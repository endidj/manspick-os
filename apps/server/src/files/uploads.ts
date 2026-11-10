// 이미지 업로드와 다운로드를 처리하고 저장 실패 시 남은 파일을 정리합니다.
import { DomainError } from '@manspick/domain';
import type { Actor } from '@manspick/contracts';
import { first, rows, statement } from '../database/statements.ts';
import { mutate } from '../database/mutations.ts';
import { isAdminTestRequest, localDemo } from '../runtime/env.ts';
import type { Env } from '../runtime/env.ts';
import { hash, id } from '../security/crypto.ts';
import { accessibleShoot } from '../shoots/access.ts';
import { retouchProgress } from '../shoots/retouch-results.ts';
import { allowedAsset, assetDTO } from './access.ts';
import type { UploadRow } from './access.ts';
import { timelineStatement } from '../activity/records.ts';
import { optionalText } from '../settings/values.ts';

const MAX_FILE = 10 * 1024 * 1024;

export function imageType(bytes: Uint8Array) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (
    bytes.length >= 24 &&
    [137, 80, 78, 71, 13, 10, 26, 10].every((value, i) => bytes[i] === value)
  ) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const width = view.getUint32(16);
    const height = view.getUint32(20);
    if (width < 1 || height < 1 || width * height > 60000000)
      throw new DomainError('IMAGE_DIMENSIONS', '이미지 해상도를 줄여주세요.');
    return 'image/png';
  }
  if (
    bytes.length >= 12 &&
    new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' &&
    new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP'
  )
    return 'image/webp';
  throw new DomainError('INVALID_FILE', 'JPEG·PNG·WebP 이미지 파일만 업로드할 수 있습니다.');
}

async function limitedFormData(request: Request) {
  if (!request.headers.get('Content-Type')?.startsWith('multipart/form-data'))
    throw new DomainError('MULTIPART_REQUIRED', '파일 업로드 형식을 확인해주세요.');
  if (!request.body) throw new DomainError('FILE_REQUIRED', '파일을 선택해주세요.');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      total += next.value.length;
      if (total > MAX_FILE + 512 * 1024) {
        void reader.cancel().catch(() => {});
        throw new DomainError('FILE_TOO_LARGE', '이미지는 한 장당 10MB 이하로 올려주세요.', 413);
      }
      chunks.push(next.value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    return await new Response(bytes.buffer, {
      headers: { 'Content-Type': request.headers.get('Content-Type') ?? '' },
    }).formData();
  } catch {
    throw new DomainError('INVALID_MULTIPART', '업로드 내용을 확인해주세요.');
  }
}

export async function upload(request: Request, env: Env, actor: Actor) {
  const form = await limitedFormData(request);
  const shootId = form.get('shootId');
  const kind = form.get('kind');
  const file = form.get('file');
  if (typeof shootId !== 'string' || typeof kind !== 'string' || !(file instanceof File))
    throw new DomainError('INVALID_UPLOAD', '촬영·파일 종류·파일이 필요합니다.');
  const shoot = await accessibleShoot(env, actor, shootId);
  if (shoot.status === 'cancelled')
    throw new DomainError('CANCELLED', '취소된 촬영에는 올릴 수 없습니다.', 409);
  const allowed =
    actor.kind === 'customer'
      ? ['survey', 'outfit', 'review']
      : actor.role === 'retoucher'
        ? ['retouched', 'revision']
        : ['candidate', 'retouched', 'revision', 'original', 'plan_ref'];
  if (!allowed.includes(kind))
    throw new DomainError('FORBIDDEN', '이 종류의 파일을 올릴 권한이 없습니다.', 403);
  const retryKey = request.headers.get('Idempotency-Key');
  if (retryKey && !/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(retryKey))
    throw new DomainError('INVALID_UPLOAD_KEY', '업로드 식별자를 확인해주세요.');
  const uploadId = retryKey
    ? await hash(JSON.stringify([actor.kind, actor.id, shootId, retryKey]))
    : id();
  if (file.size < 1 || file.size > MAX_FILE)
    throw new DomainError('FILE_TOO_LARGE', '이미지는 한 장당 10MB 이하로 올려주세요.', 413);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const contentType = imageType(bytes);
  if (file.type !== contentType)
    throw new DomainError('FILE_TYPE_MISMATCH', '실제 파일 형식과 표시 형식이 일치하지 않습니다.');
  const photoId = id();
  const outfitValue = form.get('outfitNo');
  const outfitNo = outfitValue === null || outfitValue === '' ? null : Number(outfitValue);
  if (outfitNo !== null && (!Number.isInteger(outfitNo) || outfitNo < 1 || outfitNo > 20))
    throw new DomainError('INVALID_INPUT', '의상 번호를 확인해주세요.');
  const outfitLabel = optionalText(form.get('outfitLabel'), 100) || null;
  let parentPhotoId = optionalText(form.get('parentPhotoId'), 100) || null;
  const requestedJobId = optionalText(form.get('retouchJobId'), 100);
  const fingerprint = retryKey
    ? await hash(
        JSON.stringify([
          kind,
          outfitNo,
          outfitLabel,
          parentPhotoId,
          requestedJobId,
          file.name,
          await hash(bytes.buffer),
        ]),
      )
    : null;
  const previous = retryKey
    ? await first<UploadRow>(env, 'SELECT * FROM uploads WHERE id=?', uploadId)
    : null;
  if (previous) return retryResult(previous, fingerprint, actor);
  let jobId: string | null = null;
  if (kind === 'retouched' || kind === 'revision') {
    const jobs = await rows<{ id: string }>(
      env,
      `SELECT id FROM retouch_jobs WHERE shoot_id=? AND state!='complete' AND ${kind === 'revision' ? "kind='revision'" : "kind IN ('base','extra')"}${actor.role === 'retoucher' ? ' AND retoucher_id=?' : ''}`,
      shootId,
      ...(actor.role === 'retoucher' ? [actor.id] : []),
    );
    const eligible = requestedJobId ? jobs.filter((job) => job.id === requestedJobId) : jobs;
    if (!eligible.length)
      throw new DomainError('JOB_REQUIRED', '진행 중인 보정 작업에 결과를 올려주세요.', 409);
    const progress = await retouchProgress(env, shootId);
    const matches = eligible.flatMap((job) =>
      (progress.get(job.id) ?? [])
        .filter((cut) => !parentPhotoId || cut.photoId === parentPhotoId)
        .map((cut) => ({ jobId: job.id, photoId: cut.photoId })),
    );
    if (matches.length !== 1)
      throw new DomainError(
        'RESULT_CUT_REQUIRED',
        '보정 작업과 그 작업에서 요청한 컷을 선택해주세요.',
      );
    jobId = matches[0]!.jobId;
    parentPhotoId = matches[0]!.photoId;
  } else if (parentPhotoId || requestedJobId) {
    throw new DomainError('INVALID_PHOTO', '보정본과 수정본에만 작업 컷을 연결할 수 있습니다.');
  }
  // Concurrent retries must never overwrite or delete each other's object.
  const key = `${shootId}/${kind}/${id()}`;
  const name =
    actor.role === 'retoucher'
      ? `result-${uploadId.slice(0, 8)}`
      : file.name.replace(/[\/\\\x00-\x1f]/g, '_').slice(0, 120);
  await env.BUCKET.put(key, bytes.buffer, { httpMetadata: { contentType } });
  const statements = [
    statement(
      env,
      'INSERT INTO uploads(id,shoot_id,kind,object_key,name,content_type,size,uploaded_by,retouch_job_id,retry_fingerprint) VALUES(?,?,?,?,?,?,?,?,?,?)',
      uploadId,
      shootId,
      kind,
      key,
      name,
      contentType,
      file.size,
      actor.id,
      jobId,
      fingerprint,
    ),
  ];
  if (['candidate', 'retouched', 'revision'].includes(kind))
    statements.push(
      statement(
        env,
        'INSERT INTO photos(id,shoot_id,upload_id,kind,cut_no,uploaded_by) SELECT ?,?,?,?,COALESCE(MAX(cut_no),0)+1,? FROM photos WHERE shoot_id=? AND kind=?',
        photoId,
        shootId,
        uploadId,
        kind,
        actor.id,
        shootId,
        kind,
      ),
      statement(
        env,
        'INSERT INTO photo_metadata(photo_id,outfit_no,outfit_label,parent_photo_id) VALUES(?,?,?,?)',
        photoId,
        outfitNo,
        outfitLabel,
        parentPhotoId,
      ),
    );
  statements.push(
    timelineStatement(env, shootId, actor, shoot.status, shoot.status, `${kind} 파일 업로드`),
  );
  try {
    await mutate(env, shoot, statements);
  } catch (error) {
    const existing = await first<UploadRow>(env, 'SELECT * FROM uploads WHERE id=?', uploadId);
    if (existing?.object_key !== key) await env.BUCKET.delete(key);
    if (existing && retryKey) return retryResult(existing, fingerprint, actor);
    throw error;
  }
  const result = await first<UploadRow>(env, 'SELECT * FROM uploads WHERE id=?', uploadId);
  if (!result) throw new DomainError('UPLOAD_FAILED', '업로드 기록을 확인할 수 없습니다.', 500);
  return assetDTO(result, actor.role === 'retoucher');
}

function retryResult(existing: UploadRow, fingerprint: string | null, actor: Actor) {
  if (!fingerprint || existing.retry_fingerprint !== fingerprint)
    throw new DomainError('UPLOAD_KEY_REUSED', '다른 파일이나 작업 컷은 새로 업로드해주세요.', 409);
  return assetDTO(existing, actor.role === 'retoucher');
}

function demoSvg(index: number) {
  const colors = [
    ['#1e3a5f', '#6d8a9a'],
    ['#4c4138', '#b9a48d'],
    ['#354a3d', '#8eaa97'],
    ['#43394e', '#a397b0'],
  ];
  const [dark, light] = colors[index % colors.length] ?? colors[0]!;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800"><rect width="600" height="800" fill="${dark}"/><rect x="40" y="40" width="520" height="720" rx="6" fill="${light}" opacity=".2"/><circle cx="300" cy="275" r="90" fill="${light}"/><path d="M135 690c0-190 65-280 165-280s165 90 165 280" fill="${light}"/><text x="300" y="745" font-family="sans-serif" font-size="20" fill="#fff" text-anchor="middle">LOCAL DEMO · ${String(index + 1).padStart(2, '0')}</text></svg>`;
}

export async function download(request: Request, env: Env, actor: Actor, uploadId: string) {
  const upload = await first<UploadRow>(env, 'SELECT * FROM uploads WHERE id=?', uploadId);
  if (!upload || !(await allowedAsset(env, actor, upload)))
    throw new DomainError('NOT_FOUND', '파일을 찾을 수 없습니다.', 404);
  const headers = new Headers({
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Disposition': 'inline; filename="manspick-image"',
  });
  const object = await env.BUCKET.get(upload.object_key);
  if (object) {
    headers.set('Content-Type', upload.content_type);
    return new Response(object.body, { headers });
  }
  if (
    upload.object_key.startsWith('demo/') &&
    (localDemo(request, env) || (actor.kind === 'staff' && isAdminTestRequest(request, env)))
  ) {
    const index = Number(upload.id.match(/\d+$/)?.[0] ?? 0);
    const body = demoSvg(index);
    headers.set('Content-Type', 'image/svg+xml');
    return new Response(body, { headers });
  }
  throw new DomainError('FILE_MISSING', '저장된 파일이 없습니다. 운영자에게 확인해주세요.', 404);
}

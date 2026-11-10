// 촬영 목록과 상세 정보를 모으고 역할에 따라 개인정보와 업무 정보를 가립니다.
import {
  datePlusDays,
  koreaDate,
  requiredOutfitPhotos,
  statusInfo,
  STATUSES,
} from '@manspick/domain';
import type {
  Actor,
  PackageDTO,
  ShootBoardDTO,
  ShootDetail,
  ShootSummary,
} from '@manspick/contracts';
import { first, rows } from '../database/statements.ts';
import type { SqlValue } from '../database/statements.ts';
import { assetDTO, visibleAssets } from '../files/access.ts';
import { retouchProgress } from './retouch-results.ts';
import type { UploadRow } from '../files/access.ts';
import type { Env } from '../runtime/env.ts';
import { maskPhone } from '../security/phone.ts';
import { operator } from '../security/permissions.ts';
import { parseJSON } from '../shared/json.ts';
import { retouchOffering } from '../settings/retouch-price.ts';
import { accessibleShoot, scope, SHOOT_SELECT } from './access.ts';
import type { ShootRow } from './access.ts';
import { workspaceDetail } from './workspace.ts';
import { assignmentCandidates } from './assignment.ts';

export function summary(shoot: ShootRow, actor: Actor): ShootSummary {
  const pack = parseJSON<PackageDTO>(shoot.package_snapshot, {} as PackageDTO);
  const hidden = actor.role === 'retoucher';
  return {
    id: shoot.id,
    customerName: hidden ? `고객 ${shoot.id.slice(-4)}` : shoot.customer_name,
    phoneMasked: hidden ? '' : maskPhone(shoot.phone),
    status: shoot.status,
    statusLabel: statusInfo(shoot.status).label,
    stage: statusInfo(shoot.status).stage,
    packageId: shoot.package_id,
    packageName: pack.name,
    addons: hidden ? [] : parseJSON<ShootSummary['addons']>(shoot.addons_json, []),
    totalAmount: hidden ? 0 : shoot.total_amount,
    startsAt: shoot.starts_at,
    directorName: shoot.director_name,
    retoucherName: shoot.retoucher_name,
    paymentState: hidden ? 'hidden' : shoot.payment_state,
    pendingRequests: shoot.pending_requests,
    pendingNotifications: hidden || actor.kind === 'customer' ? 0 : shoot.pending_notifications,
    retouchDueAt: shoot.retouch_due_at,
    nextAction: shoot.pending_requests
      ? '요청 확인'
      : shoot.pending_notifications && !hidden && actor.kind !== 'customer'
        ? '안내 발송 확인'
        : statusInfo(shoot.status).label,
  };
}

export async function listShoots(
  env: Env,
  actor: Actor,
  includeCancelled = false,
  { cursor, assignedOnly = false }: { cursor?: string; assignedOnly?: boolean } = {},
) {
  const access = scope(actor);
  const decoded = parseJSON<unknown>(cursor, null);
  const after =
    Array.isArray(decoded) &&
    decoded.length === 2 &&
    typeof decoded[0] === 'string' &&
    typeof decoded[1] === 'string'
      ? (decoded as [string, string])
      : undefined;
  const pageSize = 200;
  const shoots = await rows<ShootRow>(
    env,
    `${SHOOT_SELECT} WHERE ${access.sql}
    ${includeCancelled ? '' : "AND s.status!='cancelled'"}
    ${assignedOnly ? 'AND s.director_id IS NOT NULL' : ''}
    ${after ? 'AND (s.created_at,s.id)<(?,?)' : ''}
    ORDER BY s.created_at DESC,s.id DESC LIMIT ?`,
    ...access.values,
    ...(after ?? []),
    pageSize + 1,
  );
  const list = shoots.slice(0, pageSize).map((shoot) => summary(shoot, actor));
  const last = shoots[pageSize - 1];
  return {
    shoots: list,
    ...(shoots.length > pageSize && last
      ? { nextCursor: JSON.stringify([last.created_at, last.id]) }
      : {}),
    counts: {
      total: list.length,
      paymentPending: list.filter((s) => s.paymentState === 'pending').length,
      preparation: list.filter((s) => s.stage === 3 || s.stage === 4).length,
      requests: list.reduce((sum, s) => sum + s.pendingRequests, 0),
      retouching: list.filter((s) => s.stage === 6).length,
      pendingTemplates: list.reduce((sum, s) => sum + s.pendingNotifications, 0),
      depositRequests:
        (
          await first<{ n: number }>(
            env,
            `SELECT COUNT(*) AS n FROM requests q JOIN shoots s ON s.id=q.shoot_id WHERE ${access.sql} AND q.type='deposit' AND q.state IN ('new','processing')`,
            ...access.values,
          )
        )?.n ?? 0,
      retouchDueTomorrow: list.filter(
        (s) => s.retouchDueAt && s.retouchDueAt <= new Date(Date.now() + 86400000).toISOString(),
      ).length,
    },
  };
}

export async function listBoardShoots(
  env: Env,
  actor: Actor,
  filters: URLSearchParams,
  now = new Date(),
): Promise<ShootBoardDTO> {
  operator(actor);
  const access = scope(actor);
  const includeCancelled = filters.get('includeCancelled') === 'true';
  const accessible = `WITH accessible AS (${SHOOT_SELECT} WHERE ${access.sql}${includeCancelled ? '' : " AND s.status!='cancelled'"})`;
  const packageName =
    "CASE WHEN json_valid(package_snapshot) THEN json_extract(package_snapshot,'$.name') END";
  const terms: string[] = [];
  const values: SqlValue[] = [];
  const today = koreaDate(now);
  const todayStart = `${today}T00:00:00+09:00`;
  const tomorrowStart = `${datePlusDays(today, 1)}T00:00:00+09:00`;
  const dateFilter = 'julianday(starts_at)>=julianday(?) AND julianday(starts_at)<julianday(?)';

  for (const [field, column] of [
    ['packageId', 'package_id'],
    ['director', 'director_name'],
    ['retoucher', 'retoucher_name'],
  ] as const) {
    const value = filters.get(field);
    if (value && value !== 'all') {
      terms.push(`${column}=?`);
      values.push(value);
    }
  }
  const addon = filters.get('addonId');
  if (addon) {
    terms.push('EXISTS(SELECT 1 FROM shoot_addons WHERE shoot_id=accessible.id AND addon_id=?)');
    values.push(addon);
  }
  const search = filters.get('search')?.trim().toLowerCase().slice(0, 200);
  if (search) {
    const statusLabels = STATUSES.map(
      ({ id, label }) => `WHEN '${id}' THEN '${label.replaceAll("'", "''")}'`,
    ).join(' ');
    const phoneMasked =
      "CASE WHEN phone<>'' THEN substr(phone,1,3)||'-****-'||substr(phone,-4) ELSE '' END";
    terms.push(
      `instr(lower(customer_name||' '||COALESCE(${packageName},'')||' '||(CASE status ${statusLabels} ELSE '취소' END)||' '||(${phoneMasked})),?)>0`,
    );
    values.push(search);
  }
  const dateScope = filters.get('scope');
  if (dateScope === 'today' || dateScope === 'week') {
    terms.push(dateFilter);
    values.push(
      todayStart,
      dateScope === 'today' ? tomorrowStart : `${datePlusDays(today, 7)}T00:00:00+09:00`,
    );
  }
  if (dateScope === 'payment') terms.push("payment_state='pending'");
  if (dateScope === 'deposit')
    terms.push(
      "EXISTS(SELECT 1 FROM requests q WHERE q.shoot_id=accessible.id AND q.type='deposit' AND q.state IN ('new','processing'))",
    );
  if (filters.get('pending') === 'true') terms.push('pending_notifications>0');
  if (filters.get('requests') === 'true') terms.push('pending_requests>0');
  const where = terms.join(' AND ') || '1=1';
  const stageCounts = [1, 2, 3, 4, 5, 6, 7].map((stage) => {
    const statuses = STATUSES.filter((item) => item.stage === stage)
      .map((item) => `'${item.id}'`)
      .join(',');
    return `COUNT(*) FILTER(WHERE matches AND status IN (${statuses}))`;
  });

  const [counts, facetRows] = await Promise.all([
    first<ShootBoardDTO['counts'] & { totalMatches: number; stageTotals: string }>(
      env,
      `${accessible}, matches AS (SELECT *,(${where}) AS matches FROM accessible)
      SELECT COUNT(*) AS total, COUNT(*) FILTER(WHERE matches) AS totalMatches,
      json_array(${stageCounts.join(',')}) AS stageTotals,
      COUNT(*) FILTER(WHERE ${dateFilter}) AS today,
      COALESCE(SUM(pending_requests),0) AS requests,
      COALESCE(SUM(pending_notifications),0) AS pendingTemplates,
      COUNT(*) FILTER(WHERE julianday(retouch_due_at)<=julianday(?)) AS retouchDueTomorrow,
      (SELECT COUNT(*) FROM requests q JOIN accessible a ON a.id=q.shoot_id
        WHERE q.type='deposit' AND q.state IN ('new','processing')) AS depositRequests
      FROM matches`,
      ...access.values,
      ...values,
      todayStart,
      tomorrowStart,
      new Date(now.getTime() + 86400000).toISOString(),
    ),
    rows<{ kind: keyof ShootBoardDTO['facets']; id: string; name: string }>(
      env,
      `${accessible}
      SELECT 'packages' AS kind,package_id AS id,COALESCE(MAX(${packageName}),package_id) AS name FROM accessible GROUP BY package_id
      UNION ALL SELECT 'addons',a.addon_id,MAX(a.name) FROM accessible s JOIN shoot_addons a ON a.shoot_id=s.id GROUP BY a.addon_id
      UNION ALL SELECT DISTINCT 'directors',director_name,director_name FROM accessible WHERE director_name IS NOT NULL
      UNION ALL SELECT DISTINCT 'retouchers',retoucher_name,retoucher_name FROM accessible WHERE retoucher_name IS NOT NULL
      ORDER BY name,id`,
      ...access.values,
    ),
  ]);
  const {
    totalMatches = 0,
    stageTotals = '[]',
    ...metrics
  } = counts ?? {
    total: 0,
    today: 0,
    requests: 0,
    pendingTemplates: 0,
    depositRequests: 0,
    retouchDueTomorrow: 0,
  };
  const pageSize = 50;
  const requestedPage = Number(filters.get('page'));
  const page = Math.max(
    1,
    Math.min(
      Number.isSafeInteger(requestedPage) ? requestedPage : 1,
      Math.ceil(totalMatches / pageSize),
    ),
  );
  const shoots = await rows<ShootRow>(
    env,
    `${accessible} SELECT * FROM accessible WHERE ${where}
    ORDER BY COALESCE(julianday(starts_at),julianday(created_at)) DESC,id DESC LIMIT ? OFFSET ?`,
    ...access.values,
    ...values,
    pageSize,
    (page - 1) * pageSize,
  );
  const facets: ShootBoardDTO['facets'] = {
    packages: [],
    addons: [],
    directors: [],
    retouchers: [],
  };
  for (const { kind, id, name } of facetRows) {
    if (kind === 'packages' || kind === 'addons') facets[kind].push({ id, name });
    else facets[kind].push(name);
  }
  return {
    shoots: shoots.map((shoot) => summary(shoot, actor)),
    page,
    pageSize,
    totalMatches,
    matchesByStage: parseJSON<number[]>(stageTotals, []),
    counts: metrics,
    facets,
  };
}

export async function shootDetail(env: Env, actor: Actor, shootId: string): Promise<ShootDetail> {
  const shoot = await accessibleShoot(env, actor, shootId);
  const customer = actor.kind === 'customer';
  const retoucher = actor.role === 'retoucher';
  const retouch = retoucher ? { unitPrice: 0, available: false } : await retouchOffering(env);
  const [
    addons,
    survey,
    plan,
    uploads,
    photos,
    selections,
    requests,
    payments,
    timeline,
    notes,
    jobs,
    progress,
    requestItems,
  ] = await Promise.all([
    rows<{ id: string; name: string; quantity: number; unitPrice: number }>(
      env,
      'SELECT addon_id AS id,name,quantity,unit_price AS unitPrice FROM shoot_addons WHERE shoot_id=?',
      shootId,
    ),
    first<{ answers_json: string; page_done_json: string; submitted_at: string | null }>(
      env,
      'SELECT answers_json,page_done_json,submitted_at FROM surveys WHERE shoot_id=?',
      shootId,
    ),
    first<{ concept: string; outfits: string; note: string; sharedAt: string }>(
      env,
      'SELECT concept,outfits,note,shared_at AS sharedAt FROM shoot_plans WHERE shoot_id=?',
      shootId,
    ),
    rows<UploadRow>(
      env,
      'SELECT * FROM uploads WHERE shoot_id=? ORDER BY created_at DESC',
      shootId,
    ),
    rows<{
      id: string;
      upload_id: string;
      cut_no: number;
      visible: number;
      kind: string;
      outfitNo: number | null;
      outfitLabel: string | null;
      parentPhotoId: string | null;
    }>(
      env,
      'SELECT p.id,p.upload_id,p.cut_no,p.visible,p.kind,m.outfit_no AS outfitNo,m.outfit_label AS outfitLabel,m.parent_photo_id AS parentPhotoId FROM photos p LEFT JOIN photo_metadata m ON m.photo_id=p.id WHERE p.shoot_id=? ORDER BY p.cut_no',
      shootId,
    ),
    rows<{ picks_json: string; submittedAt: string; round: string }>(
      env,
      'SELECT picks_json,submitted_at AS submittedAt,round FROM selections WHERE shoot_id=?',
      shootId,
    ),
    rows<{ id: string; type: string; state: string; message: string | null; createdAt: string }>(
      env,
      `SELECT id,type,state,message,created_at AS createdAt FROM requests WHERE shoot_id=?${retoucher ? " AND type='revision' AND EXISTS(SELECT 1 FROM retouch_jobs j WHERE j.request_id=requests.id AND j.retoucher_id=?)" : ''} ORDER BY created_at DESC`,
      shootId,
      ...(retoucher ? [actor.id] : []),
    ),
    retoucher
      ? Promise.resolve([])
      : rows<{
          id: string;
          kind: string;
          channel: string;
          amount: number;
          state: string;
          heldUntil: string | null;
          confirmedAt: string | null;
          depositor: string | null;
        }>(
          env,
          'SELECT id,kind,channel,amount,state,held_until AS heldUntil,confirmed_at AS confirmedAt,depositor FROM payments WHERE shoot_id=?',
          shootId,
        ),
    retoucher
      ? Promise.resolve([])
      : rows<{
          id: string;
          from: string | null;
          to: string | null;
          actorName: string;
          reason: string;
          createdAt: string;
        }>(
          env,
          'SELECT id,from_status AS "from",to_status AS "to",actor_name AS actorName,reason,created_at AS createdAt FROM timeline WHERE shoot_id=? ORDER BY created_at DESC LIMIT 100',
          shootId,
        ),
    customer || retoucher
      ? Promise.resolve([])
      : rows<{ id: string; text: string; createdAt: string; authorName: string }>(
          env,
          'SELECT n.id,n.text,n.created_at AS createdAt,s.name AS authorName FROM notes n JOIN staff s ON s.id=n.author_id WHERE n.shoot_id=? ORDER BY n.created_at DESC',
          shootId,
        ),
    rows<{ id: string; kind: string; state: string; dueAt: string | null }>(
      env,
      `SELECT id,kind,state,due_at AS dueAt FROM retouch_jobs WHERE shoot_id=?${retoucher ? ' AND retoucher_id=?' : ''}`,
      shootId,
      ...(retoucher ? [actor.id] : []),
    ),
    customer ? Promise.resolve(new Map()) : retouchProgress(env, shootId),
    rows<{ requestId: string; photoId: string; comment: string }>(
      env,
      'SELECT i.request_id AS requestId,i.photo_id AS photoId,i.comment FROM request_items i JOIN requests r ON r.id=i.request_id WHERE r.shoot_id=?',
      shootId,
    ),
  ]);
  const selected = new Set(
    selections.flatMap((selection) => parseJSON<string[]>(selection.picks_json, [])),
  );
  const allowedUploads = await visibleAssets(env, actor, shootId, uploads);
  const uploadsById = new Map(allowedUploads.map((upload) => [upload.id, upload]));
  const photoDtos = photos.flatMap((photo) => {
    const upload = uploadsById.get(photo.upload_id);
    if (!upload || (customer && !photo.visible)) return [];
    return [
      {
        ...assetDTO(upload, retoucher),
        id: photo.id,
        kind: photo.kind,
        cutNo: photo.cut_no,
        selected: selected.has(photo.id),
        outfitNo: photo.outfitNo,
        outfitLabel: photo.outfitLabel,
        parentPhotoId: photo.parentPhotoId,
      },
    ];
  });
  const itemsByRequest = new Map<string, { photoId: string; comment: string }[]>();
  for (const { requestId, ...item } of requestItems) {
    const items = itemsByRequest.get(requestId);
    if (items) items.push(item);
    else itemsByRequest.set(requestId, [item]);
  }
  const requestDtos = requests.map((request) => ({
    ...request,
    items: itemsByRequest.get(request.id) ?? [],
  }));
  const allAnswers = parseJSON<Record<string, unknown>>(survey?.answers_json, {});
  const pack = parseJSON<PackageDTO>(shoot.package_snapshot, {} as PackageDTO);
  const visiblePack = retoucher ? { ...pack, price: 0, originalPrice: 0 } : pack;
  const capabilities = customer
    ? [
        'save_survey',
        'submit_selection',
        'request_revision',
        'review_submit',
        'request_deposit',
        'mark_preparation_read',
        'confirm_preparation',
        'request_extra_retouch',
      ]
    : actor.role === 'retoucher'
      ? ['finish_retouch']
      : actor.role === 'director'
        ? [
            'share_plan',
            'change_status',
            'start_selection',
            'note',
            'save_preparation',
            'save_field_checklist',
            'complete_field',
            'submit_selection',
            'save_file_link',
          ]
        : [
            'change_status',
            'confirm_payment',
            'share_plan',
            'start_selection',
            'finish_retouch',
            'resolve_request',
            'note',
            'cancel',
            'release_hold',
            'save_preparation',
            'save_field_checklist',
            'complete_field',
            'assign_staff',
            'submit_selection',
            'save_file_link',
          ];
  return {
    ...summary(shoot, actor),
    ...(await workspaceDetail(env, actor, shoot)),
    assignmentCandidates:
      !customer && !retoucher && actor.role !== 'director'
        ? await assignmentCandidates(env, shoot)
        : [],
    package: visiblePack,
    retouchUnitPrice: retouch.unitPrice,
    extraRetouchAvailable: retouch.available,
    addons: retoucher ? [] : addons,
    survey: survey
      ? {
          answers: retoucher ? { retouchStrength: allAnswers.retouchStrength ?? 50 } : allAnswers,
          pageDone: retoucher ? [] : parseJSON<number[]>(survey.page_done_json, []),
          submittedAt: survey.submitted_at,
          dueAt: shoot.survey_due_at,
        }
      : null,
    plan:
      retoucher || !plan
        ? null
        : {
            ...plan,
            referenceImages: allowedUploads
              .filter((upload) => upload.kind === 'plan_ref')
              .map((upload) => assetDTO(upload)),
          },
    photos: photoDtos,
    uploads: allowedUploads
      .filter((item) => !['candidate', 'retouched', 'revision', 'original'].includes(item.kind))
      .map((item) => assetDTO(item, retoucher)),
    selections: selections.map((selection) => ({
      photoIds: parseJSON<string[]>(selection.picks_json, []),
      submittedAt: selection.submittedAt,
      round: selection.round,
    })),
    requests: requestDtos,
    payments,
    timeline: customer
      ? timeline.map((item) => ({
          ...item,
          actorName: '맨즈픽',
          reason: item.to ? statusInfo(item.to).label : '진행 정보가 업데이트되었습니다.',
        }))
      : timeline,
    notes,
    originals: allowedUploads
      .filter((item) => item.kind === 'original')
      .map((item) => assetDTO(item)),
    retouchJobs: jobs.map((job) => ({
      ...job,
      cuts: (progress.get(job.id) ?? []).map(
        (cut: { photoId: string; resultId: string | null }) => ({
          photoId: cut.photoId,
          uploaded: Boolean(cut.resultId),
        }),
      ),
    })),
    capabilities: shoot.status === 'cancelled' ? [] : capabilities,
    outfitPhotosRequired: requiredOutfitPhotos(
      pack.outfits ?? 0,
      addons.find((item) => item.id === 'rental')?.quantity ?? 0,
      addons.find((item) => item.id === 'outfit')?.quantity ?? 0,
    ),
    outfitDueAt: retoucher ? null : shoot.outfit_due_at,
    revisionCount: requests.filter((request) => request.type === 'revision').length,
    holdExpiresAt:
      payments.find((payment) => payment.kind === 'base' && payment.state === 'pending')
        ?.heldUntil ?? null,
  };
}

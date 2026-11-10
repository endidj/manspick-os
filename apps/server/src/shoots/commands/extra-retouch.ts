// 추가 보정 사진을 검증하고 직원 입금 확인 전까지 작업을 시작하지 않는 주문을 만듭니다.
import { DomainError, statusInfo } from '@manspick/domain';
import { first, statement } from '../../database/statements.ts';
import type { Env } from '../../runtime/env.ts';
import { id } from '../../security/crypto.ts';
import { customer } from '../../security/permissions.ts';
import { parseJSON } from '../../shared/json.ts';
import type { CommandContext, PreparedCommand } from './types.ts';
import { retouchOffering } from '../../settings/retouch-price.ts';

export async function allCandidatesSelectable(env: Env, shootId: string, photoIds: string[]) {
  const match = await first<{ count: number }>(
    env,
    `SELECT COUNT(*) AS count FROM photos WHERE shoot_id=? AND kind='candidate' AND visible=1
      AND id IN (SELECT value FROM json_each(?))`,
    shootId,
    JSON.stringify(photoIds),
  );
  return match?.count === photoIds.length;
}

export async function retouchOrder(
  context: CommandContext,
  photoIds: string[],
  quantity: number,
  jobKind: 'base' | 'extra',
) {
  const { env, shootId } = context;
  const paymentId = id();
  const requestId = id();
  const { unitPrice, available } = await retouchOffering(env);
  if (!available)
    throw new DomainError(
      'EXTRA_RETOUCH_UNAVAILABLE',
      '현재 추가 보정의 신규 신청을 받지 않습니다. 기본 보정 수량 안에서 선택해주세요.',
      409,
    );
  return [
    statement(
      env,
      "INSERT INTO requests(id,shoot_id,type,message) VALUES(?,?,'extra_retouch',?)",
      requestId,
      shootId,
      `추가 보정 ${quantity}장 · ${quantity * unitPrice}원 · 입금 확인 대기`,
    ),
    statement(
      env,
      "INSERT INTO payments(id,shoot_id,kind,channel,amount) VALUES(?,?,?,'bank',?)",
      paymentId,
      shootId,
      jobKind === 'base' ? 'selection_extra' : 'extra_retouch',
      quantity * unitPrice,
    ),
    statement(
      env,
      'INSERT INTO retouch_orders(payment_id,request_id,job_kind,quantity,unit_price) VALUES(?,?,?,?,?)',
      paymentId,
      requestId,
      jobKind,
      quantity,
      unitPrice,
    ),
    ...photoIds.map((photoId) =>
      statement(
        env,
        'INSERT INTO request_items(id,request_id,photo_id,comment) VALUES(?,?,?,?)',
        id(),
        requestId,
        photoId,
        '추가 보정 선택',
      ),
    ),
  ];
}

export async function prepareExtraRetouch(context: CommandContext): Promise<PreparedCommand> {
  const { env, actor, shoot, shootId, body, now } = context;
  customer(actor);
  if (statusInfo(shoot.status).order < statusInfo('delivered').order)
    throw new DomainError(
      'RESULT_NOT_DELIVERED',
      '기본 보정 결과를 받은 뒤 추가 컷을 신청해주세요.',
      409,
    );
  const photoIds = body.photoIds;
  if (
    !Array.isArray(photoIds) ||
    !photoIds.length ||
    photoIds.length > 100 ||
    photoIds.some((photo) => typeof photo !== 'string') ||
    new Set(photoIds).size !== photoIds.length
  )
    throw new DomainError('SELECTION_COUNT', '추가 보정할 사진을 1~100장 골라주세요.');
  if (await first(env, "SELECT id FROM selections WHERE shoot_id=? AND round='extra'", shootId))
    throw new DomainError('EXTRA_ALREADY_SELECTED', '추가 셀렉은 이미 접수되었습니다.', 409);
  const base = await first<{ picks_json: string }>(
    env,
    "SELECT picks_json FROM selections WHERE shoot_id=? AND round='base'",
    shootId,
  );
  const previous = parseJSON<string[]>(base?.picks_json, []);
  if (
    photoIds.some((photoId) => previous.includes(photoId)) ||
    !(await allCandidatesSelectable(env, shootId, photoIds))
  )
    throw new DomainError('INVALID_PHOTO', '아직 보정하지 않은 본인 후보 사진을 선택해주세요.');
  return {
    statements: [
      statement(
        env,
        "INSERT INTO selections(id,shoot_id,round,picks_json,submitted_at) VALUES(?,?,'extra',?,?)",
        id(),
        shootId,
        JSON.stringify(photoIds),
        now,
      ),
      ...(await retouchOrder(context, photoIds, photoIds.length, 'extra')),
    ],
    to: shoot.status,
    reason: '추가 컷 셀렉 접수 · 실제 입금 확인 전 보정 시작 안 함',
  };
}

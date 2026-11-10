// 신규 예약의 입력을 확인하고 고객, 디렉터, 시간, 결제를 함께 접수합니다.
import {
  deadline,
  DomainError,
  holdExpiry,
  requiredSlots,
  validateBookingDate,
  resolveCatalogPackage,
  validateCatalogQuantities,
  additionalDifficultyWeight,
} from '@manspick/domain';
import type { AddonDTO } from '@manspick/contracts';
import { batch, first, statement } from '../database/statements.ts';
import { requiredText } from '../http/input.ts';
import { localDemo } from '../runtime/env.ts';
import type { Env } from '../runtime/env.ts';
import { hash, id, randomToken } from '../security/crypto.ts';
import { normalizePhone } from '../security/phone.ts';
import { catalog } from './catalog.ts';
import { directors, directorSkillsCondition } from './directors.ts';
import { rebookableShoot, releaseExpiredHolds } from './holds.ts';
import { conflictingReservations, lastOccupiedDate, occupiedInterval } from './reservations.ts';
import { operationsPolicy } from '../settings/operations-policy.ts';

const REBOOK_REASON = '예약 대기 만료 후 새 예약 접수';

async function activeBooking(env: Env, phone: string) {
  return first<{ id: string; version: number; rebookable: number }>(
    env,
    `SELECT s.id,s.version,${rebookableShoot} AS rebookable FROM shoots s
     JOIN customers c ON c.id=s.customer_id WHERE c.phone=? AND s.status NOT IN ('cancelled','follow_up')`,
    phone,
  );
}

export async function start(request: Request, env: Env, body: Record<string, unknown>) {
  const name = requiredText(body, 'name', 40);
  const phone = normalizePhone(requiredText(body, 'phone', 20));
  let packageId = requiredText(body, 'packageId', 80);
  const date = requiredText(body, 'date', 10);
  const time = requiredText(body, 'time', 5);
  const now = new Date();
  const policy = await operationsPolicy(env);
  validateBookingDate(date, now, policy);
  const channel = typeof body.paymentChannel === 'string' ? body.paymentChannel : 'bank';
  if (!['bank', 'kmong', 'frip', 'soomgo', 'smartstore', 'unpaid'].includes(channel))
    throw new DomainError('INVALID_CHANNEL', '결제 경로를 확인해주세요.');
  if (body.privacyConsent !== true || body.serviceNotificationConsent !== true)
    throw new DomainError(
      'CONSENT_REQUIRED',
      '개인정보 처리와 서비스 안내 필수 동의를 확인해주세요.',
    );
  if (body.marketingConsent !== undefined && typeof body.marketingConsent !== 'boolean')
    throw new DomainError('INVALID_INPUT', '마케팅 동의 여부를 확인해주세요.');
  const ip = await hash(request.headers.get('CF-Connecting-IP') ?? 'local');
  await statement(
    env,
    'INSERT INTO rate_limits(key,count,resets_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN resets_at<? THEN 1 ELSE count+1 END,resets_at=CASE WHEN resets_at<? THEN excluded.resets_at ELSE resets_at END',
    `start:${ip}`,
    new Date(now.getTime() + 600000).toISOString(),
    now.toISOString(),
    now.toISOString(),
  ).run();
  const rate = await first<{ count: number }>(
    env,
    'SELECT count FROM rate_limits WHERE key=?',
    `start:${ip}`,
  );
  if (rate && rate.count > 20)
    throw new DomainError('RATE_LIMITED', '잠시 후 다시 시도해주세요.', 429);
  const demo = localDemo(request, env);
  const accepted = {
    accepted: true as const,
    message: demo
      ? '접수가 처리되었습니다. 기존 진행 건이 있으면 등록된 번호의 안내 경로로 확인해주세요. 외부 메시지는 발송하지 않는 로컬 시연 환경입니다.'
      : '접수 요청이 처리되었습니다. 등록한 번호로 운영팀의 안내를 확인해주세요.',
  };
  await releaseExpiredHolds(env, now.toISOString(), {
    sql: 's.customer_id=(SELECT id FROM customers WHERE phone=?)',
    values: [phone],
  });
  const existing = await activeBooking(env, phone);
  const duplicate = existing && !existing.rebookable;
  if (demo && duplicate) return accepted;
  const replacement = existing?.rebookable ? existing : null;
  const available = await catalog(env);
  const pack = resolveCatalogPackage(available.packages, packageId);
  if (!pack) throw new DomainError('INVALID_PACKAGE', '패키지를 확인해주세요.');
  packageId = pack.id;
  const requested = body.addons ?? [];
  if (!Array.isArray(requested) || requested.length > available.addons.length)
    throw new DomainError('INVALID_ADDONS', '옵션을 확인해주세요.');
  const selected: { addon: AddonDTO; quantity: number }[] = [];
  for (const entry of requested) {
    if (!entry || typeof entry !== 'object')
      throw new DomainError('INVALID_ADDONS', '옵션을 확인해주세요.');
    const value = entry as { id?: unknown; quantity?: unknown };
    const addon = available.addons.find((item) => item.id === value.id);
    const quantity = value.quantity;
    if (
      !addon ||
      typeof quantity !== 'number' ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      selected.some((item) => item.addon.id === addon.id)
    )
      throw new DomainError('INVALID_ADDONS', '옵션 수량을 확인해주세요.');
    selected.push({ addon, quantity });
  }
  validateCatalogQuantities(pack, selected);
  const shopping = selected.some((item) => item.addon.id === 'shopping');
  const needed = requiredSlots(packageId, time, shopping, policy);
  const startsAt = new Date(`${date}T${time}:00+09:00`);
  const endsAt = new Date(startsAt.getTime() + pack.duration * 60000);
  const interval = occupiedInterval(
    { startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() },
    date,
    needed,
  );
  const heldUntil = holdExpiry(now, startsAt, policy);
  const addonIds = selected.map((item) => item.addon.id);
  const skills = directorSkillsCondition(addonIds);
  const eligible = await directors(env, addonIds);
  const token = randomToken();
  const tokenHash = await hash(token);
  const shootId = id();
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  const amount =
    pack.price + selected.reduce((sum, item) => sum + item.addon.price * item.quantity, 0);
  const reportedAmount = body.paymentAmount;
  if (
    reportedAmount !== undefined &&
    reportedAmount !== null &&
    (typeof reportedAmount !== 'number' ||
      !Number.isSafeInteger(reportedAmount) ||
      reportedAmount < 0 ||
      reportedAmount > 100000000)
  )
    throw new DomainError('INVALID_INPUT', '신고 결제 금액을 확인해주세요.');
  if (
    body.kakaoNickname !== undefined &&
    (typeof body.kakaoNickname !== 'string' || body.kakaoNickname.length > 80)
  )
    throw new DomainError('INVALID_INPUT', '카카오 닉네임을 확인해주세요.');
  const profile = {
    paymentAmount: reportedAmount ?? null,
    kakaoNickname: typeof body.kakaoNickname === 'string' ? body.kakaoNickname.trim() : '',
    marketingConsent: body.marketingConsent === true,
    privacyConsent: body.privacyConsent === true,
    serviceNotificationConsent: body.serviceNotificationConsent === true,
  };
  for (const director of eligible) {
    const conflicts = conflictingReservations(director.id, date, needed, interval);
    await releaseExpiredHolds(env, now.toISOString(), conflicts);
    const availability = `EXISTS(SELECT 1 FROM staff WHERE id=? AND role='director' AND active=1 AND ${skills.sql})
      AND NOT EXISTS(SELECT 1 FROM director_days_off WHERE director_id=? AND date BETWEEN ? AND ?)
      AND NOT EXISTS(SELECT 1 FROM shoots s WHERE ${conflicts.sql})`;
    const availabilityValues = [
      director.id,
      skills.value,
      director.id,
      date,
      lastOccupiedDate(date, interval),
      ...conflicts.values,
    ];
    // 진행 중인 번호로 조회해도 다른 번호와 같은 예약 가능 조건을 거칩니다.
    if (duplicate) {
      if (await first(env, `SELECT 1 WHERE ${availability}`, ...availabilityValues))
        return accepted;
      continue;
    }
    const guard = id();
    const customerId = id();
    const statements = [
      statement(
        env,
        `INSERT INTO mutation_guards(id,ok) SELECT ?,CASE WHEN ${availability}
          ${replacement ? `AND EXISTS(SELECT 1 FROM shoots s WHERE s.id=? AND s.version=? AND ${rebookableShoot})` : ''}
          THEN 1 ELSE 0 END`,
        guard,
        ...availabilityValues,
        ...(replacement ? [replacement.id, replacement.version] : []),
      ),
      ...(replacement
        ? [
            statement(
              env,
              "UPDATE shoots SET status='cancelled',cancelled_at=?,cancelled_reason=?,version=version+1 WHERE id=?",
              now.toISOString(),
              REBOOK_REASON,
              replacement.id,
            ),
            statement(
              env,
              "INSERT INTO timeline(id,shoot_id,from_status,to_status,actor_id,actor_name,reason) VALUES(?,?,'calendar_pending','cancelled','system','시스템',?)",
              id(),
              replacement.id,
              REBOOK_REASON,
            ),
          ]
        : []),
      statement(
        env,
        'INSERT INTO customers(id,name,phone) VALUES(?,?,?) ON CONFLICT(phone) DO NOTHING',
        customerId,
        name,
        phone,
      ),
      statement(
        env,
        `INSERT INTO shoots(id,customer_id,access_token_hash,status,package_id,package_snapshot,total_amount,director_id,retoucher_id,starts_at,ends_at,survey_due_at,outfit_due_at)
          VALUES(?,(SELECT id FROM customers WHERE phone=?),?,'payment_pending',?,?,?,?,
            (SELECT r.retoucher_id FROM retoucher_rules r JOIN staff s ON s.id=r.retoucher_id
              WHERE r.weekday=? AND s.active=1 AND s.role='retoucher'),?,?,?,?)`,
        shootId,
        phone,
        tokenHash,
        pack.id,
        JSON.stringify({
          ...pack,
          additionalDifficultyWeight: additionalDifficultyWeight(selected),
        }),
        amount,
        director.id,
        weekday,
        startsAt.toISOString(),
        endsAt.toISOString(),
        deadline(startsAt.toISOString(), policy.surveyLeadDays, now),
        deadline(startsAt.toISOString(), policy.outfitLeadDays, now),
      ),
      ...selected.map((item) =>
        statement(
          env,
          'INSERT INTO shoot_addons(shoot_id,addon_id,name,quantity,unit_price) VALUES(?,?,?,?,?)',
          shootId,
          item.addon.id,
          item.addon.name,
          item.quantity,
          item.addon.price,
        ),
      ),
      ...needed.map((slot) =>
        statement(
          env,
          'INSERT INTO slots(id,director_id,date,time,shoot_id) VALUES(?,?,?,?,?)',
          id(),
          director.id,
          date,
          slot,
          shootId,
        ),
      ),
      statement(
        env,
        "INSERT INTO payments(id,shoot_id,kind,channel,amount,state,held_until) VALUES(?,?,'base',?,?,'pending',?)",
        id(),
        shootId,
        channel,
        amount,
        heldUntil,
      ),
      statement(env, 'INSERT INTO surveys(shoot_id) VALUES(?)', shootId),
      statement(
        env,
        'INSERT INTO shoot_workspace(shoot_id,profile_json) VALUES(?,?)',
        shootId,
        JSON.stringify(profile),
      ),
      statement(
        env,
        "INSERT INTO timeline(id,shoot_id,to_status,actor_id,actor_name,reason) VALUES(?,?,'payment_pending','customer','고객','옵션·일정 접수 및 디렉터 자동 배정')",
        id(),
        shootId,
      ),
      statement(
        env,
        "INSERT INTO notifications(id,shoot_id,kind,body,send_at) VALUES(?,?,'booking',?,?)",
        id(),
        shootId,
        demo
          ? '로컬 접수 안내: 외부 발송 없음'
          : '신규 접수: 고객용 접속 링크를 발급해 등록한 번호로 직접 안내해주세요.',
        now.toISOString(),
      ),
      statement(env, 'DELETE FROM mutation_guards WHERE id=?', guard),
    ];
    try {
      await batch(env, statements);
      return {
        ...accepted,
        ...(demo ? { localAccess: { token, last4: phone.slice(-4), shootId } } : {}),
      };
    } catch (error) {
      if (!(error instanceof DomainError && error.status === 409)) throw error;
      const concurrent = await activeBooking(env, phone);
      if (
        concurrent &&
        !concurrent.rebookable &&
        (demo || (await first(env, `SELECT 1 WHERE ${availability}`, ...availabilityValues)))
      )
        return accepted;
    }
  }
  throw new DomainError(
    'SLOT_UNAVAILABLE',
    '선택한 시간이 방금 마감됐습니다. 다른 시간을 선택해주세요.',
    409,
  );
}

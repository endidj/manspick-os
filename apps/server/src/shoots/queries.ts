// 촬영 목록과 상세 정보를 모으고 역할에 따라 개인정보와 업무 정보를 가립니다.
import {
  BOARD_STAGE_LABELS,
  datePlusDays,
  koreaDate,
  statusInfo,
  STATUSES,
} from '@manspick/domain';
import type {
  Actor,
  PackageDTO,
  ShootBoardDTO,
  ShootBoardRowDTO,
  ShootDetail,
  ShootSummary,
} from '@manspick/contracts';
import { first, rows } from '../database/statements.ts';
import type { SqlValue } from '../database/statements.ts';
import { assetDTO, visibleAssets } from '../files/access.ts';
import { bookingSchedule } from '../booking/schedule-options.ts';
import { scheduledWork } from './scheduled-work.ts';
import type { UploadRow } from '../files/access.ts';
import type { Env } from '../runtime/env.ts';
import { maskPhone } from '../security/phone.ts';
import { operator } from '../security/permissions.ts';
import { parseJSON } from '../shared/json.ts';
import { accessibleShoot, scope, SHOOT_SELECT } from './access.ts';
import type { ShootRow } from './access.ts';
import { workspaceDetail } from './workspace.ts';
import { assignmentCandidates } from './assignment.ts';

export function summary(shoot: ShootRow, actor: Actor): ShootSummary {
  const pack = parseJSON<PackageDTO>(shoot.package_snapshot, {} as PackageDTO);
  return {
    id: shoot.id,
    customerName: shoot.customer_name,
    phoneMasked: maskPhone(shoot.phone),
    status: shoot.status,
    statusLabel: statusInfo(shoot.status).label,
    stage: statusInfo(shoot.status).stage,
    packageId: shoot.package_id,
    packageName: pack.name,
    addons: parseJSON<ShootSummary['addons']>(shoot.addons_json, []),
    totalAmount: shoot.total_amount,
    startsAt: shoot.starts_at,
    directorName: shoot.director_name,
    paymentState: shoot.payment_state,
    pendingRequests: shoot.pending_requests,
    pendingNotifications: actor.kind === 'customer' ? 0 : shoot.pending_notifications,
    nextAction: shoot.pending_requests
      ? '요청 확인'
      : shoot.pending_notifications && actor.kind !== 'customer'
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
      pendingTemplates: list.reduce((sum, s) => sum + s.pendingNotifications, 0),
      depositRequests:
        (
          await first<{ n: number }>(
            env,
            `SELECT COUNT(*) AS n FROM requests q JOIN shoots s ON s.id=q.shoot_id WHERE ${access.sql} AND q.type='deposit' AND q.state IN ('new','processing')`,
            ...access.values,
          )
        )?.n ?? 0,
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
  const scopedShoots = `${SHOOT_SELECT} WHERE ${access.sql}${includeCancelled ? '' : " AND s.status!='cancelled'"}`;
  // 후보제 예약은 확정한 후보의 시각을, 이전 고정 일정 예약은 촬영에 저장된 시각을 사용합니다.
  const accessible = `WITH scoped AS (${scopedShoots}), scheduled AS (
    SELECT scoped.*, COALESCE(
      (SELECT t.starts_at FROM booking_confirmations c JOIN booking_time_options t ON t.id=c.option_id
       WHERE c.booking_id=scoped.id),
      CASE WHEN NOT EXISTS(SELECT 1 FROM booking_time_options t WHERE t.booking_id=scoped.id)
           THEN scoped.starts_at END
    ) AS scheduled_at FROM scoped
  ), accessible AS (
    SELECT scheduled.*, CASE
      WHEN status='cancelled' THEN NULL
      WHEN status IN ('review_confirmed','originals_pending','originals_delivered','follow_up') THEN 6
      WHEN status IN ('delivered','review_requested','review_pending') THEN 5
      WHEN status='shoot_complete' THEN 4
      WHEN status IN ('shoot_day','arrived','addons_in_progress','outfit_checked','shooting','mid_check') THEN 3
      WHEN payment_state!='confirmed' THEN NULL
      WHEN scheduled_at IS NULL THEN 1
      WHEN date(scheduled_at,'+09:00')=? THEN 3
      ELSE 2 END AS board_stage FROM scheduled
  )`;
  const packageName =
    "CASE WHEN json_valid(package_snapshot) THEN json_extract(package_snapshot,'$.name') END";
  const terms: string[] = [];
  const values: SqlValue[] = [];
  const today = koreaDate(now);
  const todayStart = `${today}T00:00:00+09:00`;
  const tomorrowStart = `${datePlusDays(today, 1)}T00:00:00+09:00`;
  const dateFilter = 'julianday(starts_at)>=julianday(?) AND julianday(starts_at)<julianday(?)';
  if (filters.get('kanban') === 'true') terms.push('board_stage IS NOT NULL');

  for (const [field, column] of [
    ['packageId', 'package_id'],
    ['director', 'director_name'],
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
  const stageCounts = BOARD_STAGE_LABELS.map(
    (_, index) => `COUNT(*) FILTER(WHERE matches AND board_stage=${index + 1})`,
  );

  const [counts, facetRows] = await Promise.all([
    first<ShootBoardDTO['counts'] & { totalMatches: number; stageTotals: string }>(
      env,
      `${accessible}, matches AS (SELECT *,(${where}) AS matches FROM accessible)
      SELECT COUNT(*) AS total, COUNT(*) FILTER(WHERE matches) AS totalMatches,
      json_array(${stageCounts.join(',')}) AS stageTotals,
      COUNT(*) FILTER(WHERE ${dateFilter}) AS today,
      COALESCE(SUM(pending_requests),0) AS requests,
      COALESCE(SUM(pending_notifications),0) AS pendingTemplates,
      (SELECT COUNT(*) FROM requests q JOIN accessible a ON a.id=q.shoot_id
        WHERE q.type='deposit' AND q.state IN ('new','processing')) AS depositRequests
      FROM matches`,
      ...access.values,
      today,
      ...values,
      todayStart,
      tomorrowStart,
    ),
    rows<{ kind: keyof ShootBoardDTO['facets']; id: string; name: string }>(
      env,
      `WITH accessible AS (${scopedShoots})
      SELECT 'packages' AS kind,package_id AS id,COALESCE(MAX(${packageName}),package_id) AS name FROM accessible GROUP BY package_id
      UNION ALL SELECT 'addons',a.addon_id,MAX(a.name) FROM accessible s JOIN shoot_addons a ON a.shoot_id=s.id GROUP BY a.addon_id
      UNION ALL SELECT DISTINCT 'directors',director_name,director_name FROM accessible WHERE director_name IS NOT NULL
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
  const shoots = await rows<
    ShootRow & { board_stage: ShootBoardRowDTO['boardStage']; profile_submitted: number }
  >(
    env,
    `${accessible} SELECT accessible.*,
      EXISTS(SELECT 1 FROM booking_surveys survey
        WHERE survey.booking_id=accessible.id AND survey.submitted_at IS NOT NULL) AS profile_submitted
    FROM accessible WHERE ${where}
    ORDER BY COALESCE(julianday(starts_at),julianday(created_at)) DESC,id DESC LIMIT ? OFFSET ?`,
    ...access.values,
    today,
    ...values,
    pageSize,
    (page - 1) * pageSize,
  );
  const facets: ShootBoardDTO['facets'] = {
    packages: [],
    addons: [],
    directors: [],
  };
  for (const { kind, id, name } of facetRows) {
    if (kind === 'packages' || kind === 'addons') facets[kind].push({ id, name });
    else facets[kind].push(name);
  }
  return {
    shoots: shoots.map((shoot) => ({
      ...summary(shoot, actor),
      boardStage: shoot.board_stage,
      profileSubmitted: Boolean(shoot.profile_submitted),
    })),
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
  const [
    addons,
    survey,
    plan,
    uploads,
    requests,
    payments,
    timeline,
    notes,
    tasks,
    notices,
    campaigns,
  ] = await Promise.all([
    rows<{ id: string; name: string; quantity: number; unitPrice: number }>(
      env,
      'SELECT item_id AS id,item_name AS name,quantity,unit_price_krw AS unitPrice FROM order_items WHERE order_id=(SELECT order_id FROM bookings WHERE id=?) ORDER BY inclusion_type,item_id',
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
      "SELECT u.*,s.name AS uploaded_by_name FROM uploads u LEFT JOIN staff s ON u.kind='internal_photo' AND s.id=u.uploaded_by WHERE u.shoot_id=? ORDER BY u.created_at DESC",
      shootId,
    ),
    rows<{ id: string; type: string; state: string; message: string | null; createdAt: string }>(
      env,
      "SELECT id,type,state,message,created_at AS createdAt FROM requests WHERE shoot_id=? AND type='deposit' ORDER BY created_at DESC",
      shootId,
    ),
    rows<{
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
      `SELECT p.id,p.kind,p.channel,p.amount,p.state,p.held_until AS heldUntil,p.confirmed_at AS confirmedAt,
           COALESCE((SELECT d.reported_depositor FROM deposit_reports d JOIN requests r ON r.id=d.request_id
             WHERE d.payment_id=p.id ORDER BY r.created_at DESC,r.rowid DESC LIMIT 1),p.depositor) AS depositor
           FROM payments p WHERE p.shoot_id=?`,
      shootId,
    ),
    rows<{
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
    customer
      ? Promise.resolve([])
      : rows<{ id: string; text: string; createdAt: string; authorName: string }>(
          env,
          'SELECT n.id,n.text,n.created_at AS createdAt,s.name AS authorName FROM notes n JOIN staff s ON s.id=n.author_id WHERE n.shoot_id=? ORDER BY n.created_at DESC',
          shootId,
        ),
    customer
      ? []
      : rows<NonNullable<ShootDetail['tasks']>[number]>(
          env,
          'SELECT t.id,t.title,s.name AS assignee,t.completed_at AS completedAt FROM booking_tasks t LEFT JOIN staff s ON s.id=t.assigned_to_staff_id WHERE t.booking_id=? ORDER BY t.created_at,t.id',
          shootId,
        ),
    rows<NonNullable<ShootDetail['notices']>[number]>(
      env,
      'SELECT id,body,created_at AS createdAt FROM booking_notices WHERE booking_id=? ORDER BY created_at DESC,id DESC',
      shootId,
    ),
    customer
      ? []
      : rows<NonNullable<ShootDetail['campaigns']>[number]>(
          env,
          'SELECT c.id,c.name,e.id IS NOT NULL AS entered FROM campaigns c LEFT JOIN campaign_entries e ON e.campaign_id=c.id AND e.booking_id=? WHERE c.active=1 OR e.id IS NOT NULL ORDER BY c.name',
          shootId,
        ),
  ]);
  const allowedUploads = visibleAssets(actor, shootId, uploads);
  const allAnswers = parseJSON<Record<string, unknown>>(survey?.answers_json, {});
  const pack = parseJSON<PackageDTO>(shoot.package_snapshot, {} as PackageDTO);
  const schedule = await bookingSchedule(
    env,
    shootId,
    actor.kind === 'staff' && actor.role === 'director' && actor.id === shoot.director_id
      ? actor.id
      : undefined,
  );
  const capabilities = customer
    ? ['save_survey', 'request_deposit', 'mark_preparation_read', 'confirm_preparation']
    : [
        ...(!schedule.timeOptions.length || schedule.confirmation ? scheduledWork : []),
        'change_status',
        'note',
        'add_task',
        'complete_task',
        ...(actor.role === 'director'
          ? []
          : [
              'confirm_payment',
              'resolve_request',
              'cancel',
              'release_hold',
              'assign_staff',
              'enter_campaign',
            ]),
      ];
  return {
    ...summary(shoot, actor),
    tasks,
    notices,
    campaigns,
    timeOptions: schedule.timeOptions,
    confirmedSchedule: schedule.confirmation,
    ...(await workspaceDetail(env, actor, shoot)),
    assignmentCandidates:
      !customer && actor.role !== 'director' ? await assignmentCandidates(env, shoot) : [],
    package: pack,
    addons,
    survey: survey
      ? {
          answers: allAnswers,
          pageDone: parseJSON<number[]>(survey.page_done_json, []),
          submittedAt: survey.submitted_at,
          dueAt: shoot.survey_due_at,
        }
      : null,
    plan: !plan
      ? null
      : {
          ...plan,
          referenceImages: allowedUploads
            .filter((upload) => upload.kind === 'plan_ref')
            .map((upload) => assetDTO(upload)),
        },
    uploads: allowedUploads.map(assetDTO),
    requests,
    payments,
    timeline: customer
      ? timeline.map((item) => ({
          ...item,
          actorName: '맨즈픽',
          reason: item.to ? statusInfo(item.to).label : '진행 정보가 업데이트되었습니다.',
        }))
      : timeline,
    notes,
    capabilities:
      shoot.status === 'cancelled'
        ? []
        : [
            ...capabilities,
            ...(actor.kind === 'staff' &&
            actor.role === 'director' &&
            actor.id === shoot.director_id &&
            schedule.timeOptions.length &&
            survey?.submitted_at &&
            statusInfo(shoot.status).stage < 5
              ? ['confirm_schedule']
              : []),
          ],
    outfitPhotosRequired: 0,
    outfitDueAt: shoot.outfit_due_at,
    holdExpiresAt:
      payments.find((payment) => payment.kind === 'base' && payment.state === 'pending')
        ?.heldUntil ?? null,
  };
}

// 익명 화면 이벤트를 제한된 값으로 수집하고, 업무 전환 및 실수납은 서버 기록에서 집계합니다.
import { DomainError } from '@manspick/domain';
import { first, rows, statement } from '../database/statements.ts';
import type { Env } from '../runtime/env.ts';
import { hash } from '../security/crypto.ts';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const landingEvents = [
  'landing_visit',
  'section_view',
  'section_dwell',
  'section_click',
  'section_exit',
];
const orderEvents = ['order_options', 'order_details', 'order_schedule'];
const sections = [
  'hero',
  'why',
  'before-after',
  'reviews',
  'how',
  'team',
  'process',
  'pricing',
  'faq',
  'cta',
  'section-2',
  'section-5',
  'section-9',
];
const channels = ['pg', 'bank', 'unpaid', 'kmong', 'frip', 'soomgo', 'smartstore'];

export function validVisit(value: unknown): string | null {
  return typeof value === 'string' && uuid.test(value) ? value.toLowerCase() : null;
}

export async function recordEvent(env: Env, request: Request, body: Record<string, unknown>) {
  const surface = request.headers.get('X-Manspick-Surface');
  const event = body.event,
    device = body.device,
    section = body.section,
    duration = body.durationMs,
    channel = body.channel;
  const visit = validVisit(body.visitorId),
    eventId = validVisit(body.id);
  const landing =
    typeof event === 'string' && landingEvents.includes(event) && surface === 'landing';
  const order = typeof event === 'string' && orderEvents.includes(event) && surface === 'user';
  if (
    !eventId ||
    !visit ||
    (!landing && !order) ||
    (device !== 'mobile' && device !== 'desktop') ||
    (event !== 'landing_visit' &&
      landing &&
      (typeof section !== 'string' || !sections.includes(section))) ||
    (event === 'section_dwell' &&
      (typeof duration !== 'number' ||
        !Number.isSafeInteger(duration) ||
        duration < 0 ||
        duration > 86_400_000)) ||
    (order && (typeof channel !== 'string' || !channels.includes(channel)))
  )
    throw new DomainError('INVALID_EVENT', '집계할 수 없는 화면 이벤트입니다.');
  const now = new Date(),
    reset = new Date(now.getTime() + 60000).toISOString();
  const limit = await first<{ count: number }>(
    env,
    `INSERT INTO rate_limits(key,count,resets_at) VALUES(?,1,?)
    ON CONFLICT(key) DO UPDATE SET count=CASE WHEN resets_at<=? THEN 1 ELSE count+1 END,
    resets_at=CASE WHEN resets_at<=? THEN excluded.resets_at ELSE resets_at END RETURNING count`,
    'analytics:' + (await hash(request.headers.get('CF-Connecting-IP') ?? visit)),
    reset,
    now.toISOString(),
    now.toISOString(),
  );
  if (limit && limit.count > 360)
    throw new DomainError('RATE_LIMITED', '잠시 후 다시 시도해주세요.', 429);
  await statement(
    env,
    'INSERT INTO analytics_events(id,event_name,visitor_id,device_type,section,duration_ms,sales_channel) VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING',
    eventId,
    event as string,
    visit,
    device,
    landing && event !== 'landing_visit' ? (section as string) : null,
    event === 'section_dwell' ? (duration as number) : null,
    order ? (channel as string) : null,
  ).run();
}

export async function metrics(env: Env) {
  const [visits, sections, orders, postOrder, payments] = await Promise.all([
    rows<{ device: string; visits: number }>(
      env,
      `SELECT device_type AS device,COUNT(DISTINCT visitor_id) AS visits FROM analytics_events WHERE event_name='landing_visit' GROUP BY device_type`,
    ),
    rows<{
      device: string;
      section: string;
      views: number;
      exits: number;
      clicks: number;
      durationMs: number;
    }>(
      env,
      `SELECT device_type AS device,section,
      COUNT(DISTINCT CASE WHEN event_name='section_view' THEN visitor_id END) AS views,
      COUNT(DISTINCT CASE WHEN event_name='section_exit' THEN visitor_id END) AS exits,
      SUM(event_name='section_click') AS clicks,COALESCE(SUM(duration_ms),0) AS durationMs
      FROM analytics_events WHERE section IS NOT NULL AND device_type IS NOT NULL GROUP BY device_type,section ORDER BY device_type,section`,
    ),
    rows<{ stage: string; visits: number }>(
      env,
      `WITH tracked AS (
      SELECT id,visitor_id,event_name,sales_channel,created_at FROM analytics_events
      WHERE visitor_id IS NOT NULL AND event_name IN ('order_options','order_details','order_schedule','order_completed')
    ), attributed AS (
      SELECT visitor_id,sales_channel,ROW_NUMBER() OVER (PARTITION BY visitor_id ORDER BY (event_name='order_completed') DESC,created_at DESC,rowid DESC) AS n
      FROM analytics_events WHERE visitor_id IS NOT NULL AND sales_channel IS NOT NULL
    ), reached AS (
      SELECT t.visitor_id,MAX(t.event_name='order_options') AS options,MAX(t.event_name='order_details') AS details,
        MAX(t.event_name='order_schedule') AS schedule,MAX(t.event_name='order_completed') AS completed
      FROM tracked t JOIN attributed a ON t.visitor_id=a.visitor_id AND a.n=1
      WHERE a.sales_channel IN ('bank','pg','unpaid') GROUP BY t.visitor_id
    ) SELECT 'order_options' AS stage,COUNT(*) AS visits FROM reached WHERE options
      UNION ALL SELECT 'order_details',COUNT(*) FROM reached WHERE options AND details
      UNION ALL SELECT 'order_schedule',COUNT(*) FROM reached WHERE options AND details AND schedule
      UNION ALL SELECT 'order_completed',COUNT(*) FROM reached WHERE options AND details AND schedule AND completed`,
    ),
    first<{
      completed: number;
      signup: number;
      login: number;
      authenticated: number;
      surveyStarted: number;
      surveySubmitted: number;
    }>(
      env,
      `WITH cohorts AS (
      SELECT booking_id,MIN(CASE WHEN event_name IN ('signup','login') THEN rowid END) AS auth_id,
      MAX(event_name='survey_started') AS started,MAX(event_name='survey_submitted') AS submitted
      FROM analytics_events WHERE booking_id IS NOT NULL GROUP BY booking_id HAVING MAX(event_name='order_completed')=1
    ) SELECT COUNT(*) AS completed,COALESCE(SUM(a.event_name='signup'),0) AS signup,COALESCE(SUM(a.event_name='login'),0) AS login,
      COUNT(a.id) AS authenticated,COALESCE(SUM(a.id IS NOT NULL AND c.started),0) AS surveyStarted,
      COALESCE(SUM(a.id IS NOT NULL AND c.started AND c.submitted),0) AS surveySubmitted
      FROM cohorts c LEFT JOIN analytics_events a ON a.rowid=c.auth_id`,
    ),
    first<{ confirmed: number }>(
      env,
      "SELECT COUNT(*) AS confirmed FROM payments WHERE state='confirmed'",
    ),
  ]);
  return { visits, sections, orders, postOrder, confirmedPayments: payments?.confirmed ?? 0 };
}

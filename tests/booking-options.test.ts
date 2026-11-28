// 후보 신청은 일정을 점유하지 않으며 디렉터가 실제 확정할 때 충돌과 소유권을 다시 확인합니다.
import assert from 'node:assert/strict';
import type { SQLInputValue } from 'node:sqlite';
import test from 'node:test';
import {
  DEFAULT_OPERATIONS_POLICY,
  datePlusDays,
  koreaDate,
} from '../packages/domain/src/index.ts';
import { start } from '../apps/server/src/booking/start.ts';
import {
  availableSlots,
  bookingSchedule,
  scheduleOption,
} from '../apps/server/src/booking/schedule-options.ts';
import { calendar } from '../apps/server/src/booking/calendar.ts';
import { mutate } from '../apps/server/src/database/mutations.ts';
import { accessibleShoot } from '../apps/server/src/shoots/access.ts';
import { prepareScheduleConfirmation } from '../apps/server/src/shoots/commands/schedule-confirmation.ts';
import { assignmentCandidates, prepareAssignment } from '../apps/server/src/shoots/assignment.ts';
import { directors } from '../apps/server/src/booking/directors.ts';
import type { Actor } from '@manspick/contracts';
import { setup } from './helpers/booking-db.ts';

test('submitted options keep slots free; only a qualified, available assigned director may adopt one', async () => {
  const { env, db } = setup();
  const date = datePlusDays(koreaDate(new Date()), 18);
  const date2 = datePlusDays(date, 1);
  db.exec(`UPDATE staff SET hired_on='2021-01-01' WHERE id='demo-director';
    INSERT INTO staff(id,name,email,role,hired_on) VALUES('senior','선임','senior@example.test','director','2018-03-01');
    INSERT INTO director_package_skills VALUES('senior','hybrid');
    INSERT INTO director_skills SELECT 'senior',id FROM addons;
    UPDATE package_items SET inclusion_type='included' WHERE package_id='hybrid' AND item_id='hair';`);
  const begins = new Date(`${date2}T13:00:00+09:00`).toISOString();
  const ends = new Date(`${date2}T15:00:00+09:00`).toISOString();
  db.prepare('INSERT INTO director_availability VALUES(?,?,?)').run('senior', begins, ends);
  const submission = {
    name: '고객',
    phone: '01010101111',
    packageId: 'hybrid',
    paymentChannel: 'kmong',
    platformNickname: '구매자',
    privacyConsent: true,
    serviceNotificationConsent: true,
    timeOptions: [
      { date, time: '11:00' },
      { date: date2, time: '13:00' },
    ],
    addons: [{ id: 'rental', quantity: 1 }],
  };
  const request = new Request('http://localhost/api/start');
  await assert.rejects(start(request, env, { ...submission, platformNickname: '' }));
  await assert.rejects(
    start(request, env, {
      ...submission,
      timeOptions: [submission.timeOptions[0], submission.timeOptions[0]],
    }),
  );
  const book = async (phone: string) =>
    (await start(request, env, { ...submission, phone })).localAccess!.shootId;
  const firstId = await book(submission.phone);
  const secondId = await book('01010101112');
  const get = (sql: string, ...args: SQLInputValue[]) => db.prepare(sql).get(...args);
  assert.equal(get('SELECT starts_at FROM shoots WHERE id=?', firstId)?.starts_at, null);
  assert.equal(
    get('SELECT staff_id FROM booking_staff WHERE booking_id=? AND role=?', firstId, 'director')
      ?.staff_id,
    'senior',
  );
  assert.equal(
    get('SELECT COUNT(*) AS n FROM slots WHERE shoot_id IN (?,?)', firstId, secondId)?.n,
    0,
  );
  const saved = get(
    'SELECT package_name,shoot_duration_minutes,total_amount_krw,platform_nickname FROM orders WHERE id=?',
    firstId,
  );
  assert.equal(saved?.total_amount_krw, 185000);
  assert.equal(saved?.platform_nickname, '구매자');
  assert.equal(
    get(
      'SELECT unit_price_krw FROM order_items WHERE order_id=? AND inclusion_type=?',
      firstId,
      'included',
    )?.unit_price_krw,
    0,
  );
  assert.equal(get('SELECT order_id FROM payments WHERE shoot_id=?', firstId)?.order_id, firstId);
  db.exec("UPDATE packages SET shoot_duration_minutes=360,name='수정 상품' WHERE id='hybrid'");
  assert.equal(saved?.shoot_duration_minutes, 120);
  assert.deepEqual(
    get(
      'SELECT package_name,shoot_duration_minutes,total_amount_krw,platform_nickname FROM orders WHERE id=?',
      firstId,
    ),
    saved,
  );
  const actor: Actor = { kind: 'staff', role: 'director', id: 'senior', name: '선임' };
  const ctx = async (bookingId: string, optionId: string) => ({
    env,
    actor,
    shoot: await accessibleShoot(env, actor, bookingId),
    shootId: bookingId,
    now: new Date().toISOString(),
    body: { optionId, location: '성수역 2번 출구' },
  });
  const firstOptions = (await bookingSchedule(env, firstId)).timeOptions;
  const secondOptions = (await bookingSchedule(env, secondId)).timeOptions;
  const flagged = await bookingSchedule(env, firstId, 'senior');
  assert.deepEqual(
    flagged.timeOptions.map((o) => 'available' in o && o.available),
    [false, true],
  );
  db.prepare("INSERT INTO settings(key,value_json) VALUES('operations_policy',?)").run(
    JSON.stringify({ ...DEFAULT_OPERATIONS_POLICY, slotTimes: ['11:00'] }),
  );
  const restricted = await bookingSchedule(env, firstId, 'senior');
  assert.deepEqual(
    restricted.timeOptions.map((o) => 'available' in o && o.available),
    [false, false],
  );
  db.exec("DELETE FROM settings WHERE key='operations_policy'");
  const firstCtx = await ctx(firstId, firstOptions[1].id);
  await assert.rejects(prepareScheduleConfirmation(firstCtx));
  db.prepare('UPDATE surveys SET submitted_at=? WHERE shoot_id IN (?,?)').run(
    firstCtx.now,
    firstId,
    secondId,
  );
  await assert.rejects(
    prepareScheduleConfirmation({ ...firstCtx, actor: { ...actor, id: 'demo-director' } }),
  );
  await assert.rejects(prepareScheduleConfirmation(await ctx(firstId, secondOptions[1].id)));
  await assert.rejects(prepareScheduleConfirmation(await ctx(firstId, firstOptions[0].id)));
  const competingCtx = await ctx(secondId, secondOptions[1].id);
  const a = await prepareScheduleConfirmation(firstCtx);
  db.exec("DELETE FROM director_package_skills WHERE director_id='senior'");
  await assert.rejects(mutate(env, firstCtx.shoot, a.statements, a.condition));
  db.exec("INSERT INTO director_package_skills VALUES('senior','hybrid')");
  const b = await prepareScheduleConfirmation(competingCtx);
  await mutate(env, firstCtx.shoot, a.statements, a.condition);
  await assert.rejects(mutate(env, competingCtx.shoot, b.statements, b.condition));
  assert.equal(get('SELECT ends_at FROM shoots WHERE id=?', firstId)?.ends_at, ends);
  assert.equal((await bookingSchedule(env, firstId)).confirmation?.optionId, firstOptions[1].id);
  assert.equal((await bookingSchedule(env, secondId)).confirmation, null);
  assert.equal(get('SELECT COUNT(*) AS n FROM slots WHERE shoot_id=?', secondId)?.n, 0);
  db.exec("UPDATE staff SET active=0 WHERE id='demo-director'");
  const result = await calendar(env, 'one', false);
  assert.equal(
    result.days.find((d) => d.date === date2)?.slots.find((s) => s.time === '13:00')?.available,
    false,
  );
  db.close();
});

test('one D1 query checks a director against a full year of submitted options', async (t) => {
  const { env, db } = setup();
  t.after(() => db.close());
  const now = new Date();
  const today = koreaDate(now);
  const options = Array.from({ length: 52 * 7 }, (_, i) =>
    DEFAULT_OPERATIONS_POLICY.slotTimes.map((time) =>
      scheduleOption(datePlusDays(today, i + 1), time, 'one', 90, false, DEFAULT_OPERATIONS_POLICY),
    ),
  ).flat();
  const prepare = t.mock.method(env.DB, 'prepare');
  const available = await availableSlots(env, 'demo-director', options, [], '', now.toISOString());
  assert.equal(available.length, 1456);
  assert.ok(available.some(Boolean));
  assert.equal(prepare.mock.callCount(), 1);
});

test('package and item qualifications, working hours and hire order apply to booking and reassignment', async (t) => {
  const { db, env } = setup();
  t.after(() => db.close());
  const specialistId = 'test-specialist';
  db.exec(
    "INSERT INTO staff(id,name,email,role,hired_on) VALUES('test-specialist','테스트 디렉터','specialist@example.test','director','2022-04-01'); INSERT INTO director_package_skills VALUES('test-specialist','hybrid'); INSERT INTO director_item_skills VALUES('test-specialist','outfit'),('test-specialist','rental');",
  );
  const nextWeek = datePlusDays(koreaDate(new Date()), 12);
  db.prepare('INSERT INTO director_availability VALUES(?,?,?)').run(
    specialistId,
    new Date(nextWeek + 'T13:00:00+09:00').toISOString(),
    new Date(nextWeek + 'T17:00:00+09:00').toISOString(),
  );
  const saturday = db
    .prepare(
      "SELECT date(starts_at,'+09:00') AS day FROM director_availability WHERE director_id=? ORDER BY starts_at LIMIT 1",
    )
    .get(specialistId)?.day as string;
  const catalogOptions = (packageId: string, addons: string[]) =>
    calendar(env, packageId, false, addons);
  const open = async (packageId: string, addons: string[], time: string) =>
    (await catalogOptions(packageId, addons)).days
      .find((day) => day.date === saturday)
      ?.slots.find((slot) => slot.time === time)?.available;
  db.exec("UPDATE staff SET active=0 WHERE id='demo-director'");
  assert.equal(await open('one', [], '13:00'), false);
  assert.equal(await open('hybrid', ['outfit'], '13:00'), true);
  assert.equal(await open('hybrid', ['shopping'], '13:00'), false);
  assert.equal(await open('hybrid', [], '17:00'), false);
  db.exec(
    "UPDATE package_items SET inclusion_type='included' WHERE package_id='hybrid' AND item_id='shopping'",
  );
  assert.equal(await open('hybrid', [], '13:00'), false);
  db.exec(
    "UPDATE package_items SET inclusion_type='optional' WHERE package_id='hybrid' AND item_id='shopping'",
  );
  db.exec("UPDATE staff SET active=1 WHERE id='demo-director'");
  const proposed = {
    name: '샘플',
    packageId: 'hybrid',
    paymentChannel: 'kmong',
    platformNickname: '가상',
    privacyConsent: true,
    serviceNotificationConsent: true,
    addons: [{ id: 'outfit', quantity: 1 }],
    timeOptions: [
      { date: saturday, time: '17:00' },
      { date: saturday, time: '13:00' },
    ],
  };
  const book = async (phone: string, options = proposed.timeOptions) =>
    (
      await start(new Request('http://localhost/api/start'), env, {
        ...proposed,
        phone,
        timeOptions: options,
      })
    ).localAccess!.shootId;
  const admin: Actor = { kind: 'staff', role: 'admin', id: 'demo-admin', name: '관리자' };
  const firstId = await book('01010102222');
  assert.equal((await accessibleShoot(env, admin, firstId)).director_id, specialistId);
  const secondId = await book('01010102223', [proposed.timeOptions[0]!]);
  const second = await accessibleShoot(env, admin, secondId);
  assert.equal(second.director_id, 'demo-director');
  const choices = await assignmentCandidates(env, second);
  assert.deepEqual(
    choices.map((person) => [person.directorId, person.available]),
    [
      [specialistId, false],
      ['demo-director', true],
    ],
  );
  await assert.rejects(
    prepareAssignment({
      env,
      actor: admin,
      shoot: second,
      shootId: secondId,
      now: new Date().toISOString(),
      body: { directorId: specialistId, reason: '일정 검증' },
    }),
    { code: 'ASSIGNMENT_UNAVAILABLE' },
  );
  db.exec("UPDATE staff SET hired_on='2024-01-01' WHERE id='test-specialist'");
  assert.deepEqual(
    (await directors(env, 'hybrid', ['outfit'])).map((person) => person.id),
    ['demo-director', specialistId],
  );
  db.exec("UPDATE staff SET hired_on=NULL WHERE id='demo-director'");
  assert.deepEqual(
    (await directors(env, 'hybrid', ['outfit'])).map((person) => person.id),
    [specialistId, 'demo-director'],
  );
});

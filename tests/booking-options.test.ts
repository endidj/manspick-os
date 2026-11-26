// 후보 신청은 일정을 점유하지 않으며 디렉터가 실제 확정할 때 충돌과 소유권을 다시 확인합니다.
import assert from 'node:assert/strict';
import type { SQLInputValue } from 'node:sqlite';
import test from 'node:test';
import { datePlusDays, koreaDate } from '../packages/domain/src/index.ts';
import { start } from '../apps/server/src/booking/start.ts';
import { bookingSchedule } from '../apps/server/src/booking/schedule-options.ts';
import { calendar } from '../apps/server/src/booking/calendar.ts';
import { mutate } from '../apps/server/src/database/mutations.ts';
import { accessibleShoot } from '../apps/server/src/shoots/access.ts';
import { prepareScheduleConfirmation } from '../apps/server/src/shoots/commands/schedule-confirmation.ts';
import type { Actor } from '@manspick/contracts';
import { setup } from './helpers/booking-db.ts';

test('submitted options keep slots free; only a qualified, available assigned director may adopt one', async () => {
  const { env, db } = setup();
  const date = datePlusDays(koreaDate(new Date()), 18);
  const date2 = datePlusDays(date, 1);
  db.exec(`UPDATE staff SET hired_on='2021-01-01' WHERE id='demo-director';
    INSERT INTO staff(id,name,email,role,hired_on) VALUES('senior','선임','senior@example.test','director','2018-03-01');
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

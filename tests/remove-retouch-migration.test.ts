// 이전 스키마의 실제 예약 관계로 0020 업그레이드의 일정·구매·사진 보존과 권한 회수를 확인합니다.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

test('0020 retires staff access while preserving booked dates, order prices and private photo authorship', (t) => {
  const db = new DatabaseSync(':memory:');
  t.after(() => db.close());
  const migrations = new URL('../infra/migrations/', import.meta.url);
  const upgrade = '0020_remove_retouch_workflow.sql';
  for (const file of readdirSync(migrations)
    .filter((name) => name.endsWith('.sql') && name < upgrade)
    .sort())
    db.exec(readFileSync(new URL(file, migrations), 'utf8'));

  db.exec(`
    INSERT INTO staff(id,name,email,role,hired_on) VALUES('director','Director','d@test.local','director','2020-01-02');
    INSERT INTO staff(id,name,email,role,username,password_hash) VALUES('former','Former','f@test.local','retoucher','former','old-hash');
    INSERT INTO sessions(token_hash,kind,staff_id,created_at,expires_at) VALUES('session','staff','former','2026-01-01','2027-01-01');
    INSERT INTO staff_login_tokens(token_hash,staff_id,expires_at) VALUES('token','former','2027-01-01');
    INSERT INTO packages(id,name,price_krw,original_price_krw,shoot_duration_minutes,outfits,retouch_count,description)
      VALUES('one','One',10000,10000,90,1,3,'Portrait');
    INSERT INTO items(id,name,unit_price_krw,description) VALUES('extra_retouch','Print option',2500,'Legacy order option');
    INSERT INTO customers(id,name,phone) VALUES('customer','Customer','01000000001');
    INSERT INTO shoots(id,customer_id,access_token_hash,status,package_id,package_snapshot,total_amount,director_id,retoucher_id,starts_at,ends_at)
      VALUES('shoot','customer','link','retouching','one','{"id":"one","name":"One","price":10000,"duration":90,"retouchCount":3}',12500,
        'director','former','2026-01-10T04:00:00Z','2026-01-10T05:30:00Z');
    INSERT INTO shoot_addons(shoot_id,addon_id,name,quantity,unit_price) VALUES('shoot','extra_retouch','Print option',1,2500);
    INSERT INTO booking_time_options(id,booking_id,starts_at) VALUES('option','shoot','2026-01-10T04:00:00Z');
    INSERT INTO director_days_off(director_id,date) VALUES('director','2026-01-11');
    INSERT INTO uploads(id,shoot_id,kind,object_key,name,content_type,size,visible,uploaded_by)
      VALUES('photo','shoot','retouched','private/portrait.jpg','portrait.jpg','image/jpeg',120,1,'former');
  `);
  db.exec(readFileSync(new URL(upgrade, migrations), 'utf8'));

  const row = (sql: string) => ({ ...db.prepare(sql).get() });
  assert.deepEqual(row('SELECT status,starts_at,ends_at FROM shoots'), {
    status: 'shoot_complete',
    starts_at: '2026-01-10T04:00:00Z',
    ends_at: '2026-01-10T05:30:00Z',
  });
  assert.deepEqual(row('SELECT starts_at FROM booking_time_options'), {
    starts_at: '2026-01-10T04:00:00Z',
  });
  assert.deepEqual(row('SELECT date FROM director_days_off'), { date: '2026-01-11' });
  assert.deepEqual(row("SELECT hired_on FROM staff WHERE id='director'"), {
    hired_on: '2020-01-02',
  });
  assert.deepEqual(row('SELECT item_name,unit_price_krw,quantity FROM order_items'), {
    item_name: 'Print option',
    unit_price_krw: 2500,
    quantity: 1,
  });
  assert.deepEqual(row('SELECT total_amount_krw FROM orders'), { total_amount_krw: 12500 });
  assert.deepEqual(row('SELECT active,is_archived FROM items'), { active: 0, is_archived: 1 });
  assert.deepEqual(row('SELECT kind,visible FROM uploads'), { kind: 'internal_photo', visible: 0 });
  assert.deepEqual(row('SELECT object_key,uploaded_by_staff_id FROM booking_photos'), {
    object_key: 'private/portrait.jpg',
    uploaded_by_staff_id: 'former',
  });
  assert.deepEqual(row("SELECT active,username,password_hash FROM staff WHERE id='former'"), {
    active: 0,
    username: null,
    password_hash: null,
  });
  assert.deepEqual(
    db
      .prepare(
        'SELECT token_hash FROM sessions UNION ALL SELECT token_hash FROM staff_login_tokens',
      )
      .all(),
    [],
  );
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
});

// 관리자 화면 주소와 역할별 메뉴가 화면 개편 뒤에도 권한에 맞게 연결되는지 확인합니다.
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  detailScreen,
  needsShootList,
  resolveView,
  shootHref,
  visibleMenu,
} from '../apps/admin/src/features/workspace/model.ts';

test('admin menu exposes original operating screens and staff cannot enter administrator settings', () => {
  assert.deepEqual(
    visibleMenu('admin').map((item) => item.id),
    ['board', 'detail', 'calendar', 'retouch', 'templates', 'packages', 'followups', 'settings'],
  );
  assert.equal(
    visibleMenu('staff').some((item) => item.id === 'settings'),
    false,
  );
  assert.equal(resolveView('settings', 'staff'), 'board');
  assert.equal(resolveView('notifications', 'staff'), 'notifications');
  assert.equal(resolveView('requests', 'admin'), 'requests');
});

test('director and retoucher receive their own work routes instead of operator screens', () => {
  assert.deepEqual(
    visibleMenu('director').map((item) => item.id),
    ['my-customers', 'today', 'profile'],
  );
  assert.deepEqual(
    visibleMenu('retoucher').map((item) => item.id),
    ['retouch', 'completed'],
  );
  assert.equal(resolveView(null, 'director'), 'my-customers');
  assert.equal(resolveView('templates', 'director'), 'my-customers');
  assert.equal(resolveView('settings', 'retoucher'), 'retouch');
  assert.equal(resolveView('calendar', 'director'), 'my-customers');
  assert.equal(resolveView('list', 'director'), 'my-customers');
  assert.equal(resolveView('board', 'retoucher'), 'retouch');
  assert.equal(resolveView('list', 'staff'), 'list');
});

test('shoot screen URLs escape IDs and never give a retoucher a director screen', () => {
  assert.equal(shootHref('a/b', 'field'), '/shoots/a%2Fb?screen=field');
  assert.equal(detailScreen('field', 'director'), 'field');
  assert.equal(detailScreen('candidates', 'director'), 'candidates');
  assert.equal(detailScreen(null, 'director'), 'manage');
  assert.equal(detailScreen('field', 'retoucher'), 'retouch');
  assert.equal(detailScreen('manage', 'admin'), 'overview');
});

test('only views rendering the shared shoot list need that request before rendering', () => {
  for (const view of ['detail', 'my-customers', 'today', 'retouch', 'completed'] as const)
    assert.equal(needsShootList(view), true, view);
  for (const view of [
    'board',
    'list',
    'requests',
    'calendar',
    'notifications',
    'templates',
    'packages',
    'followups',
    'settings',
    'profile',
  ] as const)
    assert.equal(needsShootList(view), false, view);
});

// 템플릿 조건은 차원 간 AND, 같은 차원의 여러 값은 OR로 적용합니다.
import { templateMatches } from '../apps/admin/src/features/operations/template-model.ts';

test('message preview includes only active templates matching stage package addon and role', () => {
  const template = {
    active: true,
    rules: {
      stages: [4],
      packageIds: ['hybrid', 'all_day'],
      addonIds: ['hair', 'shopping'],
      roles: ['staff', 'director'],
    },
  } as const;
  const shoot = { stage: 4, packageId: 'hybrid', addonIds: ['hair'] };
  assert.equal(templateMatches(template, shoot, 'staff'), true);
  assert.equal(templateMatches({ ...template, active: false }, shoot, 'staff'), false);
  assert.equal(templateMatches(template, { ...shoot, stage: 3 }, 'staff'), false);
  assert.equal(templateMatches(template, { ...shoot, packageId: 'one' }, 'staff'), false);
  assert.equal(templateMatches(template, { ...shoot, addonIds: [] }, 'staff'), false);
  assert.equal(templateMatches(template, shoot, 'admin'), false);
  assert.equal(
    templateMatches(
      { active: true, rules: { stages: [], packageIds: [], addonIds: [], roles: [] } },
      shoot,
      'admin',
    ),
    true,
  );
  assert.equal(templateMatches({ active: true }, shoot, 'director'), true);
});

// 디렉터 셀렉이 공개 후보와 현장 확정 권한을 지키며 실제 제출 명령을 만드는지 확인합니다.
import assert from 'node:assert/strict';
import test from 'node:test';
import type { ShootDetail } from '../packages/contracts/src/contracts.ts';
import {
  directorSelectionState,
  directorSelectionAction,
  toggleSelection,
} from '../apps/admin/src/features/director/selection-model.ts';

type SelectionSource = Parameters<typeof directorSelectionState>[0];

function photo(id: string, outfitNo: number, visible = true): ShootDetail['photos'][number] {
  return {
    id,
    shootId: 'shoot',
    kind: 'candidate',
    name: id,
    contentType: 'image/jpeg',
    size: 1,
    visible,
    url: `/files/${id}`,
    createdAt: '2026-11-06T00:00:00Z',
    cutNo: Number(id.replace(/\D/g, '')) || 1,
    selected: false,
    outfitNo,
    outfitLabel: `의상 ${outfitNo}`,
    parentPhotoId: null,
  };
}

function shoot(overrides: Partial<SelectionSource> = {}): SelectionSource {
  return {
    selectionMode: 'director',
    status: 'selection_pending',
    capabilities: ['submit_selection'],
    retoucherId: 'retoucher',
    extraRetouchAvailable: true,
    package: { retouchCount: 2 },
    photos: [photo('p1', 1), photo('p2', 2), photo('private', 1, false)],
    selections: [],
    ...overrides,
  };
}

test('director selection requires field confirmation, capability, open status and no base submission', () => {
  assert.equal(directorSelectionState(shoot()).editable, true);
  for (const change of [
    { selectionMode: null },
    { selectionMode: 'customer' },
    { capabilities: [] },
    { status: 'shoot_complete' },
    { status: 'selection_complete' },
    { status: 'cancelled' },
    { selections: [{ round: 'base', photoIds: ['p1'], submittedAt: '2026-11-06' }] },
  ] satisfies Partial<SelectionSource>[]) {
    assert.equal(directorSelectionState(shoot(change)).editable, false);
    assert.equal(directorSelectionAction(shoot(change), ['p1']), null);
  }
});

test('director submits only unique public candidate IDs and leaves count and payment validation to server', () => {
  const source = shoot({
    photos: [...shoot().photos, { ...photo('result', 1), kind: 'retouched' }],
  });
  assert.deepEqual(
    directorSelectionState(source).candidates.map((item) => item.id),
    ['p1', 'p2'],
  );
  assert.deepEqual(directorSelectionAction(source, ['p2', 'p1']), {
    type: 'submit_selection',
    photoIds: ['p2', 'p1'],
  });
  assert.deepEqual(directorSelectionAction(source, ['p1']), {
    type: 'submit_selection',
    photoIds: ['p1'],
  });
  for (const ids of [[], ['private'], ['result'], ['foreign'], ['p1', 'p1']]) {
    assert.equal(directorSelectionAction(source, ids), null);
  }
  assert.equal(directorSelectionAction(shoot({ retoucherId: null }), ['p1']), null);
  const many = Array.from({ length: 101 }, (_, index) => photo(`p${index}`, 1));
  const manySource = shoot({ photos: many });
  assert.equal(
    directorSelectionAction(
      manySource,
      many.slice(0, 100).map((item) => item.id),
    )?.photoIds.length,
    100,
  );
  assert.equal(
    directorSelectionAction(
      manySource,
      many.map((item) => item.id),
    ),
    null,
  );
});

test('outfit filtering does not replace ordered picks and selection limit still allows deselection', () => {
  const first = toggleSelection([], 'outfit-1-cut');
  const both = toggleSelection(first, 'outfit-2-cut');
  assert.deepEqual(both, ['outfit-1-cut', 'outfit-2-cut']);
  assert.deepEqual(toggleSelection(both, 'outfit-1-cut'), ['outfit-2-cut']);
  const full = Array.from({ length: 100 }, (_, index) => `p${index}`);
  assert.deepEqual(toggleSelection(full, 'overflow'), full);
  assert.equal(toggleSelection(full, 'p0').length, 99);
});

test('paused additional retouch still permits included base picks but rejects overflow', () => {
  const source = shoot({
    extraRetouchAvailable: false,
    photos: [photo('p1', 1), photo('p2', 2), photo('p3', 2)],
  });
  assert.equal(directorSelectionState(source).editable, true);
  assert.deepEqual(directorSelectionAction(source, ['p1', 'p2'])?.photoIds, ['p1', 'p2']);
  assert.equal(directorSelectionAction(source, ['p1', 'p2', 'p3']), null);
  assert.deepEqual(toggleSelection(['p1', 'p2'], 'p3', 2), ['p1', 'p2']);
  assert.deepEqual(toggleSelection(['p1', 'p2'], 'p1', 2), ['p2']);
});

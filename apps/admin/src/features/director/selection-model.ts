// 현장 확정된 디렉터 셀렉의 공개 후보와 제출 가능 조건을 계산합니다.
import type { ShootAction, ShootDetail } from '@manspick/contracts';

type SelectionSource = Pick<
  ShootDetail,
  'selectionMode' | 'status' | 'capabilities' | 'retoucherId' | 'photos' | 'selections'
> & {
  package: Pick<ShootDetail['package'], 'retouchCount'>;
  extraRetouchAvailable: boolean;
};

export function directorSelectionState(shoot: SelectionSource) {
  const candidates = shoot.photos.filter((photo) => photo.kind === 'candidate' && photo.visible);
  const submission = shoot.selections.find((selection) => selection.round === 'base');
  const editable =
    shoot.selectionMode === 'director' &&
    shoot.capabilities.includes('submit_selection') &&
    shoot.status === 'selection_pending' &&
    !submission;

  return { candidates, submission, editable };
}

export function directorSelectionAction(
  shoot: SelectionSource,
  photoIds: string[],
): Extract<ShootAction, { type: 'submit_selection' }> | null {
  const { candidates, editable } = directorSelectionState(shoot);
  if (
    !editable ||
    !shoot.retoucherId ||
    photoIds.length < 1 ||
    photoIds.length > 100 ||
    (!shoot.extraRetouchAvailable && photoIds.length > shoot.package.retouchCount) ||
    new Set(photoIds).size !== photoIds.length ||
    photoIds.some((id) => !candidates.some((photo) => photo.id === id))
  )
    return null;

  return { type: 'submit_selection', photoIds };
}

export function toggleSelection(selected: string[], id: string, limit = 100) {
  if (selected.includes(id)) return selected.filter((value) => value !== id);

  return selected.length < limit ? [...selected, id] : selected;
}

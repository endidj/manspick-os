// 고객이 예약과 설문에서 같은 순서로 부가서비스를 비교할 수 있게 합니다.
const addonOrder: Record<string, number> = { hair: 0, rental: 1, outfit: 2, shopping: 3 };

export function compareAddonDisplayOrder(left: { id: string }, right: { id: string }) {
  return (addonOrder[left.id] ?? 4) - (addonOrder[right.id] ?? 4);
}

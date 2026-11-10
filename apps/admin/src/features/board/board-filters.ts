// 이전에 저장한 보드 조건을 안전하게 복원합니다.

export type BoardFilters = {
  search: string;
  packageId: string;
  addonId: string;
  director: string;
  retoucher: string;
  scope: string;
  pending: boolean;
  requests: boolean;
};

export const defaultBoardFilters: BoardFilters = {
  search: '',
  packageId: 'all',
  addonId: '',
  director: 'all',
  retoucher: 'all',
  scope: 'all',
  pending: false,
  requests: false,
};

export function restoreBoardFilters(saved: string | null): BoardFilters {
  try {
    const parsed: unknown = saved ? JSON.parse(saved) : null;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
      return { ...defaultBoardFilters };
    const values = parsed as Partial<BoardFilters>;
    return Object.fromEntries(
      Object.entries(defaultBoardFilters).map(([name, fallback]) => [
        name,
        typeof values[name as keyof BoardFilters] === typeof fallback
          ? values[name as keyof BoardFilters]
          : fallback,
      ]),
    ) as BoardFilters;
  } catch {
    return { ...defaultBoardFilters };
  }
}

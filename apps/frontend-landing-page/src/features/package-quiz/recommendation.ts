// 원본 사이트의 다섯 질문에서 패키지 추천 점수를 계산합니다.
import type { PackageDTO } from '@manspick/contracts';

export type QuizAnswers = Partial<
  Record<'purpose' | 'concern' | 'scale' | 'budget' | 'addons', string[]>
>;
export type PackageKey = 'one' | 'hybrid' | 'allday';

const packageOrder: PackageKey[] = ['one', 'hybrid', 'allday'];
const weights: Record<string, Record<string, [number, number, number]>> = {
  purpose: { dating: [0, 2, 0], sns: [0, 2, 1], business: [2, 1, 0], special: [0, 1, 2] },
  concern: { styling: [0, 1, 1], pose: [1, 1, 0], grooming: [0, 0, 2], total: [0, 0, 3] },
  scale: { light: [5, 0, 0], medium: [0, 5, 0], full: [0, 0, 5] },
  budget: { low: [3, 0, 0], mid: [0, 3, 0], high: [0, 1, 2], premium: [0, 0, 3] },
};

// 출처: JeongWhale/manspick-site 54f4a375, recommend.js의 calculateAndShow.
export function packageScores(answers: QuizAnswers): Record<PackageKey, number> {
  const scores = { one: 0, hybrid: 0, allday: 0 };
  for (const [question, values] of Object.entries(answers)) {
    for (const value of new Set(values)) {
      const weight = weights[question]?.[value];
      if (weight)
        packageOrder.forEach((id, index) => {
          scores[id] += weight[index];
        });
    }
  }
  return scores;
}

export function recommendedPackage(
  answers: QuizAnswers,
  packages: PackageDTO[],
): PackageDTO | undefined {
  const scores = packageScores(answers);
  const ranked = [...packageOrder].sort((left, right) => scores[right] - scores[left]);
  const available = packages.filter((pack) => pack.active);
  return ranked.map((id) => available.find((pack) => pack.id === id)).find(Boolean) ?? available[0];
}

export function directPackage(value: string | string[] | undefined, packages: PackageDTO[]) {
  if (typeof value !== 'string' || !packageOrder.includes(value as PackageKey)) return undefined;
  return packages.find((pack) => pack.active && pack.id === value)?.id;
}

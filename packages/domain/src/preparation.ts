// 촬영 준비에 필요한 의상 사진 수와 제출 마감을 계산합니다.
import { datePlusDays } from './dates.ts';

export function requiredOutfitPhotos(outfits: number, rental: number, styling: number) {
  return Math.max(0, outfits - rental - styling);
}

export function deadline(startsAt: string, daysBefore: number, now = new Date()) {
  const date = startsAt.slice(0, 10);
  const normal = new Date(`${datePlusDays(date, -daysBefore)}T20:00:00+09:00`);
  const near = new Date(`${datePlusDays(date, -1)}T20:00:00+09:00`);
  return new Date(
    Math.max(now.getTime(), normal.getTime() < now.getTime() ? near.getTime() : normal.getTime()),
  ).toISOString();
}

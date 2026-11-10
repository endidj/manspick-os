// 공개 페이지에서 예약과 같은 API의 현재 상품 목록을 조회합니다.
import type { AddonDTO, PackageDTO } from '@manspick/contracts';
import { proxyRequest } from '@manspick/web/proxy';

export type PublicCatalog = { packages: PackageDTO[]; addons: AddonDTO[] };

export async function loadPublicCatalog(): Promise<PublicCatalog | null> {
  const response = await proxyRequest(
    new Request('https://manspick.internal/api/catalog'),
    'landing',
  );
  if (!response.ok) return null;
  const payload = (await response.json().catch(() => null)) as { data?: PublicCatalog } | null;
  return payload?.data ?? null;
}

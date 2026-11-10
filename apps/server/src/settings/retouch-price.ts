// 추가 보정 상품의 현재 단가를 읽고 아직 등록하지 않았다면 원본 기본 단가를 사용합니다.
import { DomainError } from '@manspick/domain';
import { first } from '../database/statements.ts';
import type { Env } from '../runtime/env.ts';

export async function retouchOffering(
  env: Env,
): Promise<{ unitPrice: number; available: boolean }> {
  const addon = await first<{ price: number; active: number }>(
    env,
    "SELECT price,active FROM addons WHERE id='extra_retouch'",
  );
  if (!addon) return { unitPrice: 10000, available: true };
  if (!Number.isSafeInteger(addon.price) || addon.price < 0 || addon.price > 100000000)
    throw new DomainError('INVALID_PRICE', '추가 보정 단가를 확인해주세요.');

  return { unitPrice: addon.price, available: addon.active === 1 };
}

export async function retouchUnitPrice(env: Env): Promise<number> {
  return (await retouchOffering(env)).unitPrice;
}

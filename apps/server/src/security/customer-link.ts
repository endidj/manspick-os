// 운영자가 고객 링크를 다시 만들면 이전 링크와 세션이 즉시 무효화됩니다.
import { DomainError } from '@manspick/domain';
import type { Actor } from '@manspick/contracts';
import { timelineStatement } from '../activity/records.ts';
import { mutate } from '../database/mutations.ts';
import { statement } from '../database/statements.ts';
import { appOrigin, localDemo } from '../runtime/env.ts';
import type { Env } from '../runtime/env.ts';
import { accessibleShoot } from '../shoots/access.ts';
import { hash, randomToken } from './crypto.ts';
import { operator } from './permissions.ts';

export async function issueCustomerLink(request: Request, env: Env, actor: Actor, shootId: string) {
  operator(actor);
  const demo = localDemo(request, env);
  const origin = appOrigin(
    env.CUSTOMER_APP_ORIGIN ?? (demo ? 'http://localhost:3001' : undefined),
    demo,
  );
  if (!origin)
    throw new DomainError(
      'CUSTOMER_LINK_UNAVAILABLE',
      '고객 화면 주소가 아직 설정되지 않았습니다.',
      503,
    );
  const shoot = await accessibleShoot(env, actor, shootId);
  if (shoot.status === 'cancelled')
    throw new DomainError('CANCELLED', '취소된 촬영에는 고객 링크를 발급할 수 없습니다.', 409);
  const token = randomToken();
  await mutate(env, shoot, [
    statement(
      env,
      'UPDATE shoots SET access_token_hash=?,token_version=token_version+1 WHERE id=?',
      await hash(token),
      shoot.id,
    ),
    timelineStatement(
      env,
      shoot.id,
      actor,
      shoot.status,
      shoot.status,
      '고객 접속 링크 발급 · 등록 연락처 확인 · 이전 링크 무효화',
    ),
  ]);
  return { url: new URL(`/s/${token}`, origin).href, recipientPhone: shoot.phone };
}

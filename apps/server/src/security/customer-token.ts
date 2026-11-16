// 고객 링크용 10자리 난수를 만들고 이미 발급된 토큰과 겹치면 다시 생성합니다.
import { DomainError } from '@manspick/domain';
import { first } from '../database/statements.ts';
import type { Env } from '../runtime/env.ts';
import { hash } from './crypto.ts';

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export async function newCustomerToken(env: Env) {
  for (let attempt = 0; attempt < 5; attempt++) {
    let token = '';
    while (token.length < 10) {
      for (const byte of crypto.getRandomValues(new Uint8Array(10 - token.length))) {
        // 62의 배수 범위만 사용해 각 문자가 같은 확률로 나오게 합니다.
        if (byte < 248) token += alphabet[byte % alphabet.length];
      }
    }
    const tokenHash = await hash(token);
    if (!(await first(env, 'SELECT 1 FROM shoots WHERE access_token_hash=?', tokenHash)))
      return { token, tokenHash };
  }
  throw new DomainError(
    'CUSTOMER_LINK_UNAVAILABLE',
    '고객 링크를 만들지 못했습니다. 잠시 후 다시 시도해주세요.',
    503,
  );
}

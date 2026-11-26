// 고객이 확인한 예약과 같은 브라우저 세션에서만 소셜 계정을 연결합니다.
import { DomainError } from '@manspick/domain';
import type { Actor } from '@manspick/contracts';
import { batch, first, statement } from '../database/statements.ts';
import { appOrigin, localDemo } from '../runtime/env.ts';
import type { Env } from '../runtime/env.ts';
import { hash, id, randomToken } from './crypto.ts';
import { customer } from './permissions.ts';

function providers(env: Env) {
  return {
    google: {
      client: env.GOOGLE_CLIENT_ID,
      secret: env.GOOGLE_CLIENT_SECRET,
      authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
      token: 'https://oauth2.googleapis.com/token',
      profile: 'https://openidconnect.googleapis.com/v1/userinfo',
    },
    kakao: {
      client: env.KAKAO_CLIENT_ID,
      secret: env.KAKAO_CLIENT_SECRET,
      authorize: 'https://kauth.kakao.com/oauth/authorize',
      token: 'https://kauth.kakao.com/oauth/token',
      profile: 'https://kapi.kakao.com/v2/user/me',
    },
  };
}

export function enabledProviders(env: Env) {
  return Object.entries(providers(env))
    .filter(([, p]) => p.client && p.secret)
    .map(([key]) => key);
}

function configuration(env: Env, request: Request, provider: string) {
  if (provider !== 'google' && provider !== 'kakao')
    throw new DomainError('UNKNOWN_PROVIDER', '로그인 방식을 확인해주세요.');
  const config = providers(env)[provider];
  const local = localDemo(request, env);
  const origin = appOrigin(
    env.CUSTOMER_APP_ORIGIN ?? (local ? 'http://localhost:3001' : undefined),
    local,
  );
  if (!config.client || !config.secret || !origin)
    throw new DomainError('SOCIAL_UNAVAILABLE', '이 로그인 방식은 아직 연결되지 않았습니다.', 503);
  return {
    ...config,
    client: config.client,
    secret: config.secret,
    redirect: origin + '/social/' + provider,
  };
}

export async function customerSessionHash(request: Request) {
  const token = /(?:^|;\s*)manspick_customer=([a-f0-9]{64})(?:;|$)/.exec(
    request.headers.get('Cookie') ?? '',
  )?.[1];
  if (!token) throw new DomainError('UNAUTHENTICATED', '예약 링크에서 다시 로그인해주세요.', 401);
  return hash(token);
}

export async function socialOptions(request: Request, env: Env, actor: Actor) {
  customer(actor);
  const current = await first<{ social_verified: number }>(
    env,
    'SELECT social_verified FROM sessions WHERE token_hash=?',
    await customerSessionHash(request),
  );
  return { providers: enabledProviders(env), verified: current?.social_verified === 1 };
}

export async function beginSocial(request: Request, env: Env, actor: Actor, provider: string) {
  customer(actor);
  const config = configuration(env, request, provider);
  const state = randomToken();
  await batch(env, [
    statement(
      env,
      'DELETE FROM customer_auth_states WHERE expires_at<=?',
      new Date().toISOString(),
    ),
    statement(
      env,
      'INSERT INTO customer_auth_states(state_hash,session_hash,booking_id,provider,expires_at) VALUES(?,?,?,?,?)',
      await hash(state),
      await customerSessionHash(request),
      actor.id,
      provider,
      new Date(Date.now() + 600000).toISOString(),
    ),
  ]);
  const url = new URL(config.authorize);
  url.search = new URLSearchParams({
    client_id: config.client,
    redirect_uri: config.redirect,
    response_type: 'code',
    state,
    ...(provider === 'google' ? { scope: 'openid' } : {}),
  }).toString();
  return { url: url.href };
}

export async function finishSocial(
  request: Request,
  env: Env,
  actor: Actor,
  provider: string,
  state: string,
  code: string,
) {
  customer(actor);
  const config = configuration(env, request, provider);
  const session = await customerSessionHash(request);
  const consumed = await statement(
    env,
    'DELETE FROM customer_auth_states WHERE state_hash=? AND session_hash=? AND provider=? AND booking_id=? AND expires_at>?',
    await hash(state),
    session,
    provider,
    actor.id,
    new Date().toISOString(),
  ).run();
  if (!consumed.meta.changes)
    throw new DomainError(
      'INVALID_SOCIAL_STATE',
      '로그인 요청이 만료되었습니다. 다시 시도해주세요.',
      403,
    );

  const error = () =>
    new DomainError('SOCIAL_FAILED', '로그인 제공자에서 계정을 확인하지 못했습니다.', 401);

  const token = await fetch(config.token, {
    method: 'POST',
    redirect: 'error',
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.client,
      client_secret: config.secret,
      redirect_uri: config.redirect,
      code,
    }),
  });
  if (!token.ok) throw error();
  const { access_token: access } = await token.json<{ access_token?: string }>();
  if (typeof access !== 'string' || !access) throw error();
  const response = await fetch(config.profile, {
    headers: { Authorization: 'Bearer ' + access },
    redirect: 'error',
  });
  if (!response.ok) throw error();
  const profile = await response.json<{ sub?: string; id?: number }>();
  const subject =
    provider === 'google'
      ? profile.sub
      : Number.isSafeInteger(profile.id)
        ? String(profile.id)
        : undefined;
  if (typeof subject !== 'string' || !subject) throw error();
  const account = await first<{ customer_id: string }>(
    env,
    'SELECT COALESCE((SELECT customer_id FROM customer_social_accounts WHERE provider=? AND provider_subject=?),s.customer_id) AS customer_id FROM shoots s WHERE s.id=?',
    provider,
    subject,
    actor.id,
  );
  if (!account) throw error();
  const guard = id();
  await batch(env, [
    statement(
      env,
      'INSERT INTO mutation_guards(id,ok) SELECT ?,EXISTS(SELECT 1 FROM orders o JOIN bookings b ON b.order_id=o.id WHERE b.id=? AND (o.customer_id IS NULL OR o.customer_id=?))',
      guard + '-order',
      actor.id,
      account.customer_id,
    ),
    statement(
      env,
      `INSERT INTO mutation_guards(id,ok) SELECT ?,NOT EXISTS(SELECT 1 FROM customer_social_accounts WHERE customer_id=? AND (provider!=? OR provider_subject!=?)) AND NOT EXISTS(SELECT 1 FROM customer_social_accounts WHERE provider=? AND provider_subject=? AND customer_id!=?)`,
      guard,
      account.customer_id,
      provider,
      subject,
      provider,
      subject,
      account.customer_id,
    ),
    statement(
      env,
      `INSERT INTO analytics_events(id,event_name,booking_id) SELECT ?,CASE WHEN EXISTS(SELECT 1 FROM customer_social_accounts WHERE provider=? AND provider_subject=?) THEN 'login' ELSE 'signup' END,?`,
      id(),
      provider,
      subject,
      actor.id,
    ),
    statement(
      env,
      `INSERT INTO customer_social_accounts(id,customer_id,provider,provider_subject) VALUES(?,?,?,?) ON CONFLICT(provider,provider_subject) DO UPDATE SET last_login_at=CURRENT_TIMESTAMP`,
      id(),
      account.customer_id,
      provider,
      subject,
    ),
    statement(
      env,
      'UPDATE sessions SET social_verified=1 WHERE token_hash=? AND shoot_id=?',
      session,
      actor.id,
    ),
    statement(
      env,
      "UPDATE orders SET customer_id=?,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=(SELECT order_id FROM bookings WHERE id=?)",
      account.customer_id,
      actor.id,
    ),
    statement(env, 'DELETE FROM mutation_guards WHERE id=?', guard + '-order'),
    statement(env, 'DELETE FROM mutation_guards WHERE id=?', guard),
  ]);
  return { verified: true };
}

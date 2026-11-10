// 담당 촬영에 맞는 수동 안내를 보여주고 외부 발송 없이 완료 기록을 한 번만 저장합니다.
import { DomainError } from '@manspick/domain';
import type { Actor } from '@manspick/contracts';
import { batch, first, rows, statement } from '../database/statements.ts';
import type { Env } from '../runtime/env.ts';
import { id } from '../security/crypto.ts';
import { director } from '../security/permissions.ts';
import { shootDetail } from '../shoots/queries.ts';
import { templates } from './commands.ts';
import { matchesTemplate, renderTemplate } from './template-rules.ts';

export async function shootMessages(env: Env, actor: Actor, shootId: string) {
  director(actor);
  const shoot = await shootDetail(env, actor, shootId);
  const [catalog, items] = await Promise.all([
    templates(env, actor),
    rows<{ id: string; kind: string; body: string; state: string; sendAt: string }>(
      env,
      'SELECT id,kind,body,state,send_at AS sendAt FROM notifications WHERE shoot_id=? ORDER BY send_at DESC',
      shootId,
    ),
  ]);
  return {
    items,
    templates: catalog.items
      .filter((item) => item.active && matchesTemplate(item.rules, shoot, actor.role))
      .map((item) => {
        const record = items.find(
          (message) =>
            message.kind === `template:${item.key}` && message.state === 'manually_confirmed',
        );
        return {
          ...item,
          renderedBody: renderTemplate(item.body, shoot),
          notificationId: record?.id ?? null,
          sent: Boolean(record),
        };
      }),
  };
}

export async function completeShootMessage(env: Env, actor: Actor, shootId: string, key: string) {
  const available = await shootMessages(env, actor, shootId);
  const template = available.templates.find((item) => item.key === key);
  if (!template)
    throw new DomainError(
      'TEMPLATE_UNAVAILABLE',
      '현재 촬영과 담당자 조건에 맞는 활성 안내가 아닙니다.',
      409,
    );
  if (template.notificationId)
    return {
      id: template.notificationId,
      state: 'manually_confirmed' as const,
      externalMessages: false,
    };
  const notificationId = id();
  await batch(env, [
    statement(
      env,
      "INSERT INTO notifications(id,shoot_id,kind,body,state,send_at) VALUES(?,?,?,?,'manually_confirmed',?) ON CONFLICT DO NOTHING",
      notificationId,
      shootId,
      `template:${key}`,
      template.renderedBody,
      new Date().toISOString(),
    ),
    statement(
      env,
      'INSERT INTO timeline(id,shoot_id,actor_id,actor_name,reason) SELECT ?,?,?,?,? WHERE changes()>0',
      id(),
      shootId,
      actor.id,
      actor.name,
      `${template.title} · 수동 발송 완료 확인 · 시스템 외부 발송 없음`,
    ),
  ]);
  const saved = await first<{ id: string }>(
    env,
    "SELECT id FROM notifications WHERE shoot_id=? AND kind=? AND state='manually_confirmed'",
    shootId,
    `template:${key}`,
  );
  return { id: saved!.id, state: 'manually_confirmed' as const, externalMessages: false };
}

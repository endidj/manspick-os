// 안내 템플릿을 저장하고 실제 외부 발송 없이 알림의 수동 처리 이력을 남깁니다.
import { DomainError } from '@manspick/domain';
import type { Actor, MessageTemplateDTO, TemplateRules } from '@manspick/contracts';
import { batch, first, rows, statement } from '../database/statements.ts';
import { requiredText } from '../http/input.ts';
import type { Env } from '../runtime/env.ts';
import { id } from '../security/crypto.ts';
import { administrator, director, operator } from '../security/permissions.ts';
import { optionalText } from '../settings/values.ts';
import { parseJSON } from '../shared/json.ts';
import { auditStatement } from './audit.ts';
import { timelineStatement } from './records.ts';
import { templateRules } from './template-rules.ts';

export async function templates(env: Env, actor: Actor) {
  director(actor);
  const items = await rows<{
    key: string;
    title: string;
    body: string;
    active: number;
    condition: string;
    auto: number;
    rulesJson: string | null;
  }>(
    env,
    "SELECT m.key,m.title,m.body,m.auto,t.rules_json AS rulesJson,COALESCE(t.active,1) AS active,COALESCE(t.condition_text,'') AS condition FROM message_templates m LEFT JOIN template_settings t ON t.template_key=m.key ORDER BY m.key",
  );
  return {
    items: items.map(({ rulesJson, ...item }): MessageTemplateDTO => ({
      ...item,
      active: Boolean(item.active),
      auto: Boolean(item.auto),
      rules: parseJSON<TemplateRules | undefined>(rulesJson, undefined),
    })),
  };
}

export async function saveTemplate(
  env: Env,
  actor: Actor,
  key: string,
  body: Record<string, unknown>,
) {
  administrator(actor);
  if (!/^[a-z0-9_-]{1,80}$/.test(key))
    throw new DomainError('INVALID_INPUT', '템플릿 ID를 확인해주세요.');
  const title = requiredText(body, 'title', 200);
  const text = requiredText(body, 'body', 8000);
  if (typeof body.active !== 'boolean')
    throw new DomainError('INVALID_INPUT', '활성 여부를 확인해주세요.');
  const condition = optionalText(body.condition, 1000);
  const rules = body.rules === undefined ? undefined : templateRules(body.rules);
  const previous = await first(env, 'SELECT title,body FROM message_templates WHERE key=?', key);
  await batch(env, [
    statement(
      env,
      'INSERT INTO message_templates(key,title,body) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET title=excluded.title,body=excluded.body',
      key,
      title,
      text,
    ),
    statement(
      env,
      'INSERT INTO template_settings(template_key,active,condition_text,rules_json) VALUES(?,?,?,?) ON CONFLICT(template_key) DO UPDATE SET active=excluded.active,condition_text=excluded.condition_text,rules_json=COALESCE(excluded.rules_json,template_settings.rules_json)',
      key,
      Number(body.active),
      condition,
      rules ? JSON.stringify(rules) : null,
    ),
    auditStatement(env, actor, {
      action: previous ? 'update' : 'create',
      targetType: 'template',
      targetId: key,
      previous,
      next: { title, body: text, active: body.active, condition, rules },
    }),
  ]);
  return templates(env, actor);
}

export async function completeNotification(env: Env, actor: Actor, notificationId: string) {
  operator(actor);
  const item = await first<{ shoot_id: string; state: string }>(
    env,
    'SELECT shoot_id,state FROM notifications WHERE id=?',
    notificationId,
  );
  if (!item) throw new DomainError('NOT_FOUND', '알림을 찾을 수 없습니다.', 404);
  if (item.state !== 'local_pending')
    throw new DomainError('NOTIFICATION_CLOSED', '이미 처리되었거나 취소된 알림입니다.', 409);
  const guard = id();
  await batch(env, [
    statement(
      env,
      "INSERT INTO mutation_guards(id,ok) SELECT ?,CASE WHEN EXISTS(SELECT 1 FROM notifications WHERE id=? AND state='local_pending') THEN 1 ELSE 0 END",
      guard,
      notificationId,
    ),
    statement(
      env,
      "UPDATE notifications SET state='manually_confirmed' WHERE id=?",
      notificationId,
    ),
    timelineStatement(
      env,
      item.shoot_id,
      actor,
      null,
      null,
      '안내 수동 발송 완료 확인 · 시스템 외부 발송 없음',
    ),
    statement(env, 'DELETE FROM mutation_guards WHERE id=?', guard),
  ]);
  return { id: notificationId, state: 'manually_confirmed' as const, externalMessages: false };
}

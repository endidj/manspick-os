// 관리자에게 기존 설정 이력과 최근 감사 이벤트를 함께 보여줍니다.
import type { Actor, SettingsHistoryEntryDTO } from '@manspick/contracts';
import { rows } from '../database/statements.ts';
import type { Env } from '../runtime/env.ts';
import { administrator } from '../security/permissions.ts';
import { parseJSON } from '../shared/json.ts';

export async function settingsHistory(env: Env, actor: Actor) {
  administrator(actor);
  const items = await rows<{
    id: string;
    settingKey: string;
    previousJson: string | null;
    nextJson: string;
    actorName: string;
    createdAt: string;
    action: string | null;
    targetName: string | null;
  }>(
    env,
    `SELECT id,settingKey,previousJson,nextJson,actorName,createdAt,action,targetName FROM (
      SELECT h.id,h.setting_key AS settingKey,h.previous_json AS previousJson,h.next_json AS nextJson,
             COALESCE(s.name,'기존 운영자') AS actorName,h.created_at AS createdAt,
             NULL AS action,NULL AS targetName,0 AS sourceOrder,h.rowid AS writeOrder
      FROM settings_history h LEFT JOIN staff s ON s.id=h.actor_id
      UNION ALL
      SELECT a.id,CASE WHEN a.target_type='setting' THEN a.target_id ELSE a.target_type||':'||a.target_id END,
             a.previous_json,a.next_json,a.actor_name,a.created_at,a.action,s.name,1,a.rowid
      FROM audit_events a LEFT JOIN staff s ON a.target_type='staff' AND s.id=a.target_id
      WHERE a.target_type IN ('setting','template','staff')
    ) ORDER BY createdAt DESC,sourceOrder DESC,writeOrder DESC LIMIT 100`,
  );
  return {
    items: items.map(
      ({ previousJson, nextJson, action, targetName, ...item }): SettingsHistoryEntryDTO => ({
        ...item,
        ...(action ? { action } : {}),
        ...(targetName ? { targetName } : {}),
        previous: parseJSON<unknown>(previousJson, null),
        next: parseJSON<unknown>(nextJson, null),
      }),
    ),
  };
}

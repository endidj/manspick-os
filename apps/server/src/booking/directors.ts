// 추가 옵션의 자격 요건과 기존 예약 수에 따라 배정 가능한 디렉터를 찾습니다.
import { defaultAddonRules } from '@manspick/domain';
import { rows } from '../database/statements.ts';
import type { Env } from '../runtime/env.ts';

export function directorSkillsCondition(addonIds: string[]) {
  const defaults = Object.fromEntries(
    addonIds.map((id) => [id, Number(defaultAddonRules(id).requiresDirector)]),
  );
  // 변경된 옵션 규칙도 담당자 자격과 같은 트랜잭션에서 확인합니다.
  return {
    sql: `NOT EXISTS(SELECT 1 FROM json_each(?) requested
      WHERE COALESCE((SELECT json_extract(rule.value,'$.requiresDirector')
        FROM settings config, json_each(config.value_json,'$.addons') rule
        WHERE config.key='catalog_rules' AND rule.key=requested.key),requested.value)=1
      AND NOT EXISTS(SELECT 1 FROM director_skills WHERE director_id=staff.id AND addon_id=requested.key))`,
    value: JSON.stringify(defaults),
  };
}

export async function directors(env: Env, addonIds: string[]) {
  const skills = directorSkillsCondition(addonIds);
  return rows<{ id: string }>(
    env,
    `SELECT id FROM staff WHERE role='director' AND active=1 AND ${skills.sql} ORDER BY (SELECT COUNT(*) FROM slots WHERE director_id=staff.id),id`,
    skills.value,
  );
}

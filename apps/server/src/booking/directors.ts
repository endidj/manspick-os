// 패키지와 선택한 서비스의 자격을 갖춘 디렉터를 입사일 순으로 찾습니다.
import { defaultAddonRules } from '@manspick/domain';
import { rows } from '../database/statements.ts';
import type { Env } from '../runtime/env.ts';

export function directorSkillsCondition(packageId: string, addonIds: string[]) {
  const defaults = Object.fromEntries(
    addonIds.map((id) => [id, Number(defaultAddonRules(id).requiresDirector)]),
  );
  // 변경된 옵션 규칙도 담당자 자격과 같은 트랜잭션에서 확인합니다.
  return {
    sql: `EXISTS(SELECT 1 FROM director_package_skills WHERE director_id=staff.id AND package_id=?)
      AND NOT EXISTS(SELECT 1 FROM json_each(?) requested
      WHERE COALESCE((SELECT json_extract(rule.value,'$.requiresDirector')
        FROM settings config, json_each(config.value_json,'$.addons') rule
        WHERE config.key='catalog_rules' AND rule.key=requested.key),requested.value)=1
      AND NOT EXISTS(SELECT 1 FROM director_item_skills WHERE director_id=staff.id AND item_id=requested.key))`,
    values: [packageId, JSON.stringify(defaults)],
  };
}

export async function directors(env: Env, packageId: string, addonIds: string[]) {
  const skills = directorSkillsCondition(packageId, addonIds);
  return rows<{ id: string }>(
    env,
    `SELECT id FROM staff WHERE role='director' AND active=1 AND ${skills.sql}
     ORDER BY hired_on IS NULL,hired_on,id`,
    ...skills.values,
  );
}

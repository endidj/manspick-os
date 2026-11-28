// 관리자 권한을 확인한 뒤 직원과 판매 기준 정보를 조회합니다.
import { catalog } from '../booking/catalog.ts';
import type { Actor, OperationsSettingsDTO } from '@manspick/contracts';
import { rows } from '../database/statements.ts';
import type { Env } from '../runtime/env.ts';
import { administrator } from '../security/permissions.ts';
import { settingValue } from './values.ts';
import { operationsPolicy } from './operations-policy.ts';

export async function settings(env: Env, actor: Actor): Promise<OperationsSettingsDTO> {
  administrator(actor);
  return {
    policy: await operationsPolicy(env),
    staff: await rows<OperationsSettingsDTO['staff'][number]>(
      env,
      'SELECT id,name,email,role,active,hired_on AS hiredOn FROM staff ORDER BY id',
    ),
    ...(await catalog(env, { includeInactive: true })),
    paymentInstructions: await settingValue<OperationsSettingsDTO['paymentInstructions']>(
      env,
      'payment_instructions',
      null,
    ),
    neighborhoods: await settingValue<OperationsSettingsDTO['neighborhoods']>(
      env,
      'neighborhoods',
      [],
    ),
    preparationGuides: await settingValue<OperationsSettingsDTO['preparationGuides']>(
      env,
      'preparation_guides',
      [],
    ),
    daysOff: await rows(
      env,
      "SELECT d.director_id AS directorId,d.date FROM director_days_off d JOIN staff s ON s.id=d.director_id WHERE s.role='director' ORDER BY d.date",
    ),
    directorAvailability: await rows(
      env,
      'SELECT director_id AS directorId,starts_at AS startsAt,ends_at AS endsAt FROM director_availability ORDER BY director_id,starts_at',
    ),
    campaigns: await rows(env, 'SELECT id,name,amount,active FROM campaigns ORDER BY id'),
    directorSkills: await rows(
      env,
      'SELECT director_id AS directorId,addon_id AS addonId FROM director_skills ORDER BY director_id,addon_id',
    ),
    directorPackageSkills: await rows(
      env,
      'SELECT director_id AS directorId,package_id AS packageId FROM director_package_skills ORDER BY director_id,package_id',
    ),
    mode: 'local',
    externalMessages: false,
  };
}

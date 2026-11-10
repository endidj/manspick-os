// 저장된 운영 기준을 읽고 설정이 없으면 기존 예약 기본값을 사용합니다.
import { DEFAULT_OPERATIONS_POLICY, validateOperationsPolicy } from '@manspick/domain';
import type { OperationsPolicy } from '@manspick/domain';
import type { Env } from '../runtime/env.ts';
import { settingValue } from './values.ts';

export async function operationsPolicy(env: Env): Promise<OperationsPolicy> {
  const value = await settingValue<unknown>(env, 'operations_policy', DEFAULT_OPERATIONS_POLICY);
  return validateOperationsPolicy(value);
}

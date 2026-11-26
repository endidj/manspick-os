// 예약별 할 일과 캠페인 참여를 해당 예약의 이력과 함께 기록합니다.
import { DomainError } from '@manspick/domain';
import { first, statement } from '../../database/statements.ts';
import { requiredText } from '../../http/input.ts';
import { id } from '../../security/crypto.ts';
import { director, operator } from '../../security/permissions.ts';
import type { CommandContext, PreparedCommand } from './types.ts';

export async function prepareOperations(
  type: string,
  { env, actor, shoot, shootId, body, now }: CommandContext,
): Promise<PreparedCommand | null> {
  director(actor);
  if (type === 'add_task') {
    const title = requiredText(body, 'title', 200);
    return {
      to: shoot.status,
      reason: '촬영 할 일 추가',
      statements: [
        statement(
          env,
          'INSERT INTO booking_tasks(id,booking_id,title,assigned_to_staff_id) VALUES(?,?,?,?)',
          id(),
          shootId,
          title,
          actor.id,
        ),
      ],
    };
  }
  if (type === 'complete_task') {
    const taskId = requiredText(body, 'taskId', 100);
    const task = await first<{ completed_at: string | null }>(
      env,
      'SELECT completed_at FROM booking_tasks WHERE id=? AND booking_id=?',
      taskId,
      shootId,
    );
    if (!task) throw new DomainError('NOT_FOUND', '이 예약의 할 일을 찾을 수 없습니다.', 404);
    if (task.completed_at) return null;
    return {
      to: shoot.status,
      reason: '촬영 할 일 완료',
      statements: [
        statement(
          env,
          'UPDATE booking_tasks SET completed_at=? WHERE id=? AND booking_id=?',
          now,
          taskId,
          shootId,
        ),
      ],
    };
  }
  operator(actor);
  const campaign = requiredText(body, 'campaignId', 100);
  const eligibility = await first<{ active: number; entered: number }>(
    env,
    'SELECT active,EXISTS(SELECT 1 FROM campaign_entries WHERE campaign_id=c.id AND booking_id=?) AS entered FROM campaigns c WHERE c.id=?',
    shootId,
    campaign,
  );
  if (!eligibility?.active)
    throw new DomainError('INVALID_CAMPAIGN', '현재 참여 가능한 캠페인을 선택해주세요.', 409);
  if (eligibility.entered) return null;
  return {
    to: shoot.status,
    reason: '캠페인 참여 등록',
    condition: {
      sql: 'EXISTS(SELECT 1 FROM campaigns WHERE id=? AND active=1)',
      values: [campaign],
    },
    statements: [
      statement(
        env,
        'INSERT INTO campaign_entries(id,campaign_id,booking_id) VALUES(?,?,?)',
        id(),
        campaign,
        shootId,
      ),
    ],
  };
}

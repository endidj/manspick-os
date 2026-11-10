// 입금 확인과 고객의 입금 확인 요청을 검사하고 변경 내용을 준비합니다.
import { DomainError } from '@manspick/domain';
import type { ShootStatus } from '@manspick/domain';
import { notification } from '../../activity/records.ts';
import { first, statement } from '../../database/statements.ts';
import { requiredText } from '../../http/input.ts';
import { id } from '../../security/crypto.ts';
import { operator, customer } from '../../security/permissions.ts';
import { activeRetoucherCondition } from '../assignment.ts';
import type { CommandContext, PreparedCommand } from './types.ts';

export async function preparePayment(
  type: string,
  context: CommandContext,
): Promise<PreparedCommand | null> {
  const { env, actor, shoot, shootId, body, now } = context;
  const statements: D1PreparedStatement[] = [];
  let to: ShootStatus = context.shoot.status;
  let reason = '';
  let condition: PreparedCommand['condition'];
  switch (type) {
    case 'confirm_payment': {
      operator(actor);
      const paymentId = requiredText(body, 'paymentId', 100);
      const payment = await first<{
        id: string;
        state: string;
        kind: string;
        held_until: string | null;
      }>(
        env,
        'SELECT id,state,kind,held_until FROM payments WHERE id=? AND shoot_id=?',
        paymentId,
        shootId,
      );
      if (!payment) throw new DomainError('NOT_FOUND', '결제 기록을 찾을 수 없습니다.', 404);
      if (payment.state === 'confirmed') return null;
      if (payment.state !== 'pending' || (payment.held_until && payment.held_until <= now))
        throw new DomainError('PAYMENT_EXPIRED', '결제 대기 시간이 만료됐습니다.', 409);
      statements.push(
        statement(
          env,
          "UPDATE payments SET state='confirmed',confirmed_at=?,confirmed_by=?,held_until=NULL WHERE id=? AND state='pending'",
          now,
          actor.id,
          paymentId,
        ),
      );
      condition = {
        sql: "EXISTS(SELECT 1 FROM payments WHERE id=? AND shoot_id=? AND state='pending' AND (held_until IS NULL OR held_until>?))",
        values: [paymentId, shootId, now],
      };
      if (payment.kind === 'base') to = 'survey_pending';
      if (['selection_extra', 'extra_retouch'].includes(payment.kind)) {
        const order = await first<{ request_id: string; job_kind: string }>(
          env,
          'SELECT request_id,job_kind FROM retouch_orders WHERE payment_id=?',
          paymentId,
        );
        const retoucher = await activeRetoucherCondition(env, shoot.retoucher_id);
        if (!order || !retoucher)
          throw new DomainError(
            'RETOUCHER_REQUIRED',
            '추가 보정 주문과 보정가 배정을 확인해주세요.',
            409,
          );
        condition = {
          sql: `${condition.sql} AND ${retoucher.sql}`,
          values: [...condition.values, ...retoucher.values],
        };
        if (
          await first(
            env,
            "SELECT id FROM retouch_jobs WHERE shoot_id=? AND state!='complete'",
            shootId,
          )
        )
          throw new DomainError(
            'RETOUCH_IN_PROGRESS',
            '기존 보정 작업 완료 후 추가 주문 입금을 확인해주세요.',
            409,
          );
        statements.push(
          statement(
            env,
            'INSERT INTO retouch_jobs(id,shoot_id,retoucher_id,kind,request_id,due_at) VALUES(?,?,?,?,?,?)',
            id(),
            shootId,
            shoot.retoucher_id,
            order.job_kind,
            order.request_id,
            new Date(Date.now() + 3 * 86400000).toISOString(),
          ),
        );
        statements.push(
          statement(
            env,
            "UPDATE requests SET state='processing',handled_by=? WHERE id=?",
            actor.id,
            order.request_id,
          ),
        );
        to = 'retouch_assigned';
      }
      statements.push(
        statement(
          env,
          "UPDATE requests SET state='complete',handled_by=? WHERE shoot_id=? AND type='deposit' AND state IN ('new','processing')",
          actor.id,
          shootId,
        ),
      );
      statements.push(
        notification(
          env,
          shootId,
          'payment_confirmed',
          '입금 확인 완료 · 로컬 알림 대기. 외부 발송 없음',
        ),
      );
      reason = '직원이 실제 결제 내역 확인';
      break;
    }
    case 'request_deposit': {
      customer(actor);
      const depositor = requiredText(body, 'depositor', 40);
      const paymentId = typeof body.paymentId === 'string' ? body.paymentId : null;
      const payment = await first<{ id: string }>(
        env,
        `SELECT id FROM payments WHERE shoot_id=? AND state='pending' AND ${paymentId ? 'id=?' : "kind='base'"}`,
        shootId,
        ...(paymentId ? [paymentId] : []),
      );
      if (!payment) throw new DomainError('PAYMENT_STATE', '확인 대기 중인 결제가 없습니다.', 409);
      statements.push(
        statement(
          env,
          "UPDATE payments SET depositor=? WHERE shoot_id=? AND id=? AND state='pending'",
          depositor,
          shootId,
          payment.id,
        ),
      );
      statements.push(
        statement(
          env,
          "INSERT INTO requests(id,shoot_id,type,message) VALUES(?,?,'deposit',?)",
          id(),
          shootId,
          `입금자명: ${depositor} · 결제 ${payment.id}`,
        ),
      );
      reason = '고객 입금 확인 요청 · 결제 확정 아님';
      break;
    }
    default:
      throw new DomainError('UNKNOWN_ACTION', '지원하지 않는 동작입니다.');
  }
  return { statements, to, reason, condition };
}

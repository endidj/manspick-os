// 입금 확인과 고객의 입금 확인 요청을 검사하고 변경 내용을 준비합니다.
import { DomainError } from '@manspick/domain';
import type { ShootStatus } from '@manspick/domain';
import { notification } from '../../activity/records.ts';
import { first, statement } from '../../database/statements.ts';
import { requiredText } from '../../http/input.ts';
import { id } from '../../security/crypto.ts';
import { operator, customer } from '../../security/permissions.ts';
import type { CommandContext, PreparedCommand } from './types.ts';

export async function preparePayment(
  type: string,
  context: CommandContext,
): Promise<PreparedCommand | null> {
  const { env, actor, shootId, body, now } = context;
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
      if (payment.kind !== 'base')
        throw new DomainError('PAYMENT_STATE', '현재 예약의 기본 주문 결제를 선택해주세요.', 409);
      to = 'survey_pending';
      statements.push(
        statement(
          env,
          "UPDATE requests SET state='complete',handled_by=? WHERE id IN (SELECT request_id FROM deposit_reports WHERE payment_id=?) AND state IN ('new','processing')",
          actor.id,
          paymentId,
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
      if (
        await first(
          env,
          "SELECT 1 FROM deposit_reports d JOIN requests r ON r.id=d.request_id WHERE d.payment_id=? AND d.reported_depositor=? AND r.state IN ('new','processing')",
          payment.id,
          depositor,
        )
      )
        return null;
      const requestId = id();
      condition = {
        sql: "EXISTS(SELECT 1 FROM payments WHERE id=? AND state='pending')",
        values: [payment.id],
      };
      statements.push(
        statement(
          env,
          "INSERT INTO requests(id,shoot_id,type,message) VALUES(?,?,'deposit',?)",
          requestId,
          shootId,
          `입금자명: ${depositor} · 결제 ${payment.id}`,
        ),
        statement(
          env,
          'INSERT INTO deposit_reports(request_id,payment_id,reported_depositor) VALUES(?,?,?)',
          requestId,
          payment.id,
          depositor,
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

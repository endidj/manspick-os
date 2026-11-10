// 원본 운영 카드의 입금·예약·제출 마감과 추가 보정 단가를 실제 설정으로 저장합니다.
import { useState } from 'react';
import { SLOT_TIMES, validateOperationsPolicy } from '@manspick/domain';
import type { OperationsPolicy } from '@manspick/domain';
import type { OperationsSettingsDTO, SettingsAction } from '@manspick/contracts';
import { Button, CheckItem, Notice } from '@manspick/design-system/components';
import { Dialog, TextField } from '@manspick/design-system/patterns';
import type { useSettings } from './use-settings';
import styles from './management.module.css';

export type PolicySection = 'payment' | 'schedule' | 'results';

const fields = {
  payment: [
    ['holdHours', '입금 잠금 시간', '예약 접수 후 최대 유지 시간', 168],
    ['holdCutoffHours', '촬영 전 입금 마감', '촬영 시작 몇 시간 전까지 유지할지', 24],
  ],
  schedule: [
    ['bookingHorizonWeeks', '예약 노출 기간', '내일부터 예약을 받을 주 수', 52],
    ['surveyLeadDays', '설문 제출 마감', '촬영 며칠 전 오후 8시에 마감할지', 30],
    ['outfitLeadDays', '의상 사진 제출 마감', '촬영 며칠 전 오후 8시에 마감할지', 30],
  ],
} as const;

export function PolicyEditor({
  section,
  data,
  busy,
  saveError,
  save,
  onClose,
  onEditBank,
}: {
  section: PolicySection;
  data: OperationsSettingsDTO;
  busy: boolean;
  saveError: string;
  save: ReturnType<typeof useSettings>['save'];
  onClose: () => void;
  onEditBank: () => void;
}) {
  const [policy, setPolicy] = useState<OperationsPolicy>(() => ({
    ...data.policy,
    slotTimes: [...data.policy.slotTimes],
  }));
  const addon = data.addons.find((item) => item.id === 'extra_retouch');
  const [price, setPrice] = useState(String(addon?.price ?? 10000));
  const [error, setError] = useState('');

  async function submit() {
    setError('');
    let action: SettingsAction;
    try {
      if (section === 'results') {
        const amount = Number(price);
        if (
          !addon ||
          !price.trim() ||
          !Number.isSafeInteger(amount) ||
          amount < 0 ||
          amount > 100000000
        )
          throw new Error('추가 보정 단가는 0~100,000,000원 사이의 정수로 입력해주세요.');
        action = { type: 'addon', value: { ...addon, price: amount } };
      } else {
        action = { type: 'operations_policy', value: validateOperationsPolicy(policy) };
      }
      if (await save(action)) onClose();
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={`${{ payment: '입금 · 결제', schedule: '일정 · 설문', results: '결과물 · 혜택' }[section]} 기준 편집`}
      actions={
        <>
          <Button variant="secondary" disabled={busy} onClick={onClose}>
            취소
          </Button>
          <Button
            loading={busy}
            disabled={busy || (section === 'results' && !addon)}
            onClick={submit}
          >
            기준 저장
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        {(error || saveError) && <Notice tone="error">{error || saveError}</Notice>}
        {section === 'results' ? (
          <>
            <TextField
              label="추가 보정 단가 (원 / 장)"
              type="number"
              min={0}
              max={100000000}
              step={1}
              value={price}
              disabled={busy || !addon}
              onValueChange={setPrice}
            />
            <Notice>
              패키지·옵션의 추가 보정과 같은 단가입니다. 새 신청에 적용하며 이미 접수한 주문 금액은
              유지합니다.
            </Notice>
            <Notice>
              수정 요청은 최대 3회입니다. 후기·보관·소개 혜택의 세부 기준은 별도 운영 정책을
              확인해주세요.
            </Notice>
          </>
        ) : (
          <>
            {fields[section].map(([key, label, hint, max]) => (
              <TextField
                key={key}
                label={label}
                hint={hint}
                type="number"
                min={1}
                max={max}
                step={1}
                value={Number.isFinite(policy[key]) ? String(policy[key]) : ''}
                disabled={busy}
                onValueChange={(value) =>
                  setPolicy({ ...policy, [key]: value === '' ? NaN : Number(value) })
                }
              />
            ))}
            {section === 'payment' ? (
              <Button variant="secondary" disabled={busy} onClick={onEditBank}>
                입금 계좌 편집
              </Button>
            ) : (
              <>
                <fieldset className={styles.form}>
                  <legend>예약에 노출할 시작 시간</legend>
                  {SLOT_TIMES.map((time) => (
                    <CheckItem
                      key={time}
                      label={time}
                      completed={policy.slotTimes.includes(time)}
                      disabled={busy}
                      onClick={() =>
                        setPolicy({
                          ...policy,
                          slotTimes: policy.slotTimes.includes(time)
                            ? policy.slotTimes.filter((slot) => slot !== time)
                            : [...policy.slotTimes, time],
                        })
                      }
                    />
                  ))}
                </fieldset>
                <Notice>
                  기존 11·13·15·17시 중 노출만 바꿉니다. 올데이는 11시 노출이 필요하며 네 타임을
                  모두 점유합니다. 쇼핑의 직전 타임과 기존 예약의 점유 시간은 숨김 여부와 관계없이
                  유지합니다.
                </Notice>
                <Notice>
                  마감이 지난 임박 예약은 기존과 같이 촬영 전날 오후 8시로 안내하며, 그 시간도
                  지났으면 접수 시점으로 적용합니다.
                </Notice>
              </>
            )}
            <Notice>
              새 예약부터 적용됩니다. 이미 예약한 촬영의 입금 기한·설문 마감·의상 마감은 바뀌지
              않습니다.
            </Notice>
          </>
        )}
      </div>
    </Dialog>
  );
}

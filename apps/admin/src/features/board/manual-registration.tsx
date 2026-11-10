// 직원이 고객의 정보와 실제 가능한 일정을 확인해 기존 예약 API로 접수합니다.
import { useEffect, useState } from 'react';
import { Button, Loading, Notice } from '@manspick/design-system/components';
import { Dialog, TextField } from '@manspick/design-system/patterns';
import type { AddonDTO, PackageDTO } from '@manspick/contracts';
import { api } from '@manspick/web/client';
import { money } from '@manspick/web/format';
import { addonQuantityLimit, defaultAddonRules, validateCatalogQuantities } from '@manspick/domain';
import styles from './customer-board.module.css';

type Day = { date: string; slots: { time: string; available: boolean }[] };
type RegistrationProps = { onCreated: () => Promise<void> };

export function ManualRegistration({ onCreated }: RegistrationProps) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  function openFreshForm() {
    setFormKey((previous) => previous + 1);
    setOpen(true);
  }

  return (
    <>
      <Button onClick={openFreshForm}>+ 고객 수동 등록</Button>
      <RegistrationDialog key={formKey} open={open} onOpenChange={setOpen} onCreated={onCreated} />
    </>
  );
}

function RegistrationDialog({
  open,
  onOpenChange,
  onCreated,
}: RegistrationProps & { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [catalog, setCatalog] = useState<{ packages: PackageDTO[]; addons: AddonDTO[] }>();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [packageId, setPackageId] = useState('hybrid');
  const [extras, setExtras] = useState<Record<string, number>>({});
  const [days, setDays] = useState<Day[]>([]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [channel, setChannel] = useState('bank');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{
    message: string;
    localAccess?: { token: string; last4: string };
  }>();
  const pack = catalog?.packages.find((item) => item.id === packageId);
  const selected = (catalog?.addons ?? [])
    .filter((addon) => (extras[addon.id] ?? 0) !== 0)
    .map((addon) => ({ addon, quantity: extras[addon.id]! }));
  let quantityError = '';
  if (pack) {
    try {
      validateCatalogQuantities(pack, selected);
    } catch (cause) {
      quantityError = (cause as Error).message;
    }
  }
  useEffect(() => {
    if (open)
      api<typeof catalog>('/catalog')
        .then(setCatalog)
        .catch((cause) => setError(cause.message));
  }, [open]);
  useEffect(() => {
    if (!open) return;
    let active = true;
    const addonIds = Object.entries(extras)
      .filter(([, quantity]) => quantity > 0)
      .map(([id]) => id)
      .sort()
      .join(',');
    api<{ days: Day[] }>(`/calendar?packageId=${packageId}&addons=${encodeURIComponent(addonIds)}`)
      .then((value) => {
        if (active) setDays(value.days);
      })
      .catch((cause) => {
        if (active) setError(cause.message);
      });
    return () => {
      active = false;
    };
  }, [open, packageId, extras]);

  function resetSchedule() {
    setDate('');
    setTime('');
    setDays([]);
  }

  function choosePackage(id: string) {
    const nextPackage = catalog?.packages.find((item) => item.id === id);
    setPackageId(id);
    setExtras((previous) => {
      let remaining = nextPackage?.outfits ?? 0;
      return Object.fromEntries(
        (catalog?.addons ?? []).map((addon) => {
          const previousQuantity = previous[addon.id] ?? 0;
          let quantity =
            nextPackage && Number.isInteger(previousQuantity) && previousQuantity > 0
              ? Math.min(previousQuantity, addonQuantityLimit(nextPackage, addon))
              : 0;
          if (
            (addon.quantityMode ?? defaultAddonRules(addon.id, addon.maxQuantity).quantityMode) ===
            'outfit'
          ) {
            quantity = Math.min(quantity, remaining);
            remaining -= quantity;
          }
          return [addon.id, quantity];
        }),
      );
    });
    setError('');
    resetSchedule();
  }

  async function submit() {
    setBusy(true);
    setError('');
    try {
      if (!pack) throw new Error('예약할 패키지를 선택해주세요.');
      validateCatalogQuantities(pack, selected);
      const value = await api<{ message: string; localAccess?: { token: string; last4: string } }>(
        '/start',
        {
          method: 'POST',
          body: JSON.stringify({
            name,
            phone,
            packageId,
            addons: Object.entries(extras)
              .filter(([, quantity]) => quantity > 0)
              .map(([id, quantity]) => ({ id, quantity })),
            date,
            time,
            paymentChannel: channel,
            privacyConsent: consent,
            serviceNotificationConsent: consent,
          }),
        },
      );
      setResult(value);
      await onCreated();
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="고객 수동 등록"
      description="고객에게 확인한 기본정보와 날짜·시간으로 접수합니다. 기존 예약과 같은 배정·중복 예약 검증을 적용합니다."
      actions={
        !result && (
          <Button
            loading={busy}
            disabled={
              !pack ||
              !name.trim() ||
              !phone ||
              !date ||
              !time ||
              !consent ||
              Boolean(quantityError)
            }
            onClick={submit}
          >
            고객 접수
          </Button>
        )
      }
    >
      {(quantityError || error) && <Notice tone="error">{quantityError || error}</Notice>}
      {result ? (
        <div className={styles.form}>
          <Notice tone="success">{result.message}</Notice>
          {result.localAccess && (
            <a
              href={`http://localhost:3001/s/${result.localAccess.token}`}
              target="_blank"
              rel="noreferrer"
            >
              로컬 고객 링크 열기 · 확인 번호 {result.localAccess.last4}
            </a>
          )}
        </div>
      ) : !catalog ? (
        <Loading />
      ) : (
        <div className={styles.form}>
          <TextField label="고객 이름" value={name} onValueChange={setName} required />
          <TextField
            label="휴대전화 번호"
            type="tel"
            value={phone}
            onValueChange={setPhone}
            required
          />
          <label>
            패키지
            <select value={packageId} onChange={(e) => choosePackage(e.target.value)}>
              {catalog.packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {money(p.price)}
                </option>
              ))}
            </select>
          </label>
          {catalog.addons
            .filter((addon) => pack && addonQuantityLimit(pack, addon) > 0)
            .map((addon) => (
              <label key={addon.id}>
                {addon.name} · {money(addon.price)}
                <input
                  type="number"
                  min={0}
                  max={pack ? addonQuantityLimit(pack, addon) : 0}
                  value={extras[addon.id] ?? 0}
                  onChange={(e) => {
                    setExtras({ ...extras, [addon.id]: Number(e.target.value) });
                    setError('');
                    resetSchedule();
                  }}
                />
              </label>
            ))}
          <label>
            촬영 날짜
            <select
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setTime('');
              }}
            >
              <option value="">날짜 선택</option>
              {days
                .filter((day) => day.slots.some((t) => t.available))
                .map((day) => (
                  <option key={day.date} value={day.date}>
                    {day.date}
                  </option>
                ))}
            </select>
          </label>
          <label>
            촬영 시간
            <select value={time} onChange={(e) => setTime(e.target.value)}>
              <option value="">시간 선택</option>
              {days
                .find((day) => day.date === date)
                ?.slots.map((slot) => (
                  <option key={slot.time} value={slot.time} disabled={!slot.available}>
                    {slot.time}
                    {!slot.available ? ' · 예약 불가' : ''}
                  </option>
                ))}
            </select>
          </label>
          <label>
            결제 경로
            <select value={channel} onChange={(e) => setChannel(e.target.value)}>
              {[
                ['bank', '계좌이체'],
                ['kmong', '크몽'],
                ['frip', '프립'],
                ['soomgo', '숨고'],
                ['smartstore', '스마트스토어'],
              ].map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.consent}>
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            개인정보 처리와 서비스 안내 수신 동의를 고객에게 확인했습니다.
          </label>
        </div>
      )}
    </Dialog>
  );
}

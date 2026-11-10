// 촬영 옵션·기본정보·실제 가능 일정을 원본의 세 예약 화면으로 연결합니다.
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button, Notice, Loading, TimeSlot } from '@manspick/design-system/components';
import { ChoiceCard, TextField, RadioPills, Dialog } from '@manspick/design-system/patterns';
import { Icon } from '@manspick/design-system/icons';
import { api } from '@manspick/web/client';
import { money } from '@manspick/web/format';
import type { AddonDTO, PackageDTO } from '@manspick/contracts';
import { CustomerShell, SceneFooter } from '../shell';
import { packageName } from '../customer/presentation';
import { addonQuantityLimit, validateCatalogQuantities } from '@manspick/domain';
import type { OperationsPolicy } from '@manspick/domain';
import { BookingCalendar, type CalendarDay } from './booking-calendar';
import layout from '../shell/customer-shell.module.css';
import styles from './booking.module.css';

const landingOrigin =
  process.env.NEXT_PUBLIC_LANDING_APP_ORIGIN?.trim().replace(/\/+$/, '') ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '');

const packageDetails: Record<string, string[]> = {
  one: ['의상 가이드 + 코디북'],
  hybrid: ['무드 2가지 (캐주얼 + 포멀)', '의상 가이드 + 코디북 + 그루밍 가이드'],
  allday: ['헤어 · 메이크업 포함 (70,000원 상당)', '외모 피드백 · 그루밍 가이드 · 차량 이동'],
};

export function Booking() {
  const [catalog, setCatalog] = useState<{
    packages: PackageDTO[];
    addons: AddonDTO[];
    retouchUnitPrice?: number;
    extraRetouchAvailable?: boolean;
  }>();
  const [policy, setPolicy] = useState<OperationsPolicy>();
  const [step, setStep] = useState(1);
  const [packageId, setPackage] = useState('hybrid');
  const [extras, setExtras] = useState<Record<string, number>>({});
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nickname, setNickname] = useState('');
  const [reportedAmount, setReportedAmount] = useState('');
  const [channel, setChannel] = useState('bank');
  const [privacy, setPrivacy] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [result, setResult] = useState<{
    message: string;
    localAccess?: { token: string; last4: string };
  }>();

  const calendarOptions = Object.entries(extras)
    .filter(([, quantity]) => quantity > 0)
    .map(([id]) => id)
    .sort()
    .join(',');

  useEffect(() => {
    api<{ packages: PackageDTO[]; addons: AddonDTO[] }>('/catalog')
      .then(setCatalog)
      .catch((failure: Error) => setError(failure.message));
  }, []);

  useEffect(() => {
    let active = true;
    api<{ days: CalendarDay[]; policy?: OperationsPolicy }>(
      `/calendar?packageId=${packageId}&addons=${encodeURIComponent(calendarOptions)}`,
    )
      .then((response) => {
        if (active) {
          setDays(response.days);
          setPolicy(response.policy);
        }
      })
      .catch((failure: Error) => {
        if (active) setError(failure.message);
      });
    return () => {
      active = false;
    };
  }, [packageId, calendarOptions]);

  const pkg = catalog?.packages.find((entry) => entry.id === packageId);
  const total =
    (pkg?.price ?? 0) +
    (catalog?.addons.reduce((sum, addon) => sum + addon.price * (extras[addon.id] ?? 0), 0) ?? 0);
  const summary = [
    packageName(packageId, pkg?.name),
    ...(catalog?.addons
      .filter((addon) => extras[addon.id])
      .map(
        (addon) =>
          `${addon.name}${(extras[addon.id] ?? 0) > 1 ? ` ${extras[addon.id]}${addon.quantityMode === 'outfit' ? '벌' : addon.quantityMode === 'shopping' ? '회' : '개'}` : ''}`,
      ) ?? []),
  ].join(' · ');

  function choosePackage(id: string) {
    const pack = catalog?.packages.find((entry) => entry.id === id);
    setPackage(id);
    setExtras((previous) => {
      let remaining = pack?.outfits ?? 1;
      return Object.fromEntries(
        (catalog?.addons ?? []).map((addon) => {
          let quantity = Math.min(
            previous[addon.id] ?? 0,
            pack ? addonQuantityLimit(pack, addon) : 0,
          );
          if (addon.quantityMode === 'outfit') {
            quantity = Math.min(quantity, remaining);
            remaining -= quantity;
          }
          return [addon.id, quantity];
        }),
      );
    });
    setDate('');
    setTime('');
    setDays([]);
  }

  function chooseExtra(id: string, quantity: number) {
    const next = { ...extras, [id]: quantity };
    try {
      if (pkg && catalog)
        validateCatalogQuantities(
          pkg,
          catalog.addons
            .filter((addon) => next[addon.id])
            .map((addon) => ({ addon, quantity: next[addon.id]! })),
        );
    } catch (failure) {
      setError((failure as Error).message);
      return;
    }
    setError('');
    setExtras((previous) => ({ ...previous, [id]: quantity }));
    if (Boolean(quantity) !== Boolean(extras[id])) {
      setDate('');
      setTime('');
      setDays([]);
    }
  }

  function next() {
    setError('');
    try {
      if (step === 1 && pkg && catalog)
        validateCatalogQuantities(
          pkg,
          catalog.addons
            .filter((addon) => extras[addon.id])
            .map((addon) => ({ addon, quantity: extras[addon.id]! })),
        );
    } catch (failure) {
      setError((failure as Error).message);
      return;
    }
    setStep(step + 1);
    window.scrollTo({ top: 0 });
  }

  async function submit() {
    setBusy(true);
    setError('');
    try {
      setResult(
        await api('/start', {
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
            paymentAmount: Number(reportedAmount || total),
            kakaoNickname: nickname,
            privacyConsent: privacy,
            serviceNotificationConsent: notifications,
            marketingConsent: marketing,
          }),
        }),
      );
      window.scrollTo({ top: 0 });
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <CustomerShell
      onHelp={() => setHelpOpen(true)}
      step={
        !result
          ? { title: step === 3 ? '촬영 일정 선택' : '촬영 옵션 선택', current: step === 3 ? 2 : 1 }
          : undefined
      }
    >
      {result ? (
        <section className={layout.stack}>
          <p className={layout.overline}>RESERVATION</p>
          <h1>예약 요청을 접수했어요</h1>
          <p>{result.message}</p>
          {result.localAccess && (
            <>
              <Notice>
                확인 번호: <strong>{result.localAccess.last4}</strong>
              </Notice>
              <Link href={`/s/${result.localAccess.token}`} className={styles.primaryLink}>
                나의 촬영에서 입금 안내 확인하기 <Icon name="arrow" size={18} />
              </Link>
            </>
          )}
          <Link className={layout.textLink} href="/">
            맨즈픽 홈으로
          </Link>
        </section>
      ) : (
        <>
          <header className={layout.stack}>
            <p className={layout.overline}>STEP {step === 3 ? 2 : 1}</p>
            <h1>
              {step === 1
                ? '촬영 옵션을 골라주세요'
                : step === 2
                  ? '기본정보를 남겨주세요'
                  : '촬영 날짜를 골라주세요'}
            </h1>
            <p>
              {step === 1
                ? '원하는 무드와 필요한 도움에 맞춰 골라주세요.'
                : step === 2
                  ? '진행 안내에 사용돼요. 다음에 들어올 때는 받은 링크 + 번호 뒤 4자리로 확인해요.'
                  : '가능한 날짜만 보여드려요. 시간까지 고르면 예약돼요.'}
            </p>
          </header>
          {error && <Notice tone="error">{error}</Notice>}
          {!catalog ? (
            <Loading />
          ) : (
            <>
              {step === 1 && (
                <>
                  <Notice>
                    <strong>크몽 · 프립 · 숨고 · 스마트스토어에서 이미 결제하셨나요?</strong>
                    <p>
                      구매하신 패키지를 그대로 골라주세요. 부가서비스는 여기서 추가할 수 있어요.
                    </p>
                  </Notice>
                  <fieldset className={`${layout.fieldSet} ${styles.packageList}`}>
                    <legend className={styles.fieldTitle}>패키지</legend>
                    {catalog.packages.map((entry) => (
                      <div key={entry.id} className={styles.packageWrap}>
                        {entry.id === 'hybrid' && <span className={styles.best}>BEST</span>}
                        <ChoiceCard
                          className={styles.packageChoice}
                          title={packageName(entry.id, entry.name)}
                          name="package"
                          checked={packageId === entry.id}
                          onCheckedChange={() => choosePackage(entry.id)}
                          description={
                            <span className={styles.packageDescription}>
                              <span className={styles.packagePrice}>
                                <span>
                                  {entry.duration}분 · {entry.outfits}벌
                                  {entry.spotDescription ? ` · ${entry.spotDescription}` : ''}
                                </span>
                                <span className={styles.priceStack}>
                                  {entry.originalPrice > entry.price && (
                                    <s>{money(entry.originalPrice)}</s>
                                  )}
                                  <strong>{money(entry.price)}</strong>
                                </span>
                              </span>
                              <span className={styles.packageDetails}>
                                <span>
                                  <Icon name="solar/check-circle-bold" size={12} /> 보정본{' '}
                                  {entry.retouchCount}장
                                </span>
                                {(packageDetails[entry.id] ?? [entry.description]).map((detail) => (
                                  <span key={detail}>
                                    <Icon name="solar/check-circle-bold" size={12} /> {detail}
                                  </span>
                                ))}
                              </span>
                              <span className={styles.recommendation}>
                                이런 분께 ·{' '}
                                {entry.id === 'one'
                                  ? '데이팅 앱 · 비즈니스 프로필'
                                  : entry.id === 'hybrid'
                                    ? '데이팅 + SNS 함께'
                                    : '이미지 변신'}
                              </span>
                            </span>
                          }
                        />
                      </div>
                    ))}
                  </fieldset>
                  <section className={styles.commonCard}>
                    <h2>
                      <Icon name="solar/check-circle-bold" size={17} /> 모든 패키지 공통
                    </h2>
                    <p>아이폰 촬영 · 카페 & 야외 촬영</p>
                    <p>포즈 · 표정 디렉팅 · 사진 컨설팅</p>
                    <p>의상 가이드와 코디북 · 보정 수정 최대 3회</p>
                    <p>
                      원본은 후기 확인 후 전체 제공 ·{' '}
                      {catalog.extraRetouchAvailable === false
                        ? '추가 보정 신청은 현재 중단되어 있어요'
                        : `추가 보정 1장 ${money(catalog.retouchUnitPrice ?? 10000)}`}
                    </p>
                  </section>
                  <section className={layout.stack}>
                    <h2 className={styles.sectionTitle}>
                      더 편하게 준비하고 싶다면 <span>선택</span>
                    </h2>
                    <p className={layout.small}>
                      필요한 것만 더해주세요. 수량은 촬영 의상 수 안에서 골라요.
                    </p>
                    <div className={styles.addonList}>
                      {catalog.addons
                        .filter((addon) => pkg && addonQuantityLimit(pkg, addon) > 0)
                        .map((addon) => (
                          <div className={styles.addonWrap} key={addon.id}>
                            <ChoiceCard
                              type="checkbox"
                              className={styles.addonChoice}
                              title={addon.name}
                              description={
                                <>
                                  <span>
                                    {money(addon.price)}
                                    {addon.quantityMode === 'outfit'
                                      ? ' / 1벌'
                                      : addon.quantityMode === 'shopping'
                                        ? ' / 1회'
                                        : ''}
                                  </span>
                                  {packageId === 'allday' && addon.id === 'hair' && (
                                    <small>올데이에 포함되어 있어요</small>
                                  )}
                                </>
                              }
                              checked={
                                Boolean(extras[addon.id]) ||
                                (packageId === 'allday' && addon.id === 'hair')
                              }
                              disabled={packageId === 'allday' && addon.id === 'hair'}
                              onCheckedChange={(checked) => chooseExtra(addon.id, checked ? 1 : 0)}
                            />
                            {Boolean(extras[addon.id]) &&
                              pkg &&
                              addonQuantityLimit(pkg, addon) > 1 && (
                                <div className={styles.quantity}>
                                  <span>
                                    {addon.quantityMode === 'outfit' ? '의상 수량' : '신청 수량'}
                                  </span>
                                  <select
                                    aria-label={`${addon.name} 수량`}
                                    value={extras[addon.id]}
                                    onChange={(event) =>
                                      chooseExtra(addon.id, Number(event.target.value))
                                    }
                                  >
                                    {Array.from(
                                      { length: addonQuantityLimit(pkg, addon) },
                                      (_, index) => (
                                        <option key={index + 1} value={index + 1}>
                                          {index + 1}
                                          {addon.quantityMode === 'outfit'
                                            ? '벌'
                                            : addon.quantityMode === 'shopping'
                                              ? '회'
                                              : '개'}
                                        </option>
                                      ),
                                    )}
                                  </select>
                                </div>
                              )}
                          </div>
                        ))}
                    </div>
                  </section>
                  <SceneFooter>
                    <div className={layout.between}>
                      <span className={layout.small}>총 금액</span>
                      <strong className={styles.total}>{money(total)}</strong>
                    </div>
                    <Button fullWidth onClick={next}>
                      다음: 기본정보 남기기
                    </Button>
                    <p>선택한 옵션은 다음 화면에서 바꿀 수 있어요</p>
                  </SceneFooter>
                </>
              )}
              {step === 2 && (
                <form
                  className={layout.stack}
                  onSubmit={(event) => {
                    event.preventDefault();
                    next();
                  }}
                >
                  <section className={styles.selectedOptions}>
                    <div>
                      <p>선택한 옵션</p>
                      <strong>{summary}</strong>
                    </div>
                    <button type="button" className={styles.change} onClick={() => setStep(1)}>
                      변경
                    </button>
                  </section>
                  <RadioPills
                    className={styles.channelPills}
                    label="결제는 어디서 하셨나요?"
                    value={channel}
                    onValueChange={setChannel}
                    options={[
                      { value: 'bank', label: '계좌이체' },
                      { value: 'kmong', label: '크몽' },
                      { value: 'frip', label: '프립' },
                      { value: 'soomgo', label: '숨고' },
                      { value: 'smartstore', label: '스마트스토어' },
                      { value: 'unpaid', label: '아직 결제 전' },
                    ]}
                  />
                  <TextField
                    className={styles.amountField}
                    label="결제 금액 (원)"
                    value={reportedAmount || String(total)}
                    onValueChange={setReportedAmount}
                    type="number"
                    min={0}
                    max={100000000}
                    hint="선택하신 구성과 결제 금액이 다르면 직원이 확인 후 알려드려요. 계좌이체는 날짜를 고른 뒤 입금 안내를 드려요."
                  />
                  <TextField
                    label="이름"
                    value={name}
                    onValueChange={setName}
                    autoComplete="name"
                    maxLength={40}
                    required
                    placeholder="성함을 입력해주세요"
                  />
                  <TextField
                    label="휴대폰 번호"
                    value={phone}
                    onValueChange={setPhone}
                    type="tel"
                    autoComplete="tel"
                    pattern="[0-9\- ]{10,14}"
                    required
                    placeholder="010-1234-5678"
                    hint="같은 번호로 신청한 내역이 있으면 이어서 진행돼요."
                  />
                  <TextField
                    label="카카오톡 채널 닉네임 (선택)"
                    value={nickname}
                    onValueChange={setNickname}
                    maxLength={80}
                    placeholder="상담하신 카톡 이름을 적어주시면 빨라요"
                  />
                  <section className={styles.consents}>
                    <label>
                      <input
                        type="checkbox"
                        required
                        checked={privacy}
                        onChange={(event) => setPrivacy(event.target.checked)}
                      />
                      <span>개인정보 수집·이용 동의</span>
                      {landingOrigin ? (
                        <a href={`${landingOrigin}/legal`} target="_blank" rel="noreferrer">
                          안내 보기
                        </a>
                      ) : (
                        <span className={styles.required}>필수</span>
                      )}
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        required
                        checked={notifications}
                        onChange={(event) => setNotifications(event.target.checked)}
                      />
                      <span>촬영 안내 알림 수신 동의 (카카오톡)</span>
                      <span className={styles.required}>필수</span>
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={marketing}
                        onChange={(event) => setMarketing(event.target.checked)}
                      />
                      <span>마케팅 정보 수신 동의</span>
                      <small>선택</small>
                    </label>
                  </section>
                  <SceneFooter>
                    <Button type="submit" fullWidth>
                      다음: 촬영 날짜 고르기
                    </Button>
                    <p>다음 화면에서 바로 가능한 날짜와 시간을 보여드려요</p>
                  </SceneFooter>
                </form>
              )}
              {step === 3 && (
                <>
                  <section className={styles.selectedOptions}>
                    <div>
                      <p>선택한 옵션</p>
                      <strong>{summary}</strong>
                    </div>
                    <button className={styles.change} onClick={() => setStep(1)}>
                      변경
                    </button>
                  </section>
                  <BookingCalendar
                    key={`${packageId}-${calendarOptions}`}
                    days={days}
                    value={date}
                    onValueChange={(value) => {
                      setDate(value);
                      setTime('');
                    }}
                  />
                  <section className={layout.stack}>
                    <h2 className={styles.sectionTitle}>
                      {date
                        ? `${Number(date.slice(5, 7))}월 ${Number(date.slice(8))}일 가능한 시간`
                        : '날짜를 고르면 시간을 보여드려요'}
                    </h2>
                    {date && (
                      <div className={styles.times}>
                        {(days.find((day) => day.date === date)?.slots ?? []).map((slot) => (
                          <TimeSlot
                            key={slot.time}
                            label={slot.time}
                            availability={slot.available ? 'available' : 'booked'}
                            selected={time === slot.time}
                            onClick={() => setTime(slot.time)}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                  <Notice>
                    <strong>예약 전에 확인해주세요</strong>
                    <p>
                      · 내일부터 {policy?.bookingHorizonWeeks ?? 8}주 이내 날짜를 고를 수 있어요.
                      <br />· 계좌이체는 예약 후 최대 {policy?.holdHours ?? 24}시간, 촬영{' '}
                      {policy?.holdCutoffHours ?? 2}시간 전까지 중 먼저 오는 시각까지 확인이
                      필요해요.
                      <br />· 외부 플랫폼 결제도 직원 확인 후 확정돼요.
                    </p>
                  </Notice>
                  <SceneFooter>
                    <div className={layout.between}>
                      <span className={layout.small}>선택한 일정</span>
                      <strong>
                        {date && time
                          ? `${date.slice(5).replace('-', '/')} · ${time}`
                          : '날짜와 시간을 골라주세요'}
                      </strong>
                    </div>
                    <Button
                      fullWidth
                      disabled={!date || !time || !privacy || !notifications}
                      loading={busy}
                      onClick={submit}
                    >
                      이 시간으로 예약하기
                    </Button>
                    <p>일정은 실제 입금 확인 기한까지 잡아둘게요</p>
                  </SceneFooter>
                </>
              )}
            </>
          )}
        </>
      )}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen} title="예약을 도와드릴게요">
        <p>
          상담을 진행한 맨즈픽 카카오채널로 문의해주세요. 공식 상담 주소가 아직 등록되지 않았어요.
        </p>
      </Dialog>
    </CustomerShell>
  );
}

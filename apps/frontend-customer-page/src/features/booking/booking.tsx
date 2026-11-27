// 촬영 옵션·기본정보·실제 가능 일정을 원본의 세 예약 화면으로 연결합니다.
'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Notice, Loading, TimeSlot } from '@manspick/design-system/components';
import {
  ChoiceCard,
  Dialog,
  InfoRow,
  TextField,
  RadioPills,
} from '@manspick/design-system/patterns';
import { Icon, type IconName } from '@manspick/design-system/icons';
import { api, ApiError, trackEvent, visitId } from '@manspick/web/client';
import { money } from '@manspick/web/format';
import type {
  AddonDTO,
  BookingResultDTO,
  OperationsSettingsDTO,
  PackageDTO,
} from '@manspick/contracts';
import { CustomerShell, SceneFooter, kakaoChannelUrl } from '../shell';
import { packageName, prepaidPlatform } from '../customer/presentation';
import { customerPath } from '../customer/routes';
import { addonQuantityLimit, validateCatalogQuantities } from '@manspick/domain';
import type { OperationsPolicy } from '@manspick/domain';
import { BookingCalendar, type CalendarDay } from './booking-calendar';
import { compareAddonDisplayOrder } from './addon-order';
import { useFlowNavigation } from '../shell/flow-navigation';
import { bookingPaths, bookingStep } from './routes';
import layout from '../shell/customer-shell.module.css';
import styles from './booking.module.css';

const landingOrigin =
  process.env.NEXT_PUBLIC_LANDING_APP_ORIGIN?.trim().replace(/\/+$/, '') ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '');

const addonIcons: Record<string, IconName> = {
  hair: 'solar/magic-stick-3-bold',
  rental: 'solar/hanger-bold',
  outfit: 'solar/t-shirt-bold',
  shopping: 'solar/bag-bold',
};

function durationLabel(minutes: number) {
  return minutes % 60 === 0 ? `${minutes / 60}시간` : `${minutes}분`;
}

export function Booking() {
  const [catalog, setCatalog] = useState<{
    packages: PackageDTO[];
    addons: AddonDTO[];
    packageItems?: OperationsSettingsDTO['packageItems'];
    testCheckoutEnabled: boolean;
  }>();
  const [policy, setPolicy] = useState<OperationsPolicy>();
  const { pathname, navigate, back } = useFlowNavigation('/start');
  const step = bookingStep(pathname) ?? 1;
  const [packageId, setPackage] = useState('hybrid');
  const [extras, setExtras] = useState<Record<string, number>>({});
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nickname, setNickname] = useState('');
  const [platformNickname, setPlatformNickname] = useState('');
  const [reportedAmount, setReportedAmount] = useState('');
  const [channel, setChannel] = useState('pg');
  const [privacy, setPrivacy] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [date, setDate] = useState('');
  const [timeOptions, setTimeOptions] = useState<{ date: string; time: string }[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [result, setResult] = useState<BookingResultDTO>();
  const bookingToken = result?.bookingAccess?.token ?? result?.localAccess?.token;
  const completed = result?.bookingStatus === 'complete';
  const detailsReady = Boolean(
    name.trim() &&
    phone.replace(/\D/g, '').length >= 10 &&
    privacy &&
    notifications &&
    (!prepaidPlatform(channel) || platformNickname.trim()),
  );

  useEffect(() => {
    if (result) navigate('/start/complete', true);
    else if (step === 4) navigate('/start', true);
    else if (step === 3 && !detailsReady) navigate('/start/details', true);
  }, [step, detailsReady, result, navigate]);

  useEffect(() => {
    const event = ['order_options', 'order_details', 'order_schedule'][step - 1];
    if (event) trackEvent(event, { channel });
  }, [channel, step]);

  function setStep(next: number) {
    setCheckoutOpen(false);
    navigate(bookingPaths[next - 1]!);
  }

  const calendarOptions = Object.entries(extras)
    .filter(([, quantity]) => quantity > 0)
    .map(([id]) => id)
    .sort()
    .join(',');

  const applyCatalog = useCallback((updated: NonNullable<typeof catalog>) => {
    setCatalog(updated);
    setPackage((current) =>
      updated.packages.some((pack) => pack.id === current)
        ? current
        : (updated.packages[0]?.id ?? ''),
    );
  }, []);

  useEffect(() => {
    api<NonNullable<typeof catalog>>('/catalog')
      .then(applyCatalog)
      .catch((failure: Error) => setError(failure.message));
  }, [applyCatalog]);

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
  ].join(' + ');
  const dateLabel = date
    ? new Date(`${date}T12:00:00+09:00`).toLocaleDateString('ko-KR', {
        timeZone: 'Asia/Seoul',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      })
    : '';

  function limitFor(pack: PackageDTO, addon: AddonDTO) {
    const limit = addonQuantityLimit(pack, addon);
    if (!catalog?.packageItems) return limit;
    const item = catalog.packageItems.find(
      (entry) => entry.packageId === pack.id && entry.itemId === addon.id,
    );
    return item?.inclusionType === 'optional' ? Math.min(limit, item.quantity) : 0;
  }

  function choosePackage(id: string) {
    if (id === packageId) return;
    const pack = catalog?.packages.find((entry) => entry.id === id);
    setPackage(id);
    setExtras((previous) => {
      let remaining = pack?.outfits ?? 1;
      return Object.fromEntries(
        (catalog?.addons ?? []).map((addon) => {
          let quantity = Math.min(previous[addon.id] ?? 0, pack ? limitFor(pack, addon) : 0);
          if (addon.quantityMode === 'outfit') {
            quantity = Math.min(quantity, remaining);
            remaining -= quantity;
          }
          return [addon.id, quantity];
        }),
      );
    });
    setDate('');
    setTimeOptions([]);
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
      setTimeOptions([]);
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
    if (submitting.current || result || !detailsReady || !timeOptions.length) return;
    if (channel === 'pg' && (!checkoutOpen || !catalog?.testCheckoutEnabled)) return;
    submitting.current = true;
    setCheckoutOpen(false);
    setBusy(true);
    setError('');
    try {
      const booking = await api<BookingResultDTO>('/start', {
        method: 'POST',
        body: JSON.stringify({
          name,
          phone,
          packageId,
          addons: Object.entries(extras)
            .filter(([, quantity]) => quantity > 0)
            .map(([id, quantity]) => ({ id, quantity })),
          timeOptions,
          visitorId: visitId(),
          platformNickname: prepaidPlatform(channel) ? platformNickname.trim() : undefined,
          paymentChannel: channel,
          ...(channel === 'pg' && { testCheckoutApproved: true, testCheckoutAmountKrw: total }),
          paymentAmount: channel === 'pg' ? total : Number(reportedAmount || total),
          kakaoNickname: nickname,
          privacyConsent: privacy,
          serviceNotificationConsent: notifications,
          marketingConsent: marketing,
        }),
      });
      setResult(booking);
      window.scrollTo({ top: 0 });
    } catch (failure) {
      setError((failure as Error).message);
      if (failure instanceof ApiError && failure.code === 'CHECKOUT_AMOUNT_CHANGED') {
        setExtras({});
        setTimeOptions([]);
        setStep(1);
        try {
          applyCatalog(await api<NonNullable<typeof catalog>>('/catalog'));
        } catch (refreshError) {
          setError((refreshError as Error).message);
        }
      }
      window.scrollTo({ top: 0 });
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <CustomerShell
      onBack={() => {
        if (result || step === 1) window.location.assign(landingOrigin || '/');
        else back(bookingPaths[step - 2]!);
      }}
      step={
        !result
          ? { title: step === 3 ? '촬영 일정 선택' : '촬영 옵션 선택', current: step === 3 ? 2 : 1 }
          : undefined
      }
    >
      {result ? (
        <section className={layout.stack}>
          <p className={layout.overline}>RESERVATION</p>
          <h1>{completed ? '예약이 완료됐어요' : '예약 요청을 접수했어요'}</h1>
          <p>
            {completed
              ? '촬영 설문을 작성해주세요. 담당 디렉터가 희망 일정 중 하나를 확정해요.'
              : result.message}
          </p>
          {result.localAccess && (
            <Notice>
              확인 번호: <strong>{result.localAccess.last4}</strong>
            </Notice>
          )}
          {bookingToken ? (
            <Link
              href={customerPath(bookingToken, completed ? 'survey' : 'home')}
              className={styles.primaryLink}
            >
              {completed ? '촬영 설문 작성하기' : '나의 촬영 보기'} <Icon name="arrow" size={18} />
            </Link>
          ) : (
            <Notice>
              {completed
                ? '설문은 안내받은 개인 촬영 링크에서 작성해주세요.'
                : '이미 안내받은 개인 촬영 링크가 있다면 그 링크에서 이어서 진행해주세요. 링크를 찾을 수 없다면 예약 상담을 진행한 채널로 문의해주세요.'}
            </Notice>
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
              {step === 1 ? (
                '패키지와 부가서비스를 고르면 바로 촬영 날짜를 잡을 수 있어요.'
              ) : step === 2 ? (
                '진행 안내에 사용돼요. 다음에 들어올 때는 받은 링크 + 번호 뒤 4자리로 확인해요.'
              ) : (
                <>
                  가능한 날짜와 시간만 보여드려요.
                  <br />
                  여러 날짜와 시간을 고를 수 있어요. 담당 디렉터가 그중 한 일정을 확정해요.
                </>
              )}
            </p>
          </header>
          {error && <Notice tone="error">{error}</Notice>}
          {!catalog ? (
            <Loading />
          ) : (
            <>
              {step === 1 && (
                <>
                  <Notice className={styles.notice}>
                    <strong>크몽 · 프립 · 숨고 · 스마트스토어에서 이미 결제하셨나요?</strong>
                    <p>외부 플랫폼에서 구매한 패키지와 부가서비스를 골라주세요.</p>
                  </Notice>
                  <fieldset className={`${layout.fieldSet} ${styles.packageList}`}>
                    <legend className={styles.visuallyHidden}>패키지</legend>
                    {catalog.packages.map((entry) => (
                      <ChoiceCard
                        key={entry.id}
                        className={styles.packageChoice}
                        title={
                          <>
                            <span>{packageName(entry.id, entry.name)}</span>
                            {entry.id === 'hybrid' && <span className={styles.best}>BEST</span>}
                          </>
                        }
                        name="package"
                        checked={packageId === entry.id}
                        onCheckedChange={() => choosePackage(entry.id)}
                        description={
                          <>
                            <span className={styles.packageMeta}>
                              {durationLabel(entry.duration)} · {entry.outfits}벌
                              {entry.spotDescription ? ` · ${entry.spotDescription}` : ''}
                            </span>
                            <span className={styles.priceStack}>
                              {entry.originalPrice > entry.price && (
                                <s>{money(entry.originalPrice)}</s>
                              )}
                              <strong>{money(entry.price)}</strong>
                            </span>
                            <span className={styles.packageDetails}>
                              <span>
                                <Icon name="solar/check-circle-bold" size={12} /> 보정본{' '}
                                {entry.retouchCount}장
                              </span>
                              {[
                                entry.description,
                                ...(catalog.packageItems ?? [])
                                  .filter(
                                    (item) =>
                                      item.packageId === entry.id &&
                                      item.inclusionType === 'included',
                                  )
                                  .map((item) => {
                                    const addon = catalog.addons.find(
                                      (candidate) => candidate.id === item.itemId,
                                    );
                                    return addon ? `${addon.name} × ${item.quantity}` : '';
                                  }),
                              ]
                                .filter(Boolean)
                                .map((detail) => (
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
                          </>
                        }
                      />
                    ))}
                  </fieldset>
                  <section className={layout.stack}>
                    <h2 className={styles.sectionTitle}>
                      부가서비스 <span>선택 사항</span>
                    </h2>
                    <div className={styles.addonList}>
                      {catalog.addons
                        .filter((addon) => pkg && limitFor(pkg, addon) > 0)
                        .sort(compareAddonDisplayOrder)
                        .map((addon) => (
                          <div
                            className={styles.addonWrap}
                            key={addon.id}
                            data-selected={Boolean(extras[addon.id]) || undefined}
                          >
                            <ChoiceCard
                              type="checkbox"
                              className={styles.addonChoice}
                              title={addon.name}
                              description={
                                <>
                                  <Icon
                                    className={styles.addonIcon}
                                    name={addonIcons[addon.id] ?? 'solar/check-circle-bold'}
                                    size={18}
                                  />
                                  <span className={styles.addonDescription}>
                                    {addon.description}
                                  </span>
                                  <span className={styles.addonPrice}>
                                    +{addon.price.toLocaleString('ko-KR')}
                                  </span>
                                </>
                              }
                              checked={Boolean(extras[addon.id])}
                              onCheckedChange={(checked) => chooseExtra(addon.id, checked ? 1 : 0)}
                            />
                            {Boolean(extras[addon.id]) && pkg && limitFor(pkg, addon) > 1 && (
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
                                  {Array.from({ length: limitFor(pkg, addon) }, (_, index) => (
                                    <option key={index + 1} value={index + 1}>
                                      {index + 1}
                                      {addon.quantityMode === 'outfit'
                                        ? '벌'
                                        : addon.quantityMode === 'shopping'
                                          ? '회'
                                          : '개'}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </section>
                  <SceneFooter>
                    <div className={styles.summaryStrip}>
                      <div className={styles.footerSummary}>
                        <span>{summary}</span>
                        <strong>{money(total)}</strong>
                      </div>
                      <span className={layout.small}>결제 방법은 다음 화면에서</span>
                    </div>
                    {!pkg && <Notice>지금 신청할 수 있는 촬영 패키지가 없습니다.</Notice>}
                    <Button fullWidth onClick={next} disabled={!pkg}>
                      다음: 기본정보 입력
                    </Button>
                    <p>
                      <a href={kakaoChannelUrl} target="_blank" rel="noopener noreferrer">
                        뭘 골라야 할지 모르겠다면 카카오톡으로 물어보세요
                      </a>
                    </p>
                  </SceneFooter>
                </>
              )}
              {step === 2 && (
                <form
                  className={`${layout.stack} ${styles.detailsForm}`}
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
                    label="결제 경로"
                    value={channel}
                    onValueChange={setChannel}
                    options={[
                      { value: 'pg', label: '맨즈픽 직접결제' },
                      { value: 'kmong', label: '크몽' },
                      { value: 'frip', label: '프립' },
                      { value: 'soomgo', label: '숨고' },
                      { value: 'smartstore', label: '스마트스토어' },
                    ]}
                  />
                  {channel === 'pg' && (
                    <p>
                      {catalog.testCheckoutEnabled
                        ? '희망 일정을 고른 뒤 테스트 결제창에서 승인하면 예약이 완료돼요.'
                        : '직접결제는 결제사 연동을 준비하고 있어요.'}
                    </p>
                  )}
                  {prepaidPlatform(channel) && (
                    <TextField
                      label="결제한 플랫폼 닉네임"
                      required
                      value={platformNickname}
                      onValueChange={setPlatformNickname}
                      maxLength={80}
                    />
                  )}
                  {channel !== 'pg' && (
                    <div className={styles.amountEntry}>
                      <TextField
                        className={styles.amountField}
                        label="결제 금액 (원)"
                        value={reportedAmount || String(total)}
                        onValueChange={setReportedAmount}
                        type="number"
                        min={0}
                        max={100000000}
                        hint="외부 플랫폼에서 이미 결제한 금액을 입력해주세요. 맨즈픽에서 추가 결제 없이 예약을 신청해요."
                      />
                      <span className={styles.formattedAmount} aria-hidden="true">
                        {Number(reportedAmount || total).toLocaleString('ko-KR')}
                      </span>
                    </div>
                  )}
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
                      {landingOrigin && (
                        <a href={`${landingOrigin}/legal`} target="_blank" rel="noreferrer">
                          안내 보기
                        </a>
                      )}
                      <small className={styles.required}>필수</small>
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        required
                        checked={notifications}
                        onChange={(event) => setNotifications(event.target.checked)}
                      />
                      <span>촬영 안내 알림 수신 동의 (카카오톡)</span>
                      <small className={styles.required}>필수</small>
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
                <div className={styles.schedule}>
                  <section className={styles.selectedOptions}>
                    <div>
                      <p>선택한 촬영</p>
                      <strong>{summary}</strong>
                    </div>
                    {pkg && (
                      <span className={styles.duration}>약 {durationLabel(pkg.duration)}</span>
                    )}
                  </section>
                  <BookingCalendar
                    key={`${packageId}-${calendarOptions}`}
                    days={days}
                    horizonWeeks={policy?.bookingHorizonWeeks ?? 8}
                    value={date}
                    onValueChange={(value) => {
                      setDate(value);
                    }}
                  />
                  <section className={layout.stack}>
                    <h2 className={styles.sectionTitle}>
                      {date ? `${dateLabel} 가능한 시간` : '날짜를 고르면 시간을 보여드려요'}
                    </h2>
                    {date && (
                      <div className={styles.times}>
                        {(days.find((day) => day.date === date)?.slots ?? []).map((slot) => (
                          <TimeSlot
                            key={slot.time}
                            label={slot.time}
                            availability={slot.available ? 'available' : 'booked'}
                            selected={timeOptions.some(
                              (entry) => entry.date === date && entry.time === slot.time,
                            )}
                            onClick={() =>
                              setTimeOptions((current) => {
                                const selected = current.some(
                                  (entry) => entry.date === date && entry.time === slot.time,
                                );
                                return selected
                                  ? current.filter(
                                      (entry) => entry.date !== date || entry.time !== slot.time,
                                    )
                                  : [...current, { date, time: slot.time }];
                              })
                            }
                          />
                        ))}
                      </div>
                    )}
                    {pkg && (
                      <p className={layout.small}>
                        촬영은 약 {durationLabel(pkg.duration)} 걸려요. 촬영 장소는 코디와 설문을
                        보고 정해지면 바로 알려드려요.
                      </p>
                    )}
                  </section>
                  {timeOptions.length > 0 && (
                    <section className={layout.stack} aria-label="선택한 희망 일정">
                      <h2 className={styles.sectionTitle}>선택한 희망 일정</h2>
                      {timeOptions.map((entry) => (
                        <div key={entry.date + entry.time} className={layout.between}>
                          <span>
                            {entry.date} {entry.time}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            aria-label={`${entry.date} ${entry.time} 삭제`}
                            onClick={() =>
                              setTimeOptions((current) =>
                                current.filter(
                                  (option) =>
                                    option.date !== entry.date || option.time !== entry.time,
                                ),
                              )
                            }
                          >
                            삭제
                          </Button>
                        </div>
                      ))}
                    </section>
                  )}
                  <SceneFooter>
                    <div className={styles.summaryStrip}>
                      <div className={styles.footerSummary}>
                        <span>선택한 희망 일정</span>
                        <strong>{timeOptions.length}개</strong>
                      </div>
                      <span className={layout.small}>디렉터는 확정 후 안내</span>
                    </div>
                    <Button
                      fullWidth
                      disabled={
                        !timeOptions.length ||
                        !privacy ||
                        !notifications ||
                        (channel === 'pg' && !catalog.testCheckoutEnabled)
                      }
                      loading={busy}
                      onClick={() => (channel === 'pg' ? setCheckoutOpen(true) : void submit())}
                    >
                      {channel === 'pg'
                        ? catalog.testCheckoutEnabled
                          ? '결제창 열기'
                          : '직접결제 준비 중'
                        : '예약 신청 완료하기'}
                    </Button>
                    <p>
                      <a href={kakaoChannelUrl} target="_blank" rel="noopener noreferrer">
                        원하는 날짜가 없나요? 카카오톡으로 문의해주세요
                      </a>
                    </p>
                  </SceneFooter>
                  {checkoutOpen && channel === 'pg' && catalog.testCheckoutEnabled && (
                    <Dialog
                      open
                      onOpenChange={setCheckoutOpen}
                      title="테스트 결제"
                      description="가상 결제로 예약을 진행해요. 실제 청구 금액은 0원이에요."
                      closeLabel="결제 취소"
                      actions={
                        <Button fullWidth onClick={() => void submit()}>
                          {money(total)} 테스트 결제 승인
                        </Button>
                      }
                    >
                      <InfoRow label="주문 내용" value={summary} />
                      <InfoRow label="테스트 결제 금액" value={money(total)} />
                    </Dialog>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </CustomerShell>
  );
}

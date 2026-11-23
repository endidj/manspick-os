// 촬영 옵션·기본정보·실제 가능 일정을 원본의 세 예약 화면으로 연결합니다.
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button, Notice, Loading, TimeSlot } from '@manspick/design-system/components';
import { ChoiceCard, TextField, RadioPills } from '@manspick/design-system/patterns';
import { Icon, type IconName } from '@manspick/design-system/icons';
import { api } from '@manspick/web/client';
import { money } from '@manspick/web/format';
import type { AddonDTO, BookingResultDTO, PackageDTO } from '@manspick/contracts';
import { CustomerShell, SceneFooter, kakaoChannelUrl } from '../shell';
import { packageName, prepaidPlatform, shootTime } from '../customer/presentation';
import { customerPath } from '../customer/routes';
import { addonQuantityLimit, validateCatalogQuantities } from '@manspick/domain';
import type { OperationsPolicy } from '@manspick/domain';
import { BookingCalendar, type CalendarDay } from './booking-calendar';
import { useFlowNavigation } from '../shell/flow-navigation';
import { bookingPaths, bookingStep } from './routes';
import layout from '../shell/customer-shell.module.css';
import styles from './booking.module.css';

const landingOrigin =
  process.env.NEXT_PUBLIC_LANDING_APP_ORIGIN?.trim().replace(/\/+$/, '') ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '');

const packageDetails: Record<string, string[]> = {
  one: ['의상 가이드 + 코디북'],
  hybrid: ['무드 2가지 (캐주얼 + 포멀)', '의상 가이드 + 코디북 · 그루밍 노션'],
  allday: ['헤어 · 메이크업 포함', '외모 피드백 · 그루밍 노션 · 차량 이동'],
};

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
    retouchUnitPrice?: number;
    extraRetouchAvailable?: boolean;
  }>();
  const [policy, setPolicy] = useState<OperationsPolicy>();
  const { pathname, navigate, back } = useFlowNavigation('/start');
  const step = bookingStep(pathname) ?? 1;
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
  const [result, setResult] = useState<BookingResultDTO & { platform?: string }>();
  const bookingToken = result?.bookingAccess?.token ?? result?.localAccess?.token;
  const platform = result?.platform;
  const detailsReady = Boolean(
    name.trim() && phone.replace(/\D/g, '').length >= 10 && privacy && notifications,
  );

  useEffect(() => {
    if (result) navigate('/start/complete', true);
    else if (step === 4) navigate('/start', true);
    else if (step === 3 && !detailsReady) navigate('/start/details', true);
  }, [step, detailsReady, result, navigate]);

  function setStep(next: number) {
    navigate(bookingPaths[next - 1]!);
  }

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
  ].join(' + ');
  const dateLabel = date
    ? new Date(`${date}T12:00:00+09:00`).toLocaleDateString('ko-KR', {
        timeZone: 'Asia/Seoul',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      })
    : '';

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
    if (busy || result || !detailsReady) return;
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
          date,
          time,
          paymentChannel: channel,
          paymentAmount: Number(reportedAmount || total),
          kakaoNickname: nickname,
          privacyConsent: privacy,
          serviceNotificationConsent: notifications,
          marketingConsent: marketing,
        }),
      });
      setResult({ ...booking, platform: prepaidPlatform(channel) });
      window.scrollTo({ top: 0 });
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
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
          <h1>{platform && bookingToken ? '결제 확인을 요청했어요' : '예약 요청을 접수했어요'}</h1>
          {!(platform && result.bookingAccess) && <p>{result.message}</p>}
          <p>
            {platform
              ? `${platform} 결제 내역을 직원이 확인하면 설문을 작성할 수 있어요.`
              : '입금 확인이 끝나면 설문을 작성할 수 있어요.'}
          </p>
          {result.localAccess && (
            <Notice>
              확인 번호: <strong>{result.localAccess.last4}</strong>
            </Notice>
          )}
          {bookingToken ? (
            <Link href={customerPath(bookingToken, 'payment')} className={styles.primaryLink}>
              {platform ? '결제 확인 상태 보기' : '입금 안내 확인하고 계속하기'}{' '}
              <Icon name="arrow" size={18} />
            </Link>
          ) : (
            <Notice>
              이미 안내받은 개인 촬영 링크가 있다면 그 링크에서 이어서 진행해주세요. 링크를 찾을 수
              없다면 예약 상담을 진행한 채널로 문의해주세요.
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
                  담당 디렉터는 예약이 확정되면 알려드려요.
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
                    <p>
                      구매하신 패키지를 그대로 골라주세요. 부가서비스는 여기서 추가할 수 있어요.
                    </p>
                  </Notice>
                  <fieldset className={`${layout.fieldSet} ${styles.packageList}`}>
                    <legend className={styles.visuallyHidden}>패키지</legend>
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
                                  {durationLabel(entry.duration)} · {entry.outfits}벌
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
                    <h2>모든 패키지 공통</h2>
                    <p>
                      아이폰 촬영 (카페 · 야외 스팟) · 사진 컨설팅 · 포즈·표정 디렉팅 · 수정 3회
                    </p>
                    <p>
                      원본은 후기 확인 후 전체 제공 ·{' '}
                      {catalog.extraRetouchAvailable === false
                        ? '추가 보정 신청은 현재 중단되어 있어요'
                        : `추가 보정 1장 ${money(catalog.retouchUnitPrice ?? 10000)}`}
                    </p>
                  </section>
                  <section className={layout.stack}>
                    <h2 className={styles.sectionTitle}>
                      부가서비스 <span>선택 사항</span>
                    </h2>
                    <div className={styles.addonList}>
                      {catalog.addons
                        .filter((addon) => pkg && addonQuantityLimit(pkg, addon) > 0)
                        .map((addon) => (
                          <div
                            className={styles.addonWrap}
                            key={addon.id}
                            data-selected={Boolean(extras[addon.id]) || undefined}
                          >
                            <Icon
                              className={styles.addonIcon}
                              name={addonIcons[addon.id] ?? 'solar/check-circle-bold'}
                              size={18}
                            />
                            <ChoiceCard
                              type="checkbox"
                              className={styles.addonChoice}
                              title={addon.name}
                              description={
                                <>
                                  <span>{addon.description}</span>
                                  <span className={styles.addonPrice}>
                                    +{addon.price.toLocaleString('ko-KR')}
                                  </span>
                                </>
                              }
                              checked={Boolean(extras[addon.id])}
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
                      <div className={styles.footerSummary}>
                        <span>{summary}</span>
                        <strong>{money(total)}</strong>
                      </div>
                      <span className={layout.small}>결제 방법은 다음 화면에서</span>
                    </div>
                    <Button fullWidth onClick={next}>
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
                    hint="선택하신 구성과 결제 금액이 다르면 직원이 확인 후 연락드려요. 계좌이체는 날짜를 고른 뒤 입금 안내를 드려요."
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
                      <span>
                        개인정보 수집·이용 동의 <span className={styles.required}>(필수)</span>
                      </span>
                      {landingOrigin && (
                        <a href={`${landingOrigin}/legal`} target="_blank" rel="noreferrer">
                          안내 보기
                        </a>
                      )}
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        required
                        checked={notifications}
                        onChange={(event) => setNotifications(event.target.checked)}
                      />
                      <span>
                        촬영 안내 알림 수신 동의 (카카오톡){' '}
                        <span className={styles.required}>(필수)</span>
                      </span>
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={marketing}
                        onChange={(event) => setMarketing(event.target.checked)}
                      />
                      <span>
                        마케팅 정보 수신 동의 <span>(선택)</span>
                      </span>
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
                      setTime('');
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
                            selected={time === slot.time}
                            onClick={() => setTime(slot.time)}
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
                  <Notice tone="warning" className={styles.notice}>
                    <strong>결제 방법에 따라 이렇게 진행돼요</strong>
                    <p>
                      크몽 · 프립 · 숨고 · 스마트스토어에서 이미 결제하셨다면 직원 확인 후 확정돼요.
                      <br />
                      계좌이체는 최대 {policy?.holdHours ?? 24}시간 동안 일정을 잡아두고 입금 안내를
                      드려요. 촬영 {policy?.holdCutoffHours ?? 2}시간 전에는 입금 확인이 끝나야
                      해요.
                    </p>
                  </Notice>
                  <SceneFooter>
                    <div className={layout.between}>
                      <div className={styles.footerSummary}>
                        <span>선택한 일정</span>
                        <strong>
                          {date && time
                            ? `${dateLabel} ${shootTime(`${date}T${time}:00+09:00`)}`
                            : '날짜와 시간을 골라주세요'}
                        </strong>
                      </div>
                      <span className={layout.small}>디렉터는 확정 후 안내</span>
                    </div>
                    <Button
                      fullWidth
                      disabled={!date || !time || !privacy || !notifications}
                      loading={busy}
                      onClick={submit}
                    >
                      이 시간으로 예약하기
                    </Button>
                    <p>
                      <a href={kakaoChannelUrl} target="_blank" rel="noopener noreferrer">
                        원하는 날짜가 없나요? 카카오톡으로 문의해주세요
                      </a>
                    </p>
                  </SceneFooter>
                </>
              )}
            </>
          )}
        </>
      )}
    </CustomerShell>
  );
}

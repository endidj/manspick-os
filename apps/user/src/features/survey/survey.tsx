// 네 페이지 설문의 입력·자동 저장·필수 확인·제출 완료를 관리합니다.
'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Button, Notice } from '@manspick/design-system/components';
import {
  ChoiceCard,
  RadioPills,
  TextField,
  TextArea,
  InfoRow,
  UploadDropzone,
  Dialog,
} from '@manspick/design-system/patterns';
import { Icon } from '@manspick/design-system/icons';
import { api } from '@manspick/web/client';
import type { AddonDTO } from '@manspick/contracts';
import { SceneFooter, KakaoButton } from '../shell';
import type { CustomerViewProps } from '../customer/view-types';
import { shootDate } from '../customer/presentation';
import layout from '../shell/customer-shell.module.css';
import styles from './survey.module.css';

const pageLabels = ['나에 대해', '스타일', '촬영 · 보정', '마지막 확인'];
const pageTitles = [
  '먼저 고객님을 알려주세요',
  '어떤 스타일을 좋아하세요?',
  '어떤 사진이 필요하세요?',
  '거의 다 왔어요',
];
const pageDescriptions = [
  '약 10분이면 끝나요. 성실히 적어주실수록 결과물이 좋아져요.',
  '디렉터가 코디북과 촬영 장소를 고르는 데 써요.',
  '답변은 촬영 컨셉 · 장소 · 보정 방향에 그대로 반영돼요.',
  '추가 옵션과 동의만 확인하면 끝나요.',
];
const purposes = [
  { value: '데이팅', label: '소개팅 · 데이팅 앱' },
  { value: '카카오', label: '카카오톡 프사' },
  { value: 'SNS', label: 'SNS' },
  { value: '추억', label: '추억' },
  { value: '비즈니스', label: '비즈니스 프로필' },
];

export function Survey({ shoot, busy, onAction, onUpload, onNavigate, onHelp }: CustomerViewProps) {
  const now = useClock();
  const [page, setPage] = useState(() =>
    shoot.survey?.submittedAt
      ? 1
      : ([1, 2, 3, 4].find((value) => !shoot.survey?.pageDone.includes(value)) ?? 4),
  );
  const [answers, setAnswers] = useState<Record<string, unknown>>(shoot.survey?.answers ?? {});
  const [done, setDone] = useState<number[]>(shoot.survey?.pageDone ?? []);
  const [validation, setValidation] = useState('');
  const [savingPage, setSavingPage] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [consentOpen, setConsentOpen] = useState(false);
  const [addons, setAddons] = useState<AddonDTO[]>([]);
  const edited = useRef(false);
  const saveRef = useRef(onAction);
  const pending = useRef<Promise<unknown>>(Promise.resolve());
  const value = (key: string) => String(answers[key] ?? '');
  const wardrobe = shoot.addons.some(
    (addon) => ['rental', 'outfit', 'shopping'].includes(addon.id) && addon.quantity > 0,
  );
  const closed =
    shoot.paymentState !== 'confirmed' ||
    shoot.stage > 4 ||
    Boolean(
      shoot.survey?.submittedAt && shoot.survey.dueAt && Date.parse(shoot.survey.dueAt) < now,
    );

  useEffect(() => {
    saveRef.current = onAction;
  }, [onAction]);
  useEffect(() => {
    let active = true;
    api<{ addons: AddonDTO[] }>('/catalog')
      .then((catalog) => {
        if (active) setAddons(catalog.addons.filter((addon) => addon.id !== 'extra_retouch'));
      })
      .catch(() => {
        /* 기존 설문 저장은 상품 조회 실패와 무관하게 유지합니다. */
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!edited.current || closed) return;
    const timer = setTimeout(() => {
      if (!edited.current) return;
      setSaveState('saving');
      pending.current = pending.current.then(async () => {
        const saved = await saveRef.current({ type: 'save_survey', answers, pageDone: done });
        setSaveState(saved ? 'saved' : 'error');
      });
    }, 900);
    return () => clearTimeout(timer);
  }, [answers, done, closed]);

  function put(key: string, next: unknown) {
    edited.current = true;
    setSaveState('idle');
    setAnswers((previous) => ({ ...previous, [key]: next }));
  }

  async function next() {
    if (savingPage || closed) return;
    setValidation('');
    const invalid =
      page === 1
        ? ![1, 2, 3, 4, 5].includes(Number(answers.firstImpression)) ||
          !(Number(answers.age) > 0 && Number(answers.age) <= 120) ||
          !shoot.uploads.some((asset) => asset.kind === 'survey')
        : page === 2
          ? !value('style') ||
            (wardrobe &&
              ['height', 'weight', 'topSize', 'bottomSize', 'shoeSize', 'budget'].some(
                (key) => !value(key) || Number(answers.budget) <= 0,
              ))
          : page === 3
            ? !value('motivation').trim() ||
              !(answers.purposes as string[] | undefined)?.length ||
              answers.retouchStrength === undefined ||
              !['customer', 'director'].includes(value('selector'))
            : !value('referral') ||
              typeof answers.reviewParticipation !== 'boolean' ||
              answers.safetyRead !== true;
    if (invalid) {
      setValidation(
        page === 1 && !shoot.uploads.some((asset) => asset.kind === 'survey')
          ? '최근 얼굴 사진을 한 장 이상 올려주세요.'
          : '필수 항목을 확인해주세요.',
      );
      return;
    }
    edited.current = false;
    setSavingPage(true);
    setSaveState('saving');
    try {
      await pending.current;
      const completed = [...new Set([...done, page])];
      const saved = await onAction({
        type: 'save_survey',
        answers,
        pageDone: completed,
        submit: page === 4,
      });
      setSaveState(saved ? 'saved' : 'error');
      if (saved) {
        setDone(completed);
        if (page === 4) onNavigate('survey-complete');
        else {
          setPage(page + 1);
          window.scrollTo({ top: 0 });
        }
      }
    } finally {
      setSavingPage(false);
    }
  }

  function text(key: string, label: string, type = 'text', required = false) {
    return (
      <TextField
        key={key}
        label={label}
        type={type}
        value={value(key)}
        onValueChange={(next) => put(key, next)}
        required={required}
      />
    );
  }

  return (
    <>
      <header className={layout.stack}>
        <p className={layout.overline}>STEP 3 · 설문 {page}/4</p>
        <h1>{pageTitles[page - 1]}</h1>
        <p>{pageDescriptions[page - 1]}</p>
      </header>
      <div className={styles.pageProgress} aria-label={`설문 ${page}/4`}>
        {pageLabels.map((label, index) => (
          <span key={label} data-active={index < page || undefined}>
            <i />
            {label}
          </span>
        ))}
      </div>
      {validation && <Notice tone="error">{validation}</Notice>}
      {closed && <Notice>설문 편집이 종료됐어요. 변경이 필요하면 담당자에게 알려주세요.</Notice>}
      <fieldset
        className={`${layout.fieldSet} ${styles.fields}`}
        disabled={busy || closed || savingPage}
      >
        {page === 1 && (
          <>
            <RadioPills
              className={styles.starRating}
              label="디렉터의 첫 인사 메시지, 어떠셨나요?"
              hint="카카오톡으로 받으신 인사 메시지 기준이에요"
              required
              value={value('firstImpression')}
              onValueChange={(next) => put('firstImpression', next)}
              options={[1, 2, 3, 4, 5].map((number) => ({
                value: String(number),
                label: (
                  <span
                    aria-label={`${number}점`}
                    data-filled={Number(answers.firstImpression) >= number || undefined}
                  >
                    <Icon name="solar/star-bold" size={27} />
                  </span>
                ),
              }))}
            />
            {text('age', '나이', 'number', true)}
            <TextField
              label="직업"
              hint="공개를 원하지 않으면 비워두셔도 돼요"
              value={value('occupation')}
              onValueChange={(next) => put('occupation', next)}
            />
            <section className={layout.stack}>
              <div className={layout.between}>
                <h2 className={styles.fieldTitle}>최근 본인 사진</h2>
                <span className={styles.required}>필수</span>
              </div>
              <p className={layout.small}>
                정면 얼굴 1장 이상 · 전신 사진이 있으면 더 좋아요 · 장당 10MB까지
              </p>
              <div className={styles.uploadGrid}>
                {shoot.uploads
                  .filter((asset) => asset.kind === 'survey')
                  .map((asset) => (
                    <a key={asset.id} href={asset.url} target="_blank" rel="noreferrer">
                      <Image
                        unoptimized
                        src={asset.url}
                        alt={asset.name}
                        width={120}
                        height={150}
                      />
                    </a>
                  ))}
                <UploadDropzone
                  multiple={false}
                  className={styles.uploadTile}
                  label="추가"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={busy || closed || savingPage}
                  onFilesSelected={(files) => {
                    if (files[0]) void onUpload(files[0], 'survey');
                  }}
                />
              </div>
            </section>
            <Notice>
              <strong>사진은 왜 필요한가요?</strong>
              <p>
                얼굴형 · 분위기에 맞는 코디와 촬영 장소를 고르는 데 써요. 촬영 외 용도로 쓰지
                않아요.
              </p>
            </Notice>
          </>
        )}
        {page === 2 && (
          <>
            <RadioPills
              label="원하는 스타일"
              required
              value={value('style')}
              onValueChange={(next) => put('style', next)}
              options={[
                { value: '캐주얼', label: '캐주얼' },
                { value: '댄디', label: '댄디' },
                { value: '기타', label: '그 외' },
              ]}
            />
            {wardrobe && (
              <Notice>
                <strong>의류 대여 · 1코디 제작 · 동행쇼핑을 신청하셨네요</strong>
                <p>아래 체형 · 사이즈 정보가 꼭 필요해요. 신청하지 않으셨다면 선택 항목이에요.</p>
              </Notice>
            )}
            <section className={layout.stack}>
              <h2 className={styles.fieldTitle}>
                키 · 몸무게 {wardrobe && <span className={styles.required}>필수</span>}
              </h2>
              <div className={layout.gridTwo}>
                {text('height', '키 (cm)', 'number', wardrobe)}
                {text('weight', '몸무게 (kg)', 'number', wardrobe)}
              </div>
            </section>
            <section className={layout.stack}>
              <h2 className={styles.fieldTitle}>
                사이즈 {wardrobe && <span className={styles.required}>필수</span>}
              </h2>
              <div className={styles.sizes}>
                {text('topSize', '상의', 'text', wardrobe)}
                {text('bottomSize', '하의', 'text', wardrobe)}
                {text('shoeSize', '신발', 'number', wardrobe)}
              </div>
            </section>
            <TextArea
              label="신체 특징"
              hint="어깨가 넓다, 다리가 짧은 편이다 등 편하게 적어주세요"
              value={value('bodyConcerns')}
              onValueChange={(next) => put('bodyConcerns', next)}
            />
            <RadioPills
              label="코디 1세트 예산"
              hint="1코디 제작 · 동행쇼핑 때 이 예산 안에서 골라드려요"
              required={wardrobe}
              value={value('budget')}
              onValueChange={(next) => put('budget', Number(next))}
              options={[
                { value: '0', label: '0원' },
                { value: '500000', label: '10~50만' },
                { value: '1500000', label: '50~150만' },
                { value: '3000000', label: '150~300만' },
                { value: '5000000', label: '300만 이상' },
              ]}
            />
            <Notice tone="warning">
              <strong>의상 사진은 촬영 이틀 전까지 ‘촬영 준비’에서 올려주세요</strong>
              <p>입으실 옷 · 신발 사진을 보면 부족한 부분은 피드백과 대체 코디를 제안드려요.</p>
            </Notice>
          </>
        )}
        {page === 3 && (
          <>
            <TextArea
              label="촬영하게 된 계기를 알려주세요"
              required
              value={value('motivation')}
              onValueChange={(next) => put('motivation', next)}
            />
            <fieldset className={layout.fieldSet}>
              <legend className={styles.fieldTitle}>
                결과물을 어디에 쓰실 건가요? <span className={styles.required}>필수</span>
              </legend>
              <p className={layout.small}>여러 개 선택할 수 있어요</p>
              <div className={styles.purposePills}>
                {purposes.map((purpose) => (
                  <ChoiceCard
                    className={styles.purposeChoice}
                    key={purpose.value}
                    type="checkbox"
                    title={purpose.label}
                    checked={((answers.purposes as string[]) ?? []).includes(purpose.value)}
                    onCheckedChange={(checked) =>
                      put(
                        'purposes',
                        checked
                          ? [...((answers.purposes as string[]) ?? []), purpose.value]
                          : ((answers.purposes as string[]) ?? []).filter(
                              (item) => item !== purpose.value,
                            ),
                      )
                    }
                  />
                ))}
              </div>
            </fieldset>
            <RadioPills
              className={styles.strength}
              label="보정은 어느 정도 원하세요?"
              required
              value={value('retouchStrength')}
              onValueChange={(next) => put('retouchStrength', Number(next))}
              options={[0, 25, 50, 75, 100].map((number) => ({
                value: String(number),
                label: `${number}%`,
              }))}
            />
            <fieldset className={`${layout.fieldSet} ${layout.stack}`}>
              <legend className={styles.fieldTitle}>
                보정할 사진은 누가 고를까요? <span className={styles.required}>필수</span>
              </legend>
              <ChoiceCard
                title="제가 직접 고를게요"
                description="디렉터가 추린 후보 컷 중에서 골라요"
                name="selector"
                checked={answers.selector === 'customer'}
                onCheckedChange={() => put('selector', 'customer')}
              />
              <ChoiceCard
                title="디렉터에게 맡길게요"
                description="가장 잘 나온 것으로 알아서 골라드려요"
                name="selector"
                checked={answers.selector === 'director'}
                onCheckedChange={() => put('selector', 'director')}
              />
              <p className={layout.small}>
                촬영 당일 현장에서 마음이 바뀌면 디렉터에게 말씀해주세요. 촬영이 끝날 때 최종
                확정돼요.
              </p>
            </fieldset>
            <TextArea
              label="촬영하면서 걱정되는 점이 있나요? (선택)"
              value={value('concerns')}
              onValueChange={(next) => put('concerns', next)}
            />
          </>
        )}
        {page === 4 && (
          <>
            <fieldset className={layout.fieldSet}>
              <legend className={styles.fieldTitle}>추가로 신청하고 싶은 옵션이 있나요?</legend>
              <p className={layout.small}>
                상담 희망을 설문에 저장해요. 신청 확정과 결제는 담당자가 안내해요.
              </p>
              <div className={styles.purposePills}>
                {addons.map((addon) => (
                  <ChoiceCard
                    className={styles.purposeChoice}
                    key={addon.id}
                    type="checkbox"
                    title={addon.name}
                    checked={((answers.additionalAddonInterest as string[]) ?? []).includes(
                      addon.id,
                    )}
                    onCheckedChange={(checked) =>
                      put(
                        'additionalAddonInterest',
                        checked
                          ? [...((answers.additionalAddonInterest as string[]) ?? []), addon.id]
                          : ((answers.additionalAddonInterest as string[]) ?? []).filter(
                              (item) => item !== addon.id,
                            ),
                      )
                    }
                  />
                ))}
                <button type="button" className={styles.inquiryChip} onClick={onHelp}>
                  그 외 옵션 문의
                </button>
              </div>
            </fieldset>
            <RadioPills
              label="맨즈픽을 어떻게 알게 되셨나요?"
              required
              value={value('referral')}
              onValueChange={(next) => put('referral', next)}
              options={['인스타그램', '네이버 검색', '크몽 · 숨고 · 프립', '지인 소개', '기타'].map(
                (label) => ({ value: label, label }),
              )}
            />
            <RadioPills
              label="후기 작성 혜택"
              required
              hint="후기를 남겨주시면 원본 사진 전체를 드려요"
              value={
                typeof answers.reviewParticipation === 'boolean'
                  ? String(answers.reviewParticipation)
                  : ''
              }
              onValueChange={(next) => put('reviewParticipation', next === 'true')}
              options={[
                { value: 'true', label: '혜택 받을게요' },
                { value: 'false', label: '괜찮아요' },
              ]}
            />
            <section className={layout.stack}>
              <h2 className={styles.fieldTitle}>동의</h2>
              <div className={styles.consentCard}>
                <label className={styles.consentChoice}>
                  <input
                    type="checkbox"
                    checked={Boolean(answers.portfolioConsent)}
                    onChange={(event) => put('portfolioConsent', event.target.checked)}
                  />
                  <span>
                    촬영 현장 영상 · 포트폴리오 활용 동의 (선택)
                    <small>얼굴이 나오는 사진은 따로 확인 후 사용해요</small>
                  </span>
                </label>
                <button
                  type="button"
                  aria-label="포트폴리오 동의 내용 보기"
                  onClick={() => setConsentOpen(true)}
                >
                  <Icon name="chevron" size={18} />
                </button>
              </div>
            </section>
            <section className={`${layout.card} ${styles.safety}`}>
              <h2 className={styles.fieldTitle}>
                <Icon name="shield" size={18} /> 촬영 전 주의사항 (필수)
              </h2>
              <p>· 촬영 전날은 음주 · 과식 · 무리한 운동을 피하고 충분히 주무세요.</p>
              <p>· 촬영 장소는 코디와 설문을 보고 정해지면 바로 안내드려요.</p>
              <p>· 의상 · 신발 사진은 촬영 이틀 전까지 ‘촬영 준비’ 화면에서 올려주세요.</p>
              <label className={styles.consentCard}>
                <input
                  type="checkbox"
                  checked={Boolean(answers.safetyRead)}
                  onChange={(event) => put('safetyRead', event.target.checked)}
                />
                <span>주의사항을 모두 확인했어요</span>
              </label>
            </section>
          </>
        )}
      </fieldset>
      <SceneFooter>
        <div className={layout.footerActions}>
          {page > 1 && (
            <Button
              variant="secondary"
              disabled={busy || savingPage}
              onClick={() => {
                setPage(page - 1);
                window.scrollTo({ top: 0 });
              }}
            >
              이전
            </Button>
          )}
          <Button fullWidth loading={busy || savingPage} disabled={closed} onClick={next}>
            {page === 4 ? '설문 제출하기' : '다음'}
          </Button>
        </div>
        <p className={styles.saveStatus} role="status">
          <Icon name="solar/check-circle-bold" size={12} />
          {saveState === 'saving'
            ? '저장 중이에요'
            : saveState === 'error'
              ? '저장하지 못했어요. 다시 시도해주세요.'
              : saveState === 'saved'
                ? '저장했어요'
                : '자동 저장돼요'}{' '}
          ·{' '}
          {shoot.survey?.dueAt
            ? `${shootDate(shoot.survey.dueAt)}까지 제출`
            : '촬영 3일 전까지 제출'}
        </p>
      </SceneFooter>
      <Dialog open={consentOpen} onOpenChange={setConsentOpen} title="선택 포트폴리오 동의">
        <p>
          촬영 현장 영상과 포트폴리오 활용은 선택 사항이에요. 동의하지 않아도 촬영 서비스를 이용할
          수 있어요. 구체적인 사용 목적과 범위는 담당자에게 확인해주세요.
        </p>
      </Dialog>
    </>
  );
}

export function SurveyComplete({ shoot, onNavigate, onHelp }: CustomerViewProps) {
  const now = useClock();
  const answer = shoot.survey?.answers ?? {};
  const editable = !shoot.survey?.dueAt || Date.parse(shoot.survey.dueAt) >= now;
  return (
    <>
      <header className={styles.complete}>
        <span className={styles.completeMark}>
          <Icon name="solar/check-circle-bold" size={32} />
        </span>
        <h1>설문 제출 완료!</h1>
        <p>
          이제 디렉터가 {shoot.customerName}님 촬영을 설계해요.
          <br />
          장소와 코디가 정해지면 바로 알려드릴게요.
        </p>
      </header>
      <section className={layout.card}>
        <p className={styles.completeRow}>
          <Icon name="solar/check-circle-bold" size={17} />
          설문 제출 완료
        </p>
        <p className={styles.completeRow}>
          <Icon name="solar/magic-stick-3-bold" size={17} />
          디렉터가 코디 · 촬영 장소 설계 중
        </p>
        <p className={styles.completeRow}>
          <Icon name="calendar" size={17} />
          장소 · 코디가 정해지면 바로 안내
        </p>
      </section>
      <section className={layout.card}>
        <p className={layout.small}>제출한 내용</p>
        <InfoRow label="촬영 계기" value={String(answer.motivation ?? '')} />
        <InfoRow
          label="사진"
          value={`${shoot.uploads.filter((asset) => asset.kind === 'survey').length}장`}
        />
        <InfoRow
          label="셀렉 방식"
          value={answer.selector === 'director' ? '디렉터에게 맡길게요' : '제가 직접 고를게요'}
        />
        <InfoRow
          label="스타일"
          value={[answer.style, answer.topSize, answer.bottomSize, answer.shoeSize]
            .filter(Boolean)
            .join(' · ')}
        />
        <p className={layout.small}>
          {shoot.survey?.dueAt
            ? `${shootDate(shoot.survey.dueAt)}까지 다시 열어 고칠 수 있어요`
            : '편집 기한은 담당자에게 확인해주세요'}
        </p>
        {editable && (
          <button className={layout.textLink} onClick={() => onNavigate('survey')}>
            제출한 내용 수정하기
          </button>
        )}
      </section>
      <SceneFooter>
        <Button variant="secondary" fullWidth onClick={() => onNavigate('preparation')}>
          촬영 준비 안내 보기
        </Button>
        <KakaoButton onClick={onHelp} />
      </SceneFooter>
    </>
  );
}

function useClock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

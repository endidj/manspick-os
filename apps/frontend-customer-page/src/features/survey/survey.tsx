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
import { canEditSurvey, surveyIssues } from '@manspick/domain';
import type { AddonDTO } from '@manspick/contracts';
import { SceneFooter, KakaoButton } from '../shell';
import { compareAddonDisplayOrder } from '../booking/addon-order';
import type { CustomerViewProps } from '../customer/view-types';
import { shootDate } from '../customer/presentation';
import layout from '../shell/customer-shell.module.css';
import styles from './survey.module.css';

const pageLabels = ['나에 대해', '스타일', '촬영', '마지막 확인'];
const pageTitles = [
  '먼저 고객님을 알려주세요',
  '어떤 스타일을 좋아하세요?',
  '어떤 사진이 필요하세요?',
  '거의 다 왔어요',
];
const pageDescriptions = [
  '약 10분이면 끝나요. 성실히 적어주실수록 결과물이 좋아져요.',
  '디렉터가 코디북과 촬영 장소를 고르는 데 써요.',
  '답변은 촬영 컨셉과 장소에 그대로 반영돼요.',
  '추가 옵션과 동의만 확인하면 끝나요.',
];
const purposes = [
  { value: '데이팅', label: '소개팅 · 데이팅 앱' },
  { value: '카카오', label: '카카오톡 프사' },
  { value: 'SNS', label: 'SNS' },
  { value: '추억', label: '추억' },
  { value: '비즈니스', label: '비즈니스 프로필' },
];

function pillLabel(label: string, checked: boolean) {
  return (
    <>
      {checked && <Icon name="solar/check-circle-bold" size={14} />}
      {label}
    </>
  );
}

export function Survey({
  shoot,
  busy,
  onAction,
  onUpload,
  onNavigate,
  onHelp,
  active,
  page,
  onPageChange,
}: CustomerViewProps & {
  active: boolean;
  page: number;
  onPageChange: (page: number) => void;
}) {
  const now = useClock();
  const [answers, setAnswers] = useState<Record<string, unknown>>(shoot.survey?.answers ?? {});
  const [done, setDone] = useState<number[]>(shoot.survey?.pageDone ?? []);
  const [validation, setValidation] = useState('');
  const [savingPage, setSavingPage] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [consentOpen, setConsentOpen] = useState(false);
  const [addons, setAddons] = useState<Pick<AddonDTO, 'id' | 'name' | 'price' | 'quantityMode'>[]>(
    [],
  );
  const [addonsFailed, setAddonsFailed] = useState(false);
  const edited = useRef(false);
  const editVersion = useRef(0);
  const currentView = useRef({ active, page });
  const saveRef = useRef(onAction);
  const pending = useRef<Promise<unknown>>(Promise.resolve());
  const value = (key: string) => String(answers[key] ?? '');
  const interests = Array.isArray(answers.additionalAddonInterest)
    ? answers.additionalAddonInterest
    : undefined;
  const wardrobe = shoot.addons.some(
    (addon) => ['rental', 'outfit', 'shopping'].includes(addon.id) && addon.quantity > 0,
  );
  const closed = !canEditSurvey(shoot, now);

  useEffect(() => {
    currentView.current = { active, page };
  }, [active, page]);
  useEffect(() => {
    saveRef.current = onAction;
  }, [onAction]);
  useEffect(() => {
    if (edited.current || savingPage) return;
    setAnswers(shoot.survey?.answers ?? {});
    setDone(shoot.survey?.pageDone ?? []);
  }, [shoot.survey, savingPage]);
  useEffect(() => {
    let active = true;
    api<{
      addons: AddonDTO[];
      packageItems?: { packageId: string; itemId: string; inclusionType: string }[];
    }>('/catalog')
      .then((catalog) => {
        if (!active) return;
        const options = catalog.addons
          .filter(
            (addon) =>
              !catalog.packageItems ||
              catalog.packageItems.some(
                (item) =>
                  item.packageId === shoot.packageId &&
                  item.itemId === addon.id &&
                  item.inclusionType === 'optional',
              ),
          )
          .sort(compareAddonDisplayOrder);
        setAddons(options);
      })
      .catch(() => {
        if (active) setAddonsFailed(true);
      });
    return () => {
      active = false;
    };
  }, [shoot.packageId]);
  useEffect(() => {
    if (!edited.current || closed || savingPage) return;
    const timer = setTimeout(() => {
      if (!edited.current) return;
      const version = editVersion.current;
      setSaveState('saving');
      pending.current = pending.current.then(async () => {
        const saved = await saveRef.current({ type: 'save_survey', answers, pageDone: done });
        if (saved && version === editVersion.current) edited.current = false;
        setSaveState(saved ? 'saved' : 'error');
      });
    }, 900);
    return () => clearTimeout(timer);
  }, [answers, done, closed, savingPage]);

  function put(key: string, next: unknown) {
    editVersion.current += 1;
    edited.current = true;
    setValidation('');
    setSaveState('idle');
    setAnswers((previous) => ({ ...previous, [key]: next }));
  }

  async function next() {
    if (savingPage || closed) return;
    setValidation('');
    const issues = surveyIssues(answers, {
      wardrobe,
      hasFacePhoto: shoot.uploads.some((asset) => asset.kind === 'survey'),
    });
    const invalid = issues.find((issue) => page === 4 || issue.page === page);
    const unread = page === 4 ? [1, 2, 3].find((number) => !done.includes(number)) : undefined;
    if (invalid || unread) {
      setValidation(invalid?.message ?? '이 페이지의 답변을 확인한 뒤 다음을 눌러주세요.');
      onPageChange(invalid?.page ?? unread!);
      window.scrollTo({ top: 0 });
      return;
    }
    // 편집 중인 초안은 저장 실패 때도 서버의 이전 응답으로 덮어쓰지 않습니다.
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
        edited.current = false;
        setDone(completed);
        if (!currentView.current.active || currentView.current.page !== page) return;
        if (page === 4) onNavigate('survey-complete');
        else {
          onPageChange(page + 1);
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

  // 다른 업무 화면을 열어도 초안과 대기 중인 자동 저장을 유지합니다.
  if (!active) return null;

  return (
    <>
      <header className={layout.stack}>
        <p className={layout.overline}>STEP 3 · 설문 {page}/4</p>
        <h1>{pageTitles[page - 1]}</h1>
        <p>{pageDescriptions[page - 1]}</p>
      </header>
      <div className={styles.pageProgress} aria-label={`설문 ${page}/4`}>
        {pageLabels.map((label, index) => (
          <span
            key={label}
            data-active={index < page || undefined}
            aria-current={index + 1 === page ? 'step' : undefined}
          >
            <i />
            {label}
          </span>
        ))}
      </div>
      {validation && <Notice tone="error">{validation}</Notice>}
      {closed && <Notice>설문 편집이 종료됐어요. 변경이 필요하면 담당자에게 알려주세요.</Notice>}
      <fieldset
        className={`${layout.fieldSet} ${styles.fields} ${page === 3 ? styles.photoQuestions : ''}`}
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
              className={styles.optionalField}
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
                      <span className={styles.photoPreview}>
                        <Icon name="image" size={20} />
                        {asset.url && (
                          <Image
                            key={asset.url}
                            unoptimized
                            src={asset.url}
                            alt=""
                            width={108}
                            height={72}
                            onError={(event) => {
                              event.currentTarget.hidden = true;
                            }}
                          />
                        )}
                      </span>
                      <span>{asset.name}</span>
                    </a>
                  ))}
                <div className={styles.addPhoto}>
                  <Icon name="solar/camera-bold" size={20} />
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
              </div>
            </section>
            <Notice className={styles.notice}>
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
                { value: '캐주얼', label: pillLabel('캐주얼', value('style') === '캐주얼') },
                { value: '댄디', label: pillLabel('댄디', value('style') === '댄디') },
                { value: '기타', label: pillLabel('그 외', value('style') === '기타') },
              ]}
            />
            {wardrobe && (
              <Notice className={styles.notice}>
                <strong>의류 대여 · 1코디 제작 · 동행쇼핑을 신청하셨네요</strong>
                <p>아래 체형 · 사이즈 정보가 꼭 필요해요. 신청하지 않으셨다면 선택 항목이에요.</p>
              </Notice>
            )}
            <section className={layout.stack}>
              <h2 className={styles.fieldTitle}>
                키 · 몸무게{' '}
                <span className={wardrobe ? styles.required : styles.optional}>
                  {wardrobe ? '필수' : '선택'}
                </span>
              </h2>
              <div className={layout.gridTwo}>
                {text('height', '키 (cm)', 'number', wardrobe)}
                {text('weight', '몸무게 (kg)', 'number', wardrobe)}
              </div>
            </section>
            <section className={layout.stack}>
              <h2 className={styles.fieldTitle}>
                사이즈{' '}
                <span className={wardrobe ? styles.required : styles.optional}>
                  {wardrobe ? '필수' : '선택'}
                </span>
              </h2>
              <div className={styles.sizes}>
                {text('topSize', '상의', 'text', wardrobe)}
                {text('bottomSize', '하의', 'text', wardrobe)}
                {text('shoeSize', '신발', 'number', wardrobe)}
              </div>
            </section>
            <TextArea
              className={styles.optionalField}
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
              ].map((option) => ({
                ...option,
                label: pillLabel(option.label, option.value === value('budget')),
              }))}
            />
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
                    leadingIcon={
                      ((answers.purposes as string[]) ?? []).includes(purpose.value) ? (
                        <Icon name="solar/check-circle-bold" size={14} />
                      ) : undefined
                    }
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
              <legend className={styles.fieldTitle}>
                추가로 신청하고 싶은 옵션이 있나요? <span className={styles.optional}>선택</span>
              </legend>
              <p className={layout.small}>
                선택하시면{' '}
                <button
                  type="button"
                  className={styles.inquiryChip}
                  aria-label="그 외 옵션 문의"
                  onClick={onHelp}
                >
                  담당자
                </button>
                가 결제 안내를 따로 드려요.
              </p>
              {addonsFailed && (
                <Notice>
                  옵션 목록을 불러오지 못했어요. 설문은 계속 제출할 수 있고, 추가 옵션은 담당자에게
                  문의해주세요.
                </Notice>
              )}
              <div className={styles.purposePills}>
                {addons.map((addon) => (
                  <ChoiceCard
                    className={styles.purposeChoice}
                    key={addon.id}
                    type="checkbox"
                    title={`${addon.name} +${addon.price.toLocaleString('ko-KR')}${addon.quantityMode === 'outfit' ? '/벌' : ''}`}
                    checked={interests?.includes(addon.id) ?? false}
                    leadingIcon={
                      interests?.includes(addon.id) ? (
                        <Icon name="solar/check-circle-bold" size={14} />
                      ) : undefined
                    }
                    onCheckedChange={(checked) =>
                      put(
                        'additionalAddonInterest',
                        checked
                          ? [...(interests ?? []), addon.id]
                          : (interests?.filter((item) => item !== addon.id) ?? []),
                      )
                    }
                  />
                ))}
                <ChoiceCard
                  type="checkbox"
                  className={styles.purposeChoice}
                  title="없어요"
                  checked={interests?.length === 0}
                  leadingIcon={
                    interests?.length === 0 ? (
                      <Icon name="solar/check-circle-bold" size={14} />
                    ) : undefined
                  }
                  onCheckedChange={(checked) => put('additionalAddonInterest', checked ? [] : null)}
                />
              </div>
            </fieldset>
            <RadioPills
              label="맨즈픽을 어떻게 알게 되셨나요?"
              required
              value={value('referral')}
              onValueChange={(next) => put('referral', next)}
              options={['인스타그램', '네이버 검색', '크몽 · 숨고 · 프립', '지인 소개', '기타'].map(
                (label) => ({ value: label, label: pillLabel(label, value('referral') === label) }),
              )}
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
                  <Icon name="customer/chevron" size={18} />
                </button>
              </div>
            </section>
            <section className={`${layout.card} ${styles.safety}`}>
              <h2 className={styles.fieldTitle}>
                <Icon name="shield" size={18} /> 촬영 전 주의사항 (필독)
              </h2>
              <p>· 촬영 전날은 음주 · 과식 · 무리한 운동을 피하고 충분히 주무세요.</p>
              <p>· 촬영 장소는 코디와 설문을 보고 정해지면 바로 안내드려요.</p>
              <p>· 상담은 오전 11시~오후 8시, 촬영 중에는 답변이 늦을 수 있어요.</p>
              <label className={styles.consentCard}>
                <input
                  type="checkbox"
                  checked={Boolean(answers.safetyRead)}
                  onChange={(event) => put('safetyRead', event.target.checked)}
                />
                <span>주의사항을 모두 확인했어요</span>
                <Icon name="customer/chevron" size={18} />
              </label>
            </section>
          </>
        )}
      </fieldset>
      <SceneFooter>
        {closed ? (
          <Button fullWidth onClick={() => onNavigate('home')}>
            나의 촬영 홈으로
          </Button>
        ) : (
          <div className={layout.footerActions}>
            {page > 1 && (
              <Button
                variant="secondary"
                disabled={busy || savingPage}
                onClick={() => onPageChange(page - 1)}
              >
                이전
              </Button>
            )}
            <Button fullWidth loading={busy || savingPage} disabled={closed} onClick={next}>
              {page === 4 ? '설문 제출하기' : '다음'}
            </Button>
          </div>
        )}
        {(page < 4 || (saveState !== 'idle' && saveState !== 'saved')) && (
          <p className={styles.saveStatus} role="status">
            <Icon name="solar/check-circle-bold" size={12} />
            {closed
              ? '제출한 답변을 확인하는 화면이에요'
              : saveState === 'saving'
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
        )}
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
  const editable = canEditSurvey(shoot, now);
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
      <section className={`${layout.card} ${styles.completeSteps}`}>
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
      <section className={`${layout.card} ${styles.completeSummary}`}>
        <div className={styles.completeLinks}>
          <p className={layout.small}>제출한 내용</p>
          <button onClick={() => onNavigate('home')}>나의 촬영 홈으로</button>
        </div>
        <InfoRow label="촬영 계기" value={String(answer.motivation ?? '')} />
        <InfoRow
          label="사진"
          value={`${shoot.uploads.filter((asset) => asset.kind === 'survey').length}장`}
        />
        <InfoRow
          label="스타일"
          value={[
            answer.style,
            [answer.topSize, answer.bottomSize, answer.shoeSize].filter(Boolean).join(' / '),
          ]
            .filter(Boolean)
            .join(' · ')}
        />
        <div className={styles.completeLinks}>
          <p className={layout.small}>
            {!editable
              ? '설문 편집이 종료됐어요. 변경이 필요하면 담당자에게 알려주세요.'
              : shoot.survey?.dueAt
                ? `${shootDate(shoot.survey.dueAt)}까지 다시 열어 고칠 수 있어요`
                : '편집 기한은 담당자에게 확인해주세요'}
          </p>
          {editable && <button onClick={() => onNavigate('survey')}>제출한 내용 수정하기</button>}
        </div>
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

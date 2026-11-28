// 원본 추천의 선택·진입 모션을 React 상태로 재현하고 상담 견적은 순수 함수로 계산합니다.
'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AppBar, AppBarBrand, Button, Notice } from '@manspick/design-system/components';
import { ChoiceCard } from '@manspick/design-system/patterns';
import { Icon } from '@manspick/design-system/icons';
import { quizQuestions } from './quiz-data';
import { recommendedPackage, type QuizAnswers } from './recommendation';
import {
  marketingQuote,
  interestedAddonQuantities,
  type MarketingCatalog,
} from './marketing-offers';
import { QuizResult } from './quiz-result';
import styles from './package-quiz.module.css';

const hydration = { subscribe: () => () => {}, client: () => true, server: () => false };

export function PackageQuiz({
  packages,
  addons,
  initialPackage,
}: MarketingCatalog & { initialPackage?: string }) {
  const router = useRouter();
  const ready = useSyncExternalStore(hydration.subscribe, hydration.client, hydration.server);
  const available = packages.filter((pack) => pack.active);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [result, setResult] = useState(Boolean(initialPackage));
  const [selectedId, setSelectedId] = useState(initialPackage ?? 'hybrid');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [revision, setRevision] = useState(0);
  const [advancing, setAdvancing] = useState(false);
  const [restored, setRestored] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const previousAnswers = useRef<QuizAnswers | undefined>(undefined);
  const heading = useRef<HTMLHeadingElement>(null);
  const selected = available.find((pack) => pack.id === selectedId) ?? available[0];
  const question = quizQuestions[step];

  useEffect(() => {
    if (!restored) return;
    window.history.replaceState({ quiz: { step, result, answers, selectedId, quantities } }, '');
  }, [restored, step, result, answers, selectedId, quantities]);

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!revision) return;
    heading.current?.focus({ preventScroll: true });
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
  }, [revision]);

  useEffect(() => {
    function restore(event: PopStateEvent) {
      if (!event.state?.quiz) return;
      clearTimeout(timer.current);
      setAdvancing(false);
      const saved = event.state.quiz;
      setStep(saved?.step ?? 0);
      setResult(saved?.result ?? Boolean(initialPackage));
      if (saved) {
        setAnswers(previousAnswers.current ?? saved.answers);
        previousAnswers.current = undefined;
        setSelectedId(saved.selectedId);
        setQuantities(saved.quantities);
      }
      setRevision((value) => value + 1);
    }
    const frame = requestAnimationFrame(() => {
      if (window.history.state?.quiz) {
        restore(new PopStateEvent('popstate', { state: window.history.state }));
      } else if (window.location.pathname !== '/recommend') {
        window.history.replaceState({}, '', `/recommend${window.location.search}`);
      }
      setRestored(true);
    });
    window.addEventListener('popstate', restore, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('popstate', restore, true);
    };
  }, [initialPackage]);

  if (!selected) return <Notice>현재 추천할 수 있는 판매 상품이 없습니다.</Notice>;
  const options = question.options;
  const canContinue = Boolean(question.optional || answers[question.id]?.length);

  function navigate(nextStep: number, showResult = false, reset = false) {
    const current = window.history.state?.quiz ?? { step, result, answers, selectedId, quantities };
    window.history.replaceState({ quiz: current }, '');
    const target = reset
      ? { step: 0, result: false, answers: {}, selectedId: 'hybrid', quantities: {} }
      : { ...current, step: nextStep, result: showResult };
    window.history.pushState(
      { quiz: target },
      '',
      showResult ? '/recommend/result' : nextStep ? `/recommend/${nextStep + 1}` : '/recommend',
    );
  }

  function move(nextStep: number) {
    navigate(nextStep);
    clearTimeout(timer.current);
    setAdvancing(false);
    setStep(nextStep);
    setRevision((value) => value + 1);
  }

  function choose(value: string, checked: boolean) {
    setAnswers((current) => {
      const previous = current[question.id] ?? [];
      return {
        ...current,
        [question.id]: question.multiple
          ? checked
            ? [...new Set([...previous, value])]
            : previous.filter((item) => item !== value)
          : [value],
      };
    });
    if (!question.multiple) {
      clearTimeout(timer.current);
      setAdvancing(true);
      timer.current = setTimeout(() => move(step + 1), 300);
    }
  }

  function next() {
    if (!canContinue || advancing) return;
    if (step < quizQuestions.length - 1) move(step + 1);
    else {
      setSelectedId(recommendedPackage(answers, available)?.id ?? available[0].id);
      setQuantities({});
      navigate(step, true);
      setResult(true);
      setRevision((value) => value + 1);
    }
  }

  function restart() {
    setAnswers({});
    setQuantities({});
    setSelectedId('hybrid');
    setResult(false);
    navigate(0, false, true);
    clearTimeout(timer.current);
    setAdvancing(false);
    setStep(0);
    setRevision((value) => value + 1);
  }

  function selectPackage(id: string) {
    const pack = available.find((item) => item.id === id);
    if (!pack) return;
    setSelectedId(id);
    setQuantities((current) =>
      Object.fromEntries(
        marketingQuote(pack, addons, current)
          .filter((item) => Object.hasOwn(current, item.id))
          .map((item) => [item.id, item.quantity]),
      ),
    );
  }

  return (
    <div className={styles.quiz} aria-busy={!ready || !restored} inert={!ready || !restored}>
      <AppBar
        className={styles.navigation}
        brand={
          <Link href="/" aria-label="MANSPICK 홈" scroll>
            <AppBarBrand />
          </Link>
        }
        actions={
          result && (
            <Button variant="secondary" size="sm" onClick={restart}>
              다시 해보기
            </Button>
          )
        }
        onBack={() => {
          clearTimeout(timer.current);
          if (step > 0) {
            previousAnswers.current = answers;
            window.history.back();
          } else router.push('/', { scroll: true });
        }}
      />
      {result ? (
        <QuizResult
          packages={available}
          addons={addons}
          selected={selected}
          quantities={{ ...interestedAddonQuantities(selected, answers.addons), ...quantities }}
          headingRef={heading}
          onSelectPackage={selectPackage}
          onQuantityChange={(id, quantity) =>
            setQuantities((current) => ({ ...current, [id]: quantity }))
          }
        />
      ) : (
        <>
          <div className={styles.progress}>
            <div>
              <span>맞춤 추천</span>
              <span>{step + 1} / 5</span>
            </div>
            <div
              className={styles.progressTrack}
              role="progressbar"
              aria-label="맞춤 추천 진행"
              aria-valuenow={step + 1}
              aria-valuemin={0}
              aria-valuemax={5}
            >
              <span style={{ width: `${(step + 1) * 20}%` }} />
            </div>
          </div>
          <section key={`${step}-${revision}`} className={revision ? styles.enterStep : undefined}>
            <header className={styles.questionHeading}>
              <p className={styles.eyebrow}>Step {step + 1}</p>
              <h1 ref={heading} tabIndex={-1}>
                {question.title}
              </h1>
              <p>{question.description}</p>
            </header>
            <fieldset className={styles.choices}>
              <legend className={styles.visuallyHidden}>{question.title}</legend>
              {options.map((option) => (
                <ChoiceCard
                  key={option.value}
                  className={styles.choice}
                  name={question.id}
                  value={option.value}
                  type={question.multiple ? 'checkbox' : 'radio'}
                  checked={answers[question.id]?.includes(option.value) ?? false}
                  onCheckedChange={(checked) => choose(option.value, checked)}
                  title={option.title}
                  description={option.description}
                  leadingIcon={<Icon name={option.icon} size={20} />}
                />
              ))}
            </fieldset>
            {question.id === 'addons' && options.length === 0 && (
              <p className={styles.note}>
                현재 추가로 제공하는 옵션이 없습니다. 패키지 추천은 계속할 수 있어요.
              </p>
            )}
            {(question.multiple || (canContinue && !advancing)) && (
              <button
                type="button"
                className={`${styles.next} ${question.id === 'addons' ? styles.submit : ''}`}
                disabled={!canContinue || advancing}
                onClick={next}
              >
                {step === quizQuestions.length - 1 ? '내 맞춤 패키지 확인하기' : '다음으로'}
                <Icon name="solar/arrow-right-linear" size={question.id === 'addons' ? 18 : 16} />
              </button>
            )}
          </section>
        </>
      )}
    </div>
  );
}

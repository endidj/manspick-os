// 다섯 단계의 선택을 받아 참고용 패키지·옵션 안내를 보여줍니다.
'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Accordion, Button, Notice, StepHeader } from '@manspick/design-system/components';
import { ChoiceCard, InfoRow, StickyActionBar } from '@manspick/design-system/patterns';
import { Icon } from '@manspick/design-system/icons';
import { money } from '@manspick/web/format';
import { bookingUrl, localBooking, packageFacts } from '../site';
import type { PublicCatalog } from '../site/catalog';
import { quizQuestions } from './quiz-data';
import { budgetExceeded, quoteAddons, recommendedPackage } from './recommendation';
import styles from './package-quiz.module.css';

export function PackageQuiz({ packages, addons }: PublicCatalog) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [showResult, setShowResult] = useState(false);
  const [selectedId, setSelectedId] = useState('hybrid');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const heading = useRef<HTMLHeadingElement>(null);
  const question = quizQuestions[step];
  const selected = packages.find((item) => item.id === selectedId) ?? packages[0];
  if (!selected) return <Notice>지금은 추천에 사용할 상품을 불러올 수 없습니다.</Notice>;
  const facts = packageFacts(selected);
  const addonOptions = quoteAddons(selected, addons, quantities);
  const total =
    selected.price + addonOptions.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const questionOptions =
    question.id === 'extras'
      ? question.options.filter((option) => addons.some((addon) => addon.id === option.value))
      : question.options;
  const canContinue = question.optional || Boolean(answers[question.id]?.length);

  function focusHeading() {
    requestAnimationFrame(() => heading.current?.focus());
  }

  function choose(value: string, checked: boolean) {
    const previous = answers[question.id] ?? [];
    setAnswers({
      ...answers,
      [question.id]: question.multiple
        ? checked
          ? [...previous, value]
          : previous.filter((item) => item !== value)
        : [value],
    });
    if (!question.multiple) {
      setStep(step + 1);
      focusHeading();
    }
  }

  function next() {
    if (!canContinue) return;
    if (step < quizQuestions.length - 1) {
      setStep(step + 1);
    } else {
      setSelectedId(recommendedPackage(answers.scale?.[0] ?? 'one'));
      setQuantities(Object.fromEntries((answers.extras ?? []).map((id) => [id, 1])));
      setShowResult(true);
    }
    focusHeading();
  }

  function back() {
    if (showResult) setShowResult(false);
    else setStep(Math.max(0, step - 1));
    focusHeading();
  }

  return (
    <div className={styles.quiz}>
      {showResult ? (
        <>
          <div className={styles.resultHeading}>
            <span className={styles.eyebrow}>YOUR MATCH</span>
            <h1 ref={heading} tabIndex={-1}>
              맞춤 추천 결과
            </h1>
            <p>당신에게 딱 맞는 패키지는</p>
            <strong>{selected.name}</strong>
            <p>
              선택한 촬영 규모에 맞춘 참고 안내입니다.
              <br />
              예산과 필요한 옵션을 함께 비교해 보세요.
            </p>
          </div>
          <fieldset className={styles.packageChoices}>
            <legend className={styles.legend}>패키지 선택</legend>
            {packages.map((item) => (
              <ChoiceCard
                key={item.id}
                name="result-package"
                value={item.id}
                checked={selected.id === item.id}
                onCheckedChange={() => setSelectedId(item.id)}
                title={item.name}
                description={
                  <>
                    <span>{money(item.price)}</span>
                    <small>
                      {packageFacts(item).outfits} · {packageFacts(item).photos}
                    </small>
                  </>
                }
              />
            ))}
          </fieldset>
          <section className={styles.options}>
            <h2>필요한 도움을 더해보세요</h2>
            {addonOptions.map((item) => (
              <div className={styles.option} key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.description}</span>
                  <span>{money(item.price)}</span>
                </div>
                <label>
                  <span className={styles.visuallyHidden}>{item.name} 수량</span>
                  <select
                    value={item.quantity}
                    onChange={(event) =>
                      setQuantities({
                        ...Object.fromEntries(
                          addonOptions.map((option) => [option.id, option.quantity]),
                        ),
                        [item.id]: Number(event.target.value),
                      })
                    }
                  >
                    {Array.from({ length: item.maximum + 1 }, (_, quantity) => (
                      <option key={quantity} value={quantity}>
                        {quantity === 0
                          ? '선택 안 함'
                          : `${quantity}${item.id === 'rental' ? '벌' : item.id === 'outfit' ? '코디' : '회'}`}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ))}
          </section>
          <Accordion title="이 패키지로 받는 구성">
            <div className={styles.packageIncludes}>
              <InfoRow label="촬영 시간" value={facts.duration} />
              <InfoRow label="의상" value={facts.outfits} />
              <InfoRow label="보정본" value={facts.photos} />
              <p>
                스타일링·표정·포즈 안내, 보정 평균 1~3일, 수정 최대 3회. 전체 원본은 후기 확인 후
                공개됩니다.
              </p>
            </div>
          </Accordion>
          {budgetExceeded(answers.budget?.[0] ?? '', total) && (
            <Notice>
              선택한 구성이 생각하신 예산을 넘을 수 있어요. 패키지와 추가 옵션을 다시 살펴보세요.
            </Notice>
          )}
          <p className={styles.disclaimer}>
            답변과 선택은 저장되지 않습니다. 예약 화면에서 구성·가능 일정·최종 금액을 다시
            확인합니다.
          </p>
          <StickyActionBar className={styles.resultAction}>
            <div>
              <span>선택한 구성 합계</span>
              <strong>{money(total)}</strong>
            </div>
            <a href={bookingUrl} className={styles.bookingLink}>
              {localBooking ? '로컬 예약 체험' : '예약하기'} <Icon name="arrow" size={17} />
            </a>
          </StickyActionBar>
          <div className={styles.resultLinks}>
            <Button variant="ghost" onClick={back} leadingIcon={<Icon name="back" size={16} />}>
              이전 답변 보기
            </Button>
            <Link href="/#packages">
              전체 패키지 비교 <Icon name="arrow" size={15} />
            </Link>
          </div>
        </>
      ) : (
        <>
          <StepHeader title="맞춤 추천" current={step + 1} total={quizQuestions.length} />
          <div className={styles.questionHeading}>
            <span className={styles.eyebrow}>STEP {step + 1}</span>
            <h1 ref={heading} tabIndex={-1}>
              {question.title}
            </h1>
            <p>{question.description}</p>
          </div>
          <fieldset className={styles.choices}>
            <legend className={styles.visuallyHidden}>{question.title}</legend>
            {questionOptions.map((option) => (
              <ChoiceCard
                key={option.value}
                name={question.id}
                value={option.value}
                type={question.multiple ? 'checkbox' : 'radio'}
                checked={answers[question.id]?.includes(option.value) ?? false}
                onCheckedChange={(checked) => choose(option.value, checked)}
                title={option.title}
                description={option.description}
                leadingIcon={<Icon name={option.icon} size={24} />}
              />
            ))}
          </fieldset>
          <div className={styles.stepActions}>
            {step > 0 && (
              <Button variant="ghost" onClick={back} leadingIcon={<Icon name="back" size={16} />}>
                이전
              </Button>
            )}
            {(question.multiple || canContinue) && (
              <Button
                fullWidth
                disabled={!canContinue}
                onClick={next}
                trailingIcon={<Icon name="arrow" size={17} />}
              >
                {step === quizQuestions.length - 1 ? '결과 보기' : '다음'}
              </Button>
            )}
          </div>
          <p className={styles.privacy}>답변은 저장되지 않으며 예약이 진행되지 않습니다.</p>
        </>
      )}
    </div>
  );
}

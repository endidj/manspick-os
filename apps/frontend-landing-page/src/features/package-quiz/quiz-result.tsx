// 원본 상담 상품의 탭·옵션 펼침·고정 합계 바와 예상 금액을 표시합니다.
'use client';

import { useEffect, useRef, useState, type Ref } from 'react';
import type { AddonDTO, PackageDTO } from '@manspick/contracts';
import { Icon } from '@manspick/design-system/icons';
import { kakaoUrl } from '../site';
import { addonIcons } from './quiz-data';
import { marketingQuote, marketingIncludes, marketingAddonSummary } from './marketing-offers';
import styles from './package-quiz.module.css';

type QuizResultProps = {
  packages: PackageDTO[];
  addons: AddonDTO[];
  selected: PackageDTO;
  quantities: Record<string, number>;
  headingRef: Ref<HTMLHeadingElement>;
  onSelectPackage: (id: string) => void;
  onQuantitiesChange: (quantities: Record<string, number>) => void;
  onRestart: () => void;
};
function duration(minutes: number) {
  return `${Math.floor(minutes / 60) ? `${Math.floor(minutes / 60)}시간` : ''}${minutes % 60 ? `${minutes % 60}분` : ''}`;
}

export function QuizResult({
  packages,
  addons,
  selected,
  quantities,
  headingRef,
  onSelectPackage,
  onQuantitiesChange,
  onRestart,
}: QuizResultProps) {
  const [expanded, setExpanded] = useState<string[]>([]);
  const [summary, setSummary] = useState(false);
  const [footerSpace, setFooterSpace] = useState(0);
  const footer = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!footer.current) return;
    const element = footer.current;
    const observer = new ResizeObserver(() => {
      setFooterSpace(summary ? Math.max(0, element.getBoundingClientRect().height - 128) : 0);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [summary]);
  const options = marketingQuote(selected, addons, quantities);
  const total = selected.price + options.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const includes = [
    ...marketingIncludes[selected.id],
    ...options
      .filter((item) => item.quantity > 0)
      .map(
        (item) =>
          `${marketingAddonSummary[item.id]}${item.quantityMode === 'outfit' ? ` ×${item.quantity}` : ''}`,
      ),
  ];

  function changeQuantity(id: string, quantity: number) {
    onQuantitiesChange({
      ...Object.fromEntries(options.map((item) => [item.id, item.quantity])),
      [id]: quantity,
    });
  }

  return (
    <>
      <div className={styles.result}>
        <header className={styles.resultHeading}>
          <p className={styles.eyebrow}>
            <Icon name="solar/star-bold" size={16} />
            맞춤 추천 결과
          </p>
          <h1 ref={headingRef} tabIndex={-1}>
            당신에게 딱 맞는 패키지는
          </h1>
          <p className={styles.packageName}>{selected.name}</p>
        </header>
        <fieldset className={styles.packageChoices}>
          <legend className={styles.visuallyHidden}>패키지 선택</legend>
          {packages.map((pack) => (
            <label
              key={pack.id}
              className={styles.packageChoice}
              data-checked={selected.id === pack.id || undefined}
            >
              <input
                className={styles.visuallyHidden}
                type="radio"
                name="result-package"
                value={pack.id}
                checked={selected.id === pack.id}
                onChange={() => onSelectPackage(pack.id)}
              />
              <span className={styles.packageFacts}>
                {pack.outfits}벌 · {duration(pack.duration)}
                {pack.id === 'allday' ? '+' : ''}
              </span>
              <strong>{pack.name}</strong>
              <span className={styles.packagePrice}>
                {pack.price.toLocaleString('ko-KR')}
                <small>원</small>
              </span>
            </label>
          ))}
        </fieldset>
        <section className={styles.options} aria-labelledby="addon-title">
          <h2 id="addon-title">추가 옵션</h2>
          <div className={styles.optionList}>
            {options.map((item) => {
              const isExpanded = expanded.includes(item.id);
              return (
                <article
                  className={styles.option}
                  data-selected={item.quantity > 0 || undefined}
                  key={item.id}
                >
                  <div className={styles.optionCopy}>
                    <Icon name={addonIcons[item.id] ?? 'solar/gift-bold'} size={18} />
                    <div>
                      <h3>
                        <button
                          type="button"
                          className={styles.optionTitle}
                          aria-expanded={isExpanded}
                          aria-controls={`addon-description-${item.id}`}
                          onClick={() =>
                            setExpanded((current) =>
                              isExpanded
                                ? current.filter((id) => id !== item.id)
                                : [...current, item.id],
                            )
                          }
                        >
                          {item.name}
                          <Icon name="solar/alt-arrow-down-linear" size={12} />
                        </button>
                      </h3>
                      <p
                        id={`addon-description-${item.id}`}
                        className={styles.optionDescription}
                        hidden={!isExpanded}
                      >
                        {item.description}
                      </p>
                      {item.quantityMode !== 'single' && (
                        <p className={styles.limit}>
                          {item.quantityMode === 'outfit'
                            ? `패키지 벌수까지 선택 가능 · 최대 ${selected.outfits}벌`
                            : `최대 ${item.maximum}회 선택 가능`}
                        </p>
                      )}
                    </div>
                  </div>
                  {item.quantityMode === 'single' ? (
                    <label className={styles.addonToggle}>
                      <span>+{item.price.toLocaleString('ko-KR')}</span>
                      <input
                        type="checkbox"
                        role="switch"
                        aria-label={`${item.name} 추가`}
                        checked={item.quantity > 0}
                        onChange={(event) => changeQuantity(item.id, event.target.checked ? 1 : 0)}
                      />
                      <span className={styles.addonCheck} aria-hidden="true">
                        <Icon name="solar/check-read-bold" size={14} />
                      </span>
                    </label>
                  ) : (
                    <div className={styles.quantity}>
                      <span className={styles.subtotal}>
                        {item.quantity
                          ? `+${(item.price * item.quantity).toLocaleString('ko-KR')}`
                          : '–'}
                      </span>
                      <div className={styles.quantityControls}>
                        <button
                          type="button"
                          aria-label={`${item.name} 수량 줄이기`}
                          disabled={item.quantity === 0}
                          onClick={() => changeQuantity(item.id, item.quantity - 1)}
                        >
                          −
                        </button>
                        <output aria-label={`${item.name} 수량`} aria-live="polite">
                          {item.quantity}
                        </output>
                        <button
                          type="button"
                          aria-label={`${item.name} 수량 늘리기`}
                          disabled={item.quantity >= item.maximum}
                          onClick={() => changeQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
            {!options.length && (
              <p className={styles.note}>이 패키지에 추가할 수 있는 옵션이 없습니다.</p>
            )}
          </div>
        </section>
        <div className={styles.resultLinks}>
          <button type="button" onClick={onRestart}>
            <Icon name="solar/restart-bold" size={16} />
            다시 테스트하기
          </button>
        </div>
      </div>
      <div aria-hidden="true" style={{ height: footerSpace }} />
      <footer ref={footer} className={styles.resultAction}>
        <div className={styles.actionInner}>
          <div className={styles.actionRow}>
            <div className={styles.total} aria-live="polite" aria-atomic="true">
              <p>예상 총 금액</p>
              <strong>
                <span>{total.toLocaleString('ko-KR')}</span>
                <small>원</small>
              </strong>
            </div>
            <a
              href={kakaoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.bookingLink}
            >
              이 구성으로 상담하기
              <Icon name="solar/arrow-right-linear" size={16} />
            </a>
          </div>
          <p className={styles.captureHint}>
            <Icon name="solar/camera-bold" size={12} />
            화면 캡처 후 카카오톡으로 보내주세요, 선택하신 구성 그대로 안내해 드릴게요.
          </p>
          <div className={styles.summary}>
            <button
              type="button"
              aria-expanded={summary}
              aria-controls="quote-summary"
              onClick={() => setSummary(!summary)}
            >
              {summary ? '접기' : '받는 구성 보기'}
              <Icon name="solar/alt-arrow-down-linear" size={12} />
            </button>
            <div id="quote-summary" className={styles.summaryList} hidden={!summary}>
              {includes.map((text) => (
                <span key={text}>{text}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

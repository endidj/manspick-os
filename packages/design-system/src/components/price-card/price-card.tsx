// 가격과 제공 항목을 보여주는 공통 컴포넌트입니다.
import type { HTMLAttributes, ReactNode } from 'react';
import { Icon } from '../../icons';
import styles from './price-card.module.css';

export type PriceCardProps = Omit<HTMLAttributes<HTMLElement>, 'title'> & {
  title: string;
  description?: string;
  price: ReactNode;
  priceSuffix?: string;
  features: readonly string[];
  recommendation?: string;
  action: ReactNode;
};

/** Prices, policies, and navigation are supplied by the application. */
export function PriceCard({
  title,
  description,
  price,
  priceSuffix,
  features,
  recommendation,
  action,
  className = '',
  ...props
}: PriceCardProps) {
  return (
    <article
      {...props}
      className={`${styles.priceCard} ${className}`}
      data-recommended={Boolean(recommendation) || undefined}
    >
      {recommendation && (
        <span className={styles.priceRecommendation} data-contrast-exception="figma-blue500">
          {recommendation}
        </span>
      )}
      <h3>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      <p className={styles.price}>
        <strong>{price}</strong>
        {priceSuffix && <span>{priceSuffix}</span>}
      </p>
      <ul className={styles.priceFeatures}>
        {features.map((feature) => (
          <li key={feature}>
            <Icon name="check" size={16} />
            {feature}
          </li>
        ))}
      </ul>
      <div className={styles.priceAction}>{action}</div>
    </article>
  );
}

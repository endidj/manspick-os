// 앱에서 정한 업무 단계의 이름과 색상을 표시하는 공통 컴포넌트입니다.
import type { HTMLAttributes } from 'react';
import styles from './stage-badge.module.css';

export const stageBadgePresets = [
  { stage: 1, label: '옵션 선택', tone: 'neutral' },
  { stage: 2, label: '설문', tone: 'purple' },
  { stage: 3, label: '일정', tone: 'blue' },
  { stage: 4, label: '촬영 준비', tone: 'cyan' },
  { stage: 5, label: '촬영', tone: 'amber' },
  { stage: 6, label: '결과물', tone: 'green' },
  { stage: 7, label: '후속관리', tone: 'pink' },
] as const;
export type StageBadgeTone = (typeof stageBadgePresets)[number]['tone'];
export type StageBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  stage: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  /** Required: Figma's source stage order differs from the current business workflow. */
  label: string;
  tone?: StageBadgeTone;
};

export function StageBadge({ stage, label, tone, className = '', ...props }: StageBadgeProps) {
  const preset = stageBadgePresets[stage - 1];
  return (
    <span
      {...props}
      className={`${styles.stageBadge} ${className}`}
      data-tone={tone ?? preset.tone}
    >
      <span className={styles.stageDot} aria-hidden="true" />
      {stage} · {label}
    </span>
  );
}

// 직원에게 허용된 고객 설문 답변과 설문·의상 사진을 보여줍니다.
import Image from 'next/image';
import { Badge, EmptyState, Panel, PhotoTile } from '@manspick/design-system/components';
import { InfoRow, SectionHeader } from '@manspick/design-system/patterns';
import type { ShootDetail } from '@manspick/contracts';
import styles from './shoot-detail.module.css';

const labels: Record<string, string> = {
  firstImpression: '첫인사 평가',
  age: '나이',
  occupation: '직업',
  style: '스타일',
  height: '키',
  weight: '몸무게',
  topSize: '상의',
  bottomSize: '하의',
  shoeSize: '신발',
  bodyConcerns: '체형 참고',
  budget: '예산',
  motivation: '신청 계기',
  purposes: '사진 사용 목적',
  retouchStrength: '보정 강도',
  selector: '셀렉 주체',
  concerns: '촬영 고민',
  referral: '유입 경로',
  reviewParticipation: '후기 혜택 참여',
  portfolioConsent: '포트폴리오 활용 동의',
  marketingConsent: '마케팅 동의',
  safetyRead: '촬영 주의 확인',
};

function answerText(value: unknown) {
  return Array.isArray(value)
    ? value.join(', ')
    : typeof value === 'boolean'
      ? value
        ? '예'
        : '아니요'
      : String(value ?? '미입력');
}

export function ShootSurvey({ shoot }: { shoot: ShootDetail }) {
  const uploads = shoot.uploads.filter(
    (upload) => upload.kind === 'survey' || upload.kind === 'outfit',
  );
  return (
    <Panel className={styles.stack}>
      <div className={styles.sectionHeading}>
        <SectionHeader heading="h2" eyebrow="SURVEY" title="고객 설문" />
        <Badge tone={shoot.survey?.submittedAt ? 'green' : 'amber'}>
          {shoot.survey?.submittedAt ? '제출 완료' : '작성 중'}
        </Badge>
      </div>
      {shoot.survey ? (
        <div>
          {Object.entries(shoot.survey.answers).map(([key, value]) => (
            <InfoRow
              key={key}
              label={labels[key] ?? key}
              value={answerText(value)}
              className={styles.answer}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="아직 설문이 없습니다" />
      )}
      {uploads.length > 0 && (
        <div className={styles.photoGrid}>
          {uploads.map((upload, index) => (
            <a
              href={upload.url}
              target="_blank"
              rel="noreferrer"
              key={upload.id}
              aria-label={`${upload.kind === 'survey' ? '설문' : '의상'} 사진 ${index + 1} 크게 보기`}
            >
              <PhotoTile
                label={`${upload.kind === 'survey' ? '설문' : '의상'} 사진 ${index + 1}`}
                image={
                  <Image
                    unoptimized
                    width={600}
                    height={800}
                    src={upload.url}
                    alt={upload.kind === 'survey' ? '사전 설문 사진' : '준비 의상 사진'}
                  />
                }
                footer={`${upload.kind === 'survey' ? '설문' : '의상'} 사진 ${index + 1}`}
              />
            </a>
          ))}
        </div>
      )}
    </Panel>
  );
}

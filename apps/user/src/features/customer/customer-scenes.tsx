// 후기 캡처 제출과 직원 확인 후 원본 공개·후속 혜택 안내를 연결합니다.
'use client';

import { useState } from 'react';
import { Badge, Button, Notice } from '@manspick/design-system/components';
import { Dialog } from '@manspick/design-system/patterns';
import { Icon } from '@manspick/design-system/icons';
import { money } from '@manspick/web/format';
import { UploadButton, UploadList } from './uploads';
import type { CustomerViewProps } from './view-types';
import layout from '../shell/customer-shell.module.css';
import styles from './customer.module.css';

export function ReviewView({
  shoot,
  busy,
  onUpload,
  onAction,
  onHelp,
  onNavigate,
}: CustomerViewProps) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const [blogOpen, setBlogOpen] = useState(false);
  const originalLink = shoot.fileLinks.find((link) => link.kind === 'original');
  const reviewRequest = shoot.requests.find((request) => request.type === 'review');
  const pending = reviewRequest && ['new', 'processing'].includes(reviewRequest.state);
  const opened = Boolean(originalLink || shoot.originals.length);
  const state = opened
    ? '원본 공개 완료'
    : pending
      ? '후기 확인 대기 중'
      : reviewRequest?.state === 'rejected'
        ? '다시 확인해주세요'
        : '참여 가능';

  return (
    <>
      <header className={layout.stack}>
        <p className={layout.overline}>STEP 7</p>
        <h1>맨즈픽을 더 알차게 쓰는 방법</h1>
        <p>촬영은 끝났지만 혜택은 계속돼요.</p>
      </header>
      <section className={styles.benefitCard}>
        <div className={styles.benefitIntro}>
          <span className={styles.benefitIcon} data-tone="pink">
            <Icon name="solar/chat-square-like-bold" size={23} />
          </span>
          <div>
            <h2>후기 쓰고 원본 전체 받기</h2>
            <p>후기를 남기고 캡처를 올려주시면, 확인 후 원본 폴더를 열어드려요.</p>
          </div>
        </div>
        <div className={layout.between}>
          <Badge tone={opened ? 'green' : 'neutral'}>{state}</Badge>
          <button className={styles.textAction} onClick={() => setReviewOpen(true)}>
            {opened ? '원본 확인하기' : '후기 캡처 올리기'} <Icon name="arrow" size={14} />
          </button>
        </div>
        {opened && (
          <>
            {originalLink && (
              <a
                className={styles.secondaryLink}
                href={originalLink.url}
                target="_blank"
                rel="noreferrer"
              >
                원본 전체 열기 ↗
              </a>
            )}
            <UploadList items={shoot.originals} />
          </>
        )}
      </section>
      <BenefitCard
        icon="solar/magic-stick-3-bold"
        title="추가 보정"
        description={
          shoot.extraRetouchAvailable
            ? `후보 사진 중 마음에 드는 것을 더 골라 보정해드려요. 1장당 ${money(shoot.retouchUnitPrice)}이에요.`
            : '현재 추가 보정의 신규 신청을 받지 않아요. 이미 신청한 보정은 그대로 진행돼요.'
        }
        action={shoot.extraRetouchAvailable ? '추가 사진 고르기' : '신규 신청 중단'}
        disabled={!shoot.extraRetouchAvailable}
        onClick={() => onNavigate('extra-retouch')}
      />
      <BenefitCard
        icon="solar/users-group-rounded-bold"
        title="재방문 · 지인 소개 5천원 혜택"
        description="친구가 카톡으로 문의할 때 소개자 이름을 말해주세요. 적용 조건과 혜택은 직원이 확인해요."
        action="추천 혜택 문의하기"
        onClick={onHelp}
      />
      <BenefitCard
        icon="solar/document-text-bold"
        title="블로그 후기 이벤트 · 보정 2장"
        description="블로그에 촬영 후기를 올려주시면 보정본 2장을 추가로 드려요."
        action="참여 방법 보기"
        onClick={() => setBlogOpen(true)}
      />
      <Dialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        title={opened ? '촬영 원본' : '후기 캡처 올리기'}
      >
        <div className={layout.stack}>
          <p>후기를 작성한 화면을 캡처해 올려주세요. 직원이 확인하면 원본 전체가 열려요.</p>
          {pending && <Notice>확인 요청을 받았어요. 직원 확인을 기다려주세요.</Notice>}
          {!opened && (
            <UploadButton
              busy={busy || Boolean(pending)}
              label="후기 캡처 올리기"
              onFile={async (file) => {
                const asset = await onUpload(file, 'review');
                if (asset) await onAction({ type: 'review_submit', uploadId: asset.id });
              }}
            />
          )}
          <UploadList items={shoot.uploads.filter((asset) => asset.kind === 'review')} />
          {opened && (
            <>
              {originalLink && (
                <a
                  className={styles.textAction}
                  href={originalLink.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  원본 전체 열기 ↗
                </a>
              )}
              <UploadList items={shoot.originals} />
            </>
          )}
        </div>
      </Dialog>
      <Dialog
        open={blogOpen}
        onOpenChange={setBlogOpen}
        title="블로그 후기 참여 방법"
        actions={
          <Button fullWidth onClick={onHelp}>
            참여 조건 문의하기
          </Button>
        }
      >
        <p>
          촬영 사진 2장 이상이 포함된 후기를 작성한 뒤 상담 채널로 알려주세요. 추가 보정 2장 제공은
          직원이 참여 조건을 확인한 뒤 진행해요.
        </p>
        <p>현재 화면에서는 캠페인 신청이나 보정 작업을 자동으로 생성하지 않아요.</p>
      </Dialog>
    </>
  );
}

function BenefitCard({
  icon,
  title,
  description,
  action,
  onClick,
  disabled = false,
}: {
  icon: Parameters<typeof Icon>[0]['name'];
  title: string;
  description: string;
  action: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <section className={styles.benefitCard}>
      <div className={styles.benefitIntro}>
        <span className={styles.benefitIcon}>
          <Icon name={icon} size={23} />
        </span>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      <div className={layout.between}>
        <Badge>직원 확인</Badge>
        <button className={styles.textAction} disabled={disabled} onClick={onClick}>
          {action} <Icon name="arrow" size={14} />
        </button>
      </div>
    </section>
  );
}

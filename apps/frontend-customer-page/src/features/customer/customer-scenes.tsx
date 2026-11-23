// 후기 캡처 제출과 직원 확인 후 원본 공개·후속 혜택 안내를 연결합니다.
'use client';

import { useState } from 'react';
import { Badge, Button, Notice } from '@manspick/design-system/components';
import { Dialog } from '@manspick/design-system/patterns';
import { Icon } from '@manspick/design-system/icons';
import { money } from '@manspick/web/format';
import { kakaoChannelUrl } from '../shell';
import { reviewState } from './presentation';
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
  const [shareOpen, setShareOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const originalLink = shoot.fileLinks.find((link) => link.kind === 'original');
  const review = reviewState(shoot);
  const pending = review === 'pending';
  const opened = review === 'open';
  const canSubmit = review === 'available' || review === 'rejected';
  const extraSubmitted = shoot.selections.some((selection) => selection.round === 'extra');
  const state = opened
    ? '원본 공개 완료'
    : pending
      ? '후기 확인 대기 중'
      : review === 'approved'
        ? '원본 전달 대기'
        : review === 'rejected'
          ? '다시 확인해주세요'
          : '참여 가능';

  async function shareChannel() {
    if (navigator.share) {
      try {
        await navigator.share({ title: '맨즈픽 카카오톡 채널', url: kakaoChannelUrl });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
      }
    }
    setShareMessage('');
    setShareOpen(true);
  }

  async function copyChannel() {
    try {
      await navigator.clipboard.writeText(kakaoChannelUrl);
      setShareMessage('채널 주소를 복사했어요.');
    } catch {
      setShareMessage('아래 주소를 길게 누르거나 선택해 복사해주세요.');
    }
  }

  return (
    <>
      <header className={layout.stack}>
        <p className={layout.overline}>STEP 7</p>
        <h1>맨즈픽을 더 알차게 쓰는 방법</h1>
        <p>촬영은 끝났지만 혜택은 계속돼요.</p>
      </header>
      <div className={styles.benefitList}>
        <BenefitCard
          icon="solar/chat-square-like-bold"
          iconTone="pink"
          title="후기 쓰고 원본 전체 받기"
          description="후기를 남기고 캡처를 올려주시면, 확인 후 원본 폴더를 열어드려요."
          status={state}
          badgeTone={opened ? 'green' : pending ? 'amber' : 'neutral'}
          action={opened ? '원본 확인하기' : canSubmit ? '후기 캡처 올리기' : '제출한 후기 보기'}
          onClick={() => setReviewOpen(true)}
        />
        <BenefitCard
          icon="solar/magic-stick-3-bold"
          title="추가 보정"
          description={
            shoot.extraRetouchAvailable
              ? `후보 사진 중 마음에 드는 것을 더 골라 보정해드려요. 1장당 ${money(shoot.retouchUnitPrice)}이에요.`
              : '현재 추가 보정의 신규 신청을 받지 않아요. 이미 신청한 보정은 그대로 진행돼요.'
          }
          status={
            extraSubmitted ? '신청 완료' : shoot.extraRetouchAvailable ? '신청 가능' : '신청 마감'
          }
          action={extraSubmitted ? '신청 내역 보기' : '추가 보정 신청하기'}
          disabled={!extraSubmitted && !shoot.extraRetouchAvailable}
          onClick={() => onNavigate(extraSubmitted ? 'results' : 'extra-retouch')}
        />
        <BenefitCard
          icon="solar/users-group-rounded-bold"
          iconTone="green"
          title="재방문 · 지인 소개 5천원 혜택"
          description="친구가 카톡으로 문의할 때 소개자 이름을 말해주세요. 직원이 두 분의 할인 적용 여부를 확인해요."
          status="사용 안내"
          action="카톡 채널 공유하기"
          onClick={shareChannel}
        />
        <BenefitCard
          icon="solar/document-text-bold"
          iconTone="purple"
          title="블로그 후기 이벤트 · 보정 2장"
          description="블로그에 촬영 후기를 올려주시면 보정본 2장을 추가로 드려요."
          status="참여 안내"
          action="참여 방법 보기"
          onClick={() => setBlogOpen(true)}
        />
      </div>
      <Dialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        title="카톡 채널 공유하기"
        actions={
          <Button fullWidth onClick={copyChannel}>
            채널 주소 복사하기
          </Button>
        }
      >
        <p role="status">{shareMessage || '친구에게 아래 채널 주소를 복사해 보내주세요.'}</p>
        <a href={kakaoChannelUrl} className={layout.textLink} target="_blank" rel="noreferrer">
          {kakaoChannelUrl}
        </a>
      </Dialog>
      <Dialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        title={opened ? '촬영 원본' : canSubmit ? '후기 캡처 올리기' : '제출한 후기'}
      >
        <div className={layout.stack}>
          {canSubmit && (
            <p>후기를 작성한 화면을 캡처해 올려주세요. 직원이 확인하면 원본 전체가 열려요.</p>
          )}
          {pending && <Notice>확인 요청을 받았어요. 직원 확인을 기다려주세요.</Notice>}
          {review === 'approved' && (
            <Notice>후기가 확인됐어요. 원본이 준비되면 이곳에서 열어볼 수 있어요.</Notice>
          )}
          {canSubmit && (
            <UploadButton
              busy={busy}
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
      </Dialog>
    </>
  );
}

function BenefitCard({
  icon,
  iconTone,
  status,
  badgeTone,
  title,
  description,
  action,
  onClick,
  disabled = false,
}: {
  icon: Parameters<typeof Icon>[0]['name'];
  iconTone?: 'pink' | 'green' | 'purple';
  status: string;
  badgeTone?: Parameters<typeof Badge>[0]['tone'];
  title: string;
  description: string;
  action: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <section className={styles.benefitCard}>
      <div className={styles.benefitIntro}>
        <span className={styles.benefitIcon} data-tone={iconTone}>
          <Icon name={icon} size={20} />
        </span>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      <div className={layout.between}>
        <Badge tone={badgeTone}>{status}</Badge>
        <button className={styles.textAction} disabled={disabled} onClick={onClick}>
          {action} <Icon name="arrow" size={14} />
        </button>
      </div>
    </section>
  );
}

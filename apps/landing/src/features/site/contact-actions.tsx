// 실제 상담 연결 상태를 안내하고 기존 로컬 예약 화면으로 이동시킵니다.
'use client';

import { useState } from 'react';
import { Button, Notice } from '@manspick/design-system/components';
import { Icon } from '@manspick/design-system/icons';
import { bookingUrl, localBooking } from './site-data';
import styles from './site-shell.module.css';

export function ContactActions() {
  const [showNotice, setShowNotice] = useState(false);

  return (
    <div className={styles.contactActions}>
      <div className={styles.actions}>
        <Button
          variant="secondary"
          className={styles.contactButton}
          onClick={() => setShowNotice((value) => !value)}
          aria-expanded={showNotice}
          aria-controls="contact-information"
          leadingIcon={<Icon name="solar/chat-round-line-bold" size={18} />}
        >
          상담 연결 안내
        </Button>
        <a className={styles.bookingLink} href={bookingUrl}>
          {localBooking ? '로컬 예약 체험' : '예약하기'} <Icon name="arrow" size={18} />
        </a>
      </div>
      {showNotice && (
        <div id="contact-information">
          <Notice>
            {localBooking
              ? '이 미리보기에는 공식 카카오 상담 채널이 연결되지 않았습니다. 로컬 체험에서 예약 과정을 살펴볼 수 있습니다.'
              : '예약 화면에서 촬영 구성과 일정을 확인하고, 접수 후 운영팀의 안내를 받아보세요.'}
          </Notice>
        </div>
      )}
    </div>
  );
}

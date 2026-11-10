// 기존 로컬 서비스·개인정보 안내를 공개 사이트 셸과 함께 보여줍니다.
import type { Metadata } from 'next';
import Link from 'next/link';
import { Notice } from '@manspick/design-system/components';
import { Icon } from '@manspick/design-system/icons';
import { SiteFooter, SiteHeader } from '../../features/site';
import styles from '../subpage.module.css';

export const metadata: Metadata = { title: '이용·개인정보 안내' };

export default function LegalPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className={styles.main}>
        <Link href="/" className={styles.back}>
          <Icon name="back" size={16} /> 홈으로
        </Link>
        <div className={styles.eyebrow}>SERVICE INFORMATION</div>
        <h1>이용·개인정보 안내</h1>
        <p className={styles.intro}>로컬 체험에서 확인할 수 있는 서비스 기준입니다.</p>
        <Notice>
          현재는 로컬 미리보기입니다. 아래 내용은 정식 이용약관이나 개인정보처리방침을 대체하지
          않습니다. 실제 고객 정보·사진 대신 테스트 자료로 체험해 주세요.
        </Notice>
        <div className={styles.legalContent}>
          <section>
            <h2>촬영과 결과물</h2>
            <p>
              맨즈픽은 남성을 위한 스타일링·프로필 촬영 서비스입니다. 야외와 카페 등에서 iPhone으로
              촬영하며, 패키지에 따라 촬영 시간·의상 수·보정 장수가 달라집니다.
            </p>
            <p>
              보정본은 평균 1~3일을 기준으로 안내하며 촬영별 일정은 별도 확인합니다. 보정 수정은
              최대 3회, 전체 원본은 후기 확인 후 공개하는 흐름을 기준으로 합니다.
            </p>
          </section>
          <section>
            <h2>예약·변경·취소</h2>
            <p>
              실제 예약은 상담 후 직원이 안내하는 링크로 시작합니다. 일정 변경과 취소는 카카오
              상담을 통해 확인합니다. 이 미리보기에는 공식 상담 채널과 실제 결제가 연결되어 있지
              않습니다.
            </p>
          </section>
          <section>
            <h2>개인정보와 사진</h2>
            <p>
              예약·촬영에 필요한 이름·전화번호·설문과 사진을 다루는 흐름을 체험할 수 있습니다. 고객
              자료는 해당 촬영과 담당 업무 범위 안에서 접근하도록 구성합니다.
            </p>
            <p>
              서비스 진행에 필요한 동의와 선택적인 포트폴리오·마케팅 활용 동의는 구분합니다. 선택
              동의를 거절해도 서비스 이용을 제한하지 않습니다.
            </p>
          </section>
          <section>
            <h2>공개 전 확인할 사항</h2>
            <p>
              정확한 보존 기간과 삭제 절차, 변경·취소·환불 기준, 정식 사업자 정보와 상담 채널은 공개
              전 확정이 필요합니다. 이 페이지의 로컬 안내만으로 실제 서비스 계약이나 운영 정책이
              확정되지 않습니다.
            </p>
          </section>
        </div>
        <Link href="/#packages" className="text-link">
          패키지로 돌아가기 <Icon name="arrow" size={16} />
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}

// 원본 manspick-site@54f4a375의 개인정보처리방침 문구와 배치를 보존합니다.
import { pageMetadata } from '../../features/seo';
import Link from 'next/link';
import '@manspick/design-system/styles/site-tokens.css';
import styles from '../../features/legal/source-legal.module.css';

export const metadata = pageMetadata({
  title: '개인정보처리방침',
  description: '맨즈픽 개인정보처리방침를 확인하세요.',
  path: '/privacy',
});

export const dynamic = 'error';

export default function Page() {
  return (
    <main id="main-content" className={styles.root}>
      <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        {'\n    '}
        <Link
          href="/"
          prefetch={false}
          className="inline-flex items-center gap-2 text-zinc-500 text-sm mb-10 hover:text-white transition"
        >
          {'← 메인으로 돌아가기'}
        </Link>
        {'\n\n    '}
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{'개인정보처리방침'}</h1>
        {'\n    '}
        <p className="text-sm text-zinc-500 mb-12">{'시행일: 2026년 4월 10일'}</p>
        {'\n\n    '}
        <div className="space-y-10 text-sm leading-[1.9] text-zinc-400">
          {'\n\n      '}
          <section>
            {'\n        '}
            <h2 className="text-lg font-bold text-white mb-3">
              {'1. 개인정보의 수집 항목 및 수집 방법'}
            </h2>
            {'\n        '}
            <p>{'회사는 상담 신청 및 가이드북 발송을 위해 아래 항목을 수집합니다.'}</p>
            {'\n        '}
            <ul className="list-disc pl-5 mt-2 space-y-1">
              {'\n          '}
              <li>
                <strong className="text-zinc-200">{'필수 항목:'}</strong>
                {' 성함, 연락처(휴대전화번호)'}
              </li>
              {'\n          '}
              <li>
                <strong className="text-zinc-200">{'수집 방법:'}</strong>
                {' 웹사이트 내 상담 신청 폼을 통한 직접 입력'}
              </li>
              {'\n        '}
            </ul>
            {'\n      '}
          </section>
          {'\n\n      '}
          <section>
            {'\n        '}
            <h2 className="text-lg font-bold text-white mb-3">
              {'2. 개인정보의 수집 및 이용 목적'}
            </h2>
            {'\n        '}
            <ul className="list-disc pl-5 space-y-1">
              {'\n          '}
              <li>{'무료 상담 안내 및 일정 조율'}</li>
              {'\n          '}
              <li>{'그루밍 가이드북 발송'}</li>
              {'\n          '}
              <li>{'서비스 관련 안내 및 마케팅 정보 전달'}</li>
              {'\n        '}
            </ul>
            {'\n      '}
          </section>
          {'\n\n      '}
          <section>
            {'\n        '}
            <h2 className="text-lg font-bold text-white mb-3">
              {'3. 개인정보의 보유 및 이용 기간'}
            </h2>
            {'\n        '}
            <p>
              {'수집된 개인정보는 '}
              <strong className="text-zinc-200">{'수집일로부터 1년간'}</strong>
              {
                ' 보유하며, 보유 기간 경과 시 지체 없이 파기합니다. 다만, 관련 법령에 의해 보존이 필요한 경우 해당 기간 동안 보관합니다.'
              }
            </p>
            {'\n      '}
          </section>
          {'\n\n      '}
          <section>
            {'\n        '}
            <h2 className="text-lg font-bold text-white mb-3">{'4. 개인정보의 제3자 제공'}</h2>
            {'\n        '}
            <p>
              {
                '회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 법령에 의한 요청이 있는 경우에 한하여 제공합니다.'
              }
            </p>
            {'\n      '}
          </section>
          {'\n\n      '}
          <section>
            {'\n        '}
            <h2 className="text-lg font-bold text-white mb-3">
              {'5. 개인정보의 파기 절차 및 방법'}
            </h2>
            {'\n        '}
            <p>
              {
                '보유 기간 경과 또는 처리 목적 달성 시, 전자적 파일은 복구 불가능한 방법으로, 종이 문서는 분쇄 또는 소각하여 파기합니다.'
              }
            </p>
            {'\n      '}
          </section>
          {'\n\n      '}
          <section>
            {'\n        '}
            <h2 className="text-lg font-bold text-white mb-3">{'6. 정보주체의 권리·의무'}</h2>
            {'\n        '}
            <p>
              {
                '이용자는 언제든지 개인정보의 열람, 정정, 삭제, 처리 정지를 요청할 수 있으며, 아래 연락처로 요청하시면 지체 없이 조치합니다.'
              }
            </p>
            {'\n      '}
          </section>
          {'\n\n      '}
          <section>
            {'\n        '}
            <h2 className="text-lg font-bold text-white mb-3">{'7. 개인정보 보호책임자'}</h2>
            {'\n        '}
            <ul className="list-none space-y-1">
              {'\n          '}
              <li>
                <strong className="text-zinc-200">{'상호:'}</strong>
                {' 맨즈픽(MANSPICK)'}
              </li>
              {'\n          '}
              <li>
                <strong className="text-zinc-200">{'대표 / 개인정보 보호책임자:'}</strong>
                {' 정현욱'}
              </li>
              {'\n          '}
              <li>
                <strong className="text-zinc-200">{'사업자등록번호:'}</strong>
                {' 804-18-02180'}
              </li>
              {'\n          '}
              <li>
                <strong className="text-zinc-200">{'소재지:'}</strong>
                {' 서울특별시 강서구 양천로 94, G85호(염창동)'}
              </li>
              {'\n          '}
              <li>
                <strong className="text-zinc-200">{'이메일:'}</strong>
                {' wook971215@gmail.com'}
              </li>
              {'\n        '}
            </ul>
            {'\n      '}
          </section>
          {'\n\n      '}
          <section>
            {'\n        '}
            <h2 className="text-lg font-bold text-white mb-3">{'8. 개인정보처리방침의 변경'}</h2>
            {'\n        '}
            <p>
              {'본 방침은 시행일로부터 적용되며, 변경 사항이 있을 경우 웹사이트를 통해 공지합니다.'}
            </p>
            {'\n      '}
          </section>
          {'\n\n    '}
        </div>
        {'\n\n    '}
        <div className="mt-16 pt-8 border-t border-white/5 text-xs text-zinc-500">
          {'\n      '}
          <p>{'© 2026 MANSPICK. All rights reserved.'}</p>
          {'\n    '}
        </div>
        {'\n  '}
      </div>
    </main>
  );
}

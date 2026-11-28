// 원본 manspick-site@54f4a375의 이용약관 문구와 배치를 보존합니다.
import { pageMetadata } from '../../features/seo';
import Link from 'next/link';
import '@manspick/design-system/styles/site-tokens.css';
import styles from '../../features/legal/source-legal.module.css';

export const metadata = pageMetadata({
  title: '이용약관',
  description: '맨즈픽 이용약관를 확인하세요.',
  path: '/terms',
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
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{'이용약관'}</h1>
        {'\n    '}
        <p className="text-sm text-zinc-500 mb-12">{'시행일: 2026년 4월 10일'}</p>
        {'\n\n    '}
        <div className="space-y-10 text-sm leading-[1.9] text-zinc-400">
          {'\n\n      '}
          <section>
            {'\n        '}
            <h2 className="text-lg font-bold text-white mb-3">{'제1조 (목적)'}</h2>
            {'\n        '}
            <p>
              {
                '본 약관은 맨즈픽(MANSPICK, 이하 "회사")이 제공하는 남성 이미지 컨설팅 및 프로필 촬영 서비스(이하 "서비스")의 이용 조건과 절차, 회사와 이용자 간의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.'
              }
            </p>
            {'\n      '}
          </section>
          {'\n\n      '}
          <section>
            {'\n        '}
            <h2 className="text-lg font-bold text-white mb-3">{'제2조 (서비스의 내용)'}</h2>
            {'\n        '}
            <p>{'회사가 제공하는 서비스는 다음과 같습니다.'}</p>
            {'\n        '}
            <ul className="list-disc pl-5 mt-2 space-y-1">
              {'\n          '}
              <li>{'1:1 사전 스타일 컨설팅 (패션·헤어·컨셉)'}</li>
              {'\n          '}
              <li>{'프로필 사진 촬영 (실내·외 로케이션)'}</li>
              {'\n          '}
              <li>{'프리미엄 사진 보정 및 원본 제공'}</li>
              {'\n          '}
              <li>{'부가서비스: 헤어/메이크업 세팅, 의상 대여, 추가 보정 등'}</li>
              {'\n        '}
            </ul>
            {'\n      '}
          </section>
          {'\n\n      '}
          <section>
            {'\n        '}
            <h2 className="text-lg font-bold text-white mb-3">{'제3조 (이용 계약의 성립)'}</h2>
            {'\n        '}
            <ol className="list-decimal pl-5 space-y-1">
              {'\n          '}
              <li>
                {
                  '이용 계약은 이용자가 상담 신청 후 회사가 이를 승낙하고, 결제가 완료된 시점에 성립됩니다.'
                }
              </li>
              {'\n          '}
              <li>
                {'회사는 다음의 경우 승낙을 거부하거나 계약을 해지할 수 있습니다.\n            '}
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  {'\n              '}
                  <li>{'허위 정보를 기재한 경우'}</li>
                  {'\n              '}
                  <li>{'서비스 운영에 지장을 초래할 우려가 있는 경우'}</li>
                  {'\n            '}
                </ul>
                {'\n          '}
              </li>
              {'\n        '}
            </ol>
            {'\n      '}
          </section>
          {'\n\n      '}
          <section>
            {'\n        '}
            <h2 className="text-lg font-bold text-white mb-3">{'제4조 (예약 및 결제)'}</h2>
            {'\n        '}
            <ol className="list-decimal pl-5 space-y-1">
              {'\n          '}
              <li>
                {
                  '이용자는 사전 상담 후 촬영 일정을 예약하며, 회사가 안내하는 결제 수단을 통해 서비스 이용료를 지급합니다.'
                }
              </li>
              {'\n          '}
              <li>{'결제가 완료된 시점에 예약이 확정됩니다.'}</li>
              {'\n          '}
              <li>{'패키지별 서비스 범위 및 가격은 웹사이트에 고지된 내용을 따릅니다.'}</li>
              {'\n        '}
            </ol>
            {'\n      '}
          </section>
          {'\n\n      '}
          <section>
            {'\n        '}
            <h2 className="text-lg font-bold text-white mb-3">
              {'제5조 (예약 변경 및 취소·환불)'}
            </h2>
            {'\n        '}
            <ol className="list-decimal pl-5 space-y-1">
              {'\n          '}
              <li>
                {'일정 변경은 '}
                <strong className="text-zinc-200">{'1회에 한하여 무료'}</strong>
                {'로 가능하며, 카카오톡으로 요청할 수 있습니다.'}
              </li>
              {'\n          '}
              <li>
                {'취소·환불 기준은 다음과 같습니다.\n            '}
                <ul className="list-none mt-2 space-y-1">
                  {'\n              '}
                  <li>
                    <strong className="text-zinc-200">{'촬영일 3일 전까지:'}</strong>
                    {' 전액 환불'}
                  </li>
                  {'\n              '}
                  <li>
                    <strong className="text-zinc-200">{'촬영일 2일 전 ~ 전날:'}</strong>
                    {' 서비스 이용료의 50% 차감 후 환불'}
                  </li>
                  {'\n              '}
                  <li>
                    <strong className="text-zinc-200">{'촬영 당일 취소 또는 노쇼:'}</strong>
                    {' 환불 불가 (서비스 이용료 100% 차감)'}
                  </li>
                  {'\n            '}
                </ul>
                {'\n          '}
              </li>
              {'\n          '}
              <li>
                {'회사의 사정으로 촬영이 불가한 경우, 전액 환불 또는 일정 재조율을 제공합니다.'}
              </li>
              {'\n          '}
              <li>
                {
                  '천재지변 등 불가항력적 사유로 촬영이 어려운 경우, 양측 협의 하에 일정을 변경합니다.'
                }
              </li>
              {'\n        '}
            </ol>
            {'\n      '}
          </section>
          {'\n\n      '}
          <section>
            {'\n        '}
            <h2 className="text-lg font-bold text-white mb-3">{'제6조 (저작권 및 초상권)'}</h2>
            {'\n        '}
            <ol className="list-decimal pl-5 space-y-1">
              {'\n          '}
              <li>
                {'촬영물의 '}
                <strong className="text-zinc-200">{'저작권'}</strong>
                {'은 회사에 귀속됩니다.'}
              </li>
              {'\n          '}
              <li>
                {'이용자는 전달받은 사진을 '}
                <strong className="text-zinc-200">{'개인 용도'}</strong>
                {'(SNS 프로필, 소개팅앱, 이력서 등)로 자유롭게 사용할 수 있습니다.'}
              </li>
              {'\n          '}
              <li>
                {
                  '회사는 이용자의 촬영물을 마케팅·포트폴리오 목적으로 활용할 수 있으며, 이에 대해 촬영 전 별도의 '
                }
                <strong className="text-zinc-200">{'초상권 활용 동의'}</strong>
                {'를 구합니다. 동의하지 않을 경우 활용하지 않습니다.'}
              </li>
              {'\n          '}
              <li>
                {
                  '이용자가 촬영물을 상업적 목적(광고, 판매 등)으로 사용하고자 하는 경우, 사전에 회사의 서면 동의를 받아야 합니다.'
                }
              </li>
              {'\n        '}
            </ol>
            {'\n      '}
          </section>
          {'\n\n      '}
          <section>
            {'\n        '}
            <h2 className="text-lg font-bold text-white mb-3">{'제7조 (서비스 보장)'}</h2>
            {'\n        '}
            <ol className="list-decimal pl-5 space-y-1">
              {'\n          '}
              <li>
                {'모든 패키지에는 보정 '}
                <strong className="text-zinc-200">{'무제한 수정'}</strong>
                {'이 포함됩니다.'}
              </li>
              {'\n          '}
              <li>
                {'최종 결과물에 만족하지 못할 경우, '}
                <strong className="text-zinc-200">{'1회 무료 재촬영'}</strong>
                {'을 보장합니다.'}
              </li>
              {'\n        '}
            </ol>
            {'\n      '}
          </section>
          {'\n\n      '}
          <section>
            {'\n        '}
            <h2 className="text-lg font-bold text-white mb-3">{'제8조 (이용자의 의무)'}</h2>
            {'\n        '}
            <ol className="list-decimal pl-5 space-y-1">
              {'\n          '}
              <li>{'이용자는 예약된 일시와 장소에 성실히 참여해야 합니다.'}</li>
              {'\n          '}
              <li>{'촬영 현장에서 회사의 합리적인 안내에 협조해야 합니다.'}</li>
              {'\n          '}
              <li>{'타인의 권리를 침해하거나 공공질서에 반하는 행위를 해서는 안 됩니다.'}</li>
              {'\n        '}
            </ol>
            {'\n      '}
          </section>
          {'\n\n      '}
          <section>
            {'\n        '}
            <h2 className="text-lg font-bold text-white mb-3">{'제9조 (면책 조항)'}</h2>
            {'\n        '}
            <ol className="list-decimal pl-5 space-y-1">
              {'\n          '}
              <li>
                {
                  '천재지변, 정부 규제, 감염병, 전쟁 등 불가항력적 사유로 서비스를 제공하지 못한 경우 회사는 책임을 지지 않으며, 일정 변경 또는 환불로 대체합니다.'
                }
              </li>
              {'\n          '}
              <li>
                {
                  '이용자의 귀책 사유(지각, 컨디션 불량, 사전 안내 미이행 등)로 결과물 품질이 저하된 경우, 회사는 이에 대한 책임을 지지 않습니다.'
                }
              </li>
              {'\n        '}
            </ol>
            {'\n      '}
          </section>
          {'\n\n      '}
          <section>
            {'\n        '}
            <h2 className="text-lg font-bold text-white mb-3">{'제10조 (분쟁 해결)'}</h2>
            {'\n        '}
            <ol className="list-decimal pl-5 space-y-1">
              {'\n          '}
              <li>
                {
                  '서비스 이용과 관련하여 분쟁이 발생할 경우, 양측은 원만한 합의를 위해 성실히 협의합니다.'
                }
              </li>
              {'\n          '}
              <li>
                {'협의가 이루어지지 않을 경우 '}
                <strong className="text-zinc-200">{'서울서부지방법원'}</strong>
                {'을 관할 법원으로 합니다.'}
              </li>
              {'\n        '}
            </ol>
            {'\n      '}
          </section>
          {'\n\n      '}
          <section>
            {'\n        '}
            <h2 className="text-lg font-bold text-white mb-3">{'제11조 (약관의 변경)'}</h2>
            {'\n        '}
            <p>
              {
                '본 약관은 시행일로부터 적용되며, 변경 사항이 있을 경우 시행일 7일 전 웹사이트를 통해 공지합니다. 변경된 약관에 동의하지 않는 경우 이용 계약을 해지할 수 있습니다.'
              }
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

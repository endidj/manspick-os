// manspick-site@54f4a375의 원본 배치·문구를 보존한 React 서버 컴포넌트입니다.
import type { CSSProperties } from 'react';
import { SourceImage } from './source-image';
import { sourceImageSizes } from './source-image-sizes';
import { SourceIcon } from './source-icon';
import styles from './source-proof.module.css';

export function SourceProof() {
  return (
    <>
      <section id="before-after" className="relative py-20 md:py-24 lg:py-32">
        {'\n    '}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {'\n      '}
          <div className="reveal text-center max-w-3xl mx-auto mb-14 md:mb-16 lg:mb-20">
            {'\n        '}
            <p className="text-accent-400 text-sm font-semibold uppercase tracking-widest mb-4">
              {'Before & After'}
            </p>
            {'\n        '}
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter leading-tight text-white break-keep">
              {'\n          평범한 남자에서'}
              <br />
              <span className="text-accent-400">{'호감형 남자'}</span>
              {'가 되기까지.\n        '}
            </h2>
            {'\n        '}
            <p className="text-sm sm:text-base md:text-lg text-zinc-400 leading-relaxed mt-5 md:mt-6 break-keep">
              {'\n          맨즈픽을 다녀간 평범남들의 실제 변신 사례입니다 — '}
              <br className="hidden sm:block" />
              {' 촬영, 의상, 공간, 디렉팅으로 만든 결과입니다.\n        '}
            </p>
            {'\n      '}
          </div>
          {'\n\n      '}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {'\n        '}
            {'\n        '}
            <div className="reveal glass rounded-3xl p-5 md:p-6">
              {'\n          '}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {'\n            '}
                <div className={styles.photoFrame}>
                  {'\n              '}
                  <SourceImage
                    name="hero-before-1.png"
                    sizes={sourceImageSizes.beforeAfter}
                    alt="이지원 비포"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  {'\n              '}
                  <span className="ba-tag">{'BEFORE'}</span>
                  {'\n            '}
                </div>
                {'\n            '}
                <div className={`${styles.photoFrame} ${styles.afterFrame}`}>
                  {'\n              '}
                  <SourceImage
                    name="hero-after-1.png"
                    sizes={sourceImageSizes.beforeAfter}
                    alt="이지원 애프터"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="ba-tag after">AFTER</span>
                  {'\n            '}
                </div>
                {'\n          '}
              </div>
              {'\n          '}
              <div className="px-1">
                {'\n            '}
                <p className="text-xs text-accent-400 font-semibold uppercase tracking-widest">
                  {'20대 유학생'}
                </p>
                {'\n            '}
                <p className="text-white font-semibold mt-1">{'HYBRID 패키지 · 코디 제작 2회'}</p>
                {'\n            '}
                <p className="text-sm text-zinc-400 mt-2 break-keep">
                  {
                    '"친구들과 여자친구, 심지어 부모님까지 좋아해주셨어요. 유학 떠나기 전 최고의 선택이었습니다."'
                  }
                </p>
                {'\n          '}
              </div>
              {'\n        '}
            </div>
            {'\n\n        '}
            {'\n        '}
            <div
              className="reveal glass rounded-3xl p-5 md:p-6"
              style={{ transitionDelay: '80ms' } as CSSProperties}
            >
              {'\n          '}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {'\n            '}
                <div className={styles.photoFrame}>
                  {'\n              '}
                  <SourceImage
                    name="hero-before-2.png"
                    sizes={sourceImageSizes.beforeAfter}
                    alt="강준호 비포"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  {'\n              '}
                  <span className="ba-tag">{'BEFORE'}</span>
                  {'\n            '}
                </div>
                {'\n            '}
                <div className={`${styles.photoFrame} ${styles.afterFrame}`}>
                  {'\n              '}
                  <SourceImage
                    name="hero-after-2.png"
                    sizes={sourceImageSizes.beforeAfter}
                    alt="강준호 애프터"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="ba-tag after">AFTER</span>
                  {'\n            '}
                </div>
                {'\n          '}
              </div>
              {'\n          '}
              <div className="px-1">
                {'\n            '}
                <p className="text-xs text-accent-400 font-semibold uppercase tracking-widest">
                  {'30대 직장인'}
                </p>
                {'\n            '}
                <p className="text-white font-semibold mt-1">{'HYBRID 패키지 · 의류 대여'}</p>
                {'\n            '}
                <p className="text-sm text-zinc-400 mt-2 break-keep">
                  {
                    '"직장 생활 하다가 이번에 모델에 도전해보려고 신청했는데, "이게 나라고?" 앞으로 자신감을 가질\n              수\n              있을 거 같습니다!'
                  }
                </p>
                {'\n          '}
              </div>
              {'\n        '}
            </div>
            {'\n\n        '}
            {'\n        '}
            <div
              className="reveal glass rounded-3xl p-5 md:p-6"
              style={{ transitionDelay: '160ms' } as CSSProperties}
            >
              {'\n          '}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {'\n            '}
                <div className={styles.photoFrame}>
                  {'\n              '}
                  <SourceImage
                    name="hero-before-3.png"
                    sizes={sourceImageSizes.beforeAfter}
                    alt="박도현 비포"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  {'\n              '}
                  <span className="ba-tag">{'BEFORE'}</span>
                  {'\n            '}
                </div>
                {'\n            '}
                <div className={`${styles.photoFrame} ${styles.afterFrame}`}>
                  {'\n              '}
                  <SourceImage
                    name="hero-after-3.png"
                    sizes={sourceImageSizes.beforeAfter}
                    alt="박도현 애프터"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="ba-tag after">AFTER</span>
                  {'\n            '}
                </div>
                {'\n          '}
              </div>
              {'\n          '}
              <div className="px-1">
                {'\n            '}
                <p className="text-xs text-accent-400 font-semibold uppercase tracking-widest">
                  {'20대 한의대생'}
                </p>
                {'\n            '}
                <p className="text-white font-semibold mt-1">{'ALL DAY 패키지 · 패션컨설팅'}</p>
                {'\n            '}
                <p className="text-sm text-zinc-400 mt-2 break-keep">
                  {
                    '"공부하느라 전혀 꾸밀 줄 몰랐는데, 꾸미고 나서 삶이 180도 바뀌었어요. 컨설팅 후에도 여러가지로 도움\n              받았습니다."'
                  }
                </p>
                {'\n          '}
              </div>
              {'\n        '}
            </div>
            {'\n\n        '}
            {'\n        '}
            <div
              className="reveal glass rounded-3xl p-5 md:p-6"
              style={{ transitionDelay: '220ms' } as CSSProperties}
            >
              {'\n          '}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {'\n            '}
                <div className={styles.photoFrame}>
                  {'\n              '}
                  <SourceImage
                    name="hero-before-4.png"
                    sizes={sourceImageSizes.beforeAfter}
                    alt="윤태훈 비포"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  {'\n              '}
                  <span className="ba-tag">{'BEFORE'}</span>
                  {'\n            '}
                </div>
                {'\n            '}
                <div className={`${styles.photoFrame} ${styles.afterFrame}`}>
                  {'\n              '}
                  <SourceImage
                    name="hero-after-4.png"
                    sizes={sourceImageSizes.beforeAfter}
                    alt="윤태훈 애프터"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="ba-tag after">AFTER</span>
                  {'\n            '}
                </div>
                {'\n          '}
              </div>
              {'\n          '}
              <div className="px-1">
                {'\n            '}
                <p className="text-xs text-accent-400 font-semibold uppercase tracking-widest">
                  {'30대 직장인'}
                </p>
                {'\n            '}
                <p className="text-white font-semibold mt-1">{'ALL DAY 패키지 · 동행쇼핑'}</p>
                {'\n            '}
                <p className="text-sm text-zinc-400 mt-2 break-keep">
                  {
                    '"결정사에 제출하기 위해 촬영을 했는데, 매칭되는 사람의 조건이 완전히 달라졌어요!"'
                  }
                </p>
                {'\n          '}
              </div>
              {'\n        '}
            </div>
            {'\n\n        '}
            {'\n        '}
            <div
              className="reveal glass rounded-3xl p-5 md:p-6"
              style={{ transitionDelay: '280ms' } as CSSProperties}
            >
              {'\n          '}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {'\n            '}
                <div className={styles.photoFrame}>
                  {'\n              '}
                  <SourceImage
                    name="hero-before-5.png"
                    sizes={sourceImageSizes.beforeAfter}
                    alt="임민우 비포"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  {'\n              '}
                  <span className="ba-tag">{'BEFORE'}</span>
                  {'\n            '}
                </div>
                {'\n            '}
                <div className={`${styles.photoFrame} ${styles.afterFrame}`}>
                  {'\n              '}
                  <SourceImage
                    name="hero-after-5.png"
                    sizes={sourceImageSizes.beforeAfter}
                    alt="임민우 애프터"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="ba-tag after">AFTER</span>
                  {'\n            '}
                </div>
                {'\n          '}
              </div>
              {'\n          '}
              <div className="px-1">
                {'\n            '}
                <p className="text-xs text-accent-400 font-semibold uppercase tracking-widest">
                  {'30대 회계사'}
                </p>
                {'\n            '}
                <p className="text-white font-semibold mt-1">{'HYBRID 패키지'}</p>
                {'\n            '}
                <p className="text-sm text-zinc-400 mt-2 break-keep">
                  {
                    '"인스타 올릴 사진 찍었는데, 역시 인플루언서들은 감도가 다르네요. 다른데서도 찍어봤지만 대대대\n              만족입니다."'
                  }
                </p>
                {'\n          '}
              </div>
              {'\n        '}
            </div>
            {'\n\n        '}
            {'\n        '}
            <div
              className="reveal glass rounded-3xl p-5 md:p-6"
              style={{ transitionDelay: '340ms' } as CSSProperties}
            >
              {'\n          '}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {'\n            '}
                <div className={styles.photoFrame}>
                  {'\n              '}
                  <SourceImage
                    name="hero-before-6.png"
                    sizes={sourceImageSizes.beforeAfter}
                    alt="정현우 비포"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  {'\n              '}
                  <span className="ba-tag">{'BEFORE'}</span>
                  {'\n            '}
                </div>
                {'\n            '}
                <div className={`${styles.photoFrame} ${styles.afterFrame}`}>
                  {'\n              '}
                  <SourceImage
                    name="hero-after-6.png"
                    sizes={sourceImageSizes.beforeAfter}
                    alt="정현우 애프터"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="ba-tag after">AFTER</span>
                  {'\n            '}
                </div>
                {'\n          '}
              </div>
              {'\n          '}
              <div className="px-1">
                {'\n            '}
                <p className="text-xs text-accent-400 font-semibold uppercase tracking-widest">
                  {'30대 사업가'}
                </p>
                {'\n            '}
                <p className="text-white font-semibold mt-1">{'ALL DAY 패키지'}</p>
                {'\n            '}
                <p className="text-sm text-zinc-400 mt-2 break-keep">
                  {
                    '"옷 입는 것과 꾸미는 건 정말 좋아하는데 사진은 아무리 해도 안 늘더라구요. 맨즈픽 만나서 진짜\n              다행입니다 :>"'
                  }
                </p>
                {'\n          '}
              </div>
              {'\n        '}
            </div>
            {'\n      '}
          </div>
          {'\n    '}
        </div>
        {'\n\n    '}
        {'\n    '}
        <div className="reveal max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 md:mt-16 lg:mt-20">
          {'\n      '}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/5 rounded-2xl md:rounded-3xl overflow-hidden">
            {'\n        '}
            <div className="bg-zinc-950 p-5 sm:p-7 lg:p-10">
              {'\n          '}
              <p className="font-display text-3xl sm:text-4xl lg:text-6xl font-bold text-white tracking-tighter">
                <span className="count-up" data-count="1127" data-separator="true">
                  {'0'}
                </span>
                <span className="text-accent-400">{'+'}</span>
                {'\n          '}
              </p>
              {'\n          '}
              <p className="text-xs sm:text-sm text-zinc-500 mt-1.5 sm:mt-2">
                {'잘생겨진 남자 수'}
              </p>
              {'\n        '}
            </div>
            {'\n        '}
            <div className="bg-zinc-950 p-5 sm:p-7 lg:p-10">
              {'\n          '}
              <p className="font-display text-3xl sm:text-4xl lg:text-6xl font-bold text-white tracking-tighter">
                <span className="count-up" data-count="6">
                  {'0'}
                </span>
                <span className="text-accent-400 text-xl sm:text-2xl lg:text-3xl">{'년'}</span>
              </p>
              {'\n          '}
              <p className="text-xs sm:text-sm text-zinc-500 mt-1.5 sm:mt-2">
                {'남성 이미지 메이킹 노하우'}
              </p>
              {'\n        '}
            </div>
            {'\n        '}
            <div className="bg-zinc-950 p-5 sm:p-7 lg:p-10">
              {'\n          '}
              <p className="font-display text-3xl sm:text-4xl lg:text-6xl font-bold text-white tracking-tighter">
                <span className="count-up" data-count="46">
                  {'0'}
                </span>
                <span className="text-accent-400 text-xl sm:text-2xl lg:text-3xl">{'K'}</span>
              </p>
              {'\n          '}
              <p className="text-xs sm:text-sm text-zinc-500 mt-1.5 sm:mt-2">
                {'내부 인플루언서 팔로워 합산'}
              </p>
              {'\n        '}
            </div>
            {'\n        '}
            <div className="bg-zinc-950 p-5 sm:p-7 lg:p-10">
              {'\n          '}
              <p className="font-display text-3xl sm:text-4xl lg:text-6xl font-bold text-white tracking-tighter">
                <span className="count-up" data-count="4.97" data-decimals="2">
                  {'0'}
                </span>
                <span className="text-accent-400 text-xl sm:text-2xl lg:text-3xl">{'점'}</span>
                {'\n          '}
              </p>
              {'\n          '}
              <p className="text-xs sm:text-sm text-zinc-500 mt-1.5 sm:mt-2">
                {'평균 만족도 (5점 만점)'}
              </p>
              {'\n        '}
            </div>
            {'\n      '}
          </div>
          {'\n    '}
          <div className="mt-10 flex justify-center">
            <a
              href="https://pf.kakao.com/_kNxoMn"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-primary inline-flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-semibold px-8 py-4 text-base rounded-full"
            >
              맨즈픽 무료 상담
              <SourceIcon name="solar/arrow-right-linear" className="arrow text-xl" />
            </a>
          </div>
        </div>
        {'\n  '}
      </section>
    </>
  );
}

export function SourceImpact() {
  return (
    <section id="real-impact" className="relative py-20 md:py-24 lg:py-32 overflow-hidden">
      {'\n    '}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {'\n      '}
        {'\n      '}
        <div className="reveal text-center max-w-2xl mx-auto mb-10 md:mb-12">
          {'\n        '}
          <p className="text-accent-400 text-sm font-semibold uppercase tracking-widest mb-6">
            {'Real Impact'}
          </p>
          {'\n        '}
          <blockquote className="relative">
            {'\n          '}
            <SourceIcon
              name="solar/quote-open-bold"
              className="text-accent-500/20 text-4xl md:text-5xl absolute -top-4 -left-2 md:-left-6"
            />
            {'\n          '}
            <p className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight leading-snug break-keep">
              {'\n            첫인상의 '}
              <span className="text-accent-400">{'55%'}</span>
              {'는'}
              <br className="md:hidden" />
              {' 시각적 요소로 결정된다.\n          '}
            </p>
            {'\n          '}
            <footer className="mt-4 text-sm text-zinc-500">
              {'\n            — Albert Mehrabian, UCLA 심리학 교수 · '}
              <cite className="not-italic text-zinc-400">{'《Silent Messages》'}</cite>
              {'\n          '}
            </footer>
            {'\n        '}
          </blockquote>
          {'\n      '}
        </div>
        {'\n\n      '}
        {'\n      '}
        <div className="reveal text-center max-w-xl mx-auto mb-14 md:mb-16">
          {'\n        '}
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter leading-tight text-white break-keep">
            {'\n          사진 한 장이 바뀌면,'}
            <br />
            <span className="text-accent-400">{'알림이 달라집니다.'}</span>
            {'\n        '}
          </h2>
          {'\n      '}
        </div>
        {'\n\n      '}
        {'\n      '}
        <div className="max-w-md mx-auto">
          {'\n        '}
          <div className="relative rounded-[2.5rem] md:rounded-[3rem] border border-white/10 bg-zinc-900/80 p-3 md:p-4 shadow-2xl shadow-black/40">
            {'\n          '}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-zinc-900 rounded-b-2xl border-x border-b border-white/10 z-10"></div>
            {'\n          '}
            <div
              className="rounded-[2rem] md:rounded-[2.5rem] bg-[#0a0a0a] pt-8 pb-6 px-4 space-y-3"
              id="notif-screen"
            >
              {'\n            '}
              <div className="notif-card opacity-0 translate-y-6 glass rounded-2xl p-4 flex items-start gap-3 transition-all duration-700 ease-out">
                {'\n              '}
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shrink-0">
                  {'\n                '}
                  <SourceIcon name="solar/heart-bold" className="text-white text-sm" />
                  {'\n              '}
                </div>
                {'\n              '}
                <div className="min-w-0">
                  {'\n                '}
                  <div className="flex items-center gap-2 mb-0.5">
                    {'\n                  '}
                    <span className="text-white text-xs font-bold">{'소개팅 앱'}</span>
                    {'\n                  '}
                    <span className="text-zinc-600 text-[10px]">{'지금'}</span>
                    {'\n                '}
                  </div>
                  {'\n                '}
                  <p className="text-zinc-300 text-[13px] leading-snug">
                    {'OOO님이 먼저 좋아요를 보냈습니다 💘'}
                  </p>
                  {'\n              '}
                </div>
                {'\n            '}
              </div>
              {'\n            '}
              <div className="notif-card opacity-0 translate-y-6 glass rounded-2xl p-4 flex items-start gap-3 transition-all duration-700 ease-out">
                {'\n              '}
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
                  {'\n                '}
                  <SourceIcon name="solar/ring-bold" className="text-white text-sm" />
                  {'\n              '}
                </div>
                {'\n              '}
                <div className="min-w-0">
                  {'\n                '}
                  <div className="flex items-center gap-2 mb-0.5">
                    {'\n                  '}
                    <span className="text-white text-xs font-bold">{'결혼정보회사'}</span>
                    {'\n                  '}
                    <span className="text-zinc-600 text-[10px]">{'3분 전'}</span>
                    {'\n                '}
                  </div>
                  {'\n                '}
                  <p className="text-zinc-300 text-[13px] leading-snug">
                    {'이번 주 매칭 요청 3건이 도착했습니다'}
                  </p>
                  {'\n              '}
                </div>
                {'\n            '}
              </div>
              {'\n            '}
              <div className="notif-card opacity-0 translate-y-6 glass rounded-2xl p-4 flex items-start gap-3 transition-all duration-700 ease-out">
                {'\n              '}
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shrink-0">
                  {'\n                '}
                  <SourceIcon name="ri/kakao-talk-fill" className="text-white text-sm" />
                  {'\n              '}
                </div>
                {'\n              '}
                <div className="min-w-0">
                  {'\n                '}
                  <div className="flex items-center gap-2 mb-0.5">
                    {'\n                  '}
                    <span className="text-white text-xs font-bold">{'카카오톡'}</span>
                    {'\n                  '}
                    <span className="text-zinc-600 text-[10px]">{'15분 전'}</span>
                    {'\n                '}
                  </div>
                  {'\n                '}
                  <p className="text-zinc-300 text-[13px] leading-snug">
                    {'"오빠 프사 바꿨어? 분위기 완전 달라졌다 😳"'}
                  </p>
                  {'\n              '}
                </div>
                {'\n            '}
              </div>
              {'\n            '}
              <div className="notif-card opacity-0 translate-y-6 glass rounded-2xl p-4 flex items-start gap-3 transition-all duration-700 ease-out">
                {'\n              '}
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-orange-400 flex items-center justify-center shrink-0">
                  {'\n                '}
                  <SourceIcon name="solar/camera-bold" className="text-white text-sm" />
                  {'\n              '}
                </div>
                {'\n              '}
                <div className="min-w-0">
                  {'\n                '}
                  <div className="flex items-center gap-2 mb-0.5">
                    {'\n                  '}
                    <span className="text-white text-xs font-bold">{'Instagram'}</span>
                    {'\n                  '}
                    <span className="text-zinc-600 text-[10px]">{'1시간 전'}</span>
                    {'\n                '}
                  </div>
                  {'\n                '}
                  <p className="text-zinc-300 text-[13px] leading-snug">
                    {'프로필 방문 '}
                    <span className="text-white font-semibold">{'+127명'}</span>
                    {' · 팔로우 요청 '}
                    <span className="text-white font-semibold">{'12건'}</span>
                  </p>
                  {'\n              '}
                </div>
                {'\n            '}
              </div>
              {'\n            '}
              <div className="notif-card opacity-0 translate-y-6 glass rounded-2xl p-4 flex items-start gap-3 transition-all duration-700 ease-out">
                {'\n              '}
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shrink-0">
                  {'\n                '}
                  <SourceIcon name="solar/briefcase-bold" className="text-white text-sm" />
                  {'\n              '}
                </div>
                {'\n              '}
                <div className="min-w-0">
                  {'\n                '}
                  <div className="flex items-center gap-2 mb-0.5">
                    {'\n                  '}
                    <span className="text-white text-xs font-bold">{'LinkedIn'}</span>
                    {'\n                  '}
                    <span className="text-zinc-600 text-[10px]">{'2시간 전'}</span>
                    {'\n                '}
                  </div>
                  {'\n                '}
                  <p className="text-zinc-300 text-[13px] leading-snug">
                    {'헤드헌터로부터 연결 요청이 도착했습니다'}
                  </p>
                  {'\n              '}
                </div>
                {'\n            '}
              </div>
              {'\n          '}
            </div>
            {'\n        '}
          </div>
          {'\n        '}
          <div className="h-16 bg-gradient-to-b from-white/[0.03] to-transparent rounded-b-3xl mx-4"></div>
          {'\n      '}
        </div>
        {'\n    '}
      </div>
      {'\n  '}
    </section>
  );
}

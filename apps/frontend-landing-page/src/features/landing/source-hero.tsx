// manspick-site@54f4a375의 원본 배치·문구를 보존한 React 서버 컴포넌트입니다.
import type { CSSProperties } from 'react';
import styles from './source-hero.module.css';
import { SourceImage } from './source-image';
import { sourceImageSizes } from './source-image-sizes';
import { SourceIcon } from './source-icon';

export function SourceHero() {
  return (
    <>
      <section
        id="hero"
        className={`${styles.hero} relative mesh-bg overflow-hidden pt-28 sm:pt-32`}
      >
        {'\n    '}
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {'\n      '}
          <div className="flex flex-col items-center text-center">
            {'\n\n        '}
            <h1 className={`${styles.title} reveal font-display`}>
              <span>매력있는 남성</span>은
              <br />왜 <span>프로필 사진</span>부터
              <br className={styles.mobileBreak} /> 다를까요?
            </h1>
            <p className={`${styles.subtitle} reveal`}>7명의 전문가가 패션·헤어·보정까지 한번에</p>
            <div
              className="reveal flex flex-col sm:flex-row gap-3 justify-center"
              style={{ transitionDelay: '280ms' } as CSSProperties}
            >
              {'\n          '}
              <a
                href="https://pf.kakao.com/_kNxoMn"
                target="_blank"
                rel="noopener noreferrer"
                className="cta-primary inline-flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-semibold px-8 py-4 text-base rounded-full shadow-[0_10px_30px_-10px_rgba(45,118,246,0.7)]"
              >
                {'\n            '}
                <SourceIcon name="solar/bolt-bold" className="text-xl" />
                {'\n            무료 상담 신청하기\n            '}
                <SourceIcon name="solar/arrow-right-linear" className="arrow text-xl" />
                {'\n          '}
              </a>
              {'\n          '}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Vinext의 이 경로 간 클라이언트 전환 오류를 피해 문서 탐색을 사용합니다. */}
              <a
                href="/recommend"
                className={`${styles.recommendLink} cta-primary inline-flex items-center justify-center gap-2 font-semibold px-8 py-4 text-base rounded-full`}
              >
                나한테 딱 맞는 패키지는?
                <SourceIcon name="solar/arrow-right-linear" className="arrow text-xl" />
              </a>
            </div>
            <div
              className="reveal mt-10 md:mt-12 flex items-center gap-3 sm:gap-5 justify-center"
              style={{ transitionDelay: '360ms' } as CSSProperties}
            >
              {'\n          '}
              <div className="flex -space-x-2.5 sm:-space-x-3">
                {'\n            '}
                <SourceImage
                  name="hero-after-1.png"
                  sizes={sourceImageSizes.avatar}
                  thumbnail
                  alt="후기 작성자"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-zinc-950 object-cover object-top"
                  loading="eager"
                  decoding="async"
                />
                {'\n            '}
                <SourceImage
                  name="hero-after-2.png"
                  sizes={sourceImageSizes.avatar}
                  thumbnail
                  alt="후기 작성자"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-zinc-950 object-cover object-top"
                  loading="eager"
                  decoding="async"
                />
                {'\n            '}
                <SourceImage
                  name="hero-after-3.png"
                  sizes={sourceImageSizes.avatar}
                  thumbnail
                  alt="후기 작성자"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-zinc-950 object-cover object-top"
                  loading="eager"
                  decoding="async"
                />
                {'\n            '}
                <SourceImage
                  name="hero-after-4.png"
                  sizes={sourceImageSizes.avatar}
                  thumbnail
                  alt="후기 작성자"
                  className="hidden sm:block w-10 h-10 rounded-full border-2 border-zinc-950 object-cover object-top"
                  loading="eager"
                  decoding="async"
                />
                {'\n          '}
              </div>
              {'\n          '}
              <div className="text-left">
                {'\n            '}
                <div className="flex items-center gap-0.5 sm:gap-1 text-accent-400 text-sm">
                  {'\n              '}
                  <SourceIcon name="solar/star-bold" />
                  {'\n              '}
                  <SourceIcon name="solar/star-bold" />
                  {'\n              '}
                  <SourceIcon name="solar/star-bold" />
                  {'\n              '}
                  <SourceIcon name="solar/star-bold" />
                  {'\n              '}
                  <SourceIcon name="solar/star-bold" />
                  {'\n              '}
                  <span className="text-white font-semibold text-xs sm:text-sm ml-1">{'4.97'}</span>
                  {'\n            '}
                </div>
                {'\n            '}
                <p className={styles.proof}>{'평범남 1,127명+ 호감형으로 바뀌었습니다'}</p>
                {'\n          '}
              </div>
              {'\n        '}
            </div>
            {'\n      '}
          </div>
          {'\n    '}
        </div>
        {'\n\n    '}
        <div
          id="hero-scroll-hint"
          className={`${styles.scrollHint} flex flex-col items-center gap-2 text-xs`}
          aria-hidden="true"
        >
          {'\n      '}
          <span className="uppercase tracking-widest">{'scroll'}</span>
          {'\n      '}
          <SourceIcon name="solar/arrow-down-linear" className="text-base animate-bounce" />
          {'\n    '}
        </div>
        {'\n  '}
      </section>
      <section className="relative py-12 md:py-14 lg:py-16 border-y border-white/5">
        {'\n    '}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {'\n      '}
          <p className="text-center text-[10px] md:text-xs text-zinc-500 uppercase tracking-widest mb-6 md:mb-10">
            {'\n        누가 맨즈픽을 찾아오나요?\n      '}
          </p>
          {'\n      '}
          <div className="marquee-row overflow-hidden relative">
            {'\n        '}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 md:w-24 bg-gradient-to-r from-zinc-950 to-transparent z-10">
              {'\n        '}
            </div>
            {'\n        '}
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 md:w-24 bg-gradient-to-l from-zinc-950 to-transparent z-10">
              {'\n        '}
            </div>
            {'\n        '}
            <div className="flex w-max marquee-track gap-8 md:gap-14 whitespace-nowrap">
              {'\n          '}
              <span className="shrink-0 text-lg md:text-2xl font-display font-semibold text-zinc-500 hover:text-white transition">
                {'100만\n            유튜버'}
              </span>
              {'\n          '}
              <span className="shrink-0 text-lg md:text-2xl font-display font-semibold text-zinc-500 hover:text-white transition">
                {'대기업\n            직장인'}
              </span>
              {'\n          '}
              <span className="shrink-0 text-lg md:text-2xl font-display font-semibold text-zinc-500 hover:text-white transition">
                {'사업가'}
              </span>
              {'\n          '}
              <span className="shrink-0 text-lg md:text-2xl font-display font-semibold text-zinc-500 hover:text-white transition">
                {'변호사'}
              </span>
              {'\n          '}
              <span className="shrink-0 text-lg md:text-2xl font-display font-semibold text-zinc-500 hover:text-white transition">
                {'의사'}
              </span>
              {'\n          '}
              <span className="shrink-0 text-lg md:text-2xl font-display font-semibold text-zinc-500 hover:text-white transition">
                {'금융투자자'}
              </span>
              {'\n          '}
              <span className="shrink-0 text-lg md:text-2xl font-display font-semibold text-zinc-500 hover:text-white transition">
                {'인플루언서'}
              </span>
              {'\n          '}
              <span className="shrink-0 text-lg md:text-2xl font-display font-semibold text-zinc-500 hover:text-white transition">
                {'배우'}
              </span>
              {'\n          '}
              {'\n          '}
              <span
                aria-hidden="true"
                className="shrink-0 text-lg md:text-2xl font-display font-semibold text-zinc-500 hover:text-white transition"
              >
                {'100만\n            유튜버'}
              </span>
              {'\n          '}
              <span
                aria-hidden="true"
                className="shrink-0 text-lg md:text-2xl font-display font-semibold text-zinc-500 hover:text-white transition"
              >
                {'대기업\n            직장인'}
              </span>
              {'\n          '}
              <span
                aria-hidden="true"
                className="shrink-0 text-lg md:text-2xl font-display font-semibold text-zinc-500 hover:text-white transition"
              >
                {'사업가'}
              </span>
              {'\n          '}
              <span
                aria-hidden="true"
                className="shrink-0 text-lg md:text-2xl font-display font-semibold text-zinc-500 hover:text-white transition"
              >
                {'변호사'}
              </span>
              {'\n          '}
              <span
                aria-hidden="true"
                className="shrink-0 text-lg md:text-2xl font-display font-semibold text-zinc-500 hover:text-white transition"
              >
                {'의사'}
              </span>
              {'\n          '}
              <span
                aria-hidden="true"
                className="shrink-0 text-lg md:text-2xl font-display font-semibold text-zinc-500 hover:text-white transition"
              >
                {'금융투자자'}
              </span>
              {'\n          '}
              <span
                aria-hidden="true"
                className="shrink-0 text-lg md:text-2xl font-display font-semibold text-zinc-500 hover:text-white transition"
              >
                {'인플루언서'}
              </span>
              {'\n          '}
              <span
                aria-hidden="true"
                className="shrink-0 text-lg md:text-2xl font-display font-semibold text-zinc-500 hover:text-white transition"
              >
                {'배우'}
              </span>
              {'\n        '}
            </div>
            {'\n      '}
          </div>
          {'\n    '}
        </div>
        {'\n  '}
      </section>
    </>
  );
}

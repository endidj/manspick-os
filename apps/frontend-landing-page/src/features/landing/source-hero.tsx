// manspick-site@54f4a375의 원본 배치·문구를 보존한 React 서버 컴포넌트입니다.
import type { CSSProperties } from 'react';
import styles from './source-hero.module.css';
import { SourceImage } from './source-image';
import { sourceImageSizes } from './source-image-sizes';
import { SourceIcon } from './source-icon';

export function SourceHero() {
  return (
    <>
      <section id="hero" className={`${styles.hero} relative mesh-bg overflow-hidden`}>
        <div className={styles.backdrop} aria-hidden="true">
          <SourceImage
            name="스타일링 포트폴리오 1.png"
            sizes="(min-width: 768px) 280px, 44vw"
            alt=""
            loading="lazy"
            fetchPriority="low"
            className={styles.leftPortrait}
          />
          <SourceImage
            name="스타일링 포트폴리오 4.png"
            sizes="(min-width: 768px) 280px, 44vw"
            alt=""
            loading="lazy"
            fetchPriority="low"
            className={styles.rightPortrait}
          />
        </div>
        <div className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {'\n      '}
          <div className={`${styles.content} flex flex-col items-center text-center`}>
            {'\n\n        '}
            <div className={`${styles.creatorBadge} reveal`}>
              <strong>46K</strong> 인플루언서가 찍어주는 남성 프로필
            </div>
            <h1 className={`${styles.title} reveal font-display`}>
              <span className={styles.accent}>인기있는 남자</span>의 <br />
              <span className={styles.underline}>프로필 사진</span>은{' '}
              <br className={styles.mobileBreak} />
              어떻게 다를까요?
            </h1>
            <div
              className="reveal flex flex-col sm:flex-row items-center gap-1 sm:gap-2 justify-center"
              style={{ transitionDelay: '280ms' } as CSSProperties}
            >
              {'\n          '}
              <a
                href="https://pf.kakao.com/_kNxoMn"
                target="_blank"
                rel="noopener noreferrer"
                className="cta-primary inline-flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-semibold px-6 py-3 text-base rounded-full shadow-[0_10px_30px_-10px_rgba(45,118,246,0.7)]"
              >
                {'\n            '}
                <SourceIcon name="solar/bolt-bold" className="text-xl" />
                {'\n            맨즈픽 무료 상담\n            '}
                <SourceIcon name="solar/arrow-right-linear" className="arrow text-xl" />
                {'\n          '}
              </a>
              {'\n          '}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Vinext의 이 경로 간 클라이언트 전환 오류를 피해 문서 탐색을 사용합니다. */}
              <a
                href="/recommend"
                className={`${styles.recommendLink} cta-primary inline-flex items-center justify-center gap-2 rounded-full`}
              >
                나한테 딱 맞는 패키지는?
                <SourceIcon name="solar/arrow-right-linear" className="arrow text-base" />
              </a>
            </div>
            <div
              className="reveal mb-6 flex items-center gap-3 sm:gap-5 justify-center"
              style={{ transitionDelay: '200ms' } as CSSProperties}
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
        <SourceAudience />
      </section>
    </>
  );
}

function SourceAudience() {
  return (
    <div id="hero-audience" className={`${styles.audience} relative`}>
      {'\n    '}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {'\n      '}
        <p className={`${styles.audienceLabel} text-center`}>
          {'\n        누가 맨즈픽을 찾아주나요?\n      '}
        </p>
        {'\n      '}
        <div className={`${styles.audienceMarquee} marquee-row overflow-hidden relative`}>
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
    </div>
  );
}

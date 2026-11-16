// manspick-site@54f4a375의 원본 배치·문구를 보존한 React 서버 컴포넌트입니다.
import type { CSSProperties } from 'react';
import { sourceImageUrls } from '@manspick/design-system/assets';
import { SourceIcon } from './source-icon';
/* eslint-disable @next/next/no-img-element -- 원본 사진 비율·자르기·해상도를 그대로 보존합니다. */

export function SourceHero() {
  return (
    <>
      <section
        id="hero"
        className="relative lg:min-h-[100dvh] mesh-bg overflow-hidden pt-28 sm:pt-32 pb-16 sm:pb-20"
      >
        {'\n    '}
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {'\n      '}
          <div className="flex flex-col items-center text-center">
            {'\n\n        '}
            <div className="reveal inline-flex items-center gap-2 glass rounded-full px-3 sm:px-4 py-1.5 text-[10px] sm:text-xs text-zinc-300 mb-6 sm:mb-7 max-w-[92vw]">
              {'\n          '}
              <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse shrink-0"></span>
              {'\n          '}
              <span className="truncate">
                {'46K 인플루언서가 직접 찍어주는 · 남성 전문 프로필 촬영'}
              </span>
              {'\n        '}
            </div>
            {'\n\n        '}
            <p
              className="reveal text-zinc-400 text-sm sm:text-base md:text-lg mb-3"
              style={{ transitionDelay: '80ms' } as CSSProperties}
            >
              {'\n          매력 수치 '}
              <span className="strike-zero font-bold">{'ZERO'}</span>
              {', 무색무취 프로필 사진에서\n        '}
            </p>
            {'\n\n        '}
            <h1
              className="reveal font-display text-[2.6rem] sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5.5rem] font-bold tracking-tighter leading-[0.95] text-white mb-5 sm:mb-6"
              style={{ transitionDelay: '120ms' } as CSSProperties}
            >
              {'\n          호감형 프로필로'}
              <br />
              {'\n          바꾸고 '}
              <span className="text-accent-400">{'연애까지.'}</span>
              {'\n        '}
            </h1>
            {'\n\n        '}
            <p
              className="reveal text-[15px] sm:text-lg md:text-xl text-zinc-400 leading-[1.7] sm:leading-relaxed max-w-[58ch] mb-8 sm:mb-10 break-keep px-2"
              style={{ transitionDelay: '200ms' } as CSSProperties}
            >
              {'\n          '}
              <span className="text-white font-medium">
                {'7명의 전문가가 패션·헤어·보정까지 알아서 다 해드립니다.'}
              </span>
              <br />
              {'\n          '}
              <span className="text-white font-medium">
                {'113만 유튜버부터 대기업 임원, 변호사, 의사까지 —'}
              </span>
              {'\n        '}
            </p>
            {'\n\n        '}
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
              <a
                href="#pricing"
                className="cta-primary inline-flex items-center justify-center gap-2 glass hover:bg-white/5 text-white font-semibold px-8 py-4 text-base rounded-full"
              >
                {'\n            패키지 먼저 보기\n          '}
              </a>
              {'\n        '}
            </div>
            {'\n        '}
            <a
              href="#before-after"
              className="reveal mt-4 text-xs text-zinc-500 hover:text-zinc-300 transition inline-flex items-center gap-1 underline underline-offset-4 decoration-zinc-700"
              style={{ transitionDelay: '340ms' } as CSSProperties}
            >
              {'\n          '}
              <SourceIcon name="solar/gallery-wide-bold" />
              {'\n          변신 사례 먼저 구경하기\n        '}
            </a>
            {'\n\n        '}
            <div
              className="reveal mt-10 md:mt-12 flex items-center gap-3 sm:gap-5 justify-center"
              style={{ transitionDelay: '360ms' } as CSSProperties}
            >
              {'\n          '}
              <div className="flex -space-x-2.5 sm:-space-x-3">
                {'\n            '}
                <img
                  src={sourceImageUrls['hero-after-1.png']}
                  alt="후기 작성자"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-zinc-950 object-cover object-top"
                  loading="lazy"
                  decoding="async"
                />
                {'\n            '}
                <img
                  src={sourceImageUrls['hero-after-2.png']}
                  alt="후기 작성자"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-zinc-950 object-cover object-top"
                  loading="lazy"
                  decoding="async"
                />
                {'\n            '}
                <img
                  src={sourceImageUrls['hero-after-3.png']}
                  alt="후기 작성자"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-zinc-950 object-cover object-top"
                  loading="lazy"
                  decoding="async"
                />
                {'\n            '}
                <img
                  src={sourceImageUrls['hero-after-4.png']}
                  alt="후기 작성자"
                  className="hidden sm:block w-10 h-10 rounded-full border-2 border-zinc-950 object-cover object-top"
                  loading="lazy"
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
                <p className="text-[10px] sm:text-xs text-zinc-500 break-keep">
                  {'평범남 1,127명+ 호감형으로 바뀌었습니다'}
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
        <div className="mt-10 sm:mt-12 lg:mt-0 lg:absolute lg:bottom-8 lg:left-1/2 lg:-translate-x-1/2 flex flex-col items-center gap-2 text-zinc-500 text-xs">
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
            {'\n        FEATURED IN · 누가 맨즈픽을 찾아오나요?\n      '}
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

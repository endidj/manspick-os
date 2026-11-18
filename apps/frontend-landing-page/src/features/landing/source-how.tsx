// manspick-site@54f4a375의 원본 배치·문구를 보존한 React 서버 컴포넌트입니다.
import type { CSSProperties } from 'react';
import { SourceImage } from './source-image';
import { sourceImageSizes } from './source-image-sizes';
import { SourceIcon } from './source-icon';

export function SourceHow() {
  return (
    <>
      <section id="how" className="py-20 md:py-24 lg:py-32 relative">
        {'\n    '}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {'\n      '}
          <div className="reveal max-w-3xl mb-14 md:mb-16 lg:mb-20">
            {'\n        '}
            <p className="text-accent-400 text-sm font-semibold uppercase tracking-widest mb-4">
              {'5 HOWs · 6년의 노하우'}
            </p>
            {'\n        '}
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter leading-tight text-white break-keep">
              {'\n          이성이 먼저 연락하게 되는 사진,'}
              <br />
              {'맨즈픽의 '}
              <span className="text-accent-400">{'5가지 노하우'}</span>
              {'\n        '}
            </h2>
            {'\n        '}
            <p className="text-base md:text-lg text-zinc-400 leading-relaxed mt-5 md:mt-6 break-keep">
              {'\n          "그냥 단순히 찍어주는 것"으로는 절대 안 나옵니다.'}
              <br />
              {'공간, 의상, 보정, 검증, 구도 — 다섯 단계 모두에 노하우가 들어갑니다.\n        '}
            </p>
            {'\n      '}
          </div>
          {'\n\n      '}
          {'\n      '}
          <div className="reveal grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-14 lg:gap-16 items-center mb-20 md:mb-24 lg:mb-28">
            {'\n        '}
            <div className="lg:col-span-5">
              {'\n          '}
              <p className="font-display text-6xl sm:text-7xl md:text-8xl font-bold num-outline tracking-tighter mb-2 md:mb-3">
                {'\n            01'}
              </p>
              {'\n          '}
              <p className="text-accent-400 text-sm font-semibold uppercase tracking-widest mb-2">
                {'Location'}
              </p>
              {'\n          '}
              <h3 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight mb-5 md:mb-6 break-keep">
                {'\n            궁금증을 유발하는'}
                <br />
                {'감성 핫플레이스 선정\n          '}
              </h3>
              {'\n          '}
              <div className="glass rounded-2xl p-4 max-w-md">
                {'\n            '}
                <p className="text-sm text-white font-medium flex items-center gap-2">
                  {'\n              '}
                  <SourceIcon name="solar/chat-round-line-bold" className="text-accent-400" />
                  {'\n              "헐… 여기 어디야? 다음엔 나도 데려가줘ㅠㅠ"\n            '}
                </p>
                {'\n          '}
              </div>
              {'\n        '}
            </div>
            {'\n        '}
            <div className="lg:col-span-7 grid grid-cols-3 gap-3">
              {'\n          '}
              <SourceImage
                name="location-1.jpg"
                sizes={sourceImageSizes.location}
                alt="식물과 유리창을 배경으로 검정 재킷과 빨간 티셔츠를 입은 남성의 야외 프로필 사진"
                className="rounded-2xl aspect-[3/4] object-cover"
                loading="lazy"
                decoding="async"
              />
              {'\n          '}
              <SourceImage
                name="location-2.jpg"
                sizes={sourceImageSizes.location}
                alt="실내 테이블에 앉아 갈색 재킷을 입고 옆을 바라보는 남성의 프로필 사진"
                className="rounded-2xl aspect-[3/4] object-cover translate-y-6"
                loading="lazy"
                decoding="async"
              />
              {'\n          '}
              <SourceImage
                name="location-3.jpg"
                sizes={sourceImageSizes.location}
                alt="밝은 콘크리트 벽 앞에서 검정 재킷을 입고 서 있는 남성의 측면 프로필 사진"
                className="rounded-2xl aspect-[3/4] object-cover"
                loading="lazy"
                decoding="async"
              />
              {'\n        '}
            </div>
            {'\n      '}
          </div>
          {'\n\n      '}
          {'\n      '}
          <div className="reveal grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-14 lg:gap-16 items-center mb-20 md:mb-24 lg:mb-28">
            {'\n        '}
            <div className="lg:col-span-7 order-2 lg:order-1">
              {'\n          '}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {'\n            '}
                <SourceImage
                  name="스타일링 포트폴리오 1.png"
                  sizes={sourceImageSizes.styling}
                  alt="스타일링 포트폴리오 1"
                  className="w-full aspect-[4/5] object-cover object-center rounded-xl"
                  loading="lazy"
                  decoding="async"
                />
                {'\n            '}
                <SourceImage
                  name="스타일링 포트폴리오 2.png"
                  sizes={sourceImageSizes.styling}
                  alt="스타일링 포트폴리오 2"
                  className="w-full aspect-[4/5] object-cover object-center rounded-xl"
                  loading="lazy"
                  decoding="async"
                />
                {'\n            '}
                <SourceImage
                  name="스타일링 포트폴리오 3.png"
                  sizes={sourceImageSizes.styling}
                  alt="스타일링 포트폴리오 3"
                  className="w-full aspect-[4/5] object-cover object-center rounded-xl"
                  loading="lazy"
                  decoding="async"
                />
                {'\n            '}
                <SourceImage
                  name="스타일링 포트폴리오 4.png"
                  sizes={sourceImageSizes.styling}
                  alt="스타일링 포트폴리오 4"
                  className="w-full aspect-[4/5] object-cover object-center rounded-xl"
                  loading="lazy"
                  decoding="async"
                />
                {'\n            '}
                <SourceImage
                  name="스타일링 포트폴리오 5.png"
                  sizes={sourceImageSizes.styling}
                  alt="스타일링 포트폴리오 5"
                  className="w-full aspect-[4/5] object-cover object-center rounded-xl"
                  loading="lazy"
                  decoding="async"
                />
                {'\n            '}
                <SourceImage
                  name="스타일링 포트폴리오 6.png"
                  sizes={sourceImageSizes.styling}
                  alt="스타일링 포트폴리오 6"
                  className="w-full aspect-[4/5] object-cover object-center rounded-xl"
                  loading="lazy"
                  decoding="async"
                />
                {'\n            '}
                <SourceImage
                  name="스타일링 포트폴리오 7.png"
                  sizes={sourceImageSizes.styling}
                  alt="스타일링 포트폴리오 7"
                  className="w-full aspect-[4/5] object-cover object-center rounded-xl"
                  loading="lazy"
                  decoding="async"
                />
                {'\n            '}
                <SourceImage
                  name="스타일링 포트폴리오 8.png"
                  sizes={sourceImageSizes.styling}
                  alt="스타일링 포트폴리오 8"
                  className="w-full aspect-[4/5] object-cover object-center rounded-xl"
                  loading="lazy"
                  decoding="async"
                />
                {'\n            '}
                <SourceImage
                  name="스타일링 포트폴리오 9.png"
                  sizes={sourceImageSizes.styling}
                  alt="스타일링 포트폴리오 9"
                  className="w-full aspect-[4/5] object-cover object-center rounded-xl"
                  loading="lazy"
                  decoding="async"
                />
                {'\n            '}
                <SourceImage
                  name="스타일링 포트폴리오 10.png"
                  sizes={sourceImageSizes.styling}
                  alt="스타일링 포트폴리오 10"
                  className="w-full aspect-[4/5] object-cover object-center rounded-xl"
                  loading="lazy"
                  decoding="async"
                />
                {'\n            '}
                <SourceImage
                  name="스타일링 포트폴리오 11.png"
                  sizes={sourceImageSizes.styling}
                  alt="스타일링 포트폴리오 11"
                  className="w-full aspect-[4/5] object-cover object-center rounded-xl"
                  loading="lazy"
                  decoding="async"
                />
                {'\n            '}
                <SourceImage
                  name="스타일링 포트폴리오 12.png"
                  sizes={sourceImageSizes.styling}
                  alt="스타일링 포트폴리오 12"
                  className="w-full aspect-[4/5] object-cover object-center rounded-xl"
                  loading="lazy"
                  decoding="async"
                />
                {'\n          '}
              </div>
              {'\n        '}
            </div>
            {'\n        '}
            <div className="lg:col-span-5 order-1 lg:order-2">
              {'\n          '}
              <p className="font-display text-6xl sm:text-7xl md:text-8xl font-bold num-outline tracking-tighter mb-2 md:mb-3">
                {'\n            02'}
              </p>
              {'\n          '}
              <p className="text-accent-400 text-sm font-semibold uppercase tracking-widest mb-2">
                {'Styling'}
              </p>
              {'\n          '}
              <h3 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight mb-5 md:mb-6 break-keep">
                {'\n            46,000명에게 사랑받고 있는'}
                <br />
                {'패션 인플루언서의 스타일링\n          '}
              </h3>
              {'\n          '}
              <div className="glass rounded-2xl p-4 max-w-md">
                {'\n            '}
                <p className="text-sm text-white font-medium flex items-center gap-2">
                  {'\n              '}
                  <SourceIcon name="solar/chat-round-line-bold" className="text-accent-400" />
                  {
                    '\n              "옷 뭐야… 내가 알던 OOO 맞아?! 완전 내 스타일인데?"\n            '
                  }
                </p>
                {'\n          '}
              </div>
              {'\n        '}
            </div>
            {'\n      '}
          </div>
          {'\n\n      '}
          {'\n      '}
          <div className="reveal grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-14 lg:gap-16 items-center mb-20 md:mb-24 lg:mb-28">
            {'\n        '}
            <div className="lg:col-span-4">
              {'\n          '}
              <p className="font-display text-6xl sm:text-7xl md:text-8xl font-bold num-outline tracking-tighter mb-2 md:mb-3">
                {'\n            03'}
              </p>
              {'\n          '}
              <p className="text-accent-400 text-sm font-semibold uppercase tracking-widest mb-2">
                {'Retouching'}
              </p>
              {'\n          '}
              <h3 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight mb-5 md:mb-6 break-keep">
                {'\n            얼굴/체형의 장점을 살리는'}
                <br />
                {'자연스러운 보정\n          '}
              </h3>
              {'\n          '}
              <ul className="space-y-3 text-sm">
                {'\n            '}
                <li className="flex items-center gap-3 text-zinc-200">
                  {'\n              '}
                  <span className="w-7 h-7 rounded-full bg-accent-500/15 flex items-center justify-center flex-shrink-0">
                    {'\n                '}
                    <SourceIcon name="solar/user-bold" className="text-accent-400 text-sm" />
                    {'\n              '}
                  </span>
                  {'\n              "나이보다 최소 5살 어려보이는 피부 보정"\n            '}
                </li>
                {'\n            '}
                <li className="flex items-center gap-3 text-zinc-200">
                  {'\n              '}
                  <span className="w-7 h-7 rounded-full bg-accent-500/15 flex items-center justify-center flex-shrink-0">
                    {'\n                '}
                    <SourceIcon name="solar/scale-bold" className="text-accent-400 text-sm" />
                    {'\n              '}
                  </span>
                  {'\n              "원래 몸무게보다 최소 -5KG 체형 보정"\n            '}
                </li>
                {'\n            '}
                <li className="flex items-center gap-3 text-zinc-200">
                  {'\n              '}
                  <span className="w-7 h-7 rounded-full bg-accent-500/15 flex items-center justify-center flex-shrink-0">
                    {'\n                '}
                    <SourceIcon
                      name="solar/magic-stick-3-bold"
                      className="text-accent-400 text-sm"
                    />
                    {'\n              '}
                  </span>
                  {'\n              "AI로 불필요한 요소 변경/제거"\n            '}
                </li>
                {'\n          '}
              </ul>
              {'\n        '}
            </div>
            {'\n        '}
            <div className="lg:col-span-8 grid grid-cols-3 gap-4 items-start">
              {'\n          '}
              <div className="relative aspect-square rounded-2xl overflow-hidden glass">
                {'\n            '}
                <SourceImage
                  name="retouch-before-1.jpg"
                  sizes={sourceImageSizes.retouch}
                  alt="보정 전 1"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                {'\n            '}
                <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>
                {'\n          '}
              </div>
              {'\n          '}
              <div className="relative aspect-square rounded-2xl overflow-hidden glass lg:translate-y-8">
                {'\n            '}
                <SourceImage
                  name="retouch-before-2.jpg"
                  sizes={sourceImageSizes.retouch}
                  alt="보정 전 2"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                {'\n            '}
                <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>
                {'\n          '}
              </div>
              {'\n          '}
              <div className="relative aspect-square rounded-2xl overflow-hidden glass">
                {'\n            '}
                <SourceImage
                  name="retouch-before-3.jpg"
                  sizes={sourceImageSizes.retouch}
                  alt="보정 전 3"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                {'\n            '}
                <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>
                {'\n          '}
              </div>
              {'\n          '}
              <div className="relative aspect-square rounded-2xl overflow-hidden glass">
                {'\n            '}
                <SourceImage
                  name="retouch-after-1.jpg"
                  sizes={sourceImageSizes.retouch}
                  alt="보정 후 1"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                {'\n          '}
              </div>
              {'\n          '}
              <div className="relative aspect-square rounded-2xl overflow-hidden glass lg:translate-y-8">
                {'\n            '}
                <SourceImage
                  name="retouch-after-2.jpg"
                  sizes={sourceImageSizes.retouch}
                  alt="보정 후 2"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                {'\n          '}
              </div>
              {'\n          '}
              <div className="relative aspect-square rounded-2xl overflow-hidden glass">
                {'\n            '}
                <SourceImage
                  name="retouch-after-3.jpg"
                  sizes={sourceImageSizes.retouch}
                  alt="보정 후 3"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                {'\n          '}
              </div>
              {'\n        '}
            </div>
            {'\n      '}
          </div>
          {'\n\n      '}
          {'\n      '}
          <div className="reveal grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-14 lg:gap-16 items-center mb-20 md:mb-24 lg:mb-28">
            {'\n        '}
            <div className="lg:col-span-7 order-2 lg:order-1 relative aspect-[4/3]">
              {'\n          '}
              <div className="absolute bottom-0 left-0 w-[62%] aspect-[4/5] rounded-3xl overflow-hidden glass shadow-2xl rotate-[-4deg]">
                {'\n            '}
                <SourceImage
                  name="cross-check-1.jpg"
                  sizes={sourceImageSizes.crossCheck}
                  alt="20대 여성 보정가 교차검증 1"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                {'\n          '}
              </div>
              {'\n          '}
              <div className="absolute top-0 right-0 w-[62%] aspect-[4/5] rounded-3xl overflow-hidden glass shadow-2xl rotate-[4deg]">
                {'\n            '}
                <SourceImage
                  name="cross-check-2.jpg"
                  sizes={sourceImageSizes.crossCheck}
                  alt="20대 여성 보정가 교차검증 2"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                {'\n            '}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent"></div>
                {'\n            '}
                <div className="absolute bottom-4 left-4 right-4">
                  {'\n              '}
                  <div className="glass-strong rounded-2xl px-4 py-3">
                    {'\n                '}
                    <p className="text-white font-semibold text-sm flex items-center gap-2">
                      {'\n                  '}
                      <SourceIcon
                        name="solar/double-alt-arrow-right-bold"
                        className="text-accent-400"
                      />
                      {'\n                  20대 여성 보정가 교차검증\n                '}
                    </p>
                    {'\n                '}
                    <p className="text-[11px] text-zinc-400 mt-1">
                      {'남녀 모두에게 호감인 컷만 드립니다'}
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
            <div className="lg:col-span-5 order-1 lg:order-2">
              {'\n          '}
              <p className="font-display text-6xl sm:text-7xl md:text-8xl font-bold num-outline tracking-tighter mb-2 md:mb-3">
                {'\n            04'}
              </p>
              {'\n          '}
              <p className="text-accent-400 text-sm font-semibold uppercase tracking-widest mb-2">
                {'Cross Check'}
              </p>
              {'\n          '}
              <h3 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight break-keep">
                {'\n            남녀 호불호 없는 사진을 위한,'}
                <br />
                {'20대 여성 보정가와 교차검증\n          '}
              </h3>
              {'\n        '}
            </div>
            {'\n      '}
          </div>
          {'\n\n      '}
          {'\n      '}
          <div className="reveal grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-14 lg:gap-16 items-center">
            {'\n        '}
            <div className="lg:col-span-5">
              {'\n          '}
              <p className="font-display text-6xl sm:text-7xl md:text-8xl font-bold num-outline tracking-tighter mb-2 md:mb-3">
                {'\n            05'}
              </p>
              {'\n          '}
              <p className="text-accent-400 text-sm font-semibold uppercase tracking-widest mb-2">
                {'Props'}
              </p>
              {'\n          '}
              <h3 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight mb-5 md:mb-6 break-keep">
                {'\n            인플루언서 작가팀의 디렉팅,'}
                <br />
                {'감성있는 구도와 스팟\n          '}
              </h3>
              {'\n          '}
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                {'\n            '}
                <span className="flex items-center gap-1.5 glass rounded-full px-3 py-1.5">
                  {'\n              '}
                  <SourceIcon name="solar/camera-bold" className="text-accent-400 text-xs" />
                  {' Sony A7C II\n            '}
                </span>
                {'\n            '}
                <span className="flex items-center gap-1.5 glass rounded-full px-3 py-1.5">
                  {'\n              '}
                  <SourceIcon name="solar/smartphone-bold" className="text-accent-400 text-xs" />
                  {' iPhone 17 Pro\n            '}
                </span>
                {'\n            '}
                <span className="flex items-center gap-1.5 glass rounded-full px-3 py-1.5">
                  {'\n              '}
                  <SourceIcon name="solar/smartphone-bold" className="text-accent-400 text-xs" />
                  {' iPhone 15 Pro\n            '}
                </span>
                {'\n            '}
                <span className="flex items-center gap-1.5 glass rounded-full px-3 py-1.5">
                  {'\n              '}
                  <SourceIcon name="solar/smartphone-bold" className="text-accent-400 text-xs" />
                  {' iPhone 8\n            '}
                </span>
                {'\n          '}
              </div>
              {'\n        '}
            </div>
            {'\n        '}
            <div className="lg:col-span-7 grid grid-cols-4 gap-x-3 gap-y-10 items-start">
              {'\n          '}
              <SourceImage
                name="props-1.jpg"
                sizes={sourceImageSizes.props}
                alt="소품 1"
                className="rounded-2xl aspect-[3/4] object-cover w-full lg:translate-y-10"
                loading="lazy"
                decoding="async"
              />
              {'\n          '}
              <SourceImage
                name="props-2.jpg"
                sizes={sourceImageSizes.props}
                alt="소품 2"
                className="rounded-2xl aspect-[3/4] object-cover w-full"
                loading="lazy"
                decoding="async"
              />
              {'\n          '}
              <SourceImage
                name="props-3.jpg"
                sizes={sourceImageSizes.props}
                alt="소품 3"
                className="rounded-2xl aspect-[3/4] object-cover w-full lg:translate-y-14"
                loading="lazy"
                decoding="async"
              />
              {'\n          '}
              <SourceImage
                name="props-4.jpg"
                sizes={sourceImageSizes.props}
                alt="소품 4"
                className="rounded-2xl aspect-[3/4] object-cover w-full lg:translate-y-4"
                loading="lazy"
                decoding="async"
              />
              {'\n          '}
              <SourceImage
                name="props-5.jpg"
                sizes={sourceImageSizes.props}
                alt="소품 5"
                className="rounded-2xl aspect-[3/4] object-cover w-full lg:translate-y-6"
                loading="lazy"
                decoding="async"
              />
              {'\n          '}
              <SourceImage
                name="props-6.jpg"
                sizes={sourceImageSizes.props}
                alt="소품 6"
                className="rounded-2xl aspect-[3/4] object-cover w-full lg:-translate-y-2"
                loading="lazy"
                decoding="async"
              />
              {'\n          '}
              <SourceImage
                name="props-7.jpg"
                sizes={sourceImageSizes.props}
                alt="소품 7"
                className="rounded-2xl aspect-[3/4] object-cover w-full lg:translate-y-10"
                loading="lazy"
                decoding="async"
              />
              {'\n          '}
              <SourceImage
                name="props-8.jpg"
                sizes={sourceImageSizes.props}
                alt="소품 8"
                className="rounded-2xl aspect-[3/4] object-cover w-full"
                loading="lazy"
                decoding="async"
              />
              {'\n        '}
            </div>
            {'\n      '}
          </div>
          {'\n    '}
        </div>
        {'\n  '}
        <div className="mt-8 flex justify-center px-4">
          <a
            href="https://pf.kakao.com/_kNxoMn"
            target="_blank"
            rel="noopener noreferrer"
            className="cta-primary inline-flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-semibold px-6 py-3 text-base rounded-full"
          >
            <SourceIcon name="solar/bolt-bold" className="text-xl" />
            맨즈픽 무료 상담
            <SourceIcon name="solar/arrow-right-linear" className="arrow text-xl" />
          </a>
        </div>
      </section>
      <section id="team" className="relative py-20 md:py-24 lg:py-32">
        {'\n    '}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {'\n      '}
          <div className="reveal max-w-3xl mb-14 md:mb-16 lg:mb-20">
            {'\n        '}
            <p className="text-accent-400 text-sm font-semibold uppercase tracking-widest mb-4">
              {'Team'}
            </p>
            {'\n        '}
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter leading-tight text-white break-keep">
              {'\n          안녕하세요.'}
              <br />
              {'저희 소개가 늦었습니다.\n        '}
            </h2>
            {'\n        '}
            <p className="text-base md:text-lg text-zinc-400 leading-relaxed mt-5 md:mt-6 break-keep">
              {
                '\n          대한민국 모든 평범남의 외모 잠재력을 발현시키기 위한 여정을 끝까지 함께 할 '
              }
              <span className="text-white font-semibold">{'맨즈픽 MANSPICK'}</span>
              {'입니다.\n        '}
            </p>
            {'\n      '}
          </div>
          {'\n\n      '}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
            {'\n        '}
            {'\n        '}
            <button
              type="button"
              className="team-card reveal relative rounded-2xl md:rounded-3xl overflow-hidden aspect-[3/4] flex flex-col justify-end text-left group"
              data-team="influencer"
            >
              {'\n          '}
              <SourceImage
                name="team-influencer-3.jpg"
                sizes={sourceImageSizes.team}
                alt="인플루언서팀 작업물"
                id="team-influencer-img"
                className="absolute inset-0 w-full h-full object-cover object-center transition-all duration-1000 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
              {'\n          '}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
              {'\n          '}
              <div className="relative p-5 sm:p-6 md:p-7">
                {'\n            '}
                <p className="text-accent-400 text-xs font-semibold uppercase tracking-widest mb-2">
                  {'Fashion'}
                </p>
                {'\n            '}
                <p className="font-display text-2xl font-bold text-white mb-1">{'인플루언서팀'}</p>
                {'\n            '}
                <p className="font-display text-4xl sm:text-5xl font-black text-white tracking-tighter leading-none mb-3">
                  {'46K+'}
                </p>
                {'\n            '}
                <ul className="space-y-1.5 text-[13px] text-zinc-300">
                  {'\n              '}
                  <li className="flex items-center gap-2">
                    <SourceIcon
                      name="solar/check-circle-bold"
                      className="text-accent-400 text-sm shrink-0"
                    />
                    {' 폴로·무신사·디올 등 200+ 브랜드 협업'}
                  </li>
                  {'\n              '}
                  <li className="flex items-center gap-2">
                    <SourceIcon
                      name="solar/check-circle-bold"
                      className="text-accent-400 text-sm shrink-0"
                    />
                    {' 무신사 남성 룩북 11회 스타일링'}
                  </li>
                  {'\n              '}
                  <li className="flex items-center gap-2">
                    <SourceIcon
                      name="solar/check-circle-bold"
                      className="text-accent-400 text-sm shrink-0"
                    />
                    {' 현장 의상 체크 · 코디북 제작'}
                  </li>
                  {'\n            '}
                </ul>
                {'\n            '}
                <div className="mt-4 flex items-center gap-2 text-accent-400 text-xs font-semibold uppercase tracking-widest">
                  {'\n              '}
                  <SourceIcon name="solar/gallery-wide-bold-duotone" />
                  {'\n              '}
                  <span>{'갤러리 보기'}</span>
                  {'\n              '}
                  <SourceIcon
                    name="solar/arrow-right-linear"
                    className="group-hover:translate-x-1 transition-transform"
                  />
                  {'\n            '}
                </div>
                {'\n          '}
              </div>
              {'\n        '}
            </button>
            {'\n\n        '}
            {'\n        '}
            <button
              type="button"
              className="team-card reveal relative rounded-2xl md:rounded-3xl overflow-hidden aspect-[3/4] flex flex-col justify-end text-left group"
              data-team="retouch"
              style={{ transitionDelay: '100ms' } as CSSProperties}
            >
              {'\n          '}
              <SourceImage
                name="cross-check-2.jpg"
                sizes={sourceImageSizes.team}
                alt="보정팀 작업물"
                className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
              {'\n          '}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
              {'\n          '}
              <div className="relative p-5 sm:p-6 md:p-7">
                {'\n            '}
                <p className="text-accent-400 text-xs font-semibold uppercase tracking-widest mb-2">
                  {'Retouching'}
                </p>
                {'\n            '}
                <p className="font-display text-2xl font-bold text-white mb-1">{'보정팀'}</p>
                {'\n            '}
                <p className="font-display text-4xl sm:text-5xl font-black text-white tracking-tighter leading-none mb-3">
                  {'8,400+'}
                  <span className="text-lg font-normal text-zinc-400 ml-1">{'컷'}</span>
                </p>
                {'\n            '}
                <ul className="space-y-1.5 text-[13px] text-zinc-300">
                  {'\n              '}
                  <li className="flex items-center gap-2">
                    <SourceIcon
                      name="solar/check-circle-bold"
                      className="text-accent-400 text-sm shrink-0"
                    />
                    {' 피부·체형·배경 디테일 보정'}
                  </li>
                  {'\n              '}
                  <li className="flex items-center gap-2">
                    <SourceIcon
                      name="solar/check-circle-bold"
                      className="text-accent-400 text-sm shrink-0"
                    />
                    {' 20대 여성 보정가 교차검증'}
                  </li>
                  {'\n              '}
                  <li className="flex items-center gap-2">
                    <SourceIcon
                      name="solar/check-circle-bold"
                      className="text-accent-400 text-sm shrink-0"
                    />
                    {' 인물보정 스튜디오 경력 5년+'}
                  </li>
                  {'\n            '}
                </ul>
                {'\n            '}
                <div className="mt-4 flex items-center gap-2 text-accent-400 text-xs font-semibold uppercase tracking-widest">
                  {'\n              '}
                  <SourceIcon name="solar/gallery-wide-bold-duotone" />
                  {'\n              '}
                  <span>{'갤러리 보기'}</span>
                  {'\n              '}
                  <SourceIcon
                    name="solar/arrow-right-linear"
                    className="group-hover:translate-x-1 transition-transform"
                  />
                  {'\n            '}
                </div>
                {'\n          '}
              </div>
              {'\n        '}
            </button>
            {'\n\n        '}
            {'\n        '}
            <button
              type="button"
              className="team-card reveal relative rounded-2xl md:rounded-3xl overflow-hidden aspect-[3/4] flex flex-col justify-end text-left group"
              data-team="hair"
              style={{ transitionDelay: '200ms' } as CSSProperties}
            >
              {'\n          '}
              <SourceImage
                name="peace.jpg"
                sizes={sourceImageSizes.team}
                alt="헤어팀 작업물"
                className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
              {'\n          '}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
              {'\n          '}
              <div className="relative p-5 sm:p-6 md:p-7">
                {'\n            '}
                <p className="text-accent-400 text-xs font-semibold uppercase tracking-widest mb-2">
                  {'Hair'}
                </p>
                {'\n            '}
                <p className="font-display text-2xl font-bold text-white mb-1">{'헤어팀'}</p>
                {'\n            '}
                <p className="font-display text-4xl sm:text-5xl font-black text-white tracking-tighter leading-none mb-3">
                  {'5년+'}
                  <span className="text-lg font-normal text-zinc-400 ml-1">{'경력'}</span>
                </p>
                {'\n            '}
                <ul className="space-y-1.5 text-[13px] text-zinc-300">
                  {'\n              '}
                  <li className="flex items-center gap-2">
                    <SourceIcon
                      name="solar/check-circle-bold"
                      className="text-accent-400 text-sm shrink-0"
                    />
                    {' 얼굴형별 맞춤 헤어 디렉팅'}
                  </li>
                  {'\n              '}
                  <li className="flex items-center gap-2">
                    <SourceIcon
                      name="solar/check-circle-bold"
                      className="text-accent-400 text-sm shrink-0"
                    />
                    {' 신생 남자 아이돌 헤어 담당'}
                  </li>
                  {'\n              '}
                  <li className="flex items-center gap-2">
                    <SourceIcon
                      name="solar/check-circle-bold"
                      className="text-accent-400 text-sm shrink-0"
                    />
                    {' 한남동 기반 트렌디 디자이너'}
                  </li>
                  {'\n            '}
                </ul>
                {'\n            '}
                <div className="mt-4 flex items-center gap-2 text-accent-400 text-xs font-semibold uppercase tracking-widest">
                  {'\n              '}
                  <SourceIcon name="solar/gallery-wide-bold-duotone" />
                  {'\n              '}
                  <span>{'갤러리 보기'}</span>
                  {'\n              '}
                  <SourceIcon
                    name="solar/arrow-right-linear"
                    className="group-hover:translate-x-1 transition-transform"
                  />
                  {'\n            '}
                </div>
                {'\n          '}
              </div>
              {'\n        '}
            </button>
            {'\n      '}
          </div>
          {'\n\n      '}
          {'\n      '}

          {'\n\n    '}
        </div>
        {'\n  '}
      </section>
    </>
  );
}

export function SourceTeamModal() {
  return (
    <div
      id="team-modal"
      aria-labelledby="team-modal-title"
      className="fixed inset-0 z-[100] hidden items-center justify-center p-4 md:p-8"
      aria-hidden="true"
    >
      {'\n        '}
      <div className="team-modal-backdrop absolute inset-0 bg-black/80 backdrop-blur-md"></div>
      {'\n        '}
      <div className="team-modal-panel relative glass-strong rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {'\n          '}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          {'\n            '}
          <div>
            {'\n              '}
            <p
              id="team-modal-eyebrow"
              className="text-accent-400 text-xs font-semibold uppercase tracking-widest mb-1"
            >
              {'\n                Fashion'}
            </p>
            {'\n              '}
            <p id="team-modal-title" className="font-display text-2xl font-bold text-white">
              {'인플루언서팀'}
            </p>
            {'\n            '}
          </div>
          {'\n            '}
          <button
            type="button"
            id="team-modal-close"
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors"
            aria-label="닫기"
          >
            {'\n              '}
            <SourceIcon name="solar/close-circle-bold" className="text-2xl" />
            {'\n            '}
          </button>
          {'\n          '}
        </div>
        {'\n          '}
        <div className="p-4 md:p-5 overflow-y-auto">
          {'\n            '}
          <div id="team-modal-grid" className="grid grid-cols-3 gap-1 md:gap-1.5"></div>
          {'\n          '}
        </div>
        {'\n        '}
      </div>
      {'\n      '}
    </div>
  );
}

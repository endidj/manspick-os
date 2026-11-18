// manspick-site@54f4a375의 원본 배치·문구를 보존한 React 서버 컴포넌트입니다.
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { SourceImage } from './source-image';
import { sourceImageSizes } from './source-image-sizes';
import { SourceIcon } from './source-icon';

export function SourceNavigation() {
  return (
    <>
      <div
        id="promo-bar"
        className="fixed top-0 left-0 right-0 z-50 bg-accent-500 text-white text-center py-1.5 md:py-2 -translate-y-full transition-transform duration-300 ease-out"
      >
        {'\n    '}
        <div className="flex items-center justify-center gap-1.5 md:gap-2 text-[11px] md:text-xs font-semibold tracking-wide">
          {'\n      '}
          <span className="inline-block w-1 h-1 rounded-full bg-white/60 animate-pulse"></span>
          {'\n      '}
          <span id="promo-month-label">{'5월 한정 최대 44% 할인'}</span>
          {'\n      '}
          <span className="text-white/40">{'·'}</span>
          {'\n      '}
          <span>
            {'잔여 '}
            <span id="promo-seats" className="font-bold">
              {'--'}
            </span>
            {'자리'}
          </span>
          {'\n      '}
          <span className="text-white/40">{'·'}</span>
          {'\n      '}
          <span id="promo-timer" className="tabular-nums font-bold">
            {'--일 --:--:--'}
          </span>
          {'\n    '}
        </div>
        {'\n  '}
      </div>
      <nav
        className="fixed top-3 md:top-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] md:w-[calc(100%-2rem)] max-w-5xl transition-[top] duration-300 ease-out"
        id="main-nav"
      >
        {'\n    '}
        <div className="glass-strong rounded-full px-4 md:px-5 py-2.5 md:py-3 flex items-center justify-between gap-3">
          {'\n      '}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            {'\n        '}
            <div className="w-7 h-7 rounded-full bg-accent-500 flex items-center justify-center">
              {'\n          '}
              <SourceIcon name="solar/camera-bold" className="text-white text-base" />
              {'\n        '}
            </div>
            {'\n        '}
            <span className="font-display font-bold text-base md:text-lg tracking-tighter">
              {'MANSPICK'}
            </span>
            {'\n      '}
          </Link>
          {'\n      '}
          <div className="hidden lg:flex items-center gap-6 xl:gap-7 text-sm text-zinc-300">
            {'\n        '}
            {'\n        '}
            <a href="#before-after" className="hover:text-white transition">
              {'변신 사례'}
            </a>
            {'\n        '}
            <a href="#how" className="hover:text-white transition">
              {'5가지 노하우'}
            </a>
            {'\n        '}
            <a href="#reviews" className="hover:text-white transition">
              {'후기'}
            </a>
            {'\n        '}
            <a href="#team" className="hover:text-white transition">
              {'팀 소개'}
            </a>
            {'\n        '}
            <a href="#process" className="hover:text-white transition">
              {'진행 과정'}
            </a>
            {'\n        '}
            <a href="#pricing" className="hover:text-white transition">
              {'패키지'}
            </a>
            {'\n        '}
            <a href="#faq" className="hover:text-white transition">
              {'FAQ'}
            </a>
            {'\n      '}
          </div>
          {'\n      '}
          <div className="flex items-center gap-2">
            {'\n        '}
            <a
              href="https://pf.kakao.com/_kNxoMn"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-primary inline-flex items-center gap-1.5 bg-accent-500 hover:bg-accent-600 text-white text-xs md:text-sm font-semibold px-3 md:px-4 py-2 rounded-full"
            >
              {'\n          '}
              <SourceIcon name="solar/magic-stick-3-bold" className="text-base" />
              {'\n          '}
              <span className="hidden sm:inline">{'무료 상담'}</span>
              {'\n          '}
              <span className="sm:hidden">{'무료 상담'}</span>
              {'\n        '}
            </a>
            {'\n        '}
            <button
              id="mobile-menu-toggle"
              type="button"
              aria-label="메뉴 열기"
              aria-expanded="false"
              className="lg:hidden w-9 h-9 rounded-full glass flex items-center justify-center text-white hover:bg-white/10 transition"
            >
              {'\n          '}
              <span id="mobile-menu-icon" className="flex items-center justify-center text-xl">
                <SourceIcon name="solar/hamburger-menu-linear" data-menu-icon="open" />
                <SourceIcon
                  name="solar/close-circle-linear"
                  data-menu-icon="close"
                  style={{ display: 'none' }}
                />
              </span>
              {'\n        '}
            </button>
            {'\n      '}
          </div>
          {'\n    '}
        </div>
        {'\n\n    '}
        {'\n    '}
        <div
          id="mobile-menu"
          className="lg:hidden mt-2 hidden glass-strong rounded-2xl p-2 overflow-hidden"
        >
          {'\n      '}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- 추천 화면은 안정적인 문서 탐색을 사용합니다. */}
          <a
            href="/recommend"
            className="mobile-nav-link flex items-center gap-3 px-4 py-3 rounded-xl text-white hover:bg-white/5 transition text-sm font-medium"
          >
            <SourceIcon name="solar/magic-stick-3-bold" className="text-accent-400 text-lg" />
            나한테 딱 맞는 패키지는?
          </a>
          {'\n      '}
          <a
            href="#before-after"
            className="mobile-nav-link flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 transition text-sm font-medium"
          >
            {'\n        '}
            <SourceIcon name="solar/gallery-wide-bold" className="text-accent-400 text-lg" />
            {'\n        변신 사례\n      '}
          </a>
          {'\n      '}
          <a
            href="#how"
            className="mobile-nav-link flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 transition text-sm font-medium"
          >
            {'\n        '}
            <SourceIcon name="solar/bolt-bold" className="text-accent-400 text-lg" />
            {'\n        5가지 노하우\n      '}
          </a>
          {'\n      '}
          <a
            href="#reviews"
            className="mobile-nav-link flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 transition text-sm font-medium"
          >
            {'\n        '}
            <SourceIcon name="solar/chat-square-like-bold" className="text-accent-400 text-lg" />
            {'\n        후기\n      '}
          </a>
          {'\n      '}
          <a
            href="#team"
            className="mobile-nav-link flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 transition text-sm font-medium"
          >
            {'\n        '}
            <SourceIcon name="solar/users-group-rounded-bold" className="text-accent-400 text-lg" />
            {'\n        팀 소개\n      '}
          </a>
          {'\n      '}
          <a
            href="#process"
            className="mobile-nav-link flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 transition text-sm font-medium"
          >
            {'\n        '}
            <SourceIcon name="solar/route-bold" className="text-accent-400 text-lg" />
            {'\n        진행 과정\n      '}
          </a>
          {'\n      '}
          <a
            href="#pricing"
            className="mobile-nav-link flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 transition text-sm font-medium"
          >
            {'\n        '}
            <SourceIcon name="solar/tag-price-bold" className="text-accent-400 text-lg" />
            {'\n        패키지\n      '}
          </a>
          {'\n      '}
          <a
            href="#faq"
            className="mobile-nav-link flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 transition text-sm font-medium"
          >
            {'\n        '}
            <SourceIcon name="ri/kakao-talk-fill" className="text-accent-400 text-lg" />
            {'\n        FAQ\n      '}
          </a>
          {'\n    '}
        </div>
        {'\n  '}
      </nav>
    </>
  );
}

export function SourceOverlays() {
  return (
    <>
      <div
        id="lead-modal"
        aria-label="그루밍 가이드북 신청"
        className="fixed inset-0 z-[100] hidden items-center justify-center p-4 md:p-8"
        aria-hidden="true"
      >
        {'\n    '}
        <div className="lead-modal-backdrop absolute inset-0 bg-black/80 backdrop-blur-md"></div>
        {'\n    '}
        <div className="lead-modal-panel relative glass-strong rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
          {'\n      '}
          {'\n      '}
          <button
            type="button"
            id="lead-modal-close"
            aria-label="닫기"
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            {'\n        '}
            <SourceIcon name="solar/close-circle-linear" className="text-lg" />
            {'\n      '}
          </button>
          {'\n\n      '}
          <div className="p-6 sm:p-8 md:p-10">
            {'\n        '}
            {'\n        '}
            <div className="flex items-start gap-6 mb-8">
              {'\n          '}
              <div className="relative shrink-0" style={{ perspective: '1600px' } as CSSProperties}>
                {'\n            '}
                <div
                  className="relative w-[120px] sm:w-[140px] aspect-[5/7] rounded-r-xl rounded-l-sm overflow-hidden border border-white/10"
                  style={
                    {
                      transform: 'rotateY(-12deg) rotateX(4deg)',
                      boxShadow:
                        'var(--mp-site-color-rgba-0-0-0-0-7) -12px 12px 40px, var(--mp-site-color-rgba-0-0-0-0-4) -3px 0px 12px',
                    } as CSSProperties
                  }
                >
                  {'\n              '}
                  <SourceImage
                    name="grooming-guide.jpg"
                    sizes={sourceImageSizes.guide}
                    alt="MEN'S GROOMING GUIDE"
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  {'\n              '}
                  <div className="absolute inset-0 bg-black/55"></div>
                  {'\n              '}
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-accent-500"></div>
                  {'\n              '}
                  <div className="absolute inset-0 p-3 sm:p-4 flex flex-col justify-end">
                    {'\n                '}
                    <p className="text-accent-400 text-[8px] font-bold uppercase tracking-[0.2em] mb-1">
                      {'MANSPICK EXCLUSIVE'}
                    </p>
                    {'\n                '}
                    <p className="font-display text-base sm:text-lg font-black text-white leading-[0.95]">
                      {"MEN'S"}
                      <br />
                      {'GROOMING'}
                      <br />
                      {'GUIDE'}
                    </p>
                    {'\n              '}
                  </div>
                  {'\n            '}
                </div>
                {'\n            '}
                <div className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-accent-500 text-white flex flex-col items-center justify-center rotate-[14deg] shadow-xl ring-2 ring-zinc-950">
                  {'\n              '}
                  <span className="text-[7px] uppercase tracking-widest opacity-90">
                    {'Limited'}
                  </span>
                  {'\n              '}
                  <span className="font-display text-sm font-black leading-none">{'FREE'}</span>
                  {'\n            '}
                </div>
                {'\n          '}
              </div>
              {'\n          '}
              <div className="min-w-0 pt-1">
                {'\n            '}
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold bg-red-500/10 border border-red-500/20 text-red-400 mb-3">
                  {'\n              '}
                  <SourceIcon name="solar/fire-bold" />
                  {'\n              잔여 '}
                  <span id="lead-remaining" className="text-white mx-0.5">
                    {'23'}
                  </span>
                  {'/100\n            '}
                </div>
                {'\n            '}
                <h3 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight break-keep">
                  {'\n              무료 상담 신청하고'}
                  <br />
                  {'\n              '}
                  <span className="text-accent-400">{'가이드북'}</span>
                  {' 받아가세요.\n            '}
                </h3>
                {'\n          '}
              </div>
              {'\n        '}
            </div>
            {'\n\n        '}
            {'\n        '}
            <div className="flex flex-wrap gap-4 sm:gap-6 pb-5 mb-5 border-b border-white/10">
              {'\n          '}
              <div className="flex items-center gap-3">
                {'\n            '}
                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-accent-400 text-lg shrink-0">
                  {'\n              '}
                  <SourceIcon name="solar/book-bold" />
                  {'\n            '}
                </div>
                {'\n            '}
                <div>
                  {'\n              '}
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                    {'SPECIAL GIFT'}
                  </p>
                  {'\n              '}
                  <p className="text-white font-bold text-sm">{'그루밍 가이드북'}</p>
                  {'\n            '}
                </div>
                {'\n          '}
              </div>
              {'\n          '}
              <div className="flex items-center gap-3">
                {'\n            '}
                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-accent-400 text-lg shrink-0">
                  {'\n              '}
                  <SourceIcon name="solar/user-id-bold" />
                  {'\n            '}
                </div>
                {'\n            '}
                <div>
                  {'\n              '}
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                    {'CONSULTING'}
                  </p>
                  {'\n              '}
                  <p className="text-white font-bold text-sm">{'전문가 1:1 맞춤 진단'}</p>
                  {'\n            '}
                </div>
                {'\n          '}
              </div>
              {'\n        '}
            </div>
            {'\n\n        '}
            {'\n        '}
            <div className="mb-6">
              {'\n          '}
              <div className="flex items-center justify-between text-xs mb-2">
                {'\n            '}
                <span className="flex items-center gap-1.5 text-red-400 font-semibold">
                  {'\n              '}
                  <SourceIcon name="solar/fire-bold" />
                  {'\n              이번 달 잔여 수량\n            '}
                </span>
                {'\n            '}
                <span className="text-white font-bold tabular-nums">
                  {'\n              '}
                  <span id="lead-remaining-bar-text" className="text-red-400">
                    {'23'}
                  </span>
                  <span className="text-zinc-500">{'/100건'}</span>
                  {'\n            '}
                </span>
                {'\n          '}
              </div>
              {'\n          '}
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                {'\n            '}
                <div
                  id="lead-bar"
                  className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all duration-700"
                  style={{ width: '23%' } as CSSProperties}
                ></div>
                {'\n          '}
              </div>
              {'\n          '}
              <p
                id="lead-recent"
                className="mt-2 text-[11px] text-zinc-500 flex items-center gap-1.5 transition-opacity duration-500"
              >
                {'\n            '}
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0"></span>
                {'\n            '}
                <span>{'3분 전 김○○님이 신청했어요'}</span>
                {'\n          '}
              </p>
              {'\n        '}
            </div>
            {'\n\n        '}
            {'\n        '}
            <form className="space-y-5" id="lead-form">
              {'\n          '}
              <div className="grid sm:grid-cols-2 gap-4">
                {'\n            '}
                <label className="block">
                  {'\n              '}
                  <span className="block text-sm font-medium text-zinc-400 mb-2">{'성함'}</span>
                  {'\n              '}
                  <input
                    type="text"
                    id="lead-name"
                    name="entry.779413363"
                    placeholder="홍길동"
                    className="w-full bg-zinc-900/80 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 focus:outline-none focus:border-accent-400 transition"
                  />
                  {'\n            '}
                </label>
                {'\n            '}
                <label className="block">
                  {'\n              '}
                  <span className="block text-sm font-medium text-zinc-400 mb-2">{'연락처'}</span>
                  {'\n              '}
                  <input
                    type="tel"
                    id="lead-phone"
                    name="entry.2136682804"
                    placeholder="010-0000-0000"
                    inputMode="numeric"
                    maxLength={13}
                    className="w-full bg-zinc-900/80 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 focus:outline-none focus:border-accent-400 transition"
                  />
                  {'\n            '}
                </label>
                {'\n          '}
              </div>
              {'\n\n          '}
              <div className="grid sm:grid-cols-3 gap-4">
                {'\n            '}
                <label className="block">
                  {'\n              '}
                  <span className="block text-sm font-medium text-zinc-400 mb-2">
                    {'관심 패키지'}
                  </span>
                  {'\n              '}
                  <select
                    id="lead-package"
                    name="entry.212751070"
                    className="w-full bg-zinc-900/80 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-accent-400 transition appearance-none"
                    defaultValue=""
                  >
                    {'\n                '}
                    <option value="" className="text-zinc-600">
                      {'선택해주세요'}
                    </option>
                    {'\n                '}
                    <option value="ONE">{'ONE'}</option>
                    {'\n                '}
                    <option value="HYBRID">{'HYBRID'}</option>
                    {'\n                '}
                    <option value="ALL DAY">{'ALL DAY'}</option>
                    {'\n                '}
                    <option value="미정">{'아직 미정'}</option>
                    {'\n              '}
                  </select>
                  {'\n            '}
                </label>
                {'\n            '}
                <label className="block">
                  {'\n              '}
                  <span className="block text-sm font-medium text-zinc-400 mb-2">
                    {'촬영 목적'}
                  </span>
                  {'\n              '}
                  <select
                    id="lead-purpose"
                    name="entry.852384418"
                    className="w-full bg-zinc-900/80 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-accent-400 transition appearance-none"
                    defaultValue=""
                  >
                    {'\n                '}
                    <option value="" className="text-zinc-600">
                      {'선택해주세요'}
                    </option>
                    {'\n                '}
                    <option value="소개팅/결혼정보회사">{'소개팅/결혼정보회사'}</option>
                    {'\n                '}
                    <option value="SNS/인스타그램">{'SNS/인스타그램'}</option>
                    {'\n                '}
                    <option value="비즈니스/링크드인">{'비즈니스/링크드인'}</option>
                    {'\n                '}
                    <option value="기타">{'기타'}</option>
                    {'\n              '}
                  </select>
                  {'\n            '}
                </label>
                {'\n            '}
                <label className="block">
                  {'\n              '}
                  <span className="block text-sm font-medium text-zinc-400 mb-2">
                    {'희망 시기'}
                  </span>
                  {'\n              '}
                  <select
                    id="lead-timing"
                    name="entry.1671617897"
                    className="w-full bg-zinc-900/80 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-accent-400 transition appearance-none"
                    defaultValue=""
                  >
                    {'\n                '}
                    <option value="" className="text-zinc-600">
                      {'선택해주세요'}
                    </option>
                    {'\n                '}
                    <option value="이번주">{'이번주'}</option>
                    {'\n                '}
                    <option value="2주 내">{'2주 내'}</option>
                    {'\n                '}
                    <option value="1개월 내">{'1개월 내'}</option>
                    {'\n                '}
                    <option value="미정">{'미정'}</option>
                    {'\n              '}
                  </select>
                  {'\n            '}
                </label>
                {'\n          '}
              </div>
              {'\n\n          '}
              <label className="flex items-start gap-3 cursor-pointer select-none">
                {'\n            '}
                <input
                  type="checkbox"
                  id="privacy-agree"
                  className="mt-1 w-4 h-4 rounded border-white/20 bg-zinc-900 text-accent-500 focus:ring-accent-500 focus:ring-offset-0 accent-[#2D76F6] shrink-0"
                />
                {'\n            '}
                <span className="text-xs text-zinc-400 leading-relaxed">
                  {'\n              '}
                  <a
                    href="/privacy"
                    target="_blank"
                    className="text-accent-400 underline underline-offset-2 hover:text-white transition"
                  >
                    {'개인정보 수집·이용'}
                  </a>
                  {
                    '에 동의하며,\n              상담 및 가이드북 발송 목적으로 정보가 사용되는 것에 동의합니다. '
                  }
                  <span className="text-red-400">{'*'}</span>
                  {'\n            '}
                </span>
                {'\n          '}
              </label>
              {'\n\n          '}
              <button
                type="submit"
                id="lead-submit-btn"
                disabled={true}
                className="cta-primary w-full inline-flex items-center justify-center gap-3 bg-accent-500 hover:bg-accent-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-accent-500 text-white font-bold text-base py-4 rounded-xl transition"
              >
                {'\n            지금 신청하고 가이드북 받기\n            '}
                <SourceIcon name="solar/download-bold" className="text-xl" />
                {'\n          '}
              </button>
              {'\n        '}
            </form>
            {'\n\n        '}
            {'\n        '}
            <div
              id="lead-thankyou"
              className="hidden mt-6 p-6 rounded-2xl bg-accent-500/10 border border-accent-500/30 text-center"
            >
              {'\n          '}
              <SourceIcon
                name="solar/check-circle-bold"
                className="text-accent-400 text-5xl mb-4"
              />
              {'\n          '}
              <h3 className="font-display text-2xl font-bold text-white mb-2">
                {'신청이 완료되었습니다!'}
              </h3>
              {'\n          '}
              <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                {'\n            그루밍 가이드북은 '}
                <span className="text-white font-semibold">{'매주 일요일 20시'}</span>
                {'에 발송됩니다.'}
                <br />
                {'\n            1:1 상담 안내는 순차적으로 연락드릴게요.\n          '}
              </p>
              {'\n          '}
              <div className="flex flex-col gap-2 text-xs font-semibold">
                {'\n            '}
                <div className="inline-flex items-center gap-2 text-accent-400">
                  {'\n              '}
                  <SourceIcon name="solar/calendar-bold" />
                  {'\n              그루밍 가이드북 · 매주 일요일 20시 발송\n            '}
                </div>
                {'\n            '}
                <div className="inline-flex items-center gap-2 text-accent-400">
                  {'\n              '}
                  <SourceIcon name="solar/chat-round-call-bold" />
                  {'\n              1:1 상담 · 순차 안내 예정\n            '}
                </div>
                {'\n          '}
              </div>
              {'\n        '}
            </div>
            {'\n      '}
          </div>
          {'\n    '}
        </div>
        {'\n  '}
      </div>
      <div
        id="live-viewers-badge"
        className="fixed left-3 md:left-6 bottom-[5.5rem] md:bottom-28 z-40 glass-strong rounded-full pl-2.5 md:pl-3 pr-3 md:pr-4 py-1.5 md:py-2 flex items-center gap-1.5 md:gap-2 text-[11px] md:text-xs font-semibold shadow-2xl opacity-0 translate-y-2 transition-all duration-500 pointer-events-none"
      >
        {'\n    '}
        <span className="relative flex w-2 h-2">
          {'\n      '}
          <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping"></span>
          {'\n      '}
          <span className="relative inline-flex w-2 h-2 rounded-full bg-red-500"></span>
          {'\n    '}
        </span>
        {'\n    '}
        <span className="text-zinc-300">
          {'지금 '}
          <span id="live-viewers" className="text-red-400 font-bold">
            {'23'}
          </span>
          {'명이 보는 중'}
        </span>
        {'\n  '}
      </div>
      <div
        id="slot-toast"
        className="fixed top-24 right-4 md:right-6 z-[60] glass-strong rounded-full px-4 py-2.5 text-xs text-white font-semibold opacity-0 translate-y-2 pointer-events-none transition-all duration-500 flex items-center gap-2 shadow-2xl"
      >
        {'\n    '}
        <SourceIcon name="solar/fire-bold" className="text-red-400" />
        {'\n    '}
        <span id="slot-toast-text">{'방금 1석 마감'}</span>
        {'\n  '}
      </div>
      <div
        id="floating-social"
        className="fixed right-3 md:right-6 bottom-20 md:bottom-24 z-40 flex flex-col items-center gap-2.5 opacity-0 translate-y-2 pointer-events-none transition-all duration-500"
      >
        {'\n    '}
        <a
          href="https://pf.kakao.com/_kNxoMn"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="KakaoTalk"
          className="w-10 h-10 rounded-full glass-strong flex items-center justify-center text-zinc-400 hover:text-white hover:border-white/20 transition-all duration-200 shadow-lg"
        >
          {'\n      '}
          <SourceIcon name="ri/kakao-talk-fill" className="text-lg" />
          {'\n    '}
        </a>
        {'\n    '}
        <a
          href="https://www.instagram.com/we.are.manspick/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className="w-10 h-10 rounded-full glass-strong flex items-center justify-center text-zinc-400 hover:text-white hover:border-white/20 transition-all duration-200 shadow-lg"
        >
          {'\n      '}
          <SourceIcon name="mdi/instagram" className="text-lg" />
          {'\n    '}
        </a>
        {'\n    '}
        <a
          href="https://naver.me/GipSFyDX"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Naver Map"
          className="w-10 h-10 rounded-full glass-strong flex items-center justify-center text-zinc-400 hover:text-white hover:border-white/20 transition-all duration-200 shadow-lg"
        >
          {'\n      '}
          <SourceIcon name="solar/map-point-bold" className="text-lg" />
          {'\n    '}
        </a>
        {'\n    '}
        <span className="w-6 h-px bg-white/10"></span>
        {'\n    '}
        <button
          id="back-to-top"
          aria-label="맨 위로"
          className="w-10 h-10 rounded-full glass-strong flex items-center justify-center text-zinc-400 hover:text-white hover:border-white/20 transition-all duration-200 shadow-lg"
          type="button"
        >
          {'\n      '}
          <SourceIcon name="solar/arrow-up-linear" className="text-lg" />
          {'\n    '}
        </button>
        {'\n  '}
      </div>
      <div
        id="sticky-cta"
        className="fixed left-1/2 -translate-x-1/2 bottom-4 md:bottom-6 z-40 w-[calc(100%-1.5rem)] max-w-3xl opacity-0 translate-y-4 pointer-events-none transition-all duration-500"
      >
        {'\n    '}
        <div className="relative glass-strong rounded-full pl-4 md:pl-6 pr-1.5 py-1.5 md:py-2 flex items-center justify-between gap-3 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)] border border-white/10 overflow-hidden">
          {'\n      '}
          {'\n      '}
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.06)_50%,transparent_70%)] bg-[length:200%_100%] animate-[sheen_3.5s_linear_infinite] pointer-events-none"
          ></span>
          {'\n\n      '}
          <div className="relative flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            {'\n        '}
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] md:text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-full px-2 md:px-2.5 py-1 shrink-0 uppercase tracking-wider">
              {'\n          '}
              <SourceIcon name="solar/fire-bold" className="text-xs" />
              {'\n          이달 마감 임박\n        '}
            </span>
            {'\n        '}
            <span className="relative flex shrink-0 sm:hidden">
              {'\n          '}
              <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-70"></span>
              {'\n          '}
              <span className="relative w-2 h-2 rounded-full bg-red-500"></span>
              {'\n        '}
            </span>
            {'\n        '}
            <p
              id="sticky-cta-text"
              className="text-[12px] md:text-sm text-white font-medium truncate transition-opacity duration-300"
            >
              {'\n          당신의 프로필은 '}
              <span className="text-accent-400 font-semibold">{'호감'}</span>
              {'인가요 '}
              <span className="text-red-400 font-semibold">{'비호감'}</span>
              {'인가요?\n        '}
            </p>
            {'\n      '}
          </div>
          {'\n\n      '}
          <a
            href="https://pf.kakao.com/_kNxoMn"
            target="_blank"
            rel="noopener noreferrer"
            className="sticky-cta-btn group relative inline-flex items-center gap-1.5 bg-gradient-to-r from-accent-500 to-accent-400 text-white text-xs md:text-sm font-semibold px-5 md:px-6 py-2.5 md:py-3 rounded-full whitespace-nowrap shrink-0 shadow-[0_8px_24px_-6px_rgba(45,118,246,0.7)] overflow-hidden transition-all duration-200 will-change-transform"
          >
            {'\n        '}
            <span className="relative z-10">{'맨즈픽 무료 상담'}</span>
            {'\n        '}
            <SourceIcon
              name="solar/arrow-right-linear"
              className="relative z-10 text-base transition-transform duration-200 group-hover:translate-x-0.5"
            />
            {'\n        '}
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-r from-accent-600 to-accent-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            ></span>
            {'\n      '}
          </a>
          {'\n    '}
        </div>
        {'\n  '}
      </div>
      <div
        id="cursor-glow"
        className="pointer-events-none fixed inset-0 z-[1] opacity-0 transition-opacity duration-300"
        aria-hidden="true"
      ></div>
    </>
  );
}

export function SourceFooter() {
  return (
    <>
      <footer className="border-t border-white/5 pt-12 pb-28 md:py-14 bg-zinc-950">
        {'\n    '}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {'\n      '}
          {'\n      '}
          <div className="hidden md:grid md:grid-cols-4 gap-10">
            {'\n        '}
            <div className="col-span-2">
              {'\n          '}
              <div className="flex items-center gap-2 mb-4">
                {'\n            '}
                <div className="w-7 h-7 rounded-full bg-accent-500 flex items-center justify-center">
                  {'\n              '}
                  <SourceIcon name="solar/camera-bold" className="text-white text-base" />
                  {'\n            '}
                </div>
                {'\n            '}
                <span className="font-display font-bold text-lg tracking-tighter text-white">
                  {'MANSPICK'}
                </span>
                {'\n          '}
              </div>
              {'\n          '}
              <p className="font-display text-base font-bold text-white tracking-tight break-keep">
                {'매력 수치 ZERO, 무색무취 프로필 사진에서'}
              </p>
              {'\n          '}
              <p className="font-display text-base font-bold text-white tracking-tight mb-2 break-keep">
                {'호감형 프로필로 바꾸고 연애까지.'}
              </p>
              {'\n          '}
              <p className="text-sm text-zinc-500 leading-relaxed max-w-sm break-keep">
                {'\n            7명의 전문가가 패션·헤어·보정까지 알아서 다 해드립니다.'}
                <br />
                {'113만 유튜버부터 대기업 임원, 변호사, 의사까지 —\n          '}
              </p>
              {'\n          '}
              <div className="flex items-center gap-3 mt-4">
                {'\n            '}
                <a
                  href="https://pf.kakao.com/_kNxoMn"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="KakaoTalk"
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white hover:border-white/20 transition-all"
                >
                  {'\n              '}
                  <SourceIcon name="ri/kakao-talk-fill" className="text-base" />
                  {'\n            '}
                </a>
                {'\n            '}
                <a
                  href="https://www.instagram.com/we.are.manspick/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white hover:border-white/20 transition-all"
                >
                  {'\n              '}
                  <SourceIcon name="mdi/instagram" className="text-base" />
                  {'\n            '}
                </a>
                {'\n            '}
                <a
                  href="https://naver.me/GipSFyDX"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Naver Map"
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white hover:border-white/20 transition-all"
                >
                  {'\n              '}
                  <SourceIcon name="solar/map-point-bold" className="text-base" />
                  {'\n            '}
                </a>
                {'\n          '}
              </div>
              {'\n        '}
            </div>
            {'\n        '}
            <div>
              {'\n          '}
              <p className="text-xs uppercase tracking-widest text-zinc-600 mb-4">{'서비스'}</p>
              {'\n          '}
              <ul className="space-y-2 text-sm text-zinc-400">
                {'\n            '}
                <li>
                  <a href="#before-after" className="hover:text-white transition">
                    {'변신 사례'}
                  </a>
                </li>
                {'\n            '}
                <li>
                  <a href="#how" className="hover:text-white transition">
                    {'5가지 노하우'}
                  </a>
                </li>
                {'\n            '}
                <li>
                  <a href="#reviews" className="hover:text-white transition">
                    {'후기'}
                  </a>
                </li>
                {'\n            '}
                <li>
                  <a href="#team" className="hover:text-white transition">
                    {'팀 소개'}
                  </a>
                </li>
                {'\n            '}
                <li>
                  <a href="#process" className="hover:text-white transition">
                    {'진행 과정'}
                  </a>
                </li>
                {'\n            '}
                <li>
                  <a href="#pricing" className="hover:text-white transition">
                    {'패키지'}
                  </a>
                </li>
                {'\n            '}
                <li>
                  <a href="#faq" className="hover:text-white transition">
                    {'FAQ'}
                  </a>
                </li>
                {'\n            '}
                <li>
                  <a href="#" data-open-lead-modal="" className="hover:text-white transition">
                    {'무료 가이드북'}
                  </a>
                </li>
                {'\n          '}
              </ul>
              {'\n        '}
            </div>
            {'\n        '}
            <div>
              {'\n          '}
              <p className="text-xs uppercase tracking-widest text-zinc-600 mb-4">{'연락'}</p>
              {'\n          '}
              <ul className="space-y-2 text-sm text-zinc-400">
                {'\n            '}
                <li>{'서울특별시 강서구 양천로 94, G85호'}</li>
                {'\n            '}
                <li>{'매일 11:00 — 21:00'}</li>
                {'\n            '}
                <li>
                  <a href="mailto:wook971215@gmail.com" className="hover:text-white transition">
                    {'wook971215@gmail.com'}
                  </a>
                </li>
                {'\n          '}
              </ul>
              {'\n        '}
            </div>
            {'\n      '}
          </div>
          {'\n\n      '}
          {'\n      '}
          <div className="md:hidden space-y-6">
            {'\n        '}
            <div>
              {'\n          '}
              <div className="flex items-center gap-2 mb-3">
                {'\n            '}
                <div className="w-6 h-6 rounded-full bg-accent-500 flex items-center justify-center">
                  {'\n              '}
                  <SourceIcon name="solar/camera-bold" className="text-white text-xs" />
                  {'\n            '}
                </div>
                {'\n            '}
                <span className="font-display font-bold text-sm tracking-tighter text-white">
                  {'MANSPICK'}
                </span>
                {'\n          '}
              </div>
              {'\n          '}
              <p className="text-[13px] font-semibold text-zinc-300 tracking-tight break-keep leading-relaxed">
                {'매력 수치 ZERO, 무색무취 프로필 사진에서'}
                <br />
                {'호감형 프로필로 바꾸고 연애까지.'}
              </p>
              {'\n          '}
              <div className="flex items-center gap-2.5 mt-3">
                {'\n            '}
                <a
                  href="https://pf.kakao.com/_kNxoMn"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="KakaoTalk"
                  className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white transition-all"
                >
                  {'\n              '}
                  <SourceIcon name="ri/kakao-talk-fill" className="text-sm" />
                  {'\n            '}
                </a>
                {'\n            '}
                <a
                  href="https://www.instagram.com/we.are.manspick/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white transition-all"
                >
                  {'\n              '}
                  <SourceIcon name="mdi/instagram" className="text-sm" />
                  {'\n            '}
                </a>
                {'\n            '}
                <a
                  href="https://naver.me/GipSFyDX"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Naver Map"
                  className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white transition-all"
                >
                  {'\n              '}
                  <SourceIcon name="solar/map-point-bold" className="text-sm" />
                  {'\n            '}
                </a>
                {'\n          '}
              </div>
              {'\n        '}
            </div>
            {'\n        '}
            <div className="flex gap-8">
              {'\n          '}
              <div className="flex-1 min-w-0">
                {'\n            '}
                <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2.5">
                  {'서비스'}
                </p>
                {'\n            '}
                <ul className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-zinc-500">
                  {'\n              '}
                  <li>
                    <a href="#before-after" className="hover:text-white transition">
                      {'변신 사례'}
                    </a>
                  </li>
                  {'\n              '}
                  <li>
                    <a href="#team" className="hover:text-white transition">
                      {'팀 소개'}
                    </a>
                  </li>
                  {'\n              '}
                  <li>
                    <a href="#how" className="hover:text-white transition">
                      {'5가지 노하우'}
                    </a>
                  </li>
                  {'\n              '}
                  <li>
                    <a href="#process" className="hover:text-white transition">
                      {'진행 과정'}
                    </a>
                  </li>
                  {'\n              '}
                  <li>
                    <a href="#reviews" className="hover:text-white transition">
                      {'후기'}
                    </a>
                  </li>
                  {'\n              '}
                  <li>
                    <a href="#pricing" className="hover:text-white transition">
                      {'패키지'}
                    </a>
                  </li>
                  {'\n              '}
                  <li>
                    <a href="#faq" className="hover:text-white transition">
                      {'FAQ'}
                    </a>
                  </li>
                  {'\n              '}
                  <li>
                    <a href="#" data-open-lead-modal="" className="hover:text-white transition">
                      {'무료 가이드북'}
                    </a>
                  </li>
                  {'\n            '}
                </ul>
                {'\n          '}
              </div>
              {'\n          '}
              <div className="flex-shrink-0">
                {'\n            '}
                <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2.5">
                  {'연락'}
                </p>
                {'\n            '}
                <ul className="space-y-1 text-[11px] text-zinc-500">
                  {'\n              '}
                  <li>{'강서구 양천로 94, G85호'}</li>
                  {'\n              '}
                  <li>{'매일 11:00 — 21:00'}</li>
                  {'\n              '}
                  <li>
                    <a href="mailto:wook971215@gmail.com" className="hover:text-white transition">
                      {'wook971215@gmail.com'}
                    </a>
                  </li>
                  {'\n            '}
                </ul>
                {'\n          '}
              </div>
              {'\n        '}
            </div>
            {'\n      '}
          </div>
          {'\n      '}
          <div className="mt-12 pt-6 border-t border-white/5 text-[11px] text-zinc-600 leading-relaxed space-y-1">
            {'\n        '}
            <p className="flex flex-wrap gap-x-1">
              {'\n          '}
              <span>
                <span className="text-zinc-500">{'상호'}</span>
                {' 맨즈픽(MANSPICK)'}
              </span>
              {'\n          '}
              <span className="hidden sm:inline text-zinc-700">{'|'}</span>
              {'\n          '}
              <span>
                <span className="text-zinc-500">{'대표'}</span>
                {' 정현욱'}
              </span>
              {'\n          '}
              <span className="hidden sm:inline text-zinc-700">{'|'}</span>
              {'\n          '}
              <span>
                <span className="text-zinc-500">{'사업자등록번호'}</span>
                {' 804-18-02180'}
              </span>
              {'\n        '}
            </p>
            {'\n        '}
            <p className="flex flex-wrap gap-x-1">
              {'\n          '}
              <span>
                <span className="text-zinc-500">{'업태'}</span>
                {' 전문, 과학 및 기술서비스업'}
              </span>
              {'\n          '}
              <span className="hidden sm:inline text-zinc-700">{'|'}</span>
              {'\n          '}
              <span>
                <span className="text-zinc-500">{'종목'}</span>
                {' 인물 사진 및 행사용 영상 촬영업'}
              </span>
              {'\n        '}
            </p>
            {'\n        '}
            <p>
              {'\n          '}
              <span className="text-zinc-500">{'소재지'}</span>
              {' 서울특별시 강서구 양천로 94, G85호(염창동)\n        '}
            </p>
            {'\n      '}
          </div>
          {'\n      '}
          <div className="mt-6 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-zinc-600">
            {'\n        '}
            <p>{'© 2026 MANSPICK. All rights reserved.'}</p>
            {'\n        '}
            <div className="flex items-center gap-5">
              {'\n          '}
              <a href="/terms" className="hover:text-white transition">
                {'이용약관'}
              </a>
              {'\n          '}
              <a href="/privacy" className="hover:text-white transition">
                {'개인정보처리방침'}
              </a>
              {'\n        '}
            </div>
            {'\n      '}
          </div>
          {'\n      '}
          <p className="mt-4 text-[10px] text-zinc-700 leading-relaxed text-center break-keep">
            {
              '\n        본 웹사이트의 모든 콘텐츠(텍스트, 이미지, 디자인, 코드, 구조 등)는 맨즈픽(MANSPICK)의 자산으로 저작권법에 의해 보호됩니다.\n        AI 크롤링·스크래핑 등을 포함한 무단 복제·모방·재배포 시 사전 경고 없이 민·형사상 법적 조치를 취합니다.\n      '
            }
          </p>
          {'\n    '}
        </div>
        {'\n  '}
      </footer>
    </>
  );
}

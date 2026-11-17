// manspick-site@54f4a375의 원본 배치·문구를 보존한 React 서버 컴포넌트입니다.
import type { CSSProperties } from 'react';
import { SourceIcon } from './source-icon';

export function SourceOffer() {
  return (
    <>
      <section id="process" className="relative py-20 md:py-24 lg:py-32 border-t border-white/5">
        {'\n    '}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {'\n      '}
          <div className="reveal text-center max-w-2xl mx-auto mb-14 md:mb-16 lg:mb-20">
            {'\n        '}
            <p className="text-accent-400 text-sm font-semibold uppercase tracking-widest mb-4">
              {'Process'}
            </p>
            {'\n        '}
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter leading-tight text-white break-keep">
              {'\n          신청부터 전달까지,'}
              <br />
              <span className="text-accent-400">{'딱 5단계.'}</span>
              {'\n        '}
            </h2>
            {'\n        '}
            <p className="text-base md:text-lg text-zinc-400 leading-relaxed mt-5 md:mt-6 break-keep">
              {'\n          복잡한 건 저희가 다 합니다. 당신은 촬영만 오시면 됩니다.\n        '}
            </p>
            {'\n      '}
          </div>
          {'\n\n      '}
          <div className="relative">
            {'\n        '}
            {'\n        '}
            <div className="absolute left-5 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-accent-500/40 via-accent-500/20 to-transparent"></div>
            {'\n\n        '}
            {'\n        '}
            <div className="reveal relative flex items-start md:items-center gap-5 md:gap-12 mb-12 md:mb-16 pl-14 md:pl-0 md:flex-row">
              {'\n          '}
              <div className="md:w-1/2 md:text-right md:pr-12">
                {'\n            '}
                <p className="text-accent-400 text-xs font-bold uppercase tracking-widest mb-1">
                  {'Step 01'}
                </p>
                {'\n            '}
                <h3 className="text-xl font-bold text-white">{'무료 상담 신청'}</h3>
                {'\n            '}
                <p className="text-sm text-zinc-400 mt-2 break-keep">
                  {'폼 작성 후 카톡으로 연락드립니다.'}
                  <br />
                  {'고민·목적·일정을 편하게 말씀해 주세요.'}
                </p>
                {'\n          '}
              </div>
              {'\n          '}
              <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 w-10 h-10 rounded-full bg-accent-500/15 border-2 border-accent-500 flex items-center justify-center text-accent-400 text-sm font-bold z-10">
                {'\n            '}
                <SourceIcon name="solar/chat-round-call-bold" />
                {'\n          '}
              </div>
              {'\n          '}
              <div className="hidden md:block md:w-1/2 md:pl-12"></div>
              {'\n        '}
            </div>
            {'\n\n        '}
            {'\n        '}
            <div
              className="reveal relative flex items-start md:items-center gap-5 md:gap-12 mb-12 md:mb-16 pl-14 md:pl-0 md:flex-row"
              style={{ transitionDelay: '80ms' } as CSSProperties}
            >
              {'\n          '}
              <div className="hidden md:block md:w-1/2 md:pr-12"></div>
              {'\n          '}
              <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 w-10 h-10 rounded-full bg-accent-500/15 border-2 border-accent-500 flex items-center justify-center text-accent-400 text-sm font-bold z-10">
                {'\n            '}
                <SourceIcon name="solar/hanger-2-bold" />
                {'\n          '}
              </div>
              {'\n          '}
              <div className="md:w-1/2 md:pl-12">
                {'\n            '}
                <p className="text-accent-400 text-xs font-bold uppercase tracking-widest mb-1">
                  {'Step 02'}
                </p>
                {'\n            '}
                <h3 className="text-xl font-bold text-white">{'사전 컨설팅'}</h3>
                {'\n            '}
                <p className="text-sm text-zinc-400 mt-2 break-keep">
                  {'의상 피드백, 코디북 제공, 촬영 장소·컨셉 확정.'}
                  <br />
                  {'준비가 어려우면 저희가 다 안내해 드립니다.'}
                </p>
                {'\n          '}
              </div>
              {'\n        '}
            </div>
            {'\n\n        '}
            {'\n        '}
            <div
              className="reveal relative flex items-start md:items-center gap-5 md:gap-12 mb-12 md:mb-16 pl-14 md:pl-0 md:flex-row"
              style={{ transitionDelay: '160ms' } as CSSProperties}
            >
              {'\n          '}
              <div className="md:w-1/2 md:text-right md:pr-12">
                {'\n            '}
                <p className="text-accent-400 text-xs font-bold uppercase tracking-widest mb-1">
                  {'Step 03'}
                </p>
                {'\n            '}
                <h3 className="text-xl font-bold text-white">{'촬영 당일'}</h3>
                {'\n            '}
                <p className="text-sm text-zinc-400 mt-2 break-keep">
                  {'포즈·표정·시선 실시간 디렉팅.'}
                  <br />
                  {'처음이어도 자연스러운 결과물이 나옵니다.'}
                </p>
                {'\n          '}
              </div>
              {'\n          '}
              <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 w-10 h-10 rounded-full bg-accent-500/15 border-2 border-accent-500 flex items-center justify-center text-accent-400 text-sm font-bold z-10">
                {'\n            '}
                <SourceIcon name="solar/camera-bold" />
                {'\n          '}
              </div>
              {'\n          '}
              <div className="hidden md:block md:w-1/2 md:pl-12"></div>
              {'\n        '}
            </div>
            {'\n\n        '}
            {'\n        '}
            <div
              className="reveal relative flex items-start md:items-center gap-5 md:gap-12 mb-12 md:mb-16 pl-14 md:pl-0 md:flex-row"
              style={{ transitionDelay: '240ms' } as CSSProperties}
            >
              {'\n          '}
              <div className="hidden md:block md:w-1/2 md:pr-12"></div>
              {'\n          '}
              <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 w-10 h-10 rounded-full bg-accent-500/15 border-2 border-accent-500 flex items-center justify-center text-accent-400 text-sm font-bold z-10">
                {'\n            '}
                <SourceIcon name="solar/magic-stick-3-bold" />
                {'\n          '}
              </div>
              {'\n          '}
              <div className="md:w-1/2 md:pl-12">
                {'\n            '}
                <p className="text-accent-400 text-xs font-bold uppercase tracking-widest mb-1">
                  {'Step 04'}
                </p>
                {'\n            '}
                <h3 className="text-xl font-bold text-white">{'프리미엄 보정'}</h3>
                {'\n            '}
                <p className="text-sm text-zinc-400 mt-2 break-keep">
                  {'촬영 당일 보정 완료, 원본 전량 제공.'}
                  <br />
                  {'수정 요청은 무제한 가능합니다.'}
                </p>
                {'\n          '}
              </div>
              {'\n        '}
            </div>
            {'\n\n        '}
            {'\n        '}
            <div
              className="reveal relative flex items-start md:items-center gap-5 md:gap-12 pl-14 md:pl-0 md:flex-row"
              style={{ transitionDelay: '320ms' } as CSSProperties}
            >
              {'\n          '}
              <div className="md:w-1/2 md:text-right md:pr-12">
                {'\n            '}
                <p className="text-accent-400 text-xs font-bold uppercase tracking-widest mb-1">
                  {'Step 05'}
                </p>
                {'\n            '}
                <h3 className="text-xl font-bold text-white">{'최종 전달'}</h3>
                {'\n            '}
                <p className="text-sm text-zinc-400 mt-2 break-keep">
                  {'보정본 + 원본 전달.'}
                  <br />
                  {'만족하지 못하면 무료 재촬영까지 보장합니다.'}
                </p>
                {'\n          '}
              </div>
              {'\n          '}
              <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 w-10 h-10 rounded-full bg-accent-500/15 border-2 border-accent-500 flex items-center justify-center text-accent-400 text-sm font-bold z-10">
                {'\n            '}
                <SourceIcon name="solar/check-circle-bold" />
                {'\n          '}
              </div>
              {'\n          '}
              <div className="hidden md:block md:w-1/2 md:pl-12"></div>
              {'\n        '}
            </div>
            {'\n      '}
          </div>
          {'\n    '}
        </div>
        {'\n  '}
      </section>
      <section id="pricing" className="relative py-20 md:py-24 lg:py-32">
        {'\n    '}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {'\n      '}
          <div className="reveal text-center max-w-2xl mx-auto mb-14 md:mb-16 lg:mb-20">
            {'\n        '}
            <p className="text-accent-400 text-sm font-semibold uppercase tracking-widest mb-4">
              {'Packages'}
            </p>
            {'\n        '}
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter leading-tight text-white break-keep">
              {'\n          가장 합리적인 서비스 구성\n        '}
            </h2>
            {'\n        '}
            <p className="text-base md:text-lg text-zinc-400 leading-relaxed mt-5 md:mt-6 break-keep">
              {'\n          모든 패키지에 의상 가이드, 12종 코디북, 사진 보정, 무제한 수정,'}
              <br className="hidden md:inline" />
              {' 불만족 시 무료 재촬영이 포함됩니다.\n        '}
            </p>
            {'\n      '}
          </div>
          {'\n\n      '}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-5">
            {'\n        '}
            {'\n        '}
            <div className="reveal glass rounded-2xl md:rounded-3xl p-6 sm:p-7 md:p-8 flex flex-col">
              {'\n          '}
              <p className="text-zinc-500 text-xs uppercase tracking-widest">
                {'주말 가능 · 1시간 30분'}
              </p>
              {'\n          '}
              <div className="flex items-center gap-2 mt-1">
                {'\n            '}
                <h3 className="font-display text-2xl font-bold text-white">{'ONE 패키지'}</h3>
                {'\n            '}
                <span className="text-[11px] text-zinc-400 font-semibold bg-white/5 border border-white/10 rounded-full px-2.5 py-0.5">
                  {'1벌 · 스팟7'}
                </span>
                {'\n          '}
              </div>
              {'\n          '}
              <div className="flex items-center gap-2 mt-6">
                {'\n            '}
                <p className="text-zinc-500 text-base line-through">{'120,000원'}</p>
                {'\n            '}
                <span className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-full px-2 py-0.5">
                  {'-29%'}
                </span>
                {'\n          '}
              </div>
              {'\n          '}
              <p className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tighter mt-1">
                {'85,000'}
                <span className="text-lg text-zinc-500 font-normal">{'원'}</span>
              </p>
              {'\n          '}
              <div className="slot-info mt-5" data-package="one">
                {'\n            '}
                <div className="flex items-center justify-between text-[11px] mb-2">
                  {'\n              '}
                  <span className="text-zinc-500 uppercase tracking-widest">{'이번 달 잔여'}</span>
                  {'\n              '}
                  <span className="text-white font-semibold">
                    <span className="slot-remaining text-accent-400">{'6'}</span>
                    <span className="text-zinc-600">
                      {'/'}
                      <span className="slot-total">{'14'}</span>
                      {'석'}
                    </span>
                  </span>
                  {'\n            '}
                </div>
                {'\n            '}
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  {'\n              '}
                  <div
                    className="slot-bar h-full bg-accent-500 rounded-full transition-all duration-700"
                    style={{ width: '42%' } as CSSProperties}
                  >
                    {'\n              '}
                  </div>
                  {'\n            '}
                </div>
                {'\n            '}
                <p className="slot-urgent hidden mt-2 text-[11px] text-red-400 font-semibold items-center gap-1">
                  {'\n              '}
                  <SourceIcon name="solar/fire-bold" />
                  {' 마감 임박\n            '}
                </p>
                {'\n          '}
              </div>
              {'\n          '}
              <ul className="mt-7 space-y-2.5 text-sm text-zinc-300 flex-1">
                {'\n            '}
                <li className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
                  {'촬영 전'}
                </li>
                {'\n            '}
                <li className="flex items-start gap-2">
                  <SourceIcon
                    name="solar/check-circle-bold"
                    className="text-accent-400 mt-0.5 flex-shrink-0"
                  />
                  {' 1:1 사전 컨설팅 (카톡)'}
                </li>
                {'\n            '}
                <li className="flex items-start gap-2">
                  <SourceIcon
                    name="solar/check-circle-bold"
                    className="text-accent-400 mt-0.5 flex-shrink-0"
                  />
                  {' 의상 가이드 + 12종 코디북'}
                </li>
                {'\n            '}
                <li className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold pt-2">
                  {'촬영 당일'}
                </li>
                {'\n            '}
                <li className="flex items-start gap-2">
                  <SourceIcon
                    name="solar/check-circle-bold"
                    className="text-accent-400 mt-0.5 flex-shrink-0"
                  />
                  {' 1시간 30분 촬영 · 1벌 · 스팟7'}
                </li>
                {'\n            '}
                <li className="flex items-start gap-2">
                  <SourceIcon
                    name="solar/check-circle-bold"
                    className="text-accent-400 mt-0.5 flex-shrink-0"
                  />
                  {' 실시간 포즈·표정 디렉팅'}
                </li>
                {'\n            '}
                <li className="flex items-start gap-2">
                  <SourceIcon
                    name="solar/check-circle-bold"
                    className="text-accent-400 mt-0.5 flex-shrink-0"
                  />
                  {' 원본 300장+ 전량 제공'}
                </li>
                {'\n            '}
                <li className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold pt-2">
                  {'촬영 후'}
                </li>
                {'\n            '}
                <li className="flex items-start gap-2">
                  <SourceIcon
                    name="solar/check-circle-bold"
                    className="text-accent-400 mt-0.5 flex-shrink-0"
                  />
                  {' 프리미엄 보정 5장+@ (당일 완료)'}
                </li>
                {'\n            '}
                <li className="flex items-start gap-2">
                  <SourceIcon
                    name="solar/check-circle-bold"
                    className="text-accent-400 mt-0.5 flex-shrink-0"
                  />
                  {' 보정 무제한 수정'}
                </li>
                {'\n            '}
                <li className="flex items-start gap-2">
                  <SourceIcon
                    name="solar/check-circle-bold"
                    className="text-accent-400 mt-0.5 flex-shrink-0"
                  />
                  {' 불만족 시 무료 재촬영 보장'}
                </li>
                {'\n          '}
              </ul>
              {'\n          '}
              <p className="text-xs text-zinc-500 mt-4">{'이동: 도보'}</p>
              {'\n          '}
              <a
                href="/recommend?pkg=one"
                className="cta-primary mt-6 inline-flex items-center justify-center gap-2 glass hover:bg-white/10 text-white font-semibold py-3 rounded-full"
              >
                {'\n            선택하기\n          '}
              </a>
              {'\n        '}
            </div>
            {'\n\n        '}
            {'\n        '}
            <div
              className="hybrid-featured reveal relative rounded-3xl p-6 sm:p-8 flex flex-col bg-gradient-to-b from-accent-500/20 to-zinc-900/40 border-2 border-accent-400 lg:scale-[1.03] lg:-my-2"
              style={{ transitionDelay: '100ms' } as CSSProperties}
            >
              {'\n          '}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-gradient-to-r from-accent-500 to-accent-400 text-white text-[11px] font-black uppercase tracking-wider px-4 py-1.5 rounded-full shadow-[0_8px_24px_-6px_rgba(45,118,246,0.8)] whitespace-nowrap">
                {'\n            '}
                <SourceIcon name="solar/crown-bold" className="text-sm" />
                {'\n            BEST · 78%가 선택\n          '}
              </div>
              {'\n          '}
              <p className="text-accent-400 text-xs uppercase tracking-widest">
                {'주말 가능 · 2시간'}
              </p>
              {'\n          '}
              <div className="flex items-center gap-2 mt-1">
                {'\n            '}
                <h3 className="font-display text-2xl font-bold text-white">{'HYBRID 패키지'}</h3>
                {'\n            '}
                <span className="text-[11px] text-accent-400 font-semibold bg-accent-500/10 border border-accent-500/20 rounded-full px-2.5 py-0.5">
                  {'2벌 · 스팟14'}
                </span>
                {'\n          '}
              </div>
              {'\n          '}
              <div className="flex items-center gap-2 mt-6">
                {'\n            '}
                <p className="text-zinc-400 text-base line-through">{'210,000원'}</p>
                {'\n            '}
                <span className="text-[10px] font-bold text-red-400 bg-red-500/15 border border-red-500/30 rounded-full px-2 py-0.5">
                  {'-24%'}
                </span>
                {'\n          '}
              </div>
              {'\n          '}
              <p className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tighter mt-1">
                {'160,000'}
                <span className="text-lg text-zinc-500 font-normal">{'원'}</span>
              </p>
              {'\n          '}
              <div className="slot-info mt-5" data-package="hybrid">
                {'\n            '}
                <div className="flex items-center justify-between text-[11px] mb-2">
                  {'\n              '}
                  <span className="text-zinc-400 uppercase tracking-widest">{'이번 달 잔여'}</span>
                  {'\n              '}
                  <span className="text-white font-semibold">
                    <span className="slot-remaining text-accent-400">{'3'}</span>
                    <span className="text-zinc-500">
                      {'/'}
                      <span className="slot-total">{'10'}</span>
                      {'석'}
                    </span>
                  </span>
                  {'\n            '}
                </div>
                {'\n            '}
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  {'\n              '}
                  <div
                    className="slot-bar h-full bg-accent-500 rounded-full transition-all duration-700"
                    style={{ width: '30%' } as CSSProperties}
                  >
                    {'\n              '}
                  </div>
                  {'\n            '}
                </div>
                {'\n            '}
                <p className="slot-urgent hidden mt-2 text-[11px] text-red-400 font-semibold items-center gap-1">
                  {'\n              '}
                  <SourceIcon name="solar/fire-bold" />
                  {' 마감 임박\n            '}
                </p>
                {'\n          '}
              </div>
              {'\n          '}
              <ul className="mt-7 space-y-2.5 text-sm text-zinc-200 flex-1">
                {'\n            '}
                <li className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">
                  {'촬영 전'}
                </li>
                {'\n            '}
                <li className="flex items-start gap-2">
                  <SourceIcon
                    name="solar/check-circle-bold"
                    className="text-accent-400 mt-0.5 flex-shrink-0"
                  />
                  {' 1:1 사전 컨설팅 (카톡)'}
                </li>
                {'\n            '}
                <li className="flex items-start gap-2">
                  <SourceIcon
                    name="solar/check-circle-bold"
                    className="text-accent-400 mt-0.5 flex-shrink-0"
                  />
                  {' 의상 가이드 + 12종 코디북'}
                </li>
                {'\n            '}
                <li className="flex items-start gap-2">
                  <SourceIcon
                    name="solar/check-circle-bold"
                    className="text-accent-400 mt-0.5 flex-shrink-0"
                  />
                  {' 그루밍 노션 (피부·헤어 관리법)'}
                </li>
                {'\n            '}
                <li className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold pt-2">
                  {'촬영 당일'}
                </li>
                {'\n            '}
                <li className="flex items-start gap-2">
                  <SourceIcon
                    name="solar/check-circle-bold"
                    className="text-accent-400 mt-0.5 flex-shrink-0"
                  />
                  {' 2시간 촬영 · 2벌 · 스팟14'}
                </li>
                {'\n            '}
                <li className="flex items-start gap-2">
                  <SourceIcon
                    name="solar/check-circle-bold"
                    className="text-accent-400 mt-0.5 flex-shrink-0"
                  />
                  {' 실시간 포즈·표정 디렉팅'}
                </li>
                {'\n            '}
                <li className="flex items-start gap-2">
                  <SourceIcon
                    name="solar/check-circle-bold"
                    className="text-accent-400 mt-0.5 flex-shrink-0"
                  />
                  {' 원본 500장+ 전량 제공'}
                </li>
                {'\n            '}
                <li className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold pt-2">
                  {'촬영 후'}
                </li>
                {'\n            '}
                <li className="flex items-start gap-2">
                  <SourceIcon
                    name="solar/check-circle-bold"
                    className="text-accent-400 mt-0.5 flex-shrink-0"
                  />
                  {' 프리미엄 보정 7장+@ (당일 완료)'}
                </li>
                {'\n            '}
                <li className="flex items-start gap-2">
                  <SourceIcon
                    name="solar/check-circle-bold"
                    className="text-accent-400 mt-0.5 flex-shrink-0"
                  />
                  {' 보정 무제한 수정'}
                </li>
                {'\n            '}
                <li className="flex items-start gap-2">
                  <SourceIcon
                    name="solar/check-circle-bold"
                    className="text-accent-400 mt-0.5 flex-shrink-0"
                  />
                  {' 불만족 시 무료 재촬영 보장'}
                </li>
                {'\n          '}
              </ul>
              {'\n          '}
              <p className="text-xs text-zinc-400 mt-4">{'이동: 도보'}</p>
              {'\n          '}
              <a
                href="/recommend?pkg=hybrid"
                className="cta-primary mt-6 inline-flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-semibold py-3 rounded-full"
              >
                {'\n            선택하기\n            '}
                <SourceIcon name="solar/arrow-right-linear" className="arrow" />
                {'\n          '}
              </a>
              {'\n        '}
            </div>
            {'\n\n        '}
            {'\n        '}
            <div
              className="reveal glass rounded-2xl md:rounded-3xl p-6 sm:p-7 md:p-8 flex flex-col"
              style={{ transitionDelay: '200ms' } as CSSProperties}
            >
              {'\n          '}
              <p className="text-zinc-500 text-xs uppercase tracking-widest">
                {'주말 가능 · 5시간 이상'}
              </p>
              {'\n          '}
              <div className="flex items-center gap-2 mt-1">
                {'\n            '}
                <h3 className="font-display text-2xl font-bold text-white">{'ALL DAY 패키지'}</h3>
                {'\n            '}
                <span className="text-[11px] text-zinc-400 font-semibold bg-white/5 border border-white/10 rounded-full px-2.5 py-0.5">
                  {'4벌 · N장소'}
                </span>
                {'\n          '}
              </div>
              {'\n          '}
              <div className="flex items-center gap-2 mt-6">
                {'\n            '}
                <p className="text-zinc-500 text-base line-through">{'890,000원'}</p>
                {'\n            '}
                <span className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-full px-2 py-0.5">
                  {'-44%'}
                </span>
                {'\n          '}
              </div>
              {'\n          '}
              <p className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tighter mt-1">
                {'500,000'}
                <span className="text-lg text-zinc-500 font-normal">{'원'}</span>
              </p>
              {'\n          '}
              <div className="slot-info mt-5" data-package="allday">
                {'\n            '}
                <div className="flex items-center justify-between text-[11px] mb-2">
                  {'\n              '}
                  <span className="text-zinc-500 uppercase tracking-widest">{'이번 달 잔여'}</span>
                  {'\n              '}
                  <span className="text-white font-semibold">
                    <span className="slot-remaining text-accent-400">{'2'}</span>
                    <span className="text-zinc-600">
                      {'/'}
                      <span className="slot-total">{'6'}</span>
                      {'석'}
                    </span>
                  </span>
                  {'\n            '}
                </div>
                {'\n            '}
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  {'\n              '}
                  <div
                    className="slot-bar h-full bg-accent-500 rounded-full transition-all duration-700"
                    style={{ width: '33%' } as CSSProperties}
                  >
                    {'\n              '}
                  </div>
                  {'\n            '}
                </div>
                {'\n            '}
                <p className="slot-urgent hidden mt-2 text-[11px] text-red-400 font-semibold items-center gap-1">
                  {'\n              '}
                  <SourceIcon name="solar/fire-bold" />
                  {' 마감 임박\n            '}
                </p>
                {'\n          '}
              </div>
              {'\n          '}
              <ul className="mt-7 space-y-2.5 text-sm text-zinc-300 flex-1">
                {'\n            '}
                <li className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
                  {'촬영 전'}
                </li>
                {'\n            '}
                <li className="flex items-start gap-2">
                  <SourceIcon
                    name="solar/check-circle-bold"
                    className="text-accent-400 mt-0.5 flex-shrink-0"
                  />
                  {' 1:1 사전 컨설팅 (카톡)'}
                </li>
                {'\n            '}
                <li className="flex items-start gap-2">
                  <SourceIcon
                    name="solar/check-circle-bold"
                    className="text-accent-400 mt-0.5 flex-shrink-0"
                  />
                  {' 외모 피드백 + 의상 가이드 + 12종 코디북'}
                </li>
                {'\n            '}
                <li className="flex items-start gap-2">
                  <SourceIcon
                    name="solar/check-circle-bold"
                    className="text-accent-400 mt-0.5 flex-shrink-0"
                  />
                  {' 그루밍 노션 (피부·헤어 관리법)'}
                </li>
                {'\n            '}
                <li className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold pt-2">
                  {'촬영 당일'}
                </li>
                {'\n            '}
                <li className="flex items-start gap-2">
                  <SourceIcon
                    name="solar/check-circle-bold"
                    className="text-accent-400 mt-0.5 flex-shrink-0"
                  />
                  {' 헤어 스타일링 + 데일리 메이크업'}
                </li>
                {'\n            '}
                <li className="flex items-start gap-2">
                  <SourceIcon
                    name="solar/check-circle-bold"
                    className="text-accent-400 mt-0.5 flex-shrink-0"
                  />
                  {' 5시간+ 촬영 · 4벌 · 서울/경기 N장소'}
                </li>
                {'\n            '}
                <li className="flex items-start gap-2">
                  <SourceIcon
                    name="solar/check-circle-bold"
                    className="text-accent-400 mt-0.5 flex-shrink-0"
                  />
                  {' 실시간 포즈·표정 디렉팅'}
                </li>
                {'\n            '}
                <li className="flex items-start gap-2">
                  <SourceIcon
                    name="solar/check-circle-bold"
                    className="text-accent-400 mt-0.5 flex-shrink-0"
                  />
                  {' 원본 700장+ 전량 제공'}
                </li>
                {'\n            '}
                <li className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold pt-2">
                  {'촬영 후'}
                </li>
                {'\n            '}
                <li className="flex items-start gap-2">
                  <SourceIcon
                    name="solar/check-circle-bold"
                    className="text-accent-400 mt-0.5 flex-shrink-0"
                  />
                  {' 프리미엄 보정 12장+@ (당일 완료)'}
                </li>
                {'\n            '}
                <li className="flex items-start gap-2">
                  <SourceIcon
                    name="solar/check-circle-bold"
                    className="text-accent-400 mt-0.5 flex-shrink-0"
                  />
                  {' 보정 무제한 수정'}
                </li>
                {'\n            '}
                <li className="flex items-start gap-2">
                  <SourceIcon
                    name="solar/check-circle-bold"
                    className="text-accent-400 mt-0.5 flex-shrink-0"
                  />
                  {' 불만족 시 무료 재촬영 보장'}
                </li>
                {'\n          '}
              </ul>
              {'\n          '}
              <p className="text-xs text-zinc-500 mt-4">{'이동: 차량 이동'}</p>
              {'\n          '}
              <a
                href="/recommend?pkg=allday"
                className="cta-primary mt-6 inline-flex items-center justify-center gap-2 glass hover:bg-white/10 text-white font-semibold py-3 rounded-full"
              >
                {'\n            선택하기\n          '}
              </a>
              {'\n        '}
            </div>
            {'\n      '}
          </div>
          {'\n\n      '}
          {'\n      '}
          <div className="reveal mt-12 max-w-5xl mx-auto">
            {'\n        '}
            <div className="glass-strong rounded-2xl border border-accent-500/20 px-5 py-5 md:px-8 md:py-7">
              {'\n          '}
              <div className="flex flex-col md:flex-row md:items-center gap-5 md:gap-8">
                {'\n            '}
                <div className="flex items-center gap-3 shrink-0">
                  {'\n              '}
                  <div className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-accent-500/15 flex items-center justify-center text-accent-400 text-xl md:text-2xl shrink-0">
                    {'\n                '}
                    <SourceIcon name="solar/shield-check-bold" />
                    {'\n              '}
                  </div>
                  {'\n              '}
                  <div className="text-left">
                    {'\n                '}
                    <p className="text-[10px] text-accent-400 font-bold uppercase tracking-widest">
                      {'MANSPICK Guarantee'}
                    </p>
                    {'\n                '}
                    <p className="text-white font-bold text-sm md:text-base">{'100% 만족 보장'}</p>
                    {'\n              '}
                  </div>
                  {'\n            '}
                </div>
                {'\n            '}
                <div className="md:hidden h-px w-full bg-white/10"></div>
                {'\n            '}
                <div className="hidden md:block w-px h-12 bg-white/10"></div>
                {'\n            '}
                <div className="grid grid-cols-3 gap-2 md:gap-6 flex-1 text-xs sm:text-sm">
                  {'\n              '}
                  <div className="flex flex-col md:flex-row items-center md:items-center gap-1.5 md:gap-2.5 text-center md:text-left">
                    {'\n                '}
                    <SourceIcon
                      name="solar/refresh-bold"
                      className="text-accent-400 text-xl md:text-lg shrink-0"
                    />
                    {'\n                '}
                    <span className="text-zinc-300 break-keep leading-tight">
                      <span className="text-white font-semibold">
                        {'무료\n                    재촬영'}
                      </span>
                    </span>
                    {'\n              '}
                  </div>
                  {'\n              '}
                  <div className="flex flex-col md:flex-row items-center md:items-center gap-1.5 md:gap-2.5 text-center md:text-left">
                    {'\n                '}
                    <SourceIcon
                      name="solar/magic-stick-3-bold"
                      className="text-accent-400 text-xl md:text-lg shrink-0"
                    />
                    {'\n                '}
                    <span className="text-zinc-300 break-keep leading-tight">
                      <span className="text-white font-semibold">
                        {'무제한\n                    수정'}
                      </span>
                    </span>
                    {'\n              '}
                  </div>
                  {'\n              '}
                  <div className="flex flex-col md:flex-row items-center md:items-center gap-1.5 md:gap-2.5 text-center md:text-left">
                    {'\n                '}
                    <SourceIcon
                      name="solar/user-check-bold"
                      className="text-accent-400 text-xl md:text-lg shrink-0"
                    />
                    {'\n                '}
                    <span className="text-zinc-300 break-keep leading-tight">
                      <span className="text-white font-semibold">
                        {'100%\n                    남성'}
                      </span>
                    </span>
                    {'\n              '}
                  </div>
                  {'\n            '}
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
      </section>
      <section id="faq" className="py-20 md:py-24 lg:py-32">
        {'\n    '}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {'\n      '}
          <div className="reveal text-center mb-12 md:mb-14 lg:mb-16">
            {'\n        '}
            <p className="text-accent-400 text-sm font-semibold uppercase tracking-widest mb-4">
              {'FAQ'}
            </p>
            {'\n        '}
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter leading-tight text-white break-keep">
              {'\n          자주 묻는 질문\n        '}
            </h2>
            {'\n      '}
          </div>
          {'\n      '}
          <div className="space-y-3" id="faq-list">
            {'\n        '}
            {'\n        '}
            <details className="reveal glass rounded-2xl p-5 md:p-6 group">
              {'\n          '}
              <summary className="flex items-center justify-between cursor-pointer text-white font-semibold list-none">
                {'\n            '}
                <span className="break-keep">
                  {'사진을 한 번도 안 찍어봐서 어색한데 괜찮을까요?'}
                </span>
                {'\n            '}
                <SourceIcon
                  name="solar/alt-arrow-down-linear"
                  className="text-zinc-400 transition group-open:rotate-180"
                />
                {'\n          '}
              </summary>
              {'\n          '}
              <p className="text-zinc-400 text-sm leading-relaxed mt-4 break-keep">
                {
                  '\n            오시는 분의 87%가 처음 찍어보는 분들입니다. 작가가 호흡, 시선, 어깨 각도까지 직접 잡아드리기 때문에 어색해하실 시간이 없습니다.\n          '
                }
              </p>
              {'\n        '}
            </details>
            {'\n        '}
            <details className="reveal glass rounded-2xl p-5 md:p-6 group">
              {'\n          '}
              <summary className="flex items-center justify-between cursor-pointer text-white font-semibold list-none">
                {'\n            '}
                <span className="break-keep">{'의상은 어떻게 준비해야 하나요?'}</span>
                {'\n            '}
                <SourceIcon
                  name="solar/alt-arrow-down-linear"
                  className="text-zinc-400 transition group-open:rotate-180"
                />
                {'\n          '}
              </summary>
              {'\n          '}
              <p className="text-zinc-400 text-sm leading-relaxed mt-4 break-keep">
                {
                  '\n            촬영 3일 전, 보유 중인 옷을 카톡으로 보내주시면 35K 패션 인플루언서 디렉터가 직접 코디북을 만들어 드립니다. 의류가 부족하다면 대여 옵션도 있습니다.\n          '
                }
              </p>
              {'\n        '}
            </details>
            {'\n        '}
            <details className="reveal glass rounded-2xl p-5 md:p-6 group">
              {'\n          '}
              <summary className="flex items-center justify-between cursor-pointer text-white font-semibold list-none">
                {'\n            '}
                <span className="break-keep">{'촬영은 어디에서 진행되나요?'}</span>
                {'\n            '}
                <SourceIcon
                  name="solar/alt-arrow-down-linear"
                  className="text-zinc-400 transition group-open:rotate-180"
                />
                {'\n          '}
              </summary>
              {'\n          '}
              <p className="text-zinc-400 text-sm leading-relaxed mt-4 break-keep">
                {
                  '\n            서울/경기 인스타 핫플레이스가 가득한 실내외 공간에서 진행됩니다. 패키지에 따라 1~N개의 장소를 이동하며 촬영하며, 정확한 장소는 사전 컨설팅 후 확정됩니다.\n          '
                }
              </p>
              {'\n        '}
            </details>
            {'\n        '}
            <details className="reveal glass rounded-2xl p-5 md:p-6 group">
              {'\n          '}
              <summary className="flex items-center justify-between cursor-pointer text-white font-semibold list-none">
                {'\n            '}
                <span className="break-keep">{'보정이 마음에 안 들면 어떻게 하나요?'}</span>
                {'\n            '}
                <SourceIcon
                  name="solar/alt-arrow-down-linear"
                  className="text-zinc-400 transition group-open:rotate-180"
                />
                {'\n          '}
              </summary>
              {'\n          '}
              <p className="text-zinc-400 text-sm leading-relaxed mt-4 break-keep">
                {
                  '\n            모든 패키지에 보정 무제한 수정이 포함됩니다. 그래도 만족하지 못하실 경우 무료 재촬영까지 보장합니다. 불만족으로 끝나는 경우는 만들지 않습니다.\n          '
                }
              </p>
              {'\n        '}
            </details>
            {'\n        '}
            <details className="reveal glass rounded-2xl p-5 md:p-6 group">
              {'\n          '}
              <summary className="flex items-center justify-between cursor-pointer text-white font-semibold list-none">
                {'\n            '}
                <span className="break-keep">
                  {'머리숱이 적거나 외모에 자신이 없는데 가능할까요?'}
                </span>
                {'\n            '}
                <SourceIcon
                  name="solar/alt-arrow-down-linear"
                  className="text-zinc-400 transition group-open:rotate-180"
                />
                {'\n          '}
              </summary>
              {'\n          '}
              <p className="text-zinc-400 text-sm leading-relaxed mt-4 break-keep">
                {
                  '\n            맨즈픽 고객의 절반 이상이 "외모에 자신 없는 평범남"입니다. 우리가 가장 잘하는 일이 바로 이 부분입니다. 비포 사진 보내주시면 솔직한 사전 진단부터 드립니다.\n          '
                }
              </p>
              {'\n        '}
            </details>
            {'\n\n        '}
            {'\n        '}
            <div id="faq-more" className="space-y-3">
              {'\n          '}
              <details className="reveal in glass rounded-2xl p-5 md:p-6 group">
                {'\n            '}
                <summary className="flex items-center justify-between cursor-pointer text-white font-semibold list-none">
                  {'\n              '}
                  <span className="break-keep">{'촬영은 얼마나 걸리나요?'}</span>
                  {'\n              '}
                  <SourceIcon
                    name="solar/alt-arrow-down-linear"
                    className="text-zinc-400 transition group-open:rotate-180"
                  />
                  {'\n            '}
                </summary>
                {'\n            '}
                <p className="text-zinc-400 text-sm leading-relaxed mt-4 break-keep">
                  {
                    '\n              패키지에 따라 다릅니다. ONE 패키지는 약 1시간, HYBRID는 2~3시간, ALL DAY는 하루 종일 함께합니다. 사전 컨설팅에서 정확한 타임라인을 안내드립니다.\n            '
                  }
                </p>
                {'\n          '}
              </details>
              {'\n          '}
              <details className="reveal in glass rounded-2xl p-5 md:p-6 group">
                {'\n            '}
                <summary className="flex items-center justify-between cursor-pointer text-white font-semibold list-none">
                  {'\n              '}
                  <span className="break-keep">{'사진은 언제 받을 수 있나요?'}</span>
                  {'\n              '}
                  <SourceIcon
                    name="solar/alt-arrow-down-linear"
                    className="text-zinc-400 transition group-open:rotate-180"
                  />
                  {'\n            '}
                </summary>
                {'\n            '}
                <p className="text-zinc-400 text-sm leading-relaxed mt-4 break-keep">
                  {
                    '\n              보정본은 촬영 당일~3일 이내에 전달됩니다. 원본 사진은 리뷰 작성 시 전달해 드립니다.\n            '
                  }
                </p>
                {'\n          '}
              </details>
              {'\n          '}
              <details className="reveal in glass rounded-2xl p-5 md:p-6 group">
                {'\n            '}
                <summary className="flex items-center justify-between cursor-pointer text-white font-semibold list-none">
                  {'\n              '}
                  <span className="break-keep">{'헤어 세팅도 해주나요?'}</span>
                  {'\n              '}
                  <SourceIcon
                    name="solar/alt-arrow-down-linear"
                    className="text-zinc-400 transition group-open:rotate-180"
                  />
                  {'\n            '}
                </summary>
                {'\n            '}
                <p className="text-zinc-400 text-sm leading-relaxed mt-4 break-keep">
                  {
                    '\n              부가서비스로 헤어/메이크업 세팅을 추가하실 수 있습니다. 사전 컨설팅 시 말씀해 주시면 촬영 당일 전문 헤어팀이 현장에서 함께 진행합니다.\n            '
                  }
                </p>
                {'\n          '}
              </details>
              {'\n          '}
              <details className="reveal in glass rounded-2xl p-5 md:p-6 group">
                {'\n            '}
                <summary className="flex items-center justify-between cursor-pointer text-white font-semibold list-none">
                  {'\n              '}
                  <span className="break-keep">{'예약 변경이나 취소가 가능한가요?'}</span>
                  {'\n              '}
                  <SourceIcon
                    name="solar/alt-arrow-down-linear"
                    className="text-zinc-400 transition group-open:rotate-180"
                  />
                  {'\n            '}
                </summary>
                {'\n            '}
                <p className="text-zinc-400 text-sm leading-relaxed mt-4 break-keep">
                  {
                    '\n              촬영일 기준 3일 전까지 무료 변경·취소가 가능합니다. 2일 전~전날은 촬영비의 50%, 당일 취소·노쇼는 100%가 차감됩니다. 일정 변경은 1회에 한해 무료로 가능하며, 카카오톡으로 편하게 말씀해 주세요.\n            '
                  }
                </p>
                {'\n          '}
              </details>
              {'\n          '}
              <details className="reveal in glass rounded-2xl p-5 md:p-6 group">
                {'\n            '}
                <summary className="flex items-center justify-between cursor-pointer text-white font-semibold list-none">
                  {'\n              '}
                  <span className="break-keep">{'혼자 가야 하나요?'}</span>
                  {'\n              '}
                  <SourceIcon
                    name="solar/alt-arrow-down-linear"
                    className="text-zinc-400 transition group-open:rotate-180"
                  />
                  {'\n            '}
                </summary>
                {'\n            '}
                <p className="text-zinc-400 text-sm leading-relaxed mt-4 break-keep">
                  {
                    '\n              혼자 오셔도 전혀 문제없습니다. 오히려 대부분 혼자 오십니다. 친구나 커플 동반 촬영도 가능하니 사전 컨설팅 때 말씀해 주세요.\n            '
                  }
                </p>
                {'\n          '}
              </details>
              {'\n          '}
              <details className="reveal in glass rounded-2xl p-5 md:p-6 group">
                {'\n            '}
                <summary className="flex items-center justify-between cursor-pointer text-white font-semibold list-none">
                  {'\n              '}
                  <span className="break-keep">
                    {'소개팅앱, SNS, 링크드인 등 다양한 곳에 쓸 수 있나요?'}
                  </span>
                  {'\n              '}
                  <SourceIcon
                    name="solar/alt-arrow-down-linear"
                    className="text-zinc-400 transition group-open:rotate-180"
                  />
                  {'\n            '}
                </summary>
                {'\n            '}
                <p className="text-zinc-400 text-sm leading-relaxed mt-4 break-keep">
                  {
                    '\n              물론입니다. 소개팅앱, 결혼정보회사, 인스타그램, 링크드인, 카카오톡 프로필 등 용도에 맞게 비율·분위기를 다르게 보정해 드립니다. 사전 컨설팅 때 사용 목적을 알려주시면 맞춤 촬영 컨셉을 제안드립니다.\n            '
                  }
                </p>
                {'\n          '}
              </details>
              {'\n        '}
            </div>
            {'\n\n        '}
            {'\n        '}
            <button
              id="faq-toggle"
              className="hidden w-full mt-4 flex items-center justify-center gap-2 text-sm text-zinc-400 hover:text-white transition py-3 rounded-2xl glass hover:bg-white/5"
              type="button"
              aria-controls="faq-more"
              aria-expanded="false"
            >
              {'\n          '}
              <span id="faq-toggle-text">{'질문 더보기'}</span>
              {'\n          '}
              <SourceIcon
                name="solar/alt-arrow-down-linear"
                id="faq-toggle-icon"
                className="text-base transition-transform"
              />
              {'\n        '}
            </button>
            {'\n      '}
          </div>
          {'\n    '}
        </div>
        {'\n  '}
      </section>
      <section id="cta" className="relative py-24 md:py-28 lg:py-40 overflow-hidden">
        {'\n    '}
        <div className="absolute inset-0 mesh-bg"></div>
        {'\n    '}
        <div className="absolute inset-0 dot-line opacity-30"></div>
        {'\n    '}
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {'\n      '}
          <div className="reveal inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs text-zinc-300 mb-8">
            {'\n        '}
            <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse"></span>
            {'\n        '}
            <span id="cta-month-label">{'2026년 5월 잔여 7석 · 6월 예약 오픈'}</span>
            {'\n      '}
          </div>
          {'\n\n      '}
          <p
            className="reveal text-accent-400 text-sm md:text-base font-semibold mb-4"
            style={{ transitionDelay: '80ms' } as CSSProperties}
          >
            {'\n        MANSPICK\n      '}
          </p>
          {'\n      '}
          <h2
            className="reveal font-display text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-[5.5rem] font-bold text-white tracking-tighter leading-[1] md:leading-[0.95] break-keep"
            style={{ transitionDelay: '120ms' } as CSSProperties}
          >
            {'\n        당신의 프로필 사진'}
            <br />
            {'\n        '}
            <span id="cta-toggle" className="inline-block transition-all duration-500">
              <span className="text-red-400">{'비호감'}</span>
              {'인가요?'}
            </span>
            {'\n      '}
          </h2>
          {'\n      '}
          <p
            className="reveal text-sm sm:text-base md:text-xl text-zinc-400 leading-relaxed mt-6 md:mt-8 max-w-2xl mx-auto break-keep"
            style={{ transitionDelay: '200ms' } as CSSProperties}
          >
            {'\n        소개팅, 면접, 비즈니스 — 첫인상이 결과를 바꿉니다.'}
            <br />
            {'\n        딱 하루만에 감히 인생을 바꿔드립니다.\n      '}
          </p>
          {'\n\n      '}
          <div
            className="reveal flex flex-col items-center justify-center gap-4 mt-8 md:mt-10"
            style={{ transitionDelay: '280ms' } as CSSProperties}
          >
            {'\n        '}
            {'\n        '}
            <a
              href="https://pf.kakao.com/_kNxoMn"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-primary group relative inline-flex items-center justify-center gap-2.5 md:gap-3 bg-[#FEE500] hover:bg-[#ffdd00] text-[#191919] font-bold px-6 sm:px-10 md:px-12 py-4 md:py-6 text-[15px] sm:text-base md:text-xl rounded-full shadow-[0_20px_60px_-15px_rgba(254,229,0,0.55)] overflow-hidden w-full max-w-[360px] sm:max-w-none sm:w-auto"
            >
              {'\n          '}
              <SourceIcon name="ri/kakao-talk-fill" className="text-xl md:text-3xl shrink-0" />
              {'\n          '}
              <span className="whitespace-nowrap">{'카카오톡으로 1:1 상담하기'}</span>
              {'\n          '}
              <SourceIcon
                name="solar/arrow-right-linear"
                className="arrow text-base md:text-2xl shrink-0"
              />
              {'\n        '}
            </a>
            {'\n        '}
            <p className="text-[11px] sm:text-xs md:text-sm text-zinc-500 flex items-center gap-2 break-keep">
              {'\n          '}
              <span className="relative flex w-2 h-2 shrink-0">
                {'\n            '}
                <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-70"></span>
                {'\n            '}
                <span className="relative w-2 h-2 rounded-full bg-green-400"></span>
                {'\n          '}
              </span>
              {'\n          평균 응답 1시간 이내 · 지금 상담사 '}
              <span className="text-white font-semibold">{'2명 대기 중'}</span>
              {'\n        '}
            </p>
            {'\n        '}
            <button
              type="button"
              id="open-leadmodal-cta"
              className="guidebook-blink mt-1 text-xs sm:text-sm text-zinc-400 hover:text-white transition inline-flex items-center gap-1.5 underline underline-offset-4 decoration-zinc-700"
            >
              {'\n          '}
              <SourceIcon name="solar/document-text-bold" />
              {'\n          아직 고민되신다면? 무료 가이드북부터 받아보세요\n        '}
            </button>
            {'\n      '}
          </div>
          {'\n\n      '}
          <div
            className="reveal grid grid-cols-3 sm:flex sm:flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-3 mt-10 text-[11px] sm:text-xs text-zinc-500"
            style={{ transitionDelay: '360ms' } as CSSProperties}
          >
            {'\n        '}
            <span className="flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5 text-center">
              <SourceIcon
                name="solar/shield-check-bold"
                className="text-accent-400 text-base sm:text-sm shrink-0"
              />
              <span className="break-keep">{'무료 재촬영'}</span>
            </span>
            {'\n        '}
            <span className="flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5 text-center">
              <SourceIcon
                name="solar/refresh-bold"
                className="text-accent-400 text-base sm:text-sm shrink-0"
              />
              <span className="break-keep">{'무제한 수정'}</span>
            </span>
            {'\n        '}
            <span className="flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5 text-center">
              <SourceIcon
                name="solar/user-check-bold"
                className="text-accent-400 text-base sm:text-sm shrink-0"
              />
              <span className="break-keep">{'100% 남성 전용'}</span>
            </span>
            {'\n      '}
          </div>
          {'\n    '}
        </div>
        {'\n  '}
      </section>
    </>
  );
}

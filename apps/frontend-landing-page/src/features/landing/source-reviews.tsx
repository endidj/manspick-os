// manspick-site@54f4a375의 원본 배치·문구를 보존한 React 서버 컴포넌트입니다.
import type { CSSProperties } from 'react';
import { SourceImage } from './source-image';
import { sourceImageSizes } from './source-image-sizes';
import { SourceIcon } from './source-icon';

export function SourceReviews() {
  return (
    <>
      <section id="reviews" className="py-20 md:py-24 lg:py-32">
        {'\n    '}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {'\n      '}
          <div className="reveal max-w-3xl mb-14 md:mb-16 lg:mb-20">
            {'\n        '}
            <p className="text-accent-400 text-sm font-semibold uppercase tracking-widest mb-4">
              {'Reviews'}
            </p>
            {'\n        '}
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter leading-tight text-white break-keep">
              {'\n          남자가 남자에게 추천합니다.\n        '}
            </h2>
            {'\n        '}
            <p className="text-base md:text-lg text-zinc-400 leading-relaxed mt-5 md:mt-6 break-keep">
              {
                '\n          수천 명의 남성들이 맨즈픽을 경험한 뒤, 직접 자신의 이야기를 남겨주고 있습니다.\n        '
              }
            </p>
            {'\n      '}
          </div>
          {'\n\n    '}
        </div>
        {'\n\n    '}
        {'\n    '}
        <div className="marquee-row marquee-mask overflow-hidden">
          {'\n      '}
          <div className="marquee-track flex w-max">
            {'\n        '}
            {'\n        '}
            <div className="glass rounded-2xl p-6 w-[340px] h-[260px] mr-5 flex-shrink-0 flex flex-col overflow-hidden">
              {'\n          '}
              <div className="flex items-center gap-1 text-accent-400 mb-4">
                {'\n            '}
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                {'\n          '}
              </div>
              {'\n          '}
              <p className="text-zinc-300 text-sm leading-relaxed break-keep mb-5 flex-1 overflow-hidden line-clamp-5">
                {
                  '"마땅한 프로필\n            사진이 없어 부담이 컸는데, 메이크업과 코디 패키지 덕분에\n            스타일링 부담 없이 멋진 사진을 얻었습니다. 촬영 장소 선정도 세심했고 포징 디렉팅이 명확해서 편안했어요."'
                }
              </p>
              {'\n          '}
              <div className="flex items-center gap-3 mt-auto">
                {'\n            '}
                <SourceImage
                  name="스타일링 포트폴리오 1.png"
                  sizes={sourceImageSizes.reviewAvatar}
                  thumbnail
                  alt="고개든떡갈나무6551"
                  className="w-10 h-10 rounded-full object-cover object-top"
                  loading="lazy"
                  decoding="async"
                  style={{ objectPosition: 'center 20%' } as CSSProperties}
                />
                {'\n            '}
                <div>
                  {'\n              '}
                  <p className="text-white text-sm font-semibold">{'고개든떡갈나무6551'}</p>
                  {'\n              '}
                  <p className="text-zinc-500 text-xs">{'맨즈픽 실제 고객 · Kmong'}</p>
                  {'\n            '}
                </div>
                {'\n          '}
              </div>
              {'\n        '}
            </div>
            {'\n        '}
            <div className="glass rounded-2xl p-6 w-[340px] h-[260px] mr-5 flex-shrink-0 flex flex-col overflow-hidden">
              {'\n          '}
              <div className="flex items-center gap-1 text-accent-400 mb-4">
                {'\n            '}
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                {'\n          '}
              </div>
              {'\n          '}
              <p className="text-zinc-300 text-sm leading-relaxed break-keep mb-5 flex-1 overflow-hidden line-clamp-5">
                {
                  '"프로필 촬영\n            자체가 처음이라 솔직히 많이 망설였습니다. 평소에 사진을 즐겨 찍는\n            편도 아니고, 남자라 포즈나 표정을 어떻게 해야 할지 감도 안 잡혔는데 자연스럽게 디렉션 해주셔서 편하게 찍었어요."'
                }
              </p>
              {'\n          '}
              <div className="flex items-center gap-3 mt-auto">
                {'\n            '}
                <SourceImage
                  name="스타일링 포트폴리오 3.png"
                  sizes={sourceImageSizes.reviewAvatar}
                  thumbnail
                  alt="ksh125"
                  className="w-10 h-10 rounded-full object-cover object-top"
                  loading="lazy"
                  decoding="async"
                />
                {'\n            '}
                <div>
                  {'\n              '}
                  <p className="text-white text-sm font-semibold">{'ksh125'}</p>
                  {'\n              '}
                  <p className="text-zinc-500 text-xs">{'맨즈픽 실제 고객 · Kmong'}</p>
                  {'\n            '}
                </div>
                {'\n          '}
              </div>
              {'\n        '}
            </div>
            {'\n        '}
            <div className="glass rounded-2xl p-6 w-[340px] h-[260px] mr-5 flex-shrink-0 flex flex-col overflow-hidden">
              {'\n          '}
              <div className="flex items-center gap-1 text-accent-400 mb-4">
                {'\n            '}
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                {'\n          '}
              </div>
              {'\n          '}
              <p className="text-zinc-300 text-sm leading-relaxed break-keep mb-5 flex-1 overflow-hidden line-clamp-5">
                {
                  '"평소에도\n            가족끼리 사진 찍는 것도 어색해서 좋아하지 않는 편이라, 작가님과\n            함께하는 촬영이 더 부담스럽게 느껴졌거든요. 그런데 편한 분위기에서 세심한 포즈 가이드 덕분에 잘 찍었습니다."'
                }
              </p>
              {'\n          '}
              <div className="flex items-center gap-3 mt-auto">
                {'\n            '}
                <SourceImage
                  name="스타일링 포트폴리오 5.png"
                  sizes={sourceImageSizes.reviewAvatar}
                  thumbnail
                  alt="일찍오는한밤1651"
                  className="w-10 h-10 rounded-full object-cover object-top"
                  loading="lazy"
                  decoding="async"
                />
                {'\n            '}
                <div>
                  {'\n              '}
                  <p className="text-white text-sm font-semibold">{'일찍오는한밤1651'}</p>
                  {'\n              '}
                  <p className="text-zinc-500 text-xs">{'맨즈픽 실제 고객 · Kmong'}</p>
                  {'\n            '}
                </div>
                {'\n          '}
              </div>
              {'\n        '}
            </div>
            {'\n        '}
            <div className="glass rounded-2xl p-6 w-[340px] h-[260px] mr-5 flex-shrink-0 flex flex-col overflow-hidden">
              {'\n          '}
              <div className="flex items-center gap-1 text-accent-400 mb-4">
                {'\n            '}
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                {'\n          '}
              </div>
              {'\n          '}
              <p className="text-zinc-300 text-sm leading-relaxed break-keep mb-5 flex-1 overflow-hidden line-clamp-5">
                {
                  '"응대부터\n            촬영까지 내내 친절하셨습니다. 긴장을 풀어주는 편안한 분위기 덕분에\n            자연스러운 표정이 나왔고, 결과물도 기대 이상으로 만족스러웠어요. 정말 감사합니다."'
                }
              </p>
              {'\n          '}
              <div className="flex items-center gap-3 mt-auto">
                {'\n            '}
                <SourceImage
                  name="스타일링 포트폴리오 2.png"
                  sizes={sourceImageSizes.reviewAvatar}
                  thumbnail
                  alt="상냥한고래8226"
                  className="w-10 h-10 rounded-full object-cover object-top"
                  loading="lazy"
                  decoding="async"
                />
                {'\n            '}
                <div>
                  {'\n              '}
                  <p className="text-white text-sm font-semibold">{'상냥한고래8226'}</p>
                  {'\n              '}
                  <p className="text-zinc-500 text-xs">{'맨즈픽 실제 고객 · Kmong'}</p>
                  {'\n            '}
                </div>
                {'\n          '}
              </div>
              {'\n        '}
            </div>
            {'\n        '}
            <div className="glass rounded-2xl p-6 w-[340px] h-[260px] mr-5 flex-shrink-0 flex flex-col overflow-hidden">
              {'\n          '}
              <div className="flex items-center gap-1 text-accent-400 mb-4">
                {'\n            '}
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                {'\n          '}
              </div>
              {'\n          '}
              <p className="text-zinc-300 text-sm leading-relaxed break-keep mb-5 flex-1 overflow-hidden line-clamp-5">
                {
                  '"정말\n            좋았습니다. 촬영 전 코디 가이드부터 당일 포즈 디렉팅, 보정본까지\n            하나하나 꼼꼼하게 챙겨주셔서 남자 혼자 준비할 부담이 전혀 없었고 결과물도 아주 만족스러웠습니다."'
                }
              </p>
              {'\n          '}
              <div className="flex items-center gap-3 mt-auto">
                {'\n            '}
                <SourceImage
                  name="스타일링 포트폴리오 4.png"
                  sizes={sourceImageSizes.reviewAvatar}
                  thumbnail
                  alt="빠른사랑꾼4022"
                  className="w-10 h-10 rounded-full object-cover object-top"
                  loading="lazy"
                  decoding="async"
                />
                {'\n            '}
                <div>
                  {'\n              '}
                  <p className="text-white text-sm font-semibold">{'빠른사랑꾼4022'}</p>
                  {'\n              '}
                  <p className="text-zinc-500 text-xs">{'맨즈픽 실제 고객 · Kmong'}</p>
                  {'\n            '}
                </div>
                {'\n          '}
              </div>
              {'\n        '}
            </div>
            {'\n        '}
            {'\n        '}
            <div
              className="glass rounded-2xl p-6 w-[340px] h-[260px] mr-5 flex-shrink-0 flex flex-col overflow-hidden"
              aria-hidden="true"
            >
              {'\n          '}
              <div className="flex items-center gap-1 text-accent-400 mb-4">
                {'\n            '}
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                {'\n          '}
              </div>
              {'\n          '}
              <p className="text-zinc-300 text-sm leading-relaxed break-keep mb-5 flex-1 overflow-hidden line-clamp-5">
                {
                  '"마땅한 프로필\n            사진이 없어 부담이 컸는데, 메이크업과 코디 패키지 덕분에\n            스타일링 부담 없이 멋진 사진을 얻었습니다. 촬영 장소 선정도 세심했고 포징 디렉팅이 명확해서 편안했어요."'
                }
              </p>
              {'\n          '}
              <div className="flex items-center gap-3 mt-auto">
                {'\n            '}
                <SourceImage
                  name="스타일링 포트폴리오 1.png"
                  sizes={sourceImageSizes.reviewAvatar}
                  thumbnail
                  className="w-10 h-10 rounded-full object-cover object-top"
                  loading="lazy"
                  decoding="async"
                  alt=""
                  style={{ objectPosition: 'center 20%' } as CSSProperties}
                />
                {'\n            '}
                <div>
                  {'\n              '}
                  <p className="text-white text-sm font-semibold">{'고개든떡갈나무6551'}</p>
                  {'\n              '}
                  <p className="text-zinc-500 text-xs">{'맨즈픽 실제 고객 · Kmong'}</p>
                  {'\n            '}
                </div>
                {'\n          '}
              </div>
              {'\n        '}
            </div>
            {'\n        '}
            <div
              className="glass rounded-2xl p-6 w-[340px] h-[260px] mr-5 flex-shrink-0 flex flex-col overflow-hidden"
              aria-hidden="true"
            >
              {'\n          '}
              <div className="flex items-center gap-1 text-accent-400 mb-4">
                {'\n            '}
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                {'\n          '}
              </div>
              {'\n          '}
              <p className="text-zinc-300 text-sm leading-relaxed break-keep mb-5 flex-1 overflow-hidden line-clamp-5">
                {
                  '"프로필 촬영\n            자체가 처음이라 솔직히 많이 망설였습니다. 평소에 사진을 즐겨 찍는\n            편도 아니고, 남자라 포즈나 표정을 어떻게 해야 할지 감도 안 잡혔는데 자연스럽게 디렉션 해주셔서 편하게 찍었어요."'
                }
              </p>
              {'\n          '}
              <div className="flex items-center gap-3 mt-auto">
                {'\n            '}
                <SourceImage
                  name="스타일링 포트폴리오 3.png"
                  sizes={sourceImageSizes.reviewAvatar}
                  thumbnail
                  className="w-10 h-10 rounded-full object-cover object-top"
                  loading="lazy"
                  decoding="async"
                  alt=""
                />
                {'\n            '}
                <div>
                  {'\n              '}
                  <p className="text-white text-sm font-semibold">{'ksh125'}</p>
                  {'\n              '}
                  <p className="text-zinc-500 text-xs">{'맨즈픽 실제 고객 · Kmong'}</p>
                  {'\n            '}
                </div>
                {'\n          '}
              </div>
              {'\n        '}
            </div>
            {'\n        '}
            <div
              className="glass rounded-2xl p-6 w-[340px] h-[260px] mr-5 flex-shrink-0 flex flex-col overflow-hidden"
              aria-hidden="true"
            >
              {'\n          '}
              <div className="flex items-center gap-1 text-accent-400 mb-4">
                {'\n            '}
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                {'\n          '}
              </div>
              {'\n          '}
              <p className="text-zinc-300 text-sm leading-relaxed break-keep mb-5 flex-1 overflow-hidden line-clamp-5">
                {
                  '"평소에도\n            가족끼리 사진 찍는 것도 어색해서 좋아하지 않는 편이라, 작가님과\n            함께하는 촬영이 더 부담스럽게 느껴졌거든요. 그런데 편한 분위기에서 세심한 포즈 가이드 덕분에 잘 찍었습니다."'
                }
              </p>
              {'\n          '}
              <div className="flex items-center gap-3 mt-auto">
                {'\n            '}
                <SourceImage
                  name="스타일링 포트폴리오 5.png"
                  sizes={sourceImageSizes.reviewAvatar}
                  thumbnail
                  className="w-10 h-10 rounded-full object-cover object-top"
                  loading="lazy"
                  decoding="async"
                  alt=""
                />
                {'\n            '}
                <div>
                  {'\n              '}
                  <p className="text-white text-sm font-semibold">{'일찍오는한밤1651'}</p>
                  {'\n              '}
                  <p className="text-zinc-500 text-xs">{'맨즈픽 실제 고객 · Kmong'}</p>
                  {'\n            '}
                </div>
                {'\n          '}
              </div>
              {'\n        '}
            </div>
            {'\n        '}
            <div
              className="glass rounded-2xl p-6 w-[340px] h-[260px] mr-5 flex-shrink-0 flex flex-col overflow-hidden"
              aria-hidden="true"
            >
              {'\n          '}
              <div className="flex items-center gap-1 text-accent-400 mb-4">
                {'\n            '}
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                {'\n          '}
              </div>
              {'\n          '}
              <p className="text-zinc-300 text-sm leading-relaxed break-keep mb-5 flex-1 overflow-hidden line-clamp-5">
                {
                  '"응대부터\n            촬영까지 내내 친절하셨습니다. 긴장을 풀어주는 편안한 분위기 덕분에\n            자연스러운 표정이 나왔고, 결과물도 기대 이상으로 만족스러웠어요. 정말 감사합니다."'
                }
              </p>
              {'\n          '}
              <div className="flex items-center gap-3 mt-auto">
                {'\n            '}
                <SourceImage
                  name="스타일링 포트폴리오 2.png"
                  sizes={sourceImageSizes.reviewAvatar}
                  thumbnail
                  className="w-10 h-10 rounded-full object-cover object-top"
                  loading="lazy"
                  decoding="async"
                  alt=""
                />
                {'\n            '}
                <div>
                  {'\n              '}
                  <p className="text-white text-sm font-semibold">{'상냥한고래8226'}</p>
                  {'\n              '}
                  <p className="text-zinc-500 text-xs">{'맨즈픽 실제 고객 · Kmong'}</p>
                  {'\n            '}
                </div>
                {'\n          '}
              </div>
              {'\n        '}
            </div>
            {'\n        '}
            <div
              className="glass rounded-2xl p-6 w-[340px] h-[260px] mr-5 flex-shrink-0 flex flex-col overflow-hidden"
              aria-hidden="true"
            >
              {'\n          '}
              <div className="flex items-center gap-1 text-accent-400 mb-4">
                {'\n            '}
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                {'\n          '}
              </div>
              {'\n          '}
              <p className="text-zinc-300 text-sm leading-relaxed break-keep mb-5 flex-1 overflow-hidden line-clamp-5">
                {
                  '"정말\n            좋았습니다. 촬영 전 코디 가이드부터 당일 포즈 디렉팅, 보정본까지\n            하나하나 꼼꼼하게 챙겨주셔서 남자 혼자 준비할 부담이 전혀 없었고 결과물도 아주 만족스러웠습니다."'
                }
              </p>
              {'\n          '}
              <div className="flex items-center gap-3 mt-auto">
                {'\n            '}
                <SourceImage
                  name="스타일링 포트폴리오 4.png"
                  sizes={sourceImageSizes.reviewAvatar}
                  thumbnail
                  className="w-10 h-10 rounded-full object-cover object-top"
                  loading="lazy"
                  decoding="async"
                  alt=""
                />
                {'\n            '}
                <div>
                  {'\n              '}
                  <p className="text-white text-sm font-semibold">{'빠른사랑꾼4022'}</p>
                  {'\n              '}
                  <p className="text-zinc-500 text-xs">{'맨즈픽 실제 고객 · Kmong'}</p>
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
        {'\n\n    '}
        {'\n    '}
        <div className="marquee-row marquee-mask overflow-hidden mt-5">
          {'\n      '}
          <div className="marquee-track-reverse flex w-max">
            {'\n        '}
            <div className="glass rounded-2xl p-6 w-[340px] h-[260px] mr-5 flex-shrink-0 flex flex-col overflow-hidden">
              {'\n          '}
              <div className="flex items-center gap-1 text-accent-400 mb-4">
                {'\n            '}
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                {'\n          '}
              </div>
              {'\n          '}
              <p className="text-zinc-300 text-sm leading-relaxed break-keep mb-5 flex-1 overflow-hidden line-clamp-5">
                {
                  '"프로필 사진\n            촬영이 처음이라 긴장하고 갔는데, 생각보다 훨씬 편하게 촬영할 수\n            있었어요. 자연스러운 디렉팅과 과하지 않은 보정이 정말 좋았습니다."'
                }
              </p>
              {'\n          '}
              <div className="flex items-center gap-3 mt-auto">
                {'\n            '}
                <SourceImage
                  name="스타일링 포트폴리오 8.png"
                  sizes={sourceImageSizes.reviewAvatar}
                  thumbnail
                  className="w-10 h-10 rounded-full object-cover object-top"
                  loading="lazy"
                  decoding="async"
                  alt=""
                />
                {'\n            '}
                <div>
                  {'\n              '}
                  <p className="text-white text-sm font-semibold">{'대범한떡갈나무4373'}</p>
                  {'\n              '}
                  <p className="text-zinc-500 text-xs">{'맨즈픽 실제 고객 · Kmong'}</p>
                  {'\n            '}
                </div>
                {'\n          '}
              </div>
              {'\n        '}
            </div>
            {'\n        '}
            <div className="glass rounded-2xl p-6 w-[340px] h-[260px] mr-5 flex-shrink-0 flex flex-col overflow-hidden">
              {'\n          '}
              <div className="flex items-center gap-1 text-accent-400 mb-4">
                {'\n            '}
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                {'\n          '}
              </div>
              {'\n          '}
              <p className="text-zinc-300 text-sm leading-relaxed break-keep mb-5 flex-1 overflow-hidden line-clamp-5">
                {
                  '"아주 만족스러운\n            퀄리티입니다. 패션부터 스타일 피드백도 주셨고, 제일 중요한\n            사진 촬영과 편집 결과물이 굉장히 만족스럽습니다. 무제한 수정도 친절하게 잘 해주셨어요."'
                }
              </p>
              {'\n          '}
              <div className="flex items-center gap-3 mt-auto">
                {'\n            '}
                <SourceImage
                  name="스타일링 포트폴리오 9.png"
                  sizes={sourceImageSizes.reviewAvatar}
                  thumbnail
                  className="w-10 h-10 rounded-full object-cover object-top"
                  loading="lazy"
                  decoding="async"
                  alt=""
                />
                {'\n            '}
                <div>
                  {'\n              '}
                  <p className="text-white text-sm font-semibold">{'제이제이125'}</p>
                  {'\n              '}
                  <p className="text-zinc-500 text-xs">{'맨즈픽 실제 고객 · Kmong'}</p>
                  {'\n            '}
                </div>
                {'\n          '}
              </div>
              {'\n        '}
            </div>
            {'\n        '}
            <div className="glass rounded-2xl p-6 w-[340px] h-[260px] mr-5 flex-shrink-0 flex flex-col overflow-hidden">
              {'\n          '}
              <div className="flex items-center gap-1 text-accent-400 mb-4">
                {'\n            '}
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                {'\n          '}
              </div>
              {'\n          '}
              <p className="text-zinc-300 text-sm leading-relaxed break-keep mb-5 flex-1 overflow-hidden line-clamp-5">
                {
                  '"두 번째\n            이용인데 역시나 만족스럽습니다. 지난번과는 또 다른 분위기의 컷으로\n            새롭게 담아주셔서, 이제는 프로필 사진이 필요할 때마다 자연스럽게 이곳을 먼저 찾게 됩니다."'
                }
              </p>
              {'\n          '}
              <div className="flex items-center gap-3 mt-auto">
                {'\n            '}
                <SourceImage
                  name="스타일링 포트폴리오 6.png"
                  sizes={sourceImageSizes.reviewAvatar}
                  thumbnail
                  className="w-10 h-10 rounded-full object-cover object-top"
                  loading="lazy"
                  decoding="async"
                  alt=""
                />
                {'\n            '}
                <div>
                  {'\n              '}
                  <p className="text-white text-sm font-semibold">{'듬직한캥거루5417'}</p>
                  {'\n              '}
                  <p className="text-zinc-500 text-xs">{'맨즈픽 실제 고객 · Kmong'}</p>
                  {'\n            '}
                </div>
                {'\n          '}
              </div>
              {'\n        '}
            </div>
            {'\n        '}
            <div className="glass rounded-2xl p-6 w-[340px] h-[260px] mr-5 flex-shrink-0 flex flex-col overflow-hidden">
              {'\n          '}
              <div className="flex items-center gap-1 text-accent-400 mb-4">
                {'\n            '}
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                {'\n          '}
              </div>
              {'\n          '}
              <p className="text-zinc-300 text-sm leading-relaxed break-keep mb-5 flex-1 overflow-hidden line-clamp-5">
                {
                  '"맘에 드는 사진\n            여러 컷 건지고 갑니다. 어떤 포즈와 각도가 저한테 어울릴지\n            세심하게 봐주셔서 촬영 내내 편안했고, 보정까지 과하지 않아서 결과물이 정말 자연스럽게 나왔어요."'
                }
              </p>
              {'\n          '}
              <div className="flex items-center gap-3 mt-auto">
                {'\n            '}
                <SourceImage
                  name="스타일링 포트폴리오 7.png"
                  sizes={sourceImageSizes.reviewAvatar}
                  thumbnail
                  className="w-10 h-10 rounded-full object-cover object-top"
                  loading="lazy"
                  decoding="async"
                  alt=""
                />
                {'\n            '}
                <div>
                  {'\n              '}
                  <p className="text-white text-sm font-semibold">{'저돌적인잉어2662'}</p>
                  {'\n              '}
                  <p className="text-zinc-500 text-xs">{'맨즈픽 실제 고객 · Kmong'}</p>
                  {'\n            '}
                </div>
                {'\n          '}
              </div>
              {'\n        '}
            </div>
            {'\n        '}
            <div className="glass rounded-2xl p-6 w-[340px] h-[260px] mr-5 flex-shrink-0 flex flex-col overflow-hidden">
              {'\n          '}
              <div className="flex items-center gap-1 text-accent-400 mb-4">
                {'\n            '}
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                {'\n          '}
              </div>
              {'\n          '}
              <p className="text-zinc-300 text-sm leading-relaxed break-keep mb-5 flex-1 overflow-hidden line-clamp-5">
                {
                  '"친절하고\n            정성스럽게 작업해주셨습니다. 처음 찍어보는 프로필이라 걱정이 많았는데\n            편안한 분위기와 꼼꼼한 디렉팅 덕분에 자연스러운 사진을 많이 건질 수 있었어요. 감사합니다!"'
                }
              </p>
              {'\n          '}
              <div className="flex items-center gap-3 mt-auto">
                {'\n            '}
                <SourceImage
                  name="스타일링 포트폴리오 10.png"
                  sizes={sourceImageSizes.reviewAvatar}
                  thumbnail
                  className="w-10 h-10 rounded-full object-cover object-top"
                  loading="lazy"
                  decoding="async"
                  alt=""
                />
                {'\n            '}
                <div>
                  {'\n              '}
                  <p className="text-white text-sm font-semibold">{'보들보들한가을4415'}</p>
                  {'\n              '}
                  <p className="text-zinc-500 text-xs">{'맨즈픽 실제 고객 · Kmong'}</p>
                  {'\n            '}
                </div>
                {'\n          '}
              </div>
              {'\n        '}
            </div>
            {'\n        '}
            {'\n        '}
            <div
              className="glass rounded-2xl p-6 w-[340px] h-[260px] mr-5 flex-shrink-0 flex flex-col overflow-hidden"
              aria-hidden="true"
            >
              {'\n          '}
              <div className="flex items-center gap-1 text-accent-400 mb-4">
                {'\n            '}
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                {'\n          '}
              </div>
              {'\n          '}
              <p className="text-zinc-300 text-sm leading-relaxed break-keep mb-5 flex-1 overflow-hidden line-clamp-5">
                {
                  '"프로필 사진\n            촬영이 처음이라 긴장하고 갔는데, 생각보다 훨씬 편하게 촬영할 수\n            있었어요. 자연스러운 디렉팅과 과하지 않은 보정이 정말 좋았습니다."'
                }
              </p>
              {'\n          '}
              <div className="flex items-center gap-3 mt-auto">
                {'\n            '}
                <SourceImage
                  name="스타일링 포트폴리오 8.png"
                  sizes={sourceImageSizes.reviewAvatar}
                  thumbnail
                  className="w-10 h-10 rounded-full object-cover object-top"
                  loading="lazy"
                  decoding="async"
                  alt=""
                />
                {'\n            '}
                <div>
                  {'\n              '}
                  <p className="text-white text-sm font-semibold">{'대범한떡갈나무4373'}</p>
                  {'\n              '}
                  <p className="text-zinc-500 text-xs">{'맨즈픽 실제 고객 · Kmong'}</p>
                  {'\n            '}
                </div>
                {'\n          '}
              </div>
              {'\n        '}
            </div>
            {'\n        '}
            <div
              className="glass rounded-2xl p-6 w-[340px] h-[260px] mr-5 flex-shrink-0 flex flex-col overflow-hidden"
              aria-hidden="true"
            >
              {'\n          '}
              <div className="flex items-center gap-1 text-accent-400 mb-4">
                {'\n            '}
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                {'\n          '}
              </div>
              {'\n          '}
              <p className="text-zinc-300 text-sm leading-relaxed break-keep mb-5 flex-1 overflow-hidden line-clamp-5">
                {
                  '"아주 만족스러운\n            퀄리티입니다. 패션부터 스타일 피드백도 주셨고, 제일 중요한\n            사진 촬영과 편집 결과물이 굉장히 만족스럽습니다. 무제한 수정도 친절하게 잘 해주셨어요."'
                }
              </p>
              {'\n          '}
              <div className="flex items-center gap-3 mt-auto">
                {'\n            '}
                <SourceImage
                  name="스타일링 포트폴리오 9.png"
                  sizes={sourceImageSizes.reviewAvatar}
                  thumbnail
                  className="w-10 h-10 rounded-full object-cover object-top"
                  loading="lazy"
                  decoding="async"
                  alt=""
                />
                {'\n            '}
                <div>
                  {'\n              '}
                  <p className="text-white text-sm font-semibold">{'제이제이125'}</p>
                  {'\n              '}
                  <p className="text-zinc-500 text-xs">{'맨즈픽 실제 고객 · Kmong'}</p>
                  {'\n            '}
                </div>
                {'\n          '}
              </div>
              {'\n        '}
            </div>
            {'\n        '}
            <div
              className="glass rounded-2xl p-6 w-[340px] h-[260px] mr-5 flex-shrink-0 flex flex-col overflow-hidden"
              aria-hidden="true"
            >
              {'\n          '}
              <div className="flex items-center gap-1 text-accent-400 mb-4">
                {'\n            '}
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                {'\n          '}
              </div>
              {'\n          '}
              <p className="text-zinc-300 text-sm leading-relaxed break-keep mb-5 flex-1 overflow-hidden line-clamp-5">
                {
                  '"두 번째\n            이용인데 역시나 만족스럽습니다. 지난번과는 또 다른 분위기의 컷으로\n            새롭게 담아주셔서, 이제는 프로필 사진이 필요할 때마다 자연스럽게 이곳을 먼저 찾게 됩니다."'
                }
              </p>
              {'\n          '}
              <div className="flex items-center gap-3 mt-auto">
                {'\n            '}
                <SourceImage
                  name="스타일링 포트폴리오 6.png"
                  sizes={sourceImageSizes.reviewAvatar}
                  thumbnail
                  className="w-10 h-10 rounded-full object-cover object-top"
                  loading="lazy"
                  decoding="async"
                  alt=""
                />
                {'\n            '}
                <div>
                  {'\n              '}
                  <p className="text-white text-sm font-semibold">{'듬직한캥거루5417'}</p>
                  {'\n              '}
                  <p className="text-zinc-500 text-xs">{'맨즈픽 실제 고객 · Kmong'}</p>
                  {'\n            '}
                </div>
                {'\n          '}
              </div>
              {'\n        '}
            </div>
            {'\n        '}
            <div
              className="glass rounded-2xl p-6 w-[340px] h-[260px] mr-5 flex-shrink-0 flex flex-col overflow-hidden"
              aria-hidden="true"
            >
              {'\n          '}
              <div className="flex items-center gap-1 text-accent-400 mb-4">
                {'\n            '}
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                {'\n          '}
              </div>
              {'\n          '}
              <p className="text-zinc-300 text-sm leading-relaxed break-keep mb-5 flex-1 overflow-hidden line-clamp-5">
                {
                  '"맘에 드는 사진\n            여러 컷 건지고 갑니다. 어떤 포즈와 각도가 저한테 어울릴지\n            세심하게 봐주셔서 촬영 내내 편안했고, 보정까지 과하지 않아서 결과물이 정말 자연스럽게 나왔어요."'
                }
              </p>
              {'\n          '}
              <div className="flex items-center gap-3 mt-auto">
                {'\n            '}
                <SourceImage
                  name="스타일링 포트폴리오 7.png"
                  sizes={sourceImageSizes.reviewAvatar}
                  thumbnail
                  className="w-10 h-10 rounded-full object-cover object-top"
                  loading="lazy"
                  decoding="async"
                  alt=""
                />
                {'\n            '}
                <div>
                  {'\n              '}
                  <p className="text-white text-sm font-semibold">{'저돌적인잉어2662'}</p>
                  {'\n              '}
                  <p className="text-zinc-500 text-xs">{'맨즈픽 실제 고객 · Kmong'}</p>
                  {'\n            '}
                </div>
                {'\n          '}
              </div>
              {'\n        '}
            </div>
            {'\n        '}
            <div
              className="glass rounded-2xl p-6 w-[340px] h-[260px] mr-5 flex-shrink-0 flex flex-col overflow-hidden"
              aria-hidden="true"
            >
              {'\n          '}
              <div className="flex items-center gap-1 text-accent-400 mb-4">
                {'\n            '}
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                <SourceIcon name="solar/star-bold" />
                {'\n          '}
              </div>
              {'\n          '}
              <p className="text-zinc-300 text-sm leading-relaxed break-keep mb-5 flex-1 overflow-hidden line-clamp-5">
                {
                  '"친절하고\n            정성스럽게 작업해주셨습니다. 처음 찍어보는 프로필이라 걱정이 많았는데\n            편안한 분위기와 꼼꼼한 디렉팅 덕분에 자연스러운 사진을 많이 건질 수 있었어요. 감사합니다!"'
                }
              </p>
              {'\n          '}
              <div className="flex items-center gap-3 mt-auto">
                {'\n            '}
                <SourceImage
                  name="스타일링 포트폴리오 10.png"
                  sizes={sourceImageSizes.reviewAvatar}
                  thumbnail
                  className="w-10 h-10 rounded-full object-cover object-top"
                  loading="lazy"
                  decoding="async"
                  alt=""
                />
                {'\n            '}
                <div>
                  {'\n              '}
                  <p className="text-white text-sm font-semibold">{'보들보들한가을4415'}</p>
                  {'\n              '}
                  <p className="text-zinc-500 text-xs">{'맨즈픽 실제 고객 · Kmong'}</p>
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
      <section className="relative py-12 md:py-16 lg:py-20 border-y border-white/5 bg-gradient-to-b from-transparent via-accent-500/[0.03] to-transparent">
        {'\n    '}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {'\n      '}
          <p className="reveal text-accent-400 text-xs font-bold uppercase tracking-[0.2em] mb-5 flex items-center justify-center gap-3">
            {'\n        '}
            <span className="w-8 h-px bg-accent-400"></span>
            {'\n        이제 당신의 차례\n        '}
            <span className="w-8 h-px bg-accent-400"></span>
            {'\n      '}
          </p>
          {'\n      '}
          <h2
            className="reveal font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-white leading-[1.15] break-keep"
            style={{ transitionDelay: '80ms' } as CSSProperties}
          >
            {'\n        1,127명이 이미 선택했습니다.'}
            <br />
            {'\n        '}
            <span className="text-accent-400">{'다음은 당신 차례입니다.'}</span>
            {'\n      '}
          </h2>
          {'\n      '}
          <p
            className="reveal text-sm md:text-base text-zinc-400 mt-5 break-keep"
            style={{ transitionDelay: '160ms' } as CSSProperties}
          >
            {'\n        당신에게 가장 잘 맞는 패키지를 아래에서 확인하세요.\n      '}
          </p>
          {'\n      '}
          <a
            href="/recommend"
            className="reveal mt-8 inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-bold text-sm px-6 py-3 rounded-full transition-all duration-200 shadow-lg shadow-accent-500/20"
            style={{ transitionDelay: '220ms' } as CSSProperties}
          >
            {'\n        '}
            <SourceIcon name="solar/magic-stick-3-bold" className="text-base" />
            {'\n        나에게 맞는 패키지 찾기\n        '}
            <SourceIcon name="solar/arrow-right-linear" className="text-base" />
            {'\n      '}
          </a>
          {'\n      '}
          <p
            className="reveal text-xs text-zinc-600 mt-3"
            style={{ transitionDelay: '280ms' } as CSSProperties}
          >
            {'30초면 끝나요!'}
          </p>
          {'\n      '}
          <div
            className="reveal mt-6 inline-flex items-center gap-2 text-zinc-500 text-sm"
            style={{ transitionDelay: '340ms' } as CSSProperties}
          >
            {'\n        '}
            <SourceIcon name="solar/arrow-down-linear" className="animate-bounce text-base" />
            {'\n      '}
          </div>
          {'\n    '}
        </div>
        {'\n  '}
      </section>
    </>
  );
}

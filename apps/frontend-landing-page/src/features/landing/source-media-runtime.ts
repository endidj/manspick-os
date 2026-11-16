// 갤러리와 화면에 가까운 슬라이드만 사진 레지스트리와 교체 동작을 불러옵니다.
import { sourceImages, type SourceImageName } from '@manspick/design-system/assets';
import { sourceImageSizes } from './source-image-sizes';
import type { Scope } from './source-scope';

function setImageSource(image: HTMLImageElement, name: SourceImageName, sizes: string) {
  const asset = sourceImages[name];
  image.dataset.sourceImage = name;
  image.width = asset.width;
  image.height = asset.height;
  image.sizes = sizes;
  image.srcset = asset.srcSet;
  image.src = asset.src;
}

export function renderTeamGallery(scope: Scope, key: string | undefined) {
  const teams = {
    influencer: { eyebrow: 'Fashion', title: '인플루언서팀', prefix: 'team-influencer' },
    retouch: { eyebrow: 'Retouching', title: '보정팀', prefix: 'team-retouch' },
    hair: { eyebrow: 'Hair & Design', title: '헤어/패션디자이너팀', prefix: 'team-hair' },
  };
  const team = teams[key as keyof typeof teams];
  const grid = scope.query('#team-modal-grid');
  const title = scope.query('#team-modal-title');
  const eyebrow = scope.query('#team-modal-eyebrow');
  if (!team || !grid || !title || !eyebrow) return false;
  let sources = Array.from({ length: 9 }, (_, index) => {
    const extension = key === 'influencer' && index === 6 ? 'JPG' : 'jpg';
    return `${team.prefix}-${index + 1}.${extension}`;
  });
  if (key === 'retouch') {
    const pool = Array.from({ length: 12 }, (_, index) => `스타일링 포트폴리오 ${index + 1}.png`);
    for (let index = pool.length - 1; index > 0; index -= 1) {
      const random = Math.floor(Math.random() * (index + 1));
      [pool[index], pool[random]] = [pool[random], pool[index]];
    }
    sources = pool.slice(0, 9);
  }
  const frames = sources.map((filename, index) => {
    const frame = document.createElement('div');
    frame.className = 'relative aspect-square overflow-hidden bg-zinc-900';
    const image = document.createElement('img');
    image.alt = `${team.title} 작업물 ${index + 1}`;
    image.className =
      'w-full h-full object-cover transition-transform duration-500 hover:scale-105';
    image.loading = 'lazy';
    image.decoding = 'async';
    setImageSource(image, filename as SourceImageName, sourceImageSizes.gallery);
    frame.appendChild(image);
    return frame;
  });
  title.textContent = team.title;
  eyebrow.textContent = team.eyebrow;
  grid.replaceChildren(...frames);
  return true;
}

export function createImageRotation(scope: Scope, image: HTMLImageElement) {
  const sources: SourceImageName[] = [
    'team-influencer-3.jpg',
    'team-influencer-5.jpg',
    'location-3.jpg',
  ];
  const previousOpacity = image.style.opacity;
  let index = 0;
  let ready = false;
  let nextImage: HTMLImageElement | null = null;
  const prepareNext = () => {
    ready = false;
    const candidate = new Image();
    nextImage = candidate;
    candidate.decoding = 'async';
    candidate.fetchPriority = 'low';
    setImageSource(candidate, sources[(index + 1) % sources.length], sourceImageSizes.team);
    void candidate.decode().then(
      () => {
        if (scope.isActive() && nextImage === candidate) ready = true;
      },
      () => {
        if (scope.isActive() && nextImage === candidate) nextImage = null;
      },
    );
  };
  prepareNext();
  scope.cleanup(() => {
    nextImage?.removeAttribute('srcset');
    nextImage?.removeAttribute('src');
    nextImage = null;
    image.style.opacity = previousOpacity;
  });
  return () => {
    if (!ready) {
      if (!nextImage) prepareNext();
      return;
    }
    index = (index + 1) % sources.length;
    ready = false;
    image.style.opacity = '0';
    scope.later(() => {
      setImageSource(image, sources[index], sourceImageSizes.team);
      image.style.opacity = '1';
      prepareNext();
    }, 500);
  };
}

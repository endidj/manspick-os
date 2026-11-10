// 가져온 브랜드 사진 47개를 이름별로 둘러보고 실제 로딩을 확인합니다.
/* eslint-disable @next/next/no-img-element -- 이 Storybook은 Next 런타임 없이 원본 자산 로딩을 검사합니다. */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { brandImages } from './brand-images';

const meta = { title: 'Foundations/Brand images', parameters: { layout: 'padded' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllImages: Story = {
  render: () => (
    <section aria-label="피그마 브랜드 사진 전체">
      <h1>브랜드 사진 47개</h1>
      <p>
        Figma 99 Assets의 개별 사진을 가져왔습니다. PNG 원본과 해시는 패키지에 보관하고 앱에서는
        같은 크기의 WebP를 사용합니다.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))',
          gap: 16,
          marginTop: 24,
        }}
      >
        {Object.entries(brandImages).map(([name, asset]) => (
          <figure key={name} style={{ margin: 0 }}>
            <img
              {...asset}
              alt={name}
              style={{
                width: '100%',
                height: 'auto',
                aspectRatio: '3/4',
                objectFit: 'cover',
                borderRadius: 'var(--mp-radius-12)',
              }}
            />
            <figcaption style={{ fontSize: 12, marginTop: 8 }}>{name}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  ),

  play: async ({ canvasElement }) => {
    const images = within(canvasElement).getAllByRole('img') as HTMLImageElement[];
    await expect(images).toHaveLength(47);
    await Promise.all(images.map((image) => image.decode()));
    await expect(
      images.every((image) => image.naturalWidth === 540 && image.naturalHeight === 720),
    ).toBe(true);
  },
};

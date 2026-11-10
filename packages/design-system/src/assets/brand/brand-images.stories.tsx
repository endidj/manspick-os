// 시연용 브랜드 이미지 47개 항목의 렌더링과 크기를 확인합니다.
/* eslint-disable @next/next/no-img-element -- 이 Storybook은 Next 런타임 없이 이미지 로딩을 검사합니다. */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { brandImages } from './brand-images';

const meta = { title: 'Foundations/Brand images', parameters: { layout: 'padded' } } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllImages: Story = {
  render: () => (
    <section aria-label="시연용 브랜드 이미지">
      <h1>시연용 브랜드 이미지 47개 항목</h1>
      <p>모든 이미지 항목은 동일한 시연 SVG로 표시됩니다.</p>
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

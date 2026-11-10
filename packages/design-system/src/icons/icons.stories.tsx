// 아이콘 목록과 원본 SVG 파일이 빠짐없이 열리는지 확인합니다.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { Icon } from './icons';
import { FIGMA_ICON_NAMES, figmaIconManifest, iconAliases } from './manifest';
import type { IconAlias } from './manifest';

const meta = {
  title: 'Foundations/Icons',
  component: Icon,
  args: { name: 'solar/camera-bold', size: 24, label: '촬영' },
  argTypes: {
    name: { control: 'select', options: FIGMA_ICON_NAMES },
    size: { control: { type: 'number', min: 8, max: 96, step: 4 } },
    color: { control: 'color' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Figma 원본 SVG 53개를 파일 그대로 사용합니다. 기본 24px이며 currentColor로 색상을 상속합니다. 장식 아이콘은 보조기술에서 숨기고, 의미 있는 단독 아이콘에는 label을 제공합니다.',
      },
    },
  },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('img', { name: '촬영' })).toBeVisible();
  },
};

export const AllFigmaIcons: Story = {
  render: () => (
    <section aria-label="피그마 원본 아이콘 전체">
      <h1>Figma 원본 아이콘 53개</h1>
      <p>
        Solar 51개 · Remix Icon 1개 · Material Design Icons 1개. SVG 원본과 24×24 viewBox를
        보존했습니다.
      </p>
      <ul
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 12,
          padding: 0,
          listStyle: 'none',
        }}
      >
        {FIGMA_ICON_NAMES.map((name) => (
          <li
            key={name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 16,
              border: '1px solid var(--border)',
              borderRadius: 8,
            }}
          >
            <Icon name={name} label={name} />
            <code style={{ fontSize: 11, overflowWrap: 'anywhere' }}>{name}</code>
          </li>
        ))}
      </ul>
    </section>
  ),

  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole('img')).toHaveLength(53);
    const loaded = await Promise.all(
      FIGMA_ICON_NAMES.map(async (name) => {
        const response = await fetch(figmaIconManifest[name]);
        const source = await response.text();
        const svg = new DOMParser().parseFromString(source, 'image/svg+xml').documentElement;
        if (
          !response.ok ||
          svg.localName !== 'svg' ||
          svg.getAttribute('viewBox') !== '0 0 24 24'
        ) {
          throw new Error(`${name}: SVG could not load with its original 24×24 viewBox`);
        }
        return true;
      }),
    );
    await expect(loaded).toEqual(Array.from({ length: 53 }, () => true));
  },
};

export const CompatibilityAliases: Story = {
  render: () => (
    <section aria-label="기존 아이콘 이름 호환">
      <h1>기존 API 이름 20개</h1>
      <p>
        원본에 대응하는 별칭 15개와 기존 도형을 보존한 호환 아이콘 5개입니다. compat/ 파일은 Figma
        원본에 포함되지 않습니다.
      </p>
      <ul style={{ display: 'grid', gap: 12, padding: 0, listStyle: 'none' }}>
        {(Object.keys(iconAliases) as IconAlias[]).map((name) => (
          <li key={name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Icon name={name} label={name} />
            <code>
              {name} → {iconAliases[name]}
            </code>
          </li>
        ))}
      </ul>
    </section>
  ),
};

export const SizesAndColors: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      {[16, 20, 24, 32, 48].map((size) => (
        <div key={size} style={{ display: 'grid', justifyItems: 'center', gap: 12 }}>
          <Icon
            name="solar/camera-bold"
            size={size}
            color="var(--accent)"
            label={`${size}px 촬영`}
          />
          <span>{size}px</span>
        </div>
      ))}
    </div>
  ),
};

export const Decorative: Story = {
  render: () => (
    <button type="button" className="btn">
      <Icon name="solar/camera-bold" /> 촬영 준비
    </button>
  ),

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: '촬영 준비' })).toBeVisible();
    await expect(canvas.queryByRole('img')).not.toBeInTheDocument();
  },
};

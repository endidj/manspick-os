// 색상·서체·간격의 표시와 로컬 폰트 로딩을 확인합니다.
import type { CSSProperties, ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { primitiveTokens, radii, semanticTokens, spacing, typography } from '../tokens';
import '../styles/tokens.css';
import '../styles/fonts.css';

const meta = {
  title: 'Foundations/Tokens',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Figma Foundations 캔버스에 기재된 색상·폰트·크기·간격·모서리 값입니다. 네이티브 변수 바인딩을 추출한 결과가 아닙니다. CSS 이름과 semantic/component 매핑, 행간·자간은 구현 보완입니다.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const catalogueStyle: CSSProperties = {
  display: 'grid',
  gap: 'var(--mp-space-32)',
  maxWidth: 1080,
  padding: 'var(--mp-space-8)',
  color: 'var(--mp-color-text-primary)',
  fontFamily: 'var(--mp-font-body)',
};
const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
  gap: 'var(--mp-space-16)',
};
const cardStyle: CSSProperties = {
  display: 'grid',
  alignContent: 'start',
  gap: 'var(--mp-space-12)',
  minWidth: 0,
  border: '1px solid var(--mp-color-border-strong)',
  borderRadius: 'var(--mp-radius-16)',
  padding: 'var(--mp-space-16)',
  background: 'var(--mp-color-bg-surface)',
};

function Catalogue({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} style={catalogueStyle}>
      <header style={{ display: 'grid', gap: 'var(--mp-space-8)' }}>
        <h1 style={{ fontSize: 24, lineHeight: '34px' }}>{title}</h1>
        <p>디자인 기초의 색상, 서체, 간격을 확인합니다.</p>
      </header>
      {children}
    </section>
  );
}

export const Colors: Story = {
  name: '색상 · Primitive → Semantic',

  render: () => (
    <Catalogue title="색상 토큰">
      <section aria-label="Semantic colors" style={{ display: 'grid', gap: 'var(--mp-space-24)' }}>
        <h2 style={{ fontSize: 20 }}>Semantic</h2>
        {Object.entries(semanticTokens.color).map(([group, values]) => (
          <section key={group} style={{ display: 'grid', gap: 'var(--mp-space-12)' }}>
            <h3 style={{ fontSize: 17 }}>{group}</h3>
            <div style={gridStyle}>
              {Object.entries(values).map(([name, value]) => (
                <article key={name} style={cardStyle}>
                  <div
                    aria-hidden="true"
                    style={{
                      height: 64,
                      background: value,
                      border: '1px solid var(--mp-color-border-strong)',
                      borderRadius: 'var(--mp-radius-8)',
                    }}
                  />
                  <strong>
                    {group}.{name}
                  </strong>
                  <code style={{ overflowWrap: 'anywhere', fontSize: 12 }}>{value}</code>
                </article>
              ))}
            </div>
          </section>
        ))}
      </section>
      <section aria-label="Primitive colors" style={{ display: 'grid', gap: 'var(--mp-space-16)' }}>
        <h2 style={{ fontSize: 20 }}>Primitive</h2>
        <div style={gridStyle}>
          {Object.entries(primitiveTokens.color).map(([name, value]) => (
            <article key={name} style={cardStyle}>
              <div
                aria-hidden="true"
                style={{ height: 40, background: value, borderRadius: 'var(--mp-radius-8)' }}
              />
              <strong>{name}</strong>
              <code style={{ overflowWrap: 'anywhere', fontSize: 12 }}>{value}</code>
            </article>
          ))}
        </div>
      </section>
      <p>
        투명 색상은 Base 위에서 확인합니다. Tertiary는 작은 필수 안내에 바로 적용하지 않습니다.
        상태는 색과 문구를 함께 사용합니다.
      </p>
    </Catalogue>
  ),
};

export const Typography: Story = {
  name: '타이포그래피 · 자체 호스팅 폰트',

  render: () => (
    <Catalogue title="타이포그래피 11종">
      <p>
        서체·크기·굵기는 Figma 확인값입니다. 행간은 한글 가독성을 위한 임시 구현값이며 자간은 0으로
        둡니다.
      </p>
      <div style={{ display: 'grid', gap: 'var(--mp-space-16)' }}>
        {Object.entries(typography).map(([name, token]) => (
          <article key={name} style={cardStyle}>
            <h2 style={{ fontSize: 14, fontFamily: 'var(--mp-font-body)' }}>
              {token.label} · {token.family === 'body' ? 'Pretendard' : 'Geist'} · {token.weight} ·{' '}
              {token.size}px
            </h2>
            <div
              style={{
                fontFamily: `var(--mp-type-${name}-family)`,
                fontSize: `var(--mp-type-${name}-size)`,
                fontWeight: token.weight,
                lineHeight: `var(--mp-type-${name}-line-height)`,
                letterSpacing: `var(--mp-type-${name}-letter-spacing)`,
                overflowWrap: 'anywhere',
              }}
            >
              {token.family === 'display'
                ? 'MANSPICK — YOUR OWN STYLE 0123456789'
                : '나의 매력을 발견하는 시간, 맨즈픽 0123456789'}
            </div>
            <p style={{ fontSize: 12 }}>
              행간 {token.lineHeight}px · 자간 {token.letterSpacing} · {name}
            </p>
          </article>
        ))}
      </div>
      <p>
        Pretendard v1.3.9의 공식 가변 서브셋 92개 중 화면에 필요한 문자 조각만 로드합니다. Geist
        Sans v1.8.2는 약 70KB이며 폰트 원본과 OFL 원문을 함께 보관합니다.
      </p>
    </Catalogue>
  ),

  play: async () => {
    const [pretendard, geist] = await Promise.all([
      document.fonts.load('600 17px Pretendard', '나의 매력 MANSPICK 0123456789 똠뷁힣 ㄱㅏ'),
      document.fonts.load('700 32px Geist', 'MANSPICK'),
    ]);
    await expect(pretendard.length).toBeGreaterThan(0);
    await expect(geist.length).toBeGreaterThan(0);
    await expect(
      document.fonts.check('600 17px Pretendard', '나의 매력 MANSPICK 0123456789 똠뷁힣 ㄱㅏ'),
    ).toBe(true);
    await expect(document.fonts.check('700 32px Geist', 'MANSPICK')).toBe(true);
  },
};

export const SpacingAndRadii: Story = {
  name: '간격 · 모서리',

  render: () => (
    <Catalogue title="간격과 모서리">
      <section aria-label="Spacing" style={{ display: 'grid', gap: 'var(--mp-space-16)' }}>
        <h2 style={{ fontSize: 20 }}>Spacing</h2>
        {spacing.map((size) => (
          <div
            key={size}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--mp-space-16)' }}
          >
            <code style={{ width: 80, flexShrink: 0 }}>{size}px</code>
            <div
              aria-hidden="true"
              style={{
                width: `var(--mp-space-${size})`,
                height: 24,
                background: 'var(--mp-color-action-primary)',
              }}
            />
            <span style={{ fontSize: 12 }}>--mp-space-{size}</span>
          </div>
        ))}
      </section>
      <section aria-label="Radii" style={{ display: 'grid', gap: 'var(--mp-space-16)' }}>
        <h2 style={{ fontSize: 20 }}>Radius</h2>
        <div style={gridStyle}>
          {radii.map((radius) => (
            <article key={radius} style={cardStyle}>
              <div
                aria-hidden="true"
                style={{
                  width: 100,
                  height: 80,
                  borderRadius: `var(--mp-radius-${radius})`,
                  border: '2px solid var(--mp-color-border-accent)',
                  background: 'var(--mp-color-bg-accent-tint)',
                }}
              />
              <strong>{radius === 'full' ? 'full' : `${radius}px`}</strong>
              <code style={{ fontSize: 12 }}>--mp-radius-{radius}</code>
            </article>
          ))}
        </div>
      </section>
      <p>
        390px·1440px은 원본 프레임 폭입니다. 고정 지원 해상도나 breakpoint 값으로 간주하지 않습니다.
      </p>
    </Catalogue>
  ),
};

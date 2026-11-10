// 가격과 제공 항목을 보여주는 UI의 표시와 동작을 확인합니다.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { PriceCard } from './price-card';
import { Button } from '../button';
import { expect, within } from 'storybook/test';
const meta = {
  title: 'Components/PriceCard',
  component: PriceCard,
  args: {
    title: '하이브리드',
    description: '스타일링과 촬영을 함께',
    price: '160,000',
    priceSuffix: '원',
    features: ['스타일링 컨설팅', '사진 촬영', '보정본 7장'],
    recommendation: '추천',
    action: <Button fullWidth>이 옵션 선택하기</Button>,
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 360, paddingTop: 20 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PriceCard>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('추천')).toHaveStyle({
      backgroundColor: 'rgb(45, 118, 246)',
      color: 'rgb(255, 255, 255)',
    });
  },
};

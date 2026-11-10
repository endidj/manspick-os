// 날짜 한 칸의 선택 상태를 표시하는 UI의 표시와 동작을 확인합니다.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DateCell } from './date-cell';
import { expect, within } from 'storybook/test';

const Stack = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>{children}</div>
);

const meta = {
  title: 'Components/DateCell',
  component: DateCell,
  args: { day: 14, 'aria-label': '11월 14일' },
} satisfies Meta<typeof DateCell>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const States: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: /15 ·/ })).toHaveStyle({
      backgroundColor: 'rgb(45, 118, 246)',
      color: 'rgb(255, 255, 255)',
    });
  },

  render: () => (
    <Stack>
      <DateCell day={14} aria-label="11월 14일" />
      <DateCell day={15} selected marker aria-label="11월 15일" />
      <DateCell day={16} today aria-label="11월 16일" />
      <DateCell day={17} disabled aria-label="11월 17일 예약 불가" />
    </Stack>
  ),
};

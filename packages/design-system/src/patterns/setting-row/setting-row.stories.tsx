// 설정 행의 편집 동작과 0 값 표시·좁은 화면의 줄바꿈을 확인합니다.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button } from '../../components/button';
import { SettingRow } from './setting-row';

const edit = fn();
const meta = {
  title: 'Patterns/SettingRow',
  component: SettingRow,
  args: {
    label: '예약 노출 기간',
    description: '고객이 선택할 수 있는 일정 범위',
    value: '8주',
    actions: (
      <Button size="sm" variant="ghost" onClick={edit}>
        예약 기간 편집
      </Button>
    ),
  },
  parameters: {
    docs: {
      description: {
        component:
          '이름·설명·현재 값·actions slot을 배치하는 서버 렌더 가능 패턴입니다. default/compact 밀도를 지원하고 모바일에서 줄바꿈합니다. 값 조회·편집·저장·권한은 사용하는 화면이 소유합니다.',
      },
    },
  },
} satisfies Meta<typeof SettingRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('8주')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: '예약 기간 편집' }));
    await expect(edit).toHaveBeenCalledOnce();
  },
};

export const CompactAndZero: Story = {
  args: {
    label: '난이도 가중',
    description: undefined,
    value: 0,
    density: 'compact',
    actions: undefined,
  },

  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('0', { exact: true })).toBeInTheDocument();
  },
};

export const NarrowLayout: Story = {
  args: {
    label: '긴 설정 이름도 화면 밖으로 넘치지 않도록 표시합니다',
    value: '긴 값과 설명이 표시되는 설정입니다',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 280, maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],

  play: async ({ canvasElement }) => {
    const row = within(canvasElement).getByText(
      '긴 설정 이름도 화면 밖으로 넘치지 않도록 표시합니다',
    ).parentElement?.parentElement;
    await expect(row).not.toBeNull();
    await expect(row!.scrollWidth).toBeLessThanOrEqual(row!.clientWidth);
    await expect(
      within(canvasElement).getByRole('button', { name: '예약 기간 편집' }),
    ).toBeVisible();
  },
};

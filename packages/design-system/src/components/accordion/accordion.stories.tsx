// 자주 묻는 질문을 접고 펼치는 UI의 표시와 동작을 확인합니다.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';
import { Accordion } from './accordion';
const meta = {
  title: 'Components/Accordion',
  component: Accordion,
  args: {
    title: '촬영 전 준비가 필요한가요?',
    children:
      '예약 후 전달되는 준비 체크리스트를 확인해주세요. 상세 정책과 안내 문구는 앱에서 전달합니다.',
  },
} satisfies Meta<typeof Accordion>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Keyboard: Story = {
  play: async ({ canvasElement }) => {
    const summary = canvasElement.querySelector('summary')!;
    summary.focus();
    if ('__vitest_browser_runner__' in globalThis) {
      const { userEvent: browserUserEvent } = await import('@vitest/browser/context');
      await browserUserEvent.keyboard('{Enter}');
    } else {
      // Native keyboard activation is tested above; synthetic preview events need a click.
      await userEvent.click(summary);
    }
    await expect(canvasElement.querySelector('details')).toHaveAttribute('open');
  },
};

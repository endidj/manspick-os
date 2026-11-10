// 안내 문구 복사와 수동 발송 표시를 제공하는 UI의 표시와 동작을 확인합니다.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { useState, type ComponentProps } from 'react';
import { TemplateBlock } from './template-block';
const meta = {
  title: 'Components/TemplateBlock',
  component: TemplateBlock,
  args: {
    title: '예약금 확인 안내',
    message: '안녕하세요, {고객명}님. 예약금 확인 후 다음 단계를 안내드릴게요.',
    recommendation: '발송 권장',
    onCopy: fn(),
  },
} satisfies Meta<typeof TemplateBlock>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

function Template(props: ComponentProps<typeof TemplateBlock>) {
  const [sent, setSent] = useState(false);
  return <TemplateBlock {...props} sent={sent} onSentChange={setSent} />;
}

export const Interactive: Story = {
  render: (args) => <Template {...args} />,

  play: async ({ canvasElement, args }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole('button', { name: '복사' }));
    await expect(args.onCopy).toHaveBeenCalledWith(args.message);
    await expect(c.getByRole('button', { name: '복사 완료' })).toBeVisible();
    await userEvent.click(c.getByRole('checkbox'));
    await expect(c.getByRole('checkbox')).toBeChecked();
  },
};
export const CopyFailure: Story = {
  args: {
    onCopy: fn(async () => {
      throw new Error('Clipboard unavailable');
    }),
  },

  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole('button', { name: '복사' }));
    await expect(c.getByRole('status')).toHaveTextContent('복사하지 못했습니다.');
  },
};

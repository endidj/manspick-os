// 준비 항목의 완료 상태를 표시하는 UI의 표시와 동작을 확인합니다.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { useState } from 'react';
import { CheckItem } from './check-item';
const meta = {
  title: 'Components/CheckItem',
  component: CheckItem,
  args: { label: '촬영 준비사항 확인', description: '촬영 전 준비할 내용을 확인해주세요.' },
} satisfies Meta<typeof CheckItem>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

function Checklist() {
  const [done, setDone] = useState(false);
  return (
    <CheckItem
      label="촬영 준비사항 확인"
      description="준비물을 체크해주세요."
      completed={done}
      onClick={() => setDone(!done)}
    />
  );
}

export const Interactive: Story = {
  render: () => <Checklist />,

  play: async ({ canvasElement }) => {
    const b = within(canvasElement).getByRole('button');
    await userEvent.click(b);
    await expect(b).toHaveAttribute('aria-pressed', 'true');
  },
};

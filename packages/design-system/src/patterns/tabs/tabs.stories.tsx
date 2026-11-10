// 관리자 여백의 탭도 기존 키보드 이동·선택·실제 panel 연결을 유지하는지 검사합니다.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Tabs } from './tabs';

const meta = {
  title: 'Patterns/Tabs',
  component: Tabs,
  args: {
    label: '운영 설정',
    value: 'places',

    onValueChange: () => undefined,

    items: [],
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

function AdminTabs() {
  const [value, setValue] = useState('places');
  return (
    <Tabs
      label="운영 설정"
      variant="flush"
      value={value}
      onValueChange={setValue}
      items={[
        { value: 'places', label: '동네 · 장소', content: <p>동네와 만남 장소</p> },
        { value: 'disabled', label: '사용 불가', content: null, disabled: true },
        { value: 'account', label: '계좌', content: <p>입금 계좌 설정</p> },
      ]}
    />
  );
}

export const Flush: Story = {
  render: () => <AdminTabs />,

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const places = canvas.getByRole('tab', { name: '동네 · 장소' });
    const account = canvas.getByRole('tab', { name: '계좌' });
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent('동네와 만남 장소');
    await userEvent.click(places);
    await userEvent.keyboard('{ArrowRight}');
    await expect(account).toHaveFocus();
    await expect(places).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{Enter}');
    await expect(account).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent('입금 계좌 설정');
    await expect(canvas.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', account.id);
    await expect(account).toHaveAttribute('aria-controls', canvas.getByRole('tabpanel').id);
    await expect(canvas.getByText('동네와 만남 장소')).not.toBeVisible();
    await expect(places).toHaveStyle({ color: 'rgb(161, 161, 170)' });
  },
};

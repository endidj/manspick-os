// 예약 시간의 선택 가능 여부를 표시하는 UI의 표시와 동작을 확인합니다.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { useState } from 'react';
import { TimeSlot } from './time-slot';

const Stack = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>{children}</div>
);

const meta = {
  title: 'Components/TimeSlot',
  component: TimeSlot,
  args: { label: '10:00' },
} satisfies Meta<typeof TimeSlot>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

function Selection() {
  const [value, setValue] = useState('11:00');
  return (
    <Stack>
      {['10:00', '11:00', '12:00'].map((time) => (
        <TimeSlot
          key={time}
          label={time}
          selected={value === time}
          onClick={() => setValue(time)}
        />
      ))}
      <TimeSlot label="13:00" availability="booked" />
    </Stack>
  );
}

export const States: Story = {
  render: () => <Selection />,

  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole('button', { name: '10:00' }));
    await expect(c.getByRole('button', { name: '10:00' })).toHaveAttribute('aria-pressed', 'true');
    await expect(c.getByRole('button', { name: '10:00' })).toHaveStyle({
      backgroundColor: 'rgb(45, 118, 246)',
      color: 'rgb(255, 255, 255)',
    });
    await expect(c.getByRole('button', { name: /13:00/ })).toBeDisabled();
  },
};

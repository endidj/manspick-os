// 크기와 상태를 갖춘 공통 버튼을 그리는 UI의 표시와 동작을 확인합니다.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button } from './button';
import { Icon } from '../../icons';

const Stack = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>{children}</div>
);

const meta = {
  title: 'Components/Button',
  component: Button,
  args: { children: '다음 단계로', onClick: fn() },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button');
    // 승인된 대비 예외가 다른 색상으로 넓어지지 않도록 원본 조합을 확인합니다.
    await expect(button).toHaveStyle({
      backgroundColor: 'rgb(45, 118, 246)',
      color: 'rgb(255, 255, 255)',
    });
    await expect(button).toHaveAttribute('data-contrast-exception', 'figma-blue500');
  },
};
export const Variants: Story = {
  render: () => (
    <Stack>
      {(['primary', 'secondary', 'kakao', 'ghost', 'danger'] as const).map((variant) => (
        <Button
          key={variant}
          variant={variant}
          leadingIcon={variant === 'kakao' ? <Icon name="ri/kakao-talk-fill" /> : undefined}
        >
          {variant === 'kakao' ? '카카오로 문의하기' : variant}
        </Button>
      ))}
    </Stack>
  ),
};
export const Loading: Story = {
  args: { loading: true, children: '저장 중' },

  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button')).toBeDisabled();
  },
};
export const Keyboard: Story = {
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button');
    button.focus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

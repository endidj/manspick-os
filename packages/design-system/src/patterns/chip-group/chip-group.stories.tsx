// 칩의 여러 값 선택·키보드·제거·비활성과 알 수 없는 기존 선택값을 확인합니다.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { ChipGroup } from './chip-group';

const options = [
  { value: 'one', label: '원' },
  { value: 'hybrid', label: '하이브리드' },
  { value: 'allday', label: '올데이', disabled: true },
];
const meta = {
  title: 'Patterns/ChipGroup',
  component: ChipGroup,
  args: { label: '상품', value: [], options, onValueChange: fn() },
  parameters: {
    docs: {
      description: {
        component:
          'select는 여러 항목의 선택, remove는 선택 항목의 제거를 제공합니다. 필수 label은 hideLabel로 시각적으로만 숨깁니다. remove는 알 수 없는 저장값도 표시합니다. 조건 판단·다이얼로그·저장은 앱 책임입니다.',
      },
    },
  },
} satisfies Meta<typeof ChipGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

function SelectionExample({ onChange }: { onChange: (value: string[]) => void }) {
  const [value, setValue] = useState<string[]>([]);
  return (
    <ChipGroup
      label="상품"
      options={options}
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

export const Select: Story = {
  render: (args) => <SelectionExample onChange={args.onValueChange} />,

  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const one = canvas.getByRole('button', { name: '원' });
    const hybrid = canvas.getByRole('button', { name: '하이브리드' });
    await userEvent.click(one);
    await expect(one).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(hybrid);
    await expect(args.onValueChange).toHaveBeenLastCalledWith(['one', 'hybrid']);
    await userEvent.unhover(hybrid);
    await waitFor(() =>
      expect(hybrid).toHaveStyle({
        backgroundColor: 'rgb(45, 118, 246)',
        color: 'rgb(255, 255, 255)',
      }),
    );
    one.focus();
    await userEvent.keyboard(' ');
    await expect(one).toHaveAttribute('aria-pressed', 'false');
    await expect(args.onValueChange).toHaveBeenLastCalledWith(['hybrid']);
    await userEvent.click(canvas.getByRole('button', { name: '올데이' }));
    await expect(args.onValueChange).toHaveBeenCalledTimes(3);
  },
};

function RemovalExample({ onChange }: { onChange: (value: string[]) => void }) {
  const [value, setValue] = useState(['one', 'old-package']);
  return (
    <ChipGroup
      label="선택한 상품"
      hideLabel
      mode="remove"
      options={options}
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

export const RemoveAndUnknownValue: Story = {
  render: (args) => <RemovalExample onChange={args.onValueChange} />,

  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('group', { name: '선택한 상품' })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: '선택한 상품 old-package 제거' }));
    await expect(args.onValueChange).toHaveBeenLastCalledWith(['one']);
    await expect(
      canvas.queryByRole('button', { name: '선택한 상품 old-package 제거' }),
    ).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: '선택한 상품 원 제거' }));
    await expect(args.onValueChange).toHaveBeenLastCalledWith([]);
  },
};

export const Disabled: Story = {
  args: { value: ['one'], disabled: true },

  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole('button', { name: '원' });
    await expect(button).toBeDisabled();
    await userEvent.click(button);
    await expect(args.onValueChange).not.toHaveBeenCalled();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
  },
};

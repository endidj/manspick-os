// 토글의 상태·라벨·키보드·비활성과 native 폼 값 전달을 확인합니다.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button } from '../button';
import { Switch } from './switch';

const meta = {
  title: 'Components/Switch',
  component: Switch,
  args: { label: '고객에게 노출', checked: false, onCheckedChange: fn() },
  parameters: {
    docs: {
      description: {
        component:
          '관리자 I-6 상품 화면에서 추출한 36×20 토글입니다. checked/onCheckedChange로 제어하고 저장·권한·로딩은 앱에서 처리합니다. label은 필수이며 hideLabel은 시각적으로만 숨깁니다. className은 라벨 컨테이너에, 나머지 native 속성과 ref는 input에 전달합니다.',
      },
    },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('switch', { name: '고객에게 노출' });
    await expect(input).not.toBeChecked();
    await expect(input).toHaveStyle({
      width: '36px',
      height: '20px',
      backgroundColor: 'rgb(28, 28, 31)',
    });
  },
};

export const On: Story = {
  args: { checked: true },

  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('switch');
    await expect(input).toBeChecked();
    await expect(input).toHaveStyle({ backgroundColor: 'rgb(45, 118, 246)' });
    await expect(getComputedStyle(input, '::after').backgroundColor).toBe('rgb(255, 255, 255)');
  },
};

function InteractiveExample({ onChange }: { onChange: (checked: boolean) => void }) {
  const [checked, setChecked] = useState(false);
  return (
    <>
      <Switch
        label="고객에게 노출"
        checked={checked}
        onCheckedChange={(value) => {
          setChecked(value);
          onChange(value);
        }}
      />
      <Switch label="변경 불가" checked={false} disabled onCheckedChange={onChange} />
      <Button variant="secondary" size="sm">
        다음 항목
      </Button>
    </>
  );
}

export const Interactive: Story = {
  render: (args) => <InteractiveExample onChange={args.onCheckedChange} />,

  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('switch', { name: '고객에게 노출' });
    await userEvent.click(canvas.getByText('고객에게 노출'));
    await expect(input).toBeChecked();
    await expect(args.onCheckedChange).toHaveBeenLastCalledWith(true);
    input.focus();
    await userEvent.keyboard(' ');
    await expect(input).not.toBeChecked();
    await expect(args.onCheckedChange).toHaveBeenLastCalledWith(false);
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: '다음 항목' })).toHaveFocus();
  },
};

export const Disabled: Story = {
  args: { checked: true, disabled: true },

  play: async ({ canvasElement, args }) => {
    const input = within(canvasElement).getByRole('switch');
    await expect(input).toBeDisabled();
    await userEvent.click(input);
    await expect(input).toBeChecked();
    await expect(args.onCheckedChange).not.toHaveBeenCalled();
  },
};

function FormExample() {
  const [checked, setChecked] = useState(true);
  return (
    <form aria-label="노출 설정">
      <Switch
        label="상품 판매 노출"
        hideLabel
        name="published"
        value="yes"
        checked={checked}
        onCheckedChange={setChecked}
      />
    </form>
  );
}

export const HiddenLabelAndForm: Story = {
  render: () => <FormExample />,

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('switch', { name: '상품 판매 노출' });
    const form = canvas.getByRole('form', { name: '노출 설정' }) as HTMLFormElement;
    await expect(new FormData(form).get('published')).toBe('yes');
    await userEvent.click(input);
    await expect(new FormData(form).has('published')).toBe(false);
  },
};

// 선택 입력의 값 변경·오류 연결·숨긴 라벨·ref와 native 폼 동작을 확인합니다.
import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button } from '../../components/button';
import { SelectField } from './select-field';

const options = [
  { value: '', label: '담당자 선택' },
  { value: 'a', label: '담당자 A' },
  { value: 'b', label: '담당자 B' },
  { value: 'unavailable', label: '선택 불가', disabled: true },
];
const meta = {
  title: 'Patterns/SelectField',
  component: SelectField,
  args: { label: '담당자', value: '', options, onValueChange: fn() },
  parameters: {
    docs: {
      description: {
        component:
          '관리자 선택 입력에서 추출한 native single select입니다. label/value/onValueChange/options, hint·error·hideLabel과 native ref/name/form 속성을 지원합니다. className은 select에 적용됩니다. 선택지와 업무 검증은 앱 책임입니다.',
      },
    },
  },
} satisfies Meta<typeof SelectField>;

export default meta;
type Story = StoryObj<typeof meta>;

function SelectionExample({ onChange }: { onChange: (value: string) => void }) {
  const [value, setValue] = useState('');
  return (
    <form aria-label="담당 설정">
      <SelectField
        label="담당자"
        name="assignee"
        value={value}
        options={options}
        required
        onValueChange={(next) => {
          setValue(next);
          onChange(next);
        }}
      />
    </form>
  );
}

export const SelectionAndForm: Story = {
  render: (args) => <SelectionExample onChange={args.onValueChange} />,

  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByRole('combobox', { name: '담당자' });
    const form = canvas.getByRole('form', { name: '담당 설정' }) as HTMLFormElement;
    await expect(select).toBeRequired();
    await expect(canvas.getByRole('option', { name: '선택 불가' })).toBeDisabled();
    await userEvent.selectOptions(select, 'b');
    await expect(select).toHaveValue('b');
    await expect(args.onValueChange).toHaveBeenLastCalledWith('b');
    await expect(new FormData(form).get('assignee')).toBe('b');
    await expect(select).toHaveStyle({ minHeight: '40px' });
  },
};

export const HintAndError: Story = {
  args: {
    hint: '가능한 담당자를 선택해주세요.',
    error: '담당자가 필요합니다.',
    'aria-describedby': 'select-external-note',
  },

  render: (args) => (
    <>
      <p id="select-external-note">외부 안내</p>
      <SelectField {...args} />
    </>
  ),

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByRole('combobox', { name: '담당자' });
    await expect(select).toHaveAttribute('aria-invalid', 'true');
    await expect(select).toHaveAccessibleDescription(
      '외부 안내 가능한 담당자를 선택해주세요. 담당자가 필요합니다.',
    );
    await expect(canvas.getByRole('alert')).toHaveTextContent('담당자가 필요합니다.');
  },
};

function HiddenLabelExample() {
  const ref = useRef<HTMLSelectElement>(null);
  const [value, setValue] = useState('a');
  return (
    <>
      <SelectField
        ref={ref}
        label="화면에 숨긴 담당자"
        hideLabel
        value={value}
        onValueChange={setValue}
        options={options}
      />
      <Button size="sm" variant="secondary" onClick={() => ref.current?.focus()}>
        선택 입력으로 이동
      </Button>
    </>
  );
}

export const HiddenLabelAndRef: Story = {
  render: () => <HiddenLabelExample />,

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: '선택 입력으로 이동' }));
    await expect(canvas.getByRole('combobox', { name: '화면에 숨긴 담당자' })).toHaveFocus();
  },
};

export const Disabled: Story = {
  args: { value: 'a', disabled: true },

  play: async ({ canvasElement, args }) => {
    const select = within(canvasElement).getByRole('combobox', { name: '담당자' });
    await expect(select).toBeDisabled();
    await userEvent.selectOptions(select, 'b');
    await expect(select).toHaveValue('a');
    await expect(args.onValueChange).not.toHaveBeenCalled();
  },
};

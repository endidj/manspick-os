// 사진의 선택·업로드·오류 상태를 보여주는 UI의 표시와 동작을 확인합니다.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { useState } from 'react';
import { PhotoTile } from './photo-tile';
const meta = {
  title: 'Components/PhotoTile',
  component: PhotoTile,
  args: { label: '촬영 후보 1번' },
  decorators: [
    (Story) => (
      <div style={{ width: 112 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PhotoTile>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

function PhotoSelection() {
  const [selected, setSelected] = useState(false);
  return (
    <PhotoTile
      label="01 · 촬영 후보 1번"
      selected={selected}
      selectionOrder={1}
      onSelectedChange={setSelected}
      footer="01"
    />
  );
}

export const Selectable: Story = {
  render: () => <PhotoSelection />,

  play: async ({ canvasElement }) => {
    const b = within(canvasElement).getByRole('button', { name: '01 · 촬영 후보 1번' });
    b.focus();
    await userEvent.keyboard(' ');
    await expect(b).toHaveAttribute('aria-pressed', 'true');
  },
};
export const Uploading: Story = { args: { status: 'uploading', progress: 42 } };
export const Failed: Story = {
  args: { status: 'error', onRetry: fn() },

  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: '다시 시도' }));
    await expect(args.onRetry).toHaveBeenCalledOnce();
  },
};
export const Private: Story = { args: { status: 'private', label: '공개 전 사진' } };

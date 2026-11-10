// 화면 상단의 브랜드와 동작을 배치하는 UI의 표시와 동작을 확인합니다.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { AppBar, AppBarBrand } from './app-bar';
import { Icon } from '../../icons';
const meta = {
  title: 'Components/AppBar',
  component: AppBar,
  args: {
    actions: (
      <a href="#contact" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Icon name="chat" size={16} />
        문의
      </a>
    ),
  },
} satisfies Meta<typeof AppBar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const LinkedBrand: Story = {
  args: {
    brand: (
      <a href="#home" aria-label="MANSPICK 홈">
        <AppBarBrand />
      </a>
    ),
    actions: null,
  },

  play: async ({ canvasElement }) => {
    const header = within(within(canvasElement).getByRole('banner'));
    const home = header.getByRole('link', { name: 'MANSPICK 홈' });
    await expect(home).toHaveTextContent('MANSPICK');
    await expect(header.getAllByRole('link')).toHaveLength(1);
    await userEvent.tab();
    await expect(home).toHaveFocus();
  },
};

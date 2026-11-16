// 화면 상단의 브랜드와 동작을 배치하는 UI의 표시와 동작을 확인합니다.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { AppBar, AppBarBrand } from './app-bar';
import { Icon } from '../../icons';
const meta = {
  title: 'Components/AppBar',
  component: AppBar,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/cDXVLqZAaWwZeyIo5pqnNl/Manspick-OS?node-id=1-3',
    },
  },
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
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('button', { name: '뒤로가기' })).toBeNull();
  },
};

export const WithBackButton: Story = {
  args: {
    onBack: fn(),
    brand: (
      <a href="#home" aria-label="MANSPICK 홈">
        <AppBarBrand />
      </a>
    ),
  },

  play: async ({ canvasElement, args }) => {
    const header = within(within(canvasElement).getByRole('banner'));
    const back = header.getByRole('button', { name: '뒤로가기' });
    const home = header.getByRole('link', { name: 'MANSPICK 홈' });
    await expect(back).toHaveAttribute('type', 'button');
    await userEvent.tab();
    await expect(back).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onBack).toHaveBeenCalledTimes(1);
    await userEvent.keyboard(' ');
    await expect(args.onBack).toHaveBeenCalledTimes(2);
    await userEvent.tab();
    await expect(home).toHaveFocus();
    await userEvent.click(back);
    await expect(args.onBack).toHaveBeenCalledTimes(3);
    await expect(home).toHaveAttribute('href', '#home');
  },
};

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

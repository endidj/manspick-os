// 메뉴의 현재 위치와 부가 정보를 표시하는 UI의 표시와 동작을 확인합니다.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { NavItem } from './nav-item';
import { Icon } from '../../icons';
const meta = {
  title: 'Components/NavItem',
  component: NavItem,
  args: { href: '#board', children: '고객 보드', icon: <Icon name="board" size={18} /> },
  decorators: [
    (Story) => (
      <nav aria-label="운영 메뉴" style={{ width: 208 }}>
        <Story />
      </nav>
    ),
  ],
} satisfies Meta<typeof NavItem>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Active: Story = {
  args: { active: true, badge: '3' },

  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('link')).toHaveAttribute('aria-current', 'page');
  },
};

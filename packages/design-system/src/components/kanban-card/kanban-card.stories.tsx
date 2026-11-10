// 운영 목록의 고객 요약과 다음 동작을 보여주는 UI의 표시와 동작을 확인합니다.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { KanbanCard } from './kanban-card';
const meta = {
  title: 'Components/KanbanCard',
  component: KanbanCard,
  args: {
    href: '#customer',
    title: '김맨즈',
    packageLabel: '하이브리드',
    status: '예약금 입금 대기',
    dateLabel: '11. 14 (토) 14:00',
    assignee: '담당 디렉터',
    nextAction: '예약금 확인',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 232 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof KanbanCard>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

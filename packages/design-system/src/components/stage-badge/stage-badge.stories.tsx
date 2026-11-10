// 앱에서 정한 업무 단계의 이름과 색상을 표시하는 UI의 표시와 동작을 확인합니다.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { StageBadge, stageBadgePresets } from './stage-badge';

const Stack = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>{children}</div>
);

const meta = {
  title: 'Components/StageBadge',
  component: StageBadge,
  args: { stage: 1, label: '옵션 선택' },
} satisfies Meta<typeof StageBadge>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const AllStages: Story = {
  render: () => (
    <Stack>
      {stageBadgePresets.map((preset) => (
        <StageBadge key={preset.stage} {...preset} />
      ))}
    </Stack>
  ),
};
export const DomainLabel: Story = { args: { stage: 2, label: '일정 확정', tone: 'blue' } };

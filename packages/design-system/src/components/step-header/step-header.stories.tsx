// 진행 제목과 전체 단계 대비 위치를 보여주는 UI의 표시와 동작을 확인합니다.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { StepHeader } from './step-header';
const meta = {
  title: 'Components/StepHeader',
  component: StepHeader,
  args: { title: '촬영 옵션 선택', current: 1, total: 7 },
} satisfies Meta<typeof StepHeader>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Complete: Story = { args: { title: '모든 준비가 끝났어요', current: 7, total: 7 } };

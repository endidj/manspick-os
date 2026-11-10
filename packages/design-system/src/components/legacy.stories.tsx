// 기존 앱에서 쓰는 공통 UI의 내용 전달과 접근성 동작을 확인합니다.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Badge, Brand, EmptyState, Field, Loading, Notice, Panel, Steps } from './index';

const meta = {
  title: 'Components/App compatibility',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const BrandNames: Story = {
  render: () => (
    <div className="row">
      <Brand />
      <Brand compact />
    </div>
  ),

  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('manspick')).toBeVisible();
  },
};

export const BadgeTones: Story = {
  render: () => (
    <div className="row">
      {(['neutral', 'blue', 'green', 'amber', 'red'] as const).map((tone) => (
        <Badge key={tone} tone={tone}>
          {tone}
        </Badge>
      ))}
    </div>
  ),

  play: async ({ canvasElement }) => {
    for (const tone of ['neutral', 'blue', 'green', 'amber', 'red']) {
      await expect(within(canvasElement).getByText(tone)).toBeVisible();
    }
  },
};

export const PanelContent: Story = {
  render: () => (
    <Panel aria-label="예약 안내">
      <h2>예약 안내</h2>
      <p>선택한 일정을 확인해주세요.</p>
    </Panel>
  ),

  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('region', { name: '예약 안내' })).toBeVisible();
    await expect(within(canvasElement).getByRole('heading', { name: '예약 안내' })).toBeVisible();
  },
};

export const FieldLabel: Story = {
  render: () => (
    <Field label="이름" hint="예약자 이름을 입력해주세요.">
      <input name="customer" />
    </Field>
  ),

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: /이름/ });
    await userEvent.type(input, '김맨즈');
    await expect(input).toHaveValue('김맨즈');
    await expect(canvas.getByText('예약자 이름을 입력해주세요.')).toBeVisible();
  },
};

export const EmptyContent: Story = {
  render: () => (
    <EmptyState
      title="아직 사진이 없어요"
      description="촬영 후 사진을 확인할 수 있어요."
      action={<button type="button">예약 보기</button>}
    />
  ),

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { name: '아직 사진이 없어요' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: '예약 보기' })).toBeEnabled();
  },
};

export const NoticeRoles: Story = {
  render: () => (
    <div className="stack">
      <Notice>일정을 확인해주세요.</Notice>
      <Notice tone="success">저장했어요.</Notice>
      <Notice tone="warning" className="preparation-warning">
        준비 안내를 먼저 확인해주세요.
      </Notice>
      <Notice tone="error">저장할 수 없어요.</Notice>
    </div>
  ),

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('status')).toHaveLength(3);
    await expect(canvas.getByText('준비 안내를 먼저 확인해주세요.')).toHaveClass(
      'preparation-warning',
    );
    await expect(canvas.getByRole('alert')).toHaveTextContent('저장할 수 없어요.');
  },
};

export const LoadingStatus: Story = {
  render: () => <Loading />,

  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('status')).toHaveTextContent('불러오는 중입니다');
  },
};

export const CurrentStep: Story = {
  render: () => <Steps active={2} labels={['예약', '설문', '촬영']} />,

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('listitem')).toHaveLength(3);
    await expect(canvas.getByText('설문').closest('li')).toHaveAttribute('aria-current', 'step');
    await expect(canvas.getByText('예약').closest('li')).not.toHaveAttribute('aria-current');
  },
};

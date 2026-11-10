// 화면에서 반복하는 입력·선택·요약 UI와 키보드 동작을 확인합니다.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../components/button';
import { ChoiceCard } from './choice-card';
import { Dialog } from './dialog';
import { InfoRow } from './info-row';
import { RadioPills } from './radio-pills';
import { SectionHeader } from './section-header';
import { StickyActionBar } from './sticky-action-bar';
import { SummaryCard } from './summary-card';
import { Tabs } from './tabs';
import { TextArea } from './text-area';
import { TextField } from './text-field';
import { UploadDropzone } from './upload-dropzone';

const meta = {
  title: 'Patterns/Screen patterns',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '고객 화면에서 반복되는 입력·선택·요약·행동 영역입니다. C1-b 52:399의 입력/결제 경로/옵션 요약/STEP 헤더/하단 버튼 구성을 바탕으로 합니다. Dialog·Tabs·UploadDropzone의 접근성 동작은 구현 보완이며 API·인증·결제 로직을 포함하지 않습니다.',
      },
    },
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const stack = { display: 'grid', gap: 'var(--mp-space-24)', maxWidth: 560 } as const;

function TextFieldExample() {
  const [name, setName] = useState('');
  const [touched, setTouched] = useState(false);
  return (
    <div style={stack}>
      <TextField
        label="성함"
        name="customerName"
        autoComplete="name"
        required
        value={name}
        onValueChange={setName}
        placeholder="성함을 입력해주세요"
        hint="촬영 안내에 사용할 이름이에요."
        onBlur={() => setTouched(true)}
        error={touched && name.trim().length < 2 ? '성함을 두 글자 이상 입력해주세요.' : undefined}
      />
      <TextField
        label="연락처"
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        value="01012345678"
        onValueChange={() => undefined}
        disabled
        hint="비활성 입력 예시입니다."
      />
    </div>
  );
}

export const TextFields: Story = {
  name: 'TextField · 라벨/안내/오류/비활성',

  render: () => <TextFieldExample />,

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const name = canvas.getByRole('textbox', { name: '성함' });
    await userEvent.type(name, '김맨즈');
    await expect(name).toHaveValue('김맨즈');
    await expect(name).toHaveAccessibleDescription('촬영 안내에 사용할 이름이에요.');
    await userEvent.clear(name);
    await userEvent.tab();
    await expect(canvas.getByRole('alert')).toHaveTextContent('성함을 두 글자 이상');
    await expect(name).toHaveAttribute('aria-invalid', 'true');
    await expect(canvas.getByRole('textbox', { name: '연락처' })).toBeDisabled();
  },
};

function TextAreaExample() {
  const [comment, setComment] = useState('');
  return (
    <div style={stack}>
      <TextArea
        label="사진별 수정 의견"
        value={comment}
        onValueChange={setComment}
        hint="원하는 부분을 구체적으로 남겨주세요."
        placeholder="예: 피부 톤을 조금 더 자연스럽게 조정해주세요."
        maxLength={200}
      />
      <output aria-label="입력 글자 수">{comment.length}/200</output>
    </div>
  );
}

export const TextAreas: Story = {
  name: 'TextArea · 여러 줄 입력',

  render: () => <TextAreaExample />,

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole('textbox', { name: '사진별 수정 의견' }), '피부 톤 조정');
    await expect(canvas.getByLabelText('입력 글자 수')).toHaveTextContent('7/200');
  },
};

function RadioPillsExample() {
  const [channel, setChannel] = useState('bank');
  return (
    <div style={stack}>
      <RadioPills
        label="결제 경로"
        name="payment-channel"
        value={channel}
        onValueChange={setChannel}
        required
        hint="이미 결제한 경우 해당 경로를 선택해주세요."
        options={[
          { value: 'bank', label: '계좌이체' },
          { value: 'kmong', label: '크몽' },
          { value: 'frip', label: '프립' },
          { value: 'soomgo', label: '숨고' },
          { value: 'smartstore', label: '스마트스토어' },
          { value: 'unavailable', label: '비활성 예시', disabled: true },
        ]}
      />
      <output aria-label="선택한 결제 경로">{channel}</output>
    </div>
  );
}

export const PaymentChannels: Story = {
  name: 'RadioPills · 결제 경로',

  render: () => <RadioPillsExample />,

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('radio', { name: '크몽' }));
    await expect(canvas.getByRole('radio', { name: '크몽' })).toBeChecked();
    await expect(canvas.getByRole('radio', { name: '계좌이체' })).not.toBeChecked();
    await expect(canvas.getByLabelText('선택한 결제 경로')).toHaveTextContent('kmong');
    await expect(canvas.getByRole('radio', { name: '비활성 예시' })).toBeDisabled();
  },
};

function ChoiceCardExample() {
  const [actor, setActor] = useState('customer');
  return (
    <fieldset style={{ border: 0, margin: 0, padding: 0, ...stack }}>
      <legend style={{ marginBottom: 16 }}>셀렉 주체</legend>
      <ChoiceCard
        name="selection-actor"
        value="customer"
        title="직접 고를게요"
        description="공개된 후보 사진에서 마음에 드는 컷을 선택해요."
        checked={actor === 'customer'}
        onCheckedChange={(checked) => {
          if (checked) setActor('customer');
        }}
      />
      <ChoiceCard
        name="selection-actor"
        value="director"
        title="디렉터에게 맡길게요"
        description="디렉터가 촬영 목적에 맞는 컷을 골라요."
        checked={actor === 'director'}
        onCheckedChange={(checked) => {
          if (checked) setActor('director');
        }}
      />
    </fieldset>
  );
}

export const ChoiceCards: Story = {
  name: 'ChoiceCard · 설명이 있는 선택',

  render: () => <ChoiceCardExample />,

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const director = canvas.getByRole('radio', { name: /디렉터에게 맡길게요/ });
    await userEvent.click(director);
    await expect(director).toBeChecked();
    await expect(canvas.getByRole('radio', { name: /직접 고를게요/ })).not.toBeChecked();
  },
};

export const SectionHeaders: Story = {
  name: 'SectionHeader · STEP/제목/설명',

  render: () => (
    <div style={stack}>
      <SectionHeader
        eyebrow="STEP 1"
        title="기본 정보를 알려주세요"
        description="촬영 안내를 받을 성함과 연락처를 입력해주세요."
      />
      <SectionHeader
        heading="h2"
        eyebrow="STEP 2"
        title="일정을 선택해주세요"
        description="예약 가능한 촬영 시간을 확인할 수 있어요."
      />
    </div>
  ),
};

export const SelectedPackage: Story = {
  name: 'SummaryCard · 선택한 옵션',

  render: () => (
    <div style={stack}>
      <SummaryCard
        label="선택한 옵션"
        value="하이브리드 · 160,000원"
        description="2시간 · 2벌 · 보정 7장"
        action={<a href="#option-change-example">변경</a>}
      />
      <p id="option-change-example">
        변경 링크의 목적지 예시입니다. 실제 옵션 이동은 앱에서 연결합니다.
      </p>
    </div>
  ),
};

export const InformationRows: Story = {
  name: 'InfoRow · 촬영 정보',

  render: () => (
    <div style={{ maxWidth: 560 }}>
      <InfoRow label="촬영 옵션" value="하이브리드" />
      <InfoRow label="촬영 시간" value="13:00–15:00" />
      <InfoRow label="추가 옵션" value="의상 대여 1벌" />
      <InfoRow label="총 금액" value={<strong>185,000원</strong>} />
    </div>
  ),
};

function ConsentExample() {
  const [service, setService] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  return (
    <div style={{ maxWidth: 560 }}>
      <div style={stack}>
        <SectionHeader
          eyebrow="STEP 1"
          title="안내 사항을 확인해주세요"
          description="필수 동의와 선택 동의는 각각 선택할 수 있어요."
        />
        <ChoiceCard
          type="checkbox"
          title="[필수] 서비스 이용 안내 동의"
          checked={service}
          onCheckedChange={setService}
        />
        <ChoiceCard
          type="checkbox"
          title="[필수] 개인정보 수집·이용 동의"
          checked={privacy}
          onCheckedChange={setPrivacy}
        />
        <ChoiceCard
          type="checkbox"
          title="[선택] 마케팅 정보 수신 동의"
          checked={marketing}
          onCheckedChange={setMarketing}
        />
        <p>동의 문구는 상호작용 예시입니다. 운영 약관·동의 버전은 앱에서 관리합니다.</p>
      </div>
      <StickyActionBar aria-label="다음 단계">
        <Button fullWidth disabled={!service || !privacy} onClick={() => setSubmitted(true)}>
          다음으로
        </Button>
        {submitted && <p role="status">다음 단계 준비됨 · 데모 동작</p>}
      </StickyActionBar>
    </div>
  );
}

export const StickyActions: Story = {
  name: 'StickyActionBar · 필수/선택 동의',

  render: () => <ConsentExample />,

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const next = canvas.getByRole('button', { name: '다음으로' });
    await expect(next).toBeDisabled();
    await userEvent.click(canvas.getByRole('checkbox', { name: /선택.*마케팅/ }));
    await expect(next).toBeDisabled();
    await userEvent.click(canvas.getByRole('checkbox', { name: /필수.*서비스/ }));
    await userEvent.click(canvas.getByRole('checkbox', { name: /필수.*개인정보/ }));
    await expect(next).toBeEnabled();
    await userEvent.click(next);
    await expect(canvas.getByRole('status')).toHaveTextContent('다음 단계 준비됨');
  },
};

function TabsExample() {
  const [value, setValue] = useState('plan');
  return (
    <div style={stack}>
      <Tabs
        label="촬영 준비 안내"
        value={value}
        onValueChange={setValue}
        items={[
          { value: 'plan', label: '촬영 설계', content: <p>컨셉과 의상 제안을 확인해주세요.</p> },
          { value: 'outfit', label: '의상 사진', content: <p>촬영에 입을 의상을 준비해주세요.</p> },
          { value: 'disabled', label: '비활성 예시', disabled: true, content: null },
          { value: 'guide', label: '준비물', content: <p>안내된 준비물을 확인해주세요.</p> },
        ]}
      />
    </div>
  );
}

export const KeyboardTabs: Story = {
  name: 'Tabs · 방향키/Enter/Home/End',

  render: () => <TabsExample />,

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const first = canvas.getByRole('tab', { name: '촬영 설계' });
    const second = canvas.getByRole('tab', { name: '의상 사진' });
    await userEvent.click(first);
    await userEvent.keyboard('{ArrowRight}');
    await expect(second).toHaveFocus();
    await expect(first).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{Enter}');
    await expect(second).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent('촬영에 입을 의상');
    await userEvent.keyboard('{End}');
    await expect(canvas.getByRole('tab', { name: '준비물' })).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect(first).toHaveFocus();
  },
};

function DialogExample() {
  const [open, setOpen] = useState(false);
  return (
    <div style={stack}>
      <Button onClick={() => setOpen(true)}>수정 안내 열기</Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="수정 요청 안내"
        description="사진별 의견을 한 번에 모아 요청할 수 있어요."
      >
        <p>
          브라우저 기본 모달이 배경 조작을 막고 포커스를 유지합니다. Escape 또는 닫기 버튼으로 나갈
          수 있어요.
        </p>
        <Button onClick={() => setOpen(false)}>확인했어요</Button>
      </Dialog>
    </div>
  );
}

export const ModalDialog: Story = {
  name: 'Dialog · 기본 모달/포커스 복귀',

  render: () => <DialogExample />,

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: '수정 안내 열기' });
    await userEvent.click(trigger);
    const dialog = await canvas.findByRole('dialog', { name: '수정 요청 안내' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAccessibleDescription(
      '사진별 의견을 한 번에 모아 요청할 수 있어요.',
    );
    await userEvent.click(within(dialog).getByRole('button', { name: '확인했어요' }));
    await waitFor(() => expect(dialog).not.toBeVisible());
    await expect(trigger).toHaveFocus();
  },
};

function UploadExample() {
  const [files, setFiles] = useState<string[]>([]);
  return (
    <div style={stack}>
      <UploadDropzone
        label="의상 사진 추가"
        accept="image/jpeg,image/png,image/webp"
        hint="JPG, PNG, WebP · 파일 검증과 업로드는 앱에서 진행해요."
        onFilesSelected={(selected) => setFiles(Array.from(selected, (file) => file.name))}
      />
      <ul aria-label="선택한 파일">
        {files.map((file) => (
          <li key={file}>{file}</li>
        ))}
      </ul>
      <UploadDropzone label="비활성 업로더" disabled onFilesSelected={() => undefined} />
    </div>
  );
}

export const FileSelection: Story = {
  name: 'UploadDropzone · 다중 파일 선택',

  render: () => <UploadExample />,

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText(/의상 사진 추가/);
    await userEvent.upload(input, [
      new File(['demo'], 'outfit-front.png', { type: 'image/png' }),
      new File(['demo'], 'outfit-back.webp', { type: 'image/webp' }),
    ]);
    await expect(canvas.getByRole('list', { name: '선택한 파일' })).toHaveTextContent(
      'outfit-front.png',
    );
    await expect(canvas.getByRole('list', { name: '선택한 파일' })).toHaveTextContent(
      'outfit-back.webp',
    );
    await expect(canvas.getByLabelText(/비활성 업로더/)).toBeDisabled();
  },
};

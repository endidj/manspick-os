// 공통 UI를 실제 화면처럼 함께 배치해 확인합니다.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
  AppBar,
  Button,
  CheckItem,
  DateCell,
  KanbanCard,
  NavItem,
  PhotoTile,
  StageBadge,
  stageBadgePresets,
  StepHeader,
  TemplateBlock,
} from './components';
import { Icon } from './icons';
import { SectionHeader } from './patterns';

const meta = {
  title: 'Overview/Design system',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function Overview() {
  const [selected, setSelected] = useState(false);
  const [completed, setCompleted] = useState(false);
  return (
    <div style={{ maxWidth: 1200, margin: 'auto', padding: '24px clamp(16px,4vw,48px) 64px' }}>
      <AppBar actions={<span>Design system · v0.1</span>} />
      <div style={{ margin: '40px 0' }}>
        <SectionHeader
          eyebrow="MANSPICK OS"
          title="공통 UI, 한 곳에서"
          description="Figma 원본 컴포넌트와 고객·운영 화면의 공통 패턴입니다."
        />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,320px),1fr))',
          gap: 24,
        }}
      >
        <section aria-label="고객 UI" style={{ display: 'grid', alignContent: 'start', gap: 16 }}>
          <StepHeader title="촬영 준비" current={4} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {stageBadgePresets.map((preset) => (
              <StageBadge key={preset.stage} {...preset} />
            ))}
          </div>
          <CheckItem
            label="촬영 준비 체크"
            description="완료한 항목을 표시해주세요."
            completed={completed}
            onClick={() => setCompleted(!completed)}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <DateCell day={14} aria-label="11월 14일" />
            <DateCell day={15} selected today aria-label="11월 15일" />
            <DateCell day={16} disabled aria-label="11월 16일 예약 불가" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            <PhotoTile
              label="촬영 후보 1번"
              selected={selected}
              onSelectedChange={setSelected}
              selectionOrder={1}
            />
            <PhotoTile label="촬영 후보 2번" />
            <PhotoTile label="촬영 후보 3번" />
          </div>
          <Button fullWidth trailingIcon={<Icon name="arrow" size={18} />}>
            다음 단계로
          </Button>
          <Button
            fullWidth
            variant="kakao"
            leadingIcon={<Icon name="ri/kakao-talk-fill" size={20} />}
          >
            카카오로 문의하기
          </Button>
        </section>
        <section aria-label="운영 UI" style={{ display: 'grid', alignContent: 'start', gap: 16 }}>
          <nav aria-label="운영 메뉴">
            <NavItem href="#board" active icon={<Icon name="board" size={18} />}>
              운영 보드
            </NavItem>
            <NavItem href="#requests" icon={<Icon name="chat" size={18} />} badge="3">
              요청함
            </NavItem>
          </nav>
          <KanbanCard
            href="#customer"
            title="김맨즈"
            packageLabel="하이브리드"
            status="촬영 준비 중"
            dateLabel="11. 14 (토) 14:00"
            assignee="담당 디렉터"
            nextAction="촬영 설계 확인"
          />
          <TemplateBlock
            title="준비 안내"
            recommendation="발송 권장"
            message="안녕하세요, {고객명}님. 촬영 준비사항을 확인해주세요."
          />
        </section>
      </div>
    </div>
  );
}

export const Catalog: Story = { render: () => <Overview /> };

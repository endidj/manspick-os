// 열림 상태에 따라 대화상자나 서랍을 띄우는 UI의 표시와 동작을 확인합니다.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../../components/button';
import { TextField } from '../text-field';
import { Dialog } from './dialog';

const meta = {
  title: 'Patterns/Dialog',
  component: Dialog,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'modal과 drawer가 같은 native dialog 접근성 동작을 사용합니다. 운영 Figma M-2 파일 링크 drawer 확인값은 너비 520, surface #141416, padding 24, gap 16, border white 16%, radius 20입니다. 전체 viewport 높이와 모바일 전체 너비는 반응형 구현 보완입니다. 링크 저장·발송·인가 기능은 포함하지 않습니다.',
      },
    },
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function DrawerExample() {
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState('');
  return (
    <div>
      <style>{'.dialog-consumer-layout { display: grid; }'}</style>
      <Button onClick={() => setOpen(true)}>파일 링크 관리 열기</Button>
      <Dialog
        className="dialog-consumer-layout"
        open={open}
        onOpenChange={setOpen}
        presentation="drawer"
        title="파일 링크 관리"
        description="고객에게 안내할 파일 링크를 확인해주세요."
        actions={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button onClick={() => setOpen(false)}>확인</Button>
          </>
        }
      >
        <TextField
          label="파일 링크"
          type="url"
          value={link}
          onValueChange={setLink}
          placeholder="https://"
          hint="이 예시에서는 값을 저장하거나 외부에 전송하지 않습니다."
        />
        <p>Escape로 닫으면 이 패널을 열었던 버튼으로 포커스가 돌아갑니다.</p>
      </Dialog>
    </div>
  );
}

export const FileLinkDrawer: Story = {
  name: 'Drawer · 파일 링크/Escape/포커스 복귀',
  args: {
    open: false,

    onOpenChange: () => undefined,

    presentation: 'drawer',
    title: '파일 링크 관리',
    children: null,
  },

  render: () => <DrawerExample />,

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: '파일 링크 관리 열기' });
    const closedDialog = canvasElement.querySelector('dialog');
    await expect(closedDialog).not.toBeVisible();
    await userEvent.click(trigger);
    const dialog = await canvas.findByRole('dialog', { name: '파일 링크 관리' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('data-presentation', 'drawer');
    await expect(dialog).toContainElement(canvasElement.ownerDocument.activeElement as HTMLElement);
    await userEvent.type(
      within(dialog).getByRole('textbox', { name: '파일 링크' }),
      'https://example.com/demo',
    );

    if ('__vitest_browser_runner__' in globalThis) {
      // Trusted provider keyboard input exercises the browser's native Escape dismissal.
      const { userEvent: browserUserEvent } = await import('@vitest/browser/context');
      await browserUserEvent.keyboard('{Escape}');
    } else {
      // The interactive preview uses synthetic events; native Escape is tested by Chromium above.
      await userEvent.click(within(dialog).getByRole('button', { name: '닫기' }));
    }

    await waitFor(() => expect(dialog).not.toBeVisible());
    await expect(trigger).toHaveFocus();
  },
};

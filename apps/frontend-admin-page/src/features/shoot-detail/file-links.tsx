// 검증된 외부 원본·결과 링크를 등록하고 서버의 고객 공개 게이트를 적용합니다.
import { useState } from 'react';
import { Button, Notice, Panel } from '@manspick/design-system/components';
import { Dialog, TextField } from '@manspick/design-system/patterns';
import type { ShootDetail } from '@manspick/contracts';
import type { PerformAction } from './use-shoot-detail';
import styles from './shoot-detail.module.css';

export function FileLinks({
  shoot,
  busy,
  perform,
}: {
  shoot: ShootDetail;
  busy: boolean;
  perform: PerformAction;
}) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<'original' | 'retouched'>('original');
  const [url, setUrl] = useState('');
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState('');
  const allowed = shoot.capabilities.includes('save_file_link');
  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        파일 링크 관리
      </Button>
      <Dialog
        presentation="drawer"
        open={open}
        onOpenChange={setOpen}
        title={`파일 · ${shoot.customerName}`}
        description="후보·보정·수정 사진은 보호된 사진 저장소에서 관리합니다. 외부 링크 자체의 공유 권한은 드라이브에서 관리합니다."
        className={styles.fileDrawer}
      >
        <div className={styles.stackSmall}>
          {shoot.fileLinks.map((link) => (
            <Panel key={link.id} className={styles.stackSmall}>
              <div className={styles.sectionHeading}>
                <strong>{link.label}</strong>
                <span>{link.publishedAt ? '고객 공개' : '직원 전용'}</span>
              </div>
              <a href={link.url} target="_blank" rel="noreferrer" className={styles.externalLink}>
                {link.url}
              </a>
              <div className={styles.row}>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(link.url);
                      setCopied('링크를 복사했습니다.');
                    } catch {
                      setCopied('복사하지 못했습니다. 링크를 직접 복사해주세요.');
                    }
                  }}
                >
                  복사
                </Button>
                {allowed && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setKind(link.kind);
                      setUrl(link.url);
                      setVisible(Boolean(link.publishedAt));
                    }}
                  >
                    교체
                  </Button>
                )}
              </div>
            </Panel>
          ))}
          {copied && <Notice>{copied}</Notice>}
          {allowed && (
            <Panel className={styles.stackSmall}>
              <label className={styles.selectField}>
                링크 종류
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value as 'original' | 'retouched')}
                >
                  <option value="original">후기 보상 원본</option>
                  <option value="retouched">외부 보정 결과</option>
                </select>
              </label>
              <TextField label="HTTPS 링크" type="url" value={url} onValueChange={setUrl} />
              <label>
                <input
                  type="checkbox"
                  checked={visible}
                  onChange={(e) => setVisible(e.target.checked)}
                />{' '}
                고객 공개
              </label>
              <Button
                size="sm"
                loading={busy}
                disabled={!url.startsWith('https://')}
                onClick={() =>
                  perform({
                    type: 'save_file_link',
                    kind,
                    label: kind === 'original' ? '후기 보상 원본' : '외부 보정 결과',
                    url,
                    visible,
                  })
                }
              >
                링크 저장
              </Button>
            </Panel>
          )}
          <Notice>후기 원본은 후기 확인 조건을 만족해야 고객에게 공개됩니다.</Notice>
        </div>
      </Dialog>
    </>
  );
}

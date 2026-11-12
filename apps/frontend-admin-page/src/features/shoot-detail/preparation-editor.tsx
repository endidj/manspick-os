// 촬영 동네·만남 장소와 준비 안내를 저장해 고객 준비 화면에 제공합니다.
import { useState } from 'react';
import { Button } from '@manspick/design-system/components';
import { Dialog, TextArea, TextField } from '@manspick/design-system/patterns';
import type { PreparationDTO, ShootDetail } from '@manspick/contracts';
import type { PerformAction } from './use-shoot-detail';
import styles from './shoot-detail.module.css';

export function PreparationEditor({
  shoot,
  busy,
  perform,
}: {
  shoot: ShootDetail;
  busy: boolean;
  perform: PerformAction;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Omit<PreparationDTO, 'confirmedAt'>>(
    shoot.preparation ?? {
      location: { area: '', meetingPlace: '', mapUrl: null, parkingNote: '', parkingUrl: null },
      hair: null,
      guides: [],
    },
  );
  const setLocation = (key: keyof PreparationDTO['location'], value: string) =>
    setDraft({
      ...draft,
      location: {
        ...draft.location,
        [key]: key === 'mapUrl' || key === 'parkingUrl' ? value || null : value,
      },
    });

  async function save() {
    if (await perform({ type: 'save_preparation', preparation: draft })) setOpen(false);
  }

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        disabled={busy || !shoot.capabilities.includes('save_preparation')}
        onClick={() => setOpen(true)}
      >
        장소·준비 안내 편집
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="촬영 장소·준비 안내"
        actions={
          <Button
            loading={busy}
            disabled={!draft.location.area.trim() || !draft.location.meetingPlace.trim()}
            onClick={save}
          >
            고객에게 안내 저장
          </Button>
        }
      >
        <div className={styles.stackSmall}>
          <TextField
            label="촬영 동네"
            value={draft.location.area}
            onValueChange={(value) => setLocation('area', value)}
          />
          <TextField
            label="만남 장소"
            value={draft.location.meetingPlace}
            onValueChange={(value) => setLocation('meetingPlace', value)}
          />
          <TextField
            label="지도 HTTPS 링크"
            value={draft.location.mapUrl ?? ''}
            onValueChange={(value) => setLocation('mapUrl', value)}
          />
          <TextArea
            label="주차 안내"
            value={draft.location.parkingNote}
            onValueChange={(value) => setLocation('parkingNote', value)}
          />
          {draft.guides.map((guide, index) => (
            <TextArea
              key={guide.id}
              label={guide.title}
              value={guide.body}
              onValueChange={(value) =>
                setDraft({
                  ...draft,
                  guides: draft.guides.map((g, i) => (i === index ? { ...g, body: value } : g)),
                })
              }
            />
          ))}
        </div>
      </Dialog>
    </>
  );
}

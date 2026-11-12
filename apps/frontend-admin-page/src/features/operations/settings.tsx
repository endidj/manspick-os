// 실제 계좌·장소·직원·준비 안내를 조회하고 관리자 설정 변경을 저장합니다.
import { useState } from 'react';
import { Button, Loading, Notice, Panel } from '@manspick/design-system/components';
import { Dialog, InfoRow, Tabs, TextArea, TextField } from '@manspick/design-system/patterns';
import type { OperationsSettingsDTO } from '@manspick/contracts';
import { money } from '@manspick/web/format';
import { PageHeading } from '../workspace/page-heading';
import { useSettings } from './use-settings';
import { SettingsHistory } from './settings-history';
import { StaffAccounts } from './staff-accounts';
import { PolicyEditor } from './policy-editor';
import type { PolicySection } from './policy-editor';
import styles from './management.module.css';

type Neighborhood = OperationsSettingsDTO['neighborhoods'][number];

export function Settings({ actorId }: { actorId: string }) {
  const settings = useSettings();
  const [tab, setTab] = useState('neighborhoods');
  const [place, setPlace] = useState<Neighborhood>();
  const [bank, setBank] = useState<NonNullable<OperationsSettingsDTO['paymentInstructions']>>();
  const [policySection, setPolicySection] = useState<PolicySection>();
  const data = settings.data;
  return (
    <div className={styles.screen}>
      <PageHeading
        eyebrow="ADMIN · 2-8"
        title="운영 설정"
        description="동네별 만남 장소 · 제휴 헤어샵, 입금 계좌, 운영 시간 값. 바꾸면 고객 화면 · 알림에 바로 반영돼요."
        actions={
          <>
            <SettingsHistory />
            <Button
              onClick={() =>
                setPlace({
                  id: '',
                  name: '',
                  meetingPlace: '',
                  mapUrl: null,
                  parkingNote: '',
                  parkingUrl: null,
                  hairPlace: '',
                  hairMapUrl: null,
                  curriculum: '',
                  active: true,
                })
              }
            >
              + 동네 추가
            </Button>
          </>
        }
      />
      {settings.error && (
        <Notice tone="error">
          {settings.error}
          <Button size="sm" variant="ghost" onClick={settings.retry}>
            다시 불러오기
          </Button>
        </Notice>
      )}
      {settings.success && <Notice tone="success">{settings.success}</Notice>}
      <Tabs
        label="운영 설정"
        value={tab}
        onValueChange={setTab}
        variant="flush"
        items={(
          [
            ['neighborhoods', '동네 · 장소'],
            ['operators', '운영자'],
            ['notifications', '준비 안내'],
            ['account', '계좌'],
          ] as const
        ).map(([value, label]) => ({
          value,
          label,
          content:
            tab === value &&
            (tab === 'operators' ? (
              <StaffAccounts actorId={actorId} />
            ) : !data ? (
              !settings.error && <Loading />
            ) : (
              <>
                {(tab === 'neighborhoods' || tab === 'account') && (
                  <div className={styles.cards}>
                    <Panel className={styles.productCard}>
                      <h2>입금 · 결제</h2>
                      <span className={styles.mapping}>계좌이체 기준</span>
                      <div className={styles.price}>
                        {data.paymentInstructions?.bankName ?? '미설정'}
                        <small>
                          {data.paymentInstructions?.accountNumber ?? '계좌를 등록해주세요'}
                        </small>
                      </div>
                      <div className={styles.facts}>
                        <InfoRow
                          label="예금주"
                          value={data.paymentInstructions?.accountHolder ?? '미설정'}
                        />
                        <InfoRow
                          label="입금 잠금"
                          value={`${data.policy.holdHours}시간 (촬영 ${data.policy.holdCutoffHours}h 전까지)`}
                        />
                        <InfoRow label="미입금" value="만료 후 입금 확인 불가" />
                        <InfoRow label="확인" value="직원 · 입금자명" />
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setPolicySection('payment')}
                      >
                        편집
                      </Button>
                    </Panel>
                    <Panel className={styles.productCard} data-featured>
                      <h2>일정 · 설문</h2>
                      <span className={styles.mapping}>슬롯 기준</span>
                      <div className={styles.price}>
                        {data.policy.slotTimes.map((time) => time.slice(0, 2)).join(' · ')}시
                        <small>{data.policy.bookingHorizonWeeks}주</small>
                      </div>
                      <div className={styles.facts}>
                        <InfoRow
                          label="노출 범위"
                          value={`내일부터 · ${data.policy.bookingHorizonWeeks}주`}
                        />
                        <InfoRow label="올데이" value="하루 4타임" />
                        <InfoRow
                          label="설문 마감"
                          value={`촬영 ${data.policy.surveyLeadDays}일 전`}
                        />
                        <InfoRow
                          label="의상 사진"
                          value={`촬영 ${data.policy.outfitLeadDays}일 전`}
                        />
                        <InfoRow label="휴무" value="디렉터별 등록" />
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setPolicySection('schedule')}
                      >
                        편집
                      </Button>
                    </Panel>
                    <Panel className={styles.productCard}>
                      <h2>결과물 · 혜택</h2>
                      <span className={styles.mapping}>후속 기준</span>
                      <div className={styles.price}>
                        수정 3회<small>요청 1번 = 1회</small>
                      </div>
                      <div className={styles.facts}>
                        <InfoRow
                          label="추가 보정"
                          value={`${money(data.addons.find((addon) => addon.id === 'extra_retouch')?.price ?? 10000)} / 장`}
                        />
                        <InfoRow label="후기" value="확인 → 원본 전체" />
                        <InfoRow label="사진 보관" value="보존 정책 확정 전" />
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setPolicySection('results')}
                      >
                        편집
                      </Button>
                    </Panel>
                  </div>
                )}
                {tab === 'neighborhoods' && (
                  <>
                    <h2 className={styles.sectionTitle}>동네 · 만남 장소 · 제휴 헤어샵</h2>
                    <div className={styles.tableWrap}>
                      <table>
                        <thead>
                          <tr>
                            <th>동네</th>
                            <th>만남 장소</th>
                            <th>지도</th>
                            <th>제휴 헤어샵</th>
                            <th>헤어샵 지도</th>
                            <th>다음 장소 고르기</th>
                            <th>노출</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {data.neighborhoods.map((item) => (
                            <tr key={item.id}>
                              <th>{item.name}</th>
                              <td>{item.meetingPlace}</td>
                              <td>
                                {item.mapUrl ? (
                                  <a href={item.mapUrl} target="_blank" rel="noreferrer">
                                    지도 ↗
                                  </a>
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td>{item.hairPlace || '—'}</td>
                              <td>
                                {item.hairMapUrl ? (
                                  <a href={item.hairMapUrl} target="_blank" rel="noreferrer">
                                    지도 ↗
                                  </a>
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td>{item.curriculum || '—'}</td>
                              <td>{item.active ? '노출 중' : '숨김'}</td>
                              <td>
                                <Button size="sm" variant="ghost" onClick={() => setPlace(item)}>
                                  편집
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Notice>
                      디렉터가 촬영 설계에서 장소를 저장하면 고객 준비 화면에 표시됩니다.
                    </Notice>
                  </>
                )}
                {tab === 'notifications' && (
                  <GuideSettings data={data} busy={settings.busy} save={settings.save} />
                )}
              </>
            )),
        }))}
      />
      <Dialog
        open={Boolean(bank)}
        onOpenChange={(open) => {
          if (!open) setBank(undefined);
        }}
        title="입금 계좌 편집"
        actions={
          <Button
            loading={settings.busy}
            disabled={!bank?.bankName || !bank.accountNumber || !bank.accountHolder}
            onClick={async () => {
              if (bank && (await settings.save({ type: 'payment_instructions', value: bank })))
                setBank(undefined);
            }}
          >
            계좌 저장
          </Button>
        }
      >
        {bank && (
          <div className={styles.form}>
            {(['bankName', 'accountNumber', 'accountHolder'] as const).map((key, index) => (
              <TextField
                key={key}
                label={['은행', '계좌번호', '예금주'][index]!}
                value={bank[key]}
                onValueChange={(value) => setBank({ ...bank, [key]: value })}
              />
            ))}
          </div>
        )}
      </Dialog>
      {policySection && data && (
        <PolicyEditor
          key={policySection}
          section={policySection}
          data={data}
          busy={settings.busy}
          saveError={settings.error}
          save={settings.save}
          onClose={() => setPolicySection(undefined)}
          onEditBank={() => {
            setPolicySection(undefined);
            setBank(
              data.paymentInstructions ?? { bankName: '', accountNumber: '', accountHolder: '' },
            );
          }}
        />
      )}
      <Dialog
        open={Boolean(place)}
        onOpenChange={(open) => {
          if (!open) setPlace(undefined);
        }}
        title="동네 · 만남 장소 편집"
        actions={
          <Button
            loading={settings.busy}
            disabled={!place?.id || !place.name || !place.meetingPlace}
            onClick={async () => {
              if (place && (await settings.save({ type: 'neighborhood', value: place })))
                setPlace(undefined);
            }}
          >
            장소 저장
          </Button>
        }
      >
        {place && (
          <div className={styles.form}>
            {(
              [
                'id',
                'name',
                'meetingPlace',
                'mapUrl',
                'parkingNote',
                'parkingUrl',
                'hairPlace',
                'hairMapUrl',
                'curriculum',
              ] as const
            ).map((key, index) => (
              <TextField
                key={key}
                label={
                  [
                    '장소 ID',
                    '동네',
                    '만남 장소',
                    '지도 HTTPS 링크',
                    '주차 안내',
                    '주차 지도 HTTPS 링크',
                    '제휴 헤어샵',
                    '헤어샵 지도 HTTPS 링크',
                    '다음 장소 안내',
                  ][index]!
                }
                value={place[key] ?? ''}
                onValueChange={(value) => setPlace({ ...place, [key]: value })}
              />
            ))}
            <label>
              <input
                type="checkbox"
                checked={place.active}
                onChange={(e) => setPlace({ ...place, active: e.target.checked })}
              />{' '}
              고객 화면에 노출
            </label>
          </div>
        )}
      </Dialog>
    </div>
  );
}

function GuideSettings({
  data,
  busy,
  save,
}: {
  data: OperationsSettingsDTO;
  busy: boolean;
  save: ReturnType<typeof useSettings>['save'];
}) {
  const [guides, setGuides] = useState(data.preparationGuides);
  return (
    <Panel className={styles.form}>
      <h2>고객 준비 안내</h2>
      {guides.map((guide, index) => (
        <div className={styles.form} key={guide.id}>
          <TextField
            label="제목"
            value={guide.title}
            onValueChange={(title) =>
              setGuides(guides.map((g, i) => (i === index ? { ...g, title } : g)))
            }
          />
          <TextArea
            label="안내 본문"
            value={guide.body}
            onValueChange={(body) =>
              setGuides(guides.map((g, i) => (i === index ? { ...g, body } : g)))
            }
          />
        </div>
      ))}
      <Button
        variant="secondary"
        onClick={() =>
          setGuides([
            ...guides,
            { id: crypto.randomUUID(), title: '새 준비 안내', summary: '', body: '', readAt: null },
          ])
        }
      >
        + 준비 안내 추가
      </Button>
      <Button
        loading={busy}
        disabled={guides.some((g) => !g.title.trim() || !g.body.trim())}
        onClick={() => save({ type: 'preparation_guides', guides })}
      >
        안내 저장
      </Button>
    </Panel>
  );
}

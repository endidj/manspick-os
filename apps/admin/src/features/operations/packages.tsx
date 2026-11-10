// 실제 상품·부가서비스와 담당 가능 직원, 보정가 요일 기준을 보여주고 편집합니다.
import { useEffect, useState } from 'react';
import type { StaffRole } from '@manspick/domain';
import {
  Button,
  CheckItem,
  Loading,
  Notice,
  Panel,
  Switch,
} from '@manspick/design-system/components';
import {
  Dialog,
  InfoRow,
  SelectField,
  SettingRow,
  Tabs,
  TextArea,
  TextField,
} from '@manspick/design-system/patterns';
import type {
  AddonDTO,
  OperationsSettingsDTO,
  PackageDTO,
  SettingsAction,
} from '@manspick/contracts';
import { api } from '@manspick/web/client';
import { money } from '@manspick/web/format';
import { PageHeading } from '../workspace/page-heading';
import { useSettings } from './use-settings';
import { SettingsHistory } from './settings-history';
import { CatalogRuleFields, difficultyLabels } from './catalog-rule-fields';
import styles from './management.module.css';

export function Packages({ role }: { role: StaffRole }) {
  return role === 'admin' ? <ManagedPackages /> : <CatalogPackages />;
}

function CatalogPackages() {
  const [data, setData] = useState<{ packages: PackageDTO[]; addons: AddonDTO[] }>();
  const [error, setError] = useState('');
  useEffect(() => {
    api<typeof data>('/catalog')
      .then(setData)
      .catch((cause) => setError(cause.message));
  }, []);
  return (
    <div className={styles.screen}>
      <PageHeading
        eyebrow="ADMIN · 2-5"
        title="패키지 · 옵션 관리"
        description="고객 옵션 선택 화면과 배정 기준에 사용하는 실제 상품 정보"
      />
      {error && <Notice tone="error">{error}</Notice>}
      {data ? <PackageContent data={data} /> : !error && <Loading />}
    </div>
  );
}

function ManagedPackages() {
  const settings = useSettings();
  const [draft, setDraft] = useState<PackageDTO | AddonDTO>();
  const [kind, setKind] = useState<'package' | 'addon'>('package');
  const [tab, setTab] = useState('packages');
  const [creating, setCreating] = useState(false);
  const edit = (value: PackageDTO | AddonDTO, type: 'package' | 'addon') => {
    setDraft(value);
    setKind(type);
    setCreating(!value.id);
  };

  async function save() {
    if (
      draft &&
      (await settings.save(
        kind === 'package'
          ? { type: 'package', value: draft as PackageDTO }
          : { type: 'addon', value: draft as AddonDTO },
      ))
    )
      setDraft(undefined);
  }

  return (
    <div className={styles.screen}>
      <PageHeading
        eyebrow="ADMIN · 2-5"
        title="패키지 · 옵션 관리"
        description="고객 옵션 선택 화면(고객 1단계)과 디렉터 자동 배정의 기준 데이터 · 패키지 v1 (AI · DSLR · 강의 판매 종료)"
        actions={
          <>
            <SettingsHistory />
            <Button
              onClick={() =>
                edit(
                  { id: '', name: '', price: 0, description: '', maxQuantity: 1, active: true },
                  'addon',
                )
              }
            >
              + 부가서비스 추가
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
        label="상품 설정"
        value={tab}
        onValueChange={setTab}
        variant="flush"
        items={(
          [
            ['packages', '패키지'],
            ['addons', '부가서비스'],
            ['rules', '난이도 규칙'],
            ['normalization', '표기 정규화'],
          ] as const
        ).map(([value, label]) => ({
          value,
          label,
          content:
            tab === value &&
            (settings.data ? (
              <>
                <PackageContent
                  data={settings.data}
                  edit={edit}
                  tab={tab}
                  busy={settings.busy}
                  onActiveChange={(value, kind) =>
                    settings.save(
                      kind === 'package'
                        ? { type: 'package', value: value as PackageDTO }
                        : { type: 'addon', value: value as AddonDTO },
                    )
                  }
                />
                {tab === 'rules' && (
                  <>
                    <Panel className={styles.productCard}>
                      <h2>패키지 기본 난이도 + 선택한 부가서비스 가중 합</h2>
                      {settings.data.packages.map((pack) => (
                        <SettingRow
                          key={pack.id}
                          label={pack.name}
                          density="compact"
                          value={difficultyLabels[pack.baseDifficulty ?? 'low']}
                          actions={
                            <Button
                              size="sm"
                              variant="ghost"
                              aria-label={`${pack.name} 난이도 편집`}
                              onClick={() => edit(pack, 'package')}
                            >
                              편집
                            </Button>
                          }
                        />
                      ))}
                      {settings.data.addons.map((addon) => (
                        <SettingRow
                          key={addon.id}
                          label={addon.name}
                          density="compact"
                          value={`+${addon.difficultyWeight ?? 0}`}
                          actions={
                            <Button
                              size="sm"
                              variant="ghost"
                              aria-label={`${addon.name} 가중 편집`}
                              onClick={() => edit(addon, 'addon')}
                            >
                              편집
                            </Button>
                          }
                        />
                      ))}
                      <p className={styles.muted}>
                        기본 난이도와 옵션 가중 합을 신규 예약에 기록합니다. 디렉터 자격·일정·현재
                        예약 수로 배정하며, 난이도별 숫자 환산과 디렉터 수용 기준은 아직 정해지지
                        않았습니다.
                      </p>
                    </Panel>
                    <AssignmentRules
                      data={settings.data}
                      busy={settings.busy}
                      save={settings.save}
                    />
                  </>
                )}
                {tab === 'normalization' && (
                  <Panel className={styles.productCard}>
                    <h2>표기 정규화</h2>
                    {settings.data.packages.map((pack) => (
                      <SettingRow
                        key={pack.id}
                        label={(pack.aliases ?? [pack.id]).join(' · ')}
                        density="compact"
                        value={pack.name}
                        actions={
                          <Button
                            size="sm"
                            variant="ghost"
                            aria-label={`${pack.name} 표기 편집`}
                            onClick={() => edit(pack, 'package')}
                          >
                            편집
                          </Button>
                        }
                      />
                    ))}
                    <p className={styles.muted}>
                      대소문자·공백·하이픈 차이를 정리해 같은 상품으로 접수합니다. 다른 상품과
                      겹치는 별칭은 저장할 수 없습니다.
                    </p>
                  </Panel>
                )}
              </>
            ) : (
              !settings.error && <Loading />
            )),
        }))}
      />
      <Dialog
        open={Boolean(draft)}
        onOpenChange={(open) => {
          if (!open) setDraft(undefined);
        }}
        title={kind === 'package' ? '패키지 편집' : '부가서비스 편집'}
        actions={
          <Button
            disabled={!draft?.id.trim() || !draft.name.trim()}
            loading={settings.busy}
            onClick={save}
          >
            상품 저장
          </Button>
        }
      >
        {draft && (
          <div className={styles.form}>
            <TextField
              label="상품 ID"
              value={draft.id}
              disabled={!creating}
              onValueChange={(id) => setDraft({ ...draft, id })}
            />
            <TextField
              label="이름"
              value={draft.name}
              onValueChange={(name) => setDraft({ ...draft, name })}
            />
            <TextField
              label="가격 (원)"
              type="number"
              min={0}
              value={String(draft.price)}
              onValueChange={(value) => setDraft({ ...draft, price: Number(value) })}
            />
            {kind === 'package' ? (
              (['originalPrice', 'duration', 'outfits', 'retouchCount'] as const).map(
                (key, index) => (
                  <TextField
                    key={key}
                    label={['정가 (원)', '촬영 시간 (분)', '의상 수 (벌)', '보정 장수'][index]!}
                    type="number"
                    min={0}
                    value={String((draft as PackageDTO)[key])}
                    onValueChange={(value) => setDraft({ ...draft, [key]: Number(value) })}
                  />
                ),
              )
            ) : (
              <TextField
                label="최대 신청 수량"
                type="number"
                min={1}
                value={String((draft as AddonDTO).maxQuantity)}
                onValueChange={(value) => setDraft({ ...draft, maxQuantity: Number(value) })}
              />
            )}
            <TextArea
              label="포함 구성 · 설명"
              value={draft.description}
              onValueChange={(description) => setDraft({ ...draft, description })}
            />
            <CatalogRuleFields
              value={draft}
              kind={kind}
              packages={settings.data?.packages ?? []}
              onChange={setDraft}
            />
            <Switch
              label="고객에게 노출"
              checked={draft.active}
              onCheckedChange={(active) => setDraft({ ...draft, active })}
            />
          </div>
        )}
      </Dialog>
    </div>
  );
}

function PackageContent({
  data,
  edit,
  tab = 'packages',
  busy = false,
  onActiveChange,
}: {
  data: { packages: PackageDTO[]; addons: AddonDTO[] } & Partial<OperationsSettingsDTO>;
  edit?: (value: PackageDTO | AddonDTO, kind: 'package' | 'addon') => void;
  tab?: string;
  busy?: boolean;
  onActiveChange?: (value: PackageDTO | AddonDTO, kind: 'package' | 'addon') => Promise<boolean>;
}) {
  return (
    <>
      {tab === 'packages' && (
        <div className={styles.cards}>
          {data.packages.map((pack) => (
            <Panel
              className={styles.productCard}
              key={pack.id}
              data-featured={pack.id === 'hybrid' || undefined}
            >
              <div className={styles.productHeading}>
                <h2>{pack.name}</h2>
                {onActiveChange && (
                  <Switch
                    label={`${pack.name} 판매 노출`}
                    hideLabel
                    checked={pack.active}
                    disabled={busy}
                    onCheckedChange={(active) =>
                      void onActiveChange({ ...pack, active }, 'package')
                    }
                  />
                )}
              </div>
              <span className={styles.mapping}>
                표기 매핑: {(pack.aliases ?? [pack.id.toUpperCase()]).join(' · ')} → {pack.name}
              </span>
              <div className={styles.price}>
                {money(pack.price)}
                <del>{money(pack.originalPrice)}</del>
              </div>
              <div className={styles.facts}>
                <InfoRow label="의상" value={`${pack.outfits}벌`} />
                <InfoRow label="촬영 시간" value={`${pack.duration}분`} />
                <InfoRow label="보정본" value={`${pack.retouchCount}장`} />
                <InfoRow label="스팟" value={pack.spotDescription || '미설정'} />
                <InfoRow
                  label="기본 난이도"
                  value={difficultyLabels[pack.baseDifficulty ?? 'low']}
                />
              </div>
              <p className={styles.muted}>{pack.description}</p>
              {edit && (
                <Button variant="secondary" size="sm" onClick={() => edit(pack, 'package')}>
                  포함 구성 · 설명 편집
                </Button>
              )}
            </Panel>
          ))}
        </div>
      )}
      {(tab === 'packages' || tab === 'addons') && (
        <>
          <h2 className={styles.sectionTitle}>부가서비스</h2>
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>부가서비스</th>
                  <th>가격</th>
                  <th>수량</th>
                  <th>난이도 가중</th>
                  <th>설명</th>
                  <th>가능 디렉터</th>
                  {onActiveChange && <th>노출</th>}
                  {edit && <th />}
                </tr>
              </thead>
              <tbody>
                {data.addons.map((addon) => (
                  <tr key={addon.id}>
                    <th>{addon.name}</th>
                    <td>{money(addon.price)}</td>
                    <td>
                      {addon.quantityMode === 'photo'
                        ? '셀렉 · 후속에서 신청'
                        : addon.quantityMode === 'outfit'
                          ? '대여 + 코디 ≤ 패키지 벌수'
                          : addon.quantityMode === 'shopping'
                            ? data.packages
                                .map(
                                  (pack) =>
                                    `${pack.name} ${addon.packageQuantityLimits?.[pack.id] ?? addon.maxQuantity}회`,
                                )
                                .join(' · ')
                            : `최대 ${addon.maxQuantity}`}
                      {addon.hiddenPackageIds?.length
                        ? ` · ${addon.hiddenPackageIds.map((id) => data.packages.find((pack) => pack.id === id)?.name ?? id).join(' · ')} 숨김`
                        : ''}
                    </td>
                    <td>난이도 +{addon.difficultyWeight ?? 0}</td>
                    <td>{addon.description}</td>
                    <td>
                      {data.directorSkills
                        ?.filter((skill) => skill.addonId === addon.id)
                        .map(
                          (skill) =>
                            data.staff?.find((person) => person.id === skill.directorId)?.name,
                        )
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </td>
                    {onActiveChange && (
                      <td>
                        <Switch
                          label={`${addon.name} 판매 노출`}
                          hideLabel
                          checked={addon.active}
                          disabled={busy}
                          onCheckedChange={(active) =>
                            void onActiveChange({ ...addon, active }, 'addon')
                          }
                        />
                      </td>
                    )}
                    {edit && (
                      <td>
                        <Button size="sm" variant="ghost" onClick={() => edit(addon, 'addon')}>
                          편집
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {data.retoucherRules && (
        <Panel className={styles.productCard}>
          <h2>보정가 배정 규칙 · 촬영일 요일 기준</h2>
          <div className={styles.weekRules}>
            {[1, 2, 3, 4, 5, 6, 0].map((day) => (
              <div key={day}>
                <span>{['일', '월', '화', '수', '목', '금', '토'][day]}</span>
                <strong>
                  {data.staff?.find(
                    (person) =>
                      person.id ===
                      data.retoucherRules?.find((rule) => rule.weekday === day)?.retoucherId,
                  )?.name ?? '미설정'}
                </strong>
              </div>
            ))}
          </div>
          <p className={styles.muted}>
            셀렉 완료 시 자동 배정됩니다. 개별 담당자 변경은 고객 상세에서 사유와 함께 처리합니다.
          </p>
        </Panel>
      )}
    </>
  );
}

function AssignmentRules({
  data,
  busy,
  save,
}: {
  data: OperationsSettingsDTO;
  busy: boolean;
  save: (action: SettingsAction) => Promise<boolean>;
}) {
  const directors = data.staff.filter((person) => person.role === 'director' && person.active);
  const retouchers = data.staff.filter((person) => person.role === 'retoucher' && person.active);
  const [directorId, setDirectorId] = useState(directors[0]?.id ?? '');
  const [skills, setSkills] = useState(
    data.directorSkills
      .filter(
        (skill) =>
          skill.directorId === directorId &&
          data.addons.some((addon) => addon.id === skill.addonId && addon.active),
      )
      .map((skill) => skill.addonId),
  );
  const [rules, setRules] = useState(
    Array.from({ length: 7 }, (_, weekday) => ({
      weekday,
      retoucherId: data.retoucherRules.find((rule) => rule.weekday === weekday)?.retoucherId ?? '',
    })),
  );

  function chooseDirector(id: string) {
    setDirectorId(id);
    setSkills(
      data.directorSkills
        .filter(
          (skill) =>
            skill.directorId === id &&
            data.addons.some((addon) => addon.id === skill.addonId && addon.active),
        )
        .map((skill) => skill.addonId),
    );
  }

  return (
    <div className={styles.settingsGrid}>
      <Panel className={styles.productCard}>
        <h2>디렉터별 수행 가능 옵션</h2>
        <SelectField
          label="디렉터"
          value={directorId}
          disabled={busy}
          onValueChange={chooseDirector}
          options={directors.map((person) => ({ value: person.id, label: person.name }))}
        />
        {data.addons
          .filter((addon) => addon.active)
          .map((addon) => (
            <CheckItem
              key={addon.id}
              label={addon.name}
              completed={skills.includes(addon.id)}
              disabled={busy || !directorId}
              onClick={() =>
                setSkills((current) =>
                  current.includes(addon.id)
                    ? current.filter((id) => id !== addon.id)
                    : [...current, addon.id],
                )
              }
            />
          ))}
        <Button
          variant="secondary"
          disabled={!directorId}
          loading={busy}
          onClick={() => save({ type: 'director_skills', directorId, addonIds: skills })}
        >
          가능 옵션 저장
        </Button>
        <p className={styles.muted}>
          저장 이후 자동 배정에 적용됩니다. 이미 배정된 촬영의 담당자는 유지됩니다.
        </p>
      </Panel>
      <Panel className={styles.productCard}>
        <h2>요일별 보정가 배정 편집</h2>
        {[1, 2, 3, 4, 5, 6, 0].map((day) => (
          <SelectField
            key={day}
            label={`${['일', '월', '화', '수', '목', '금', '토'][day]}요일`}
            value={rules[day]!.retoucherId}
            disabled={busy}
            onValueChange={(retoucherId) =>
              setRules((current) =>
                current.map((rule) => (rule.weekday === day ? { ...rule, retoucherId } : rule)),
              )
            }
            options={[
              { value: '', label: '보정가 선택' },
              ...retouchers.map((person) => ({ value: person.id, label: person.name })),
            ]}
          />
        ))}
        <Button
          variant="secondary"
          loading={busy}
          disabled={rules.some((rule) => !rule.retoucherId)}
          onClick={() => save({ type: 'retoucher_rules', rules })}
        >
          요일별 배정 기준 저장
        </Button>
        <p className={styles.muted}>
          월요일부터 일요일까지 활성 보정가를 지정해주세요. 기존 보정 작업의 담당자는 유지됩니다.
        </p>
      </Panel>
    </div>
  );
}

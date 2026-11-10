// 단계별 안내 목록과 구조화된 노출 조건을 편집하고 해당 고객에게만 미리보기를 보여줍니다.
import { useEffect, useState } from 'react';
import { STAGE_LABELS, type StaffRole } from '@manspick/domain';
import {
  Button,
  EmptyState,
  Loading,
  Notice,
  Panel,
  Switch,
} from '@manspick/design-system/components';
import {
  ChipGroup,
  Dialog,
  SelectField,
  TextArea,
  TextField,
} from '@manspick/design-system/patterns';
import type {
  AddonDTO,
  MessageTemplateDTO,
  PackageDTO,
  ShootDetail,
  TemplateRules,
} from '@manspick/contracts';
import { api } from '@manspick/web/client';
import { PageHeading } from '../workspace/page-heading';
import { useShootList } from '../workspace/use-shoot-list';
import { templateMatches } from './template-model';
import styles from './management.module.css';
import templateStyles from './template-conditions.module.css';

const variables = [
  '고객명',
  '촬영일',
  '촬영시간',
  '장소',
  '디렉터',
  '패키지',
  '의상벌수',
  '부가서비스',
  'OS링크',
];
const emptyRules: TemplateRules = { stages: [], packageIds: [], addonIds: [], roles: [] };
const sourceGroups = [
  { label: '1 · 옵션 선택', keys: ['01-os-link'] },
  { label: '2 · 설문', keys: ['02-survey', '03-survey-reminder'] },
  { label: '3 · 일정', keys: ['04-schedule'] },
  {
    label: '4 · 촬영 준비',
    keys: [
      '05-confirmation',
      '06-preparation',
      '07-hair',
      '08-location',
      '09-cancellation',
      '10-day-before',
    ],
  },
  { label: '6 · 결과물', keys: ['11-selection', '12-delivery'] },
  { label: '7 · 후속관리', keys: ['13-review', '14-originals', '15-referral'] },
];
const roleOptions = [
  { value: 'admin', label: '관리자' },
  { value: 'staff', label: '직원' },
  { value: 'director', label: '디렉터' },
] satisfies { value: StaffRole; label: string }[];

type Catalog = { packages: PackageDTO[]; addons: AddonDTO[] };

export function Templates({ role }: { role: StaffRole }) {
  const canEdit = role === 'admin';
  const [items, setItems] = useState<MessageTemplateDTO[]>();
  const [catalog, setCatalog] = useState<Catalog>({ packages: [], addons: [] });
  const [draft, setDraft] = useState<MessageTemplateDTO>();
  const [error, setError] = useState('');
  const [previewError, setPreviewError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [add, setAdd] = useState(false);
  const [key, setKey] = useState('');
  const [customer, setCustomer] = useState('');
  const [detail, setDetail] = useState<ShootDetail>();
  const [revision, setRevision] = useState(0);
  const [customerPicker, setCustomerPicker] = useState(false);
  const [previewStarted, setPreviewStarted] = useState(false);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const previewList = useShootList(previewStarted ? 'template-preview' : undefined);
  const shoots = previewList.shoots ?? [];
  const shoot = shoots.find((item) => item.id === customer) ?? shoots[0];
  const previewShootId = shoot?.id;
  useEffect(() => {
    let active = true;
    Promise.all([api<{ items: MessageTemplateDTO[] }>('/templates'), api<Catalog>('/catalog')])
      .then(([data, products]) => {
        if (active) {
          setItems(data.items);
          setCatalog(products);
          setDraft(data.items.find((item) => item.key === '06-preparation') ?? data.items[0]);
          setError('');
        }
      })
      .catch((cause) => {
        if (active) setError(cause.message);
      });
    return () => {
      active = false;
    };
  }, [revision]);
  useEffect(() => {
    if (!previewShootId) return;
    let active = true;
    api<ShootDetail>(`/shoots/${encodeURIComponent(previewShootId)}`)
      .then((value) => {
        if (active) {
          setDetail(value);
          setPreviewError('');
        }
      })
      .catch((cause) => {
        if (active) setPreviewError(cause.message);
      });
    return () => {
      active = false;
    };
  }, [previewShootId]);
  const previewCustomer = detail?.id === shoot?.id ? detail : undefined;
  const applicable = Boolean(
    draft &&
    previewCustomer &&
    templateMatches(
      draft,
      {
        stage: previewCustomer.stage,
        packageId: previewCustomer.packageId,
        addonIds: previewCustomer.addons.map((addon) => addon.id),
      },
      role,
    ),
  );
  const preview =
    applicable && draft && previewCustomer ? renderPreview(draft.body, previewCustomer) : '';
  const otherItems =
    items?.filter((item) => !sourceGroups.some((group) => group.keys.includes(item.key))) ?? [];

  function edit(next: MessageTemplateDTO) {
    setDraft(next);
    setSuccess('');
  }

  async function save() {
    if (!canEdit || !draft) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await api(`/templates/${encodeURIComponent(draft.key)}`, {
        method: 'POST',
        body: JSON.stringify(draft),
      });
      const data = await api<{ items: MessageTemplateDTO[] }>('/templates');
      setItems(data.items);
      setDraft(data.items.find((item) => item.key === draft.key) ?? draft);
      setSuccess('템플릿을 저장했습니다. 외부 메시지는 발송하지 않았습니다.');
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function openPreview() {
    setPreviewStarted(true);
    setCustomerPicker(true);
  }

  function navigationItem(item: MessageTemplateDTO) {
    return (
      <button
        type="button"
        key={item.key}
        data-active={draft?.key === item.key}
        aria-current={draft?.key === item.key ? 'true' : undefined}
        onClick={() => edit(item)}
      >
        <span>{item.title}</span>
        {!item.active && <small>{item.condition.includes('초안') ? '초안' : '비활성'}</small>}
      </button>
    );
  }

  return (
    <div className={styles.screen}>
      <PageHeading
        eyebrow="ADMIN · 2-6 · SHARED 6-1"
        title="안내 템플릿"
        description="카카오채널 복붙용 안내문 · 자동 발송 없음 · 고객 상세/디렉터 화면에 조건별로 노출"
        actions={
          <>
            <Button variant="secondary" onClick={openPreview}>
              미리보기 고객 선택
            </Button>
            {canEdit && <Button onClick={() => setAdd(true)}>+ 템플릿 추가</Button>}
          </>
        }
      />
      {error && (
        <Notice tone="error">
          {error}
          <Button size="sm" variant="ghost" onClick={() => setRevision((value) => value + 1)}>
            다시 불러오기
          </Button>
        </Notice>
      )}
      {success && <Notice tone="success">{success}</Notice>}
      {!items ? (
        !error && <Loading />
      ) : (
        <div className={styles.templateLayout}>
          <nav className={styles.templateNav} aria-label="안내 템플릿">
            {sourceGroups.map((group) => {
              const groupItems = group.keys.flatMap((itemKey) =>
                items.filter((item) => item.key === itemKey),
              );
              return groupItems.length ? (
                <section key={group.label}>
                  <h2>{group.label}</h2>
                  {groupItems.map(navigationItem)}
                </section>
              ) : null;
            })}
            {otherItems.length > 0 && (
              <section>
                <h2>추가 안내</h2>
                {otherItems.map(navigationItem)}
              </section>
            )}
            {!items.length && <EmptyState title="등록된 템플릿이 없습니다" />}
          </nav>
          {draft ? (
            <Panel className={styles.templateEditor}>
              <div className={styles.cardHeading}>
                <TextField
                  label="템플릿 제목"
                  value={draft.title}
                  readOnly={!canEdit}
                  onValueChange={(title) => edit({ ...draft, title })}
                />
                <Switch
                  label="활성"
                  checked={draft.active}
                  disabled={!canEdit || busy}
                  onCheckedChange={(active) => edit({ ...draft, active })}
                />
              </div>
              {!draft.active && draft.condition.includes('초안') && (
                <Notice>
                  원본에서 본문을 확인하지 못한 안내 초안입니다.
                  {canEdit && ' 운영 문구와 조건을 확인하고 저장·활성화해주세요.'}
                </Notice>
              )}
              <div className={styles.conditions}>
                <div className={styles.conditionHeading}>
                  <h3>노출 조건</h3>
                  {canEdit && (
                    <Button size="sm" variant="ghost" onClick={() => setDescriptionOpen(true)}>
                      설명 편집
                    </Button>
                  )}
                </div>
                <ConditionRow
                  label="단계 · 상태"
                  options={STAGE_LABELS.map((label, index) => ({
                    value: String(index + 1),
                    label: `${index + 1} · ${label}`,
                  }))}
                  values={(draft.rules?.stages ?? []).map(String)}
                  disabled={!canEdit || busy}
                  onChange={(values) =>
                    edit({
                      ...draft,
                      rules: { ...(draft.rules ?? emptyRules), stages: values.map(Number) },
                    })
                  }
                />
                <ConditionRow
                  label="패키지"
                  options={catalog.packages.map((pack) => ({ value: pack.id, label: pack.name }))}
                  values={draft.rules?.packageIds ?? []}
                  disabled={!canEdit || busy}
                  onChange={(values) =>
                    edit({
                      ...draft,
                      rules: { ...(draft.rules ?? emptyRules), packageIds: values },
                    })
                  }
                />
                <ConditionRow
                  label="부가서비스"
                  options={catalog.addons.map((addon) => ({ value: addon.id, label: addon.name }))}
                  values={draft.rules?.addonIds ?? []}
                  disabled={!canEdit || busy}
                  onChange={(values) =>
                    edit({ ...draft, rules: { ...(draft.rules ?? emptyRules), addonIds: values } })
                  }
                />
                <ConditionRow
                  label="발송 담당"
                  options={roleOptions}
                  values={draft.rules?.roles ?? []}
                  disabled={!canEdit || busy}
                  onChange={(values) =>
                    edit({
                      ...draft,
                      rules: { ...(draft.rules ?? emptyRules), roles: values as StaffRole[] },
                    })
                  }
                />
              </div>
              {canEdit && (
                <div className={styles.variables}>
                  <span>변수 삽입</span>
                  {variables.map((variable) => (
                    <Button
                      size="sm"
                      variant="secondary"
                      key={variable}
                      onClick={() => edit({ ...draft, body: `${draft.body}{${variable}}` })}
                    >{`{${variable}}`}</Button>
                  ))}
                </div>
              )}
              <TextArea
                label="안내 본문"
                className={styles.templateBody}
                value={draft.body}
                readOnly={!canEdit}
                onValueChange={(body) => edit({ ...draft, body })}
                rows={10}
              />
              <div className={styles.cardHeading}>
                <span className={styles.muted}>
                  {canEdit
                    ? '변경 내용은 저장 후 적용됩니다.'
                    : '대표만 템플릿을 편집할 수 있습니다.'}
                </span>
                <span className={styles.muted}>글자 수 {draft.body.length}</span>
              </div>
              {canEdit && (
                <Button
                  loading={busy}
                  disabled={!draft.title.trim() || !draft.body.trim()}
                  onClick={save}
                >
                  변경 내용 저장
                </Button>
              )}
            </Panel>
          ) : (
            <Panel className={styles.templateEditor}>
              <EmptyState title="등록된 안내 템플릿이 없습니다" />
              {canEdit && <Button onClick={() => setAdd(true)}>템플릿 추가</Button>}
            </Panel>
          )}
          <aside className={styles.preview}>
            <SelectField
              label={`카카오채널 미리보기 · ${shoot?.customerName ?? '고객 선택'}`}
              value={shoot?.id ?? ''}
              onValueChange={setCustomer}
              options={
                shoots.length
                  ? shoots.map((item) => ({ value: item.id, label: item.customerName }))
                  : [{ value: '', label: '등록된 고객 없음' }]
              }
            />
            {previewError ? (
              <p role="alert">{previewError}</p>
            ) : preview ? (
              <div className={styles.bubble}>{preview}</div>
            ) : (
              <div className={styles.bubble}>
                {!draft?.active
                  ? '비활성 템플릿은 고객 안내에 표시되지 않습니다.'
                  : !shoot
                    ? '미리볼 고객을 선택해주세요.'
                    : !previewCustomer
                      ? '고객 정보를 불러오는 중입니다.'
                      : '이 고객·현재 직원 역할은 템플릿 노출 조건에 해당하지 않습니다.'}
              </div>
            )}
            <p>
              선택한 부가서비스가 없으면 해당 변수는 빈 값입니다. 고객 링크 등 없는 값은 중괄호
              그대로 남습니다. 저장 전 미리보기이며 실제 발송은 하지 않습니다.
            </p>
          </aside>
        </div>
      )}
      <Dialog
        open={add}
        onOpenChange={setAdd}
        title="안내 템플릿 추가"
        actions={
          <Button
            disabled={
              !/^[a-zA-Z0-9_-]+$/.test(key) || Boolean(items?.some((item) => item.key === key))
            }
            onClick={() => {
              edit({
                key,
                title: '새 안내',
                body: '',
                condition: '',
                active: false,
                auto: false,
                rules: { stages: [], packageIds: [], addonIds: [], roles: [] },
              });
              setAdd(false);
            }}
          >
            본문 작성
          </Button>
        }
      >
        <TextField
          label="템플릿 식별 이름"
          hint="영문·숫자·하이픈·밑줄, 기존 이름과 다르게 입력해주세요."
          value={key}
          onValueChange={setKey}
        />
      </Dialog>
      <Dialog open={customerPicker} onOpenChange={setCustomerPicker} title="미리보기 고객 선택">
        {previewList.error ? (
          <Notice tone="error">
            {previewList.error}
            <Button variant="ghost" size="sm" onClick={previewList.retry}>
              다시 불러오기
            </Button>
          </Notice>
        ) : !previewList.shoots ? (
          <Loading />
        ) : (
          <SelectField
            label="고객"
            value={shoot?.id ?? ''}
            onValueChange={(value) => {
              setCustomer(value);
              setCustomerPicker(false);
            }}
            options={
              shoots.length
                ? shoots.map((item) => ({
                    value: item.id,
                    label: `${item.customerName} · ${item.packageName}`,
                  }))
                : [{ value: '', label: '등록된 고객 없음' }]
            }
          />
        )}
      </Dialog>
      <Dialog
        open={descriptionOpen}
        onOpenChange={setDescriptionOpen}
        title="조건 설명"
        description="설명은 자동 필터에 사용하지 않습니다. 단계·패키지·부가서비스·담당 조건으로 판단합니다."
      >
        {draft && (
          <TextField
            label="운영자가 읽을 설명"
            value={draft.condition}
            onValueChange={(condition) => edit({ ...draft, condition })}
          />
        )}
      </Dialog>
    </div>
  );
}

function ConditionRow({
  label,
  options,
  values,
  onChange,
  disabled,
}: {
  label: string;
  options: { value: string; label: string }[];
  values: string[];
  onChange: (values: string[]) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.conditionRow}>
      <span>{label}</span>
      <div>
        {values.length ? (
          <ChipGroup
            label={`${label} 선택 조건`}
            hideLabel
            mode="remove"
            options={options}
            value={values}
            onValueChange={onChange}
            disabled={disabled}
          />
        ) : (
          <Button
            size="sm"
            variant="secondary"
            className={templateStyles.emptyRule}
            disabled={disabled}
            onClick={() => setOpen(true)}
          >
            조건 없음
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className={styles.addRule}
          disabled={disabled}
          aria-label={`${label} 조건 선택`}
          onClick={() => setOpen(true)}
        >
          +
        </Button>
      </div>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={`${label} 노출 조건`}
        description="여러 항목은 하나라도 해당하면 일치합니다. 아무것도 선택하지 않으면 이 조건을 제한하지 않습니다."
      >
        <div className={styles.ruleOptions}>
          <ChipGroup
            label={`${label} 조건`}
            hideLabel
            options={options}
            value={values}
            onValueChange={onChange}
            disabled={disabled}
          />
        </div>
        <Button size="sm" variant="ghost" onClick={() => onChange([])} disabled={disabled}>
          조건 없음으로 변경
        </Button>
      </Dialog>
    </div>
  );
}

function renderPreview(body: string, shoot: ShootDetail) {
  const startsAt = shoot.startsAt ? new Date(shoot.startsAt) : null;
  const values: Record<string, string | undefined> = {
    고객명: shoot.customerName,
    촬영일: startsAt
      ? new Intl.DateTimeFormat('ko-KR', {
          month: 'numeric',
          day: 'numeric',
          weekday: 'short',
          timeZone: 'Asia/Seoul',
        }).format(startsAt)
      : undefined,
    촬영시간: startsAt
      ? new Intl.DateTimeFormat('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Seoul',
        }).format(startsAt)
      : undefined,
    장소: shoot.preparation?.location.meetingPlace,
    디렉터: shoot.directorName ?? undefined,
    패키지: shoot.packageName,
    의상벌수: String(shoot.package.outfits),
    부가서비스: shoot.addons
      .map((addon) => `${addon.name}${addon.quantity > 1 ? ` ×${addon.quantity}` : ''}`)
      .join(' · '),
  };
  return body.replace(/\{([^{}]+)\}/g, (match, name: string) => values[name] ?? match);
}

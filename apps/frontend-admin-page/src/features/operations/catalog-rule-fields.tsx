// 상품의 촬영 구성·표기 별칭과 옵션별 수량·난이도 규칙을 편집합니다.
import { defaultAddonRules, defaultPackageRules } from '@manspick/domain';
import type { AddonDTO, PackageDTO } from '@manspick/contracts';
import { SelectField, TextField } from '@manspick/design-system/patterns';
import styles from './management.module.css';

export const difficultyLabels = { low: '하', medium: '중', high: '상' };

export function CatalogRuleFields({
  value,
  kind,
  packages,
  onChange,
}: {
  value: PackageDTO | AddonDTO;
  kind: 'package' | 'addon';
  packages: PackageDTO[];
  onChange: (value: PackageDTO | AddonDTO) => void;
}) {
  if (kind === 'package') {
    const pack = { ...defaultPackageRules(value.id), ...value } as PackageDTO;
    return (
      <>
        <TextField
          label="스팟 · 포함 구성"
          value={pack.spotDescription ?? ''}
          onValueChange={(spotDescription) => onChange({ ...pack, spotDescription })}
        />
        <SelectField
          label="기본 난이도"
          value={pack.baseDifficulty ?? 'low'}
          onValueChange={(baseDifficulty) =>
            onChange({
              ...pack,
              baseDifficulty: baseDifficulty as PackageDTO['baseDifficulty'],
            })
          }
          options={Object.entries(difficultyLabels).map(([value, label]) => ({ value, label }))}
        />
        <TextField
          label="표기 별칭 (쉼표로 구분)"
          value={(pack.aliases ?? []).join(', ')}
          onValueChange={(value) =>
            onChange({
              ...pack,
              aliases: value ? value.split(',').map((label) => label.trim()) : [],
            })
          }
        />
        <p className={styles.muted}>
          고객에게는 상품 이름을 표시하고, 별칭으로 접수된 패키지도 같은 상품으로 연결합니다. 이미
          예약한 상품명은 바뀌지 않습니다.
        </p>
      </>
    );
  }
  const addon = {
    ...defaultAddonRules(value.id, (value as AddonDTO).maxQuantity),
    ...value,
  } as AddonDTO;
  return (
    <>
      <TextField
        label="옵션 난이도 가중"
        type="number"
        min={0}
        max={20}
        value={String(addon.difficultyWeight)}
        onValueChange={(value) => onChange({ ...addon, difficultyWeight: Number(value) })}
      />
      <SelectField
        label="수량 단위"
        value={addon.quantityMode ?? 'count'}
        disabled={addon.id === 'extra_retouch'}
        onValueChange={(quantityMode) =>
          onChange({ ...addon, quantityMode: quantityMode as AddonDTO['quantityMode'] })
        }
        options={(
          [
            ['single', '단일 선택'],
            ['outfit', '의상 (대여·코디 합산)'],
            ['shopping', '쇼핑 횟수'],
            ['count', '개수'],
            ['photo', '사진 (셀렉·후속 전용)'],
          ] as const
        ).map(([value, label]) => ({ value, label }))}
      />
      {packages.map((pack) => (
        <div key={pack.id} className={styles.form}>
          <TextField
            label={`${pack.name} 최대 수량 (비워두면 공통 최대값)`}
            type="number"
            min={0}
            max={100}
            value={
              addon.packageQuantityLimits?.[pack.id] === undefined
                ? ''
                : String(addon.packageQuantityLimits[pack.id])
            }
            onValueChange={(value) => {
              const limits = { ...addon.packageQuantityLimits };
              if (value === '') delete limits[pack.id];
              else limits[pack.id] = Number(value);
              onChange({ ...addon, packageQuantityLimits: limits });
            }}
          />
          <label>
            <input
              type="checkbox"
              checked={addon.hiddenPackageIds?.includes(pack.id) ?? false}
              onChange={(event) =>
                onChange({
                  ...addon,
                  hiddenPackageIds: event.target.checked
                    ? [...(addon.hiddenPackageIds ?? []), pack.id]
                    : addon.hiddenPackageIds?.filter((id) => id !== pack.id),
                })
              }
            />{' '}
            {pack.name}에서 숨김 · 별도 신청 불가
          </label>
        </div>
      ))}
      <label>
        <input
          type="checkbox"
          checked={addon.requiresDirector}
          disabled={addon.quantityMode === 'photo'}
          onChange={(event) => onChange({ ...addon, requiresDirector: event.target.checked })}
        />{' '}
        수행 가능한 디렉터만 자동 배정
      </label>
    </>
  );
}

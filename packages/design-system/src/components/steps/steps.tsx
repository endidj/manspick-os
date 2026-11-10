// 진행 단계와 현재 위치를 표시하는 공통 컴포넌트입니다.
import { Icon } from '../../icons';

export function Steps({ active, labels }: { active: number; labels: readonly string[] }) {
  return (
    <ol className="steps">
      {labels.map((label, index) => (
        <li
          key={label}
          className={index + 1 === active ? 'current' : index + 1 < active ? 'complete' : ''}
          aria-current={index + 1 === active ? 'step' : undefined}
        >
          <span>{index + 1 < active ? <Icon name="check" size={13} /> : index + 1}</span>
          <strong>{label}</strong>
        </li>
      ))}
    </ol>
  );
}

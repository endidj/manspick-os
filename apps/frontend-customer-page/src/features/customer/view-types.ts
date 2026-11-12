// 고객 화면들이 공유하는 데이터와 실제 저장 동작의 타입입니다.
import type { ShootDetail } from '@manspick/contracts';
import type { CustomerScene } from './journey';

export type CustomerViewProps = {
  shoot: ShootDetail;
  busy: boolean;
  onAction: (body: unknown, message?: string) => Promise<boolean>;
  onUpload: (file: File, kind: string) => Promise<{ id: string } | null>;
  onNavigate: (scene: CustomerScene) => void;
  onHelp: () => void;
};

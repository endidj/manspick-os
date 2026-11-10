// 화면 앱과 공통 서버가 주고받는 데이터와 명령의 타입을 정의합니다.

import type { OperationsPolicy, ShootStatus, StaffRole } from '@manspick/domain';

export interface Actor {
  kind: 'staff' | 'customer';
  id: string;
  role: StaffRole | 'customer';
  name: string;
  shootId?: string;
}
export interface SessionDTO {
  actor: Actor;
  shootId?: string;
}

export interface StaffAccountDTO {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  active: boolean;
  version: number;
}

export interface PackageDTO {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  duration: number;
  outfits: number;
  retouchCount: number;
  description: string;
  active: boolean;
  spotDescription?: string;
  baseDifficulty?: 'low' | 'medium' | 'high';
  aliases?: string[];
  additionalDifficultyWeight?: number;
}
export interface AddonDTO {
  id: string;
  name: string;
  price: number;
  description: string;
  maxQuantity: number;
  active: boolean;
  difficultyWeight?: number;
  quantityMode?: 'single' | 'outfit' | 'shopping' | 'photo' | 'count';
  packageQuantityLimits?: Record<string, number>;
  hiddenPackageIds?: string[];
  requiresDirector?: boolean;
}
export interface ShootSummary {
  id: string;
  customerName: string;
  phoneMasked: string;
  status: ShootStatus;
  statusLabel: string;
  stage: number;
  packageId: string;
  packageName: string;
  addons: { id: string; name: string }[];
  totalAmount: number;
  startsAt: string | null;
  directorName: string | null;
  retoucherName: string | null;
  paymentState: string;
  pendingRequests: number;
  pendingNotifications: number;
  retouchDueAt: string | null;
  nextAction: string;
}
export interface ShootListPageDTO {
  shoots: ShootSummary[];
  nextCursor?: string;
}
export interface ShootBoardDTO {
  shoots: ShootSummary[];
  page: number;
  pageSize: number;
  totalMatches: number;
  matchesByStage: number[];
  counts: {
    total: number;
    today: number;
    requests: number;
    pendingTemplates: number;
    depositRequests: number;
    retouchDueTomorrow: number;
  };
  facets: {
    packages: { id: string; name: string }[];
    addons: { id: string; name: string }[];
    directors: string[];
    retouchers: string[];
  };
}
export interface AssetDTO {
  id: string;
  shootId: string;
  kind: string;
  name: string;
  contentType: string;
  size: number;
  visible: boolean;
  url: string;
  createdAt: string;
}
export interface PhotoDTO extends AssetDTO {
  cutNo: number;
  selected: boolean;
  outfitNo: number | null;
  outfitLabel: string | null;
  parentPhotoId: string | null;
}
export interface PaymentDTO {
  id: string;
  kind: string;
  channel: string;
  amount: number;
  state: string;
  heldUntil: string | null;
  confirmedAt: string | null;
  depositor: string | null;
}
export interface RequestDTO {
  id: string;
  type: string;
  state: string;
  message: string | null;
  createdAt: string;
  items: { photoId: string; comment: string }[];
}
export interface TimelineDTO {
  id: string;
  from: string | null;
  to: string | null;
  actorName: string;
  reason: string;
  createdAt: string;
}

export interface PreparationDTO {
  location: {
    area: string;
    meetingPlace: string;
    mapUrl: string | null;
    parkingNote: string;
    parkingUrl: string | null;
  };
  hair: { place: string; time: string; mapUrl: string | null; note: string } | null;
  guides: {
    id: string;
    title: string;
    summary: string;
    body: string;
    url?: string;
    readAt: string | null;
  }[];
  confirmedAt: string | null;
}

export interface AssignmentCandidateDTO {
  directorId: string;
  name: string;
  skillEligible: boolean;
  available: boolean;
  weeklyLoad: number;
  reason: string;
}

export interface ScheduleDTO {
  directors: { id: string; name: string }[];
  retouchers: { id: string; name: string }[];
  slots: {
    directorId: string;
    date: string;
    time: string;
    state: 'available' | 'reserved' | 'unavailable' | 'held';
    shootId?: string;
  }[];
  recentAssignments: ShootSummary[];
}

export interface FileLinkDTO {
  id: string;
  kind: 'retouched' | 'original';
  label: string;
  url: string;
  publishedAt: string | null;
}

export interface CustomerProfileDTO {
  paymentAmount: number | null;
  kakaoNickname: string;
  marketingConsent: boolean;
  privacyConsent: boolean;
  serviceNotificationConsent: boolean;
}

export interface MessageTemplateDTO {
  key: string;
  title: string;
  body: string;
  active: boolean;
  condition: string;
  auto: boolean;
  rules?: TemplateRules;
}

export interface TemplateRules {
  stages: number[];
  packageIds: string[];
  addonIds: string[];
  roles: StaffRole[];
}

export interface SettingsHistoryEntryDTO {
  id: string;
  settingKey: string;
  action?: string;
  targetName?: string;
  actorName: string;
  createdAt: string;
  previous: unknown;
  next: unknown;
}

export interface OperationsSettingsDTO {
  policy: OperationsPolicy;
  staff: { id: string; name: string; email: string; role: StaffRole; active: number }[];
  packages: PackageDTO[];
  addons: AddonDTO[];
  paymentInstructions: ShootDetail['paymentInstructions'];
  neighborhoods: {
    id: string;
    name: string;
    meetingPlace: string;
    mapUrl: string | null;
    parkingNote: string;
    parkingUrl: string | null;
    hairPlace: string;
    hairMapUrl: string | null;
    curriculum: string;
    active: boolean;
  }[];
  daysOff: { directorId: string; date: string }[];
  campaigns: { id: string; name: string; amount: number; active: number }[];
  preparationGuides: PreparationDTO['guides'];
  directorSkills: { directorId: string; addonId: string }[];
  retoucherRules: { weekday: number; retoucherId: string }[];
  mode: 'local';
  externalMessages: false;
}

export type SettingsAction =
  | { type: 'operations_policy'; value: OperationsPolicy }
  | { type: 'payment_instructions'; value: NonNullable<ShootDetail['paymentInstructions']> }
  | { type: 'neighborhood'; value: OperationsSettingsDTO['neighborhoods'][number] }
  | { type: 'day_off'; directorId: string; date: string; unavailable: boolean }
  | { type: 'package'; value: PackageDTO }
  | { type: 'addon'; value: AddonDTO }
  | { type: 'campaign'; value: OperationsSettingsDTO['campaigns'][number] }
  | { type: 'director_skills'; directorId: string; addonIds: string[] }
  | { type: 'retoucher_rules'; rules: OperationsSettingsDTO['retoucherRules'] }
  | { type: 'preparation_guides'; guides: PreparationDTO['guides'] };

export interface ShootDetail extends ShootSummary {
  package: PackageDTO;
  retouchUnitPrice: number;
  extraRetouchAvailable: boolean;
  addons: { id: string; name: string; quantity: number; unitPrice: number }[];
  survey: {
    answers: Record<string, unknown>;
    pageDone: number[];
    submittedAt: string | null;
    dueAt: string | null;
  } | null;
  plan: {
    concept: string;
    outfits: string;
    note: string;
    sharedAt: string | null;
    referenceImages: AssetDTO[];
  } | null;
  directorId: string | null;
  retoucherId: string | null;
  assignmentCandidates: AssignmentCandidateDTO[];
  preparation: PreparationDTO | null;
  selectionMode: 'customer' | 'director' | null;
  selectorReason: string;
  fieldMemo: string;
  fieldChecklist: { checks: string[]; completedAt: string | null };
  fileLinks: FileLinkDTO[];
  paymentInstructions: { bankName: string; accountNumber: string; accountHolder: string } | null;
  profile: CustomerProfileDTO | null;
  photos: PhotoDTO[];
  uploads: AssetDTO[];
  selections: { photoIds: string[]; submittedAt: string; round: string }[];
  requests: RequestDTO[];
  payments: PaymentDTO[];
  timeline: TimelineDTO[];
  notes: { id: string; text: string; createdAt: string; authorName: string }[];
  originals: AssetDTO[];
  retouchJobs: {
    id: string;
    kind: string;
    state: string;
    dueAt: string | null;
    cuts: { photoId: string; uploaded: boolean }[];
  }[];
  capabilities: string[];
  outfitPhotosRequired: number;
  outfitDueAt: string | null;
  revisionCount: number;
  holdExpiresAt: string | null;
}

export type ShootAction =
  | { type: 'change_status'; status: ShootStatus; reason?: string }
  | { type: 'confirm_payment'; paymentId: string }
  | { type: 'save_survey'; answers: Record<string, unknown>; pageDone: number[]; submit?: boolean }
  | { type: 'share_plan'; concept: string; outfits: string; note: string }
  | { type: 'save_preparation'; preparation: Omit<PreparationDTO, 'confirmedAt'> }
  | { type: 'mark_preparation_read'; guideId: string }
  | { type: 'confirm_preparation' }
  | {
      type: 'save_field_checklist';
      checks: string[];
      selector: 'customer' | 'director';
      reason: string;
      note: string;
    }
  | { type: 'complete_field' }
  | { type: 'assign_staff'; directorId?: string; retoucherId?: string; reason: string }
  | {
      type: 'save_file_link';
      kind: 'retouched' | 'original';
      label: string;
      url: string;
      visible: boolean;
    }
  | { type: 'submit_selection'; photoIds: string[] }
  | { type: 'request_extra_retouch'; photoIds: string[] }
  | { type: 'request_revision'; items: { photoId: string; comment: string }[] }
  | { type: 'review_submit'; uploadId: string; message?: string }
  | { type: 'request_deposit'; depositor: string; paymentId?: string }
  | { type: 'resolve_request'; requestId: string; decision: 'complete' | 'reject' }
  | { type: 'note'; text: string }
  | { type: 'cancel'; reason: string }
  | { type: 'start_selection' }
  | { type: 'finish_retouch' }
  | { type: 'release_hold' };

export type ApiResponse<T> = { data: T } | { error: { code: string; message: string } };

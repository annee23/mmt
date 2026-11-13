export const APPLICATION_STATUSES = ["new", "reviewing", "confirmed", "waitlist", "rejected", "cancelled"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const STATUS_LABEL_KO: Record<ApplicationStatus, string> = {
  new: "신규 접수",
  reviewing: "검토 중",
  confirmed: "참가 확정",
  waitlist: "대기",
  rejected: "반려",
  cancelled: "취소",
};

export const AGE_GROUPS = ["10s", "20s", "30s", "40s", "50s", "60s", "70s_plus"] as const;
export const GENDERS = ["female", "male", "other"] as const;
export const HEARD = ["never", "media", "live", "both"] as const;

export const AGE_LABEL_KO: Record<string, string> = {
  "10s": "10대",
  "20s": "20대",
  "30s": "30대",
  "40s": "40대",
  "50s": "50대",
  "60s": "60대",
  "70s_plus": "70대 이상",
};
export const GENDER_LABEL_KO: Record<string, string> = { female: "여성", male: "남성", other: "기타" };
export const HEARD_LABEL_KO: Record<string, string> = {
  never: "들어본 적이 없습니다.",
  media: "영상이나 음원으로 들어본 적이 있습니다.",
  live: "실제 디저리두 연주를 들어본 적이 있습니다.",
  both: "영상·음원과 실제 연주를 모두 들어본 적이 있습니다.",
};

export const STATUS_TONE: Record<ApplicationStatus, string> = {
  new: "text-burgundy",
  reviewing: "text-bronze-deep",
  confirmed: "text-olive",
  waitlist: "text-brown/70",
  rejected: "text-brown/50",
  cancelled: "text-brown/50",
};

export type PrivacySettings = {
  reviewed: boolean;
  controller: string;
  contact_email: string;
  purpose_ko: string;
  purpose_en: string;
  items_ko: string;
  items_en: string;
  retention_ko: string;
  retention_en: string;
  sensitive_purpose_ko: string;
  sensitive_purpose_en: string;
  sensitive_retention_ko: string;
  sensitive_retention_en: string;
  refusal_ko: string;
  refusal_en: string;
};

export type ApplicationFormSettings = { name_required: boolean };

/** Short fingerprint of the consent text that was shown, stored with every application. */
export function consentVersion(p: PrivacySettings): string {
  const text = JSON.stringify(p);
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return `v${(h >>> 0).toString(36)}`;
}

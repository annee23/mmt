import { z } from "zod";

const t = (max = 4000) => z.string().trim().max(max);
const optInt = z.number().int().min(0).max(10_000_000).nullable();
const optDate = z.string().datetime({ offset: true }).nullable();

export const programSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),
  sort_order: z.number().int().min(0).max(1000),
  is_published: z.boolean(),
  recruit_status: z.enum(["open", "closed", "upcoming"]),
  apply_deadline: optDate,
  cover_image: z.string().trim().max(500).nullable(),
  default_capacity: optInt,
  fee_amount: optInt,
  name_ko: t(200), name_en: t(200),
  format_ko: t(300), format_en: t(300),
  summary_ko: t(), summary_en: t(),
  description_ko: t(), description_en: t(),
  composition_ko: t(), composition_en: t(),
  target_ko: t(1000), target_en: t(1000),
  duration_ko: t(500), duration_en: t(500),
  location_ko: t(500), location_en: t(500),
  fee_note_ko: t(500), fee_note_en: t(500),
});

export const sessionSchema = z.object({
  title_ko: t(200), title_en: t(200),
  starts_at: z.string().datetime({ offset: true }),
  ends_at: optDate,
  time_note_ko: t(200), time_note_en: t(200),
  location_ko: t(500), location_en: t(500),
  fee_amount: optInt,
  fee_note_ko: t(500), fee_note_en: t(500),
  capacity: optInt,
  apply_deadline: optDate,
  status: z.enum(["open", "closed"]),
  is_published: z.boolean(),
});

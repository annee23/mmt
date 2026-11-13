-- Initial data. Program names, formats and summaries are the original site's text.
-- Fields the original site never provided (schedule, fee, hours, venue …) stay empty
-- and are entered by the admin under /admin/programs.

insert into public.programs
  (slug, sort_order, recruit_status, cover_image,
   name_ko, name_en, format_ko, format_en, summary_ko, summary_en,
   composition_ko, composition_en, target_ko, target_en, location_ko, location_en)
values
  ('embodied-listening', 1, 'open', null,
   'Didgeridoo Embodied Listening', 'Didgeridoo Embodied Listening',
   '원데이 체험', 'One-Day Experience',
   '디저리두의 소리와 진동을 듣고 느끼며 자신의 몸과 감각을 알아차리는 경험',
   'An experience of listening to and feeling the sound and vibration of the didgeridoo, while noticing your body and senses',
   '호흡 → 소리 → 진동 → 알아차림 → 체화된 경청',
   'Breath → Sound → Vibration → Awareness → Embodied Listening',
   '', '', '', ''),
  ('ten-week-program', 2, 'open', null,
   '10-Week Didgeridoo Program', '10-Week Didgeridoo Program',
   '10주 과정 (개인의 특성에 따라 유연하게 조정 가능)', '10 Weeks (flexibly adjusted to individual needs)',
   '호흡과 신체 인식에서 시작해 소리, 진동, 즉흥연주로 확장하는 단계적 프로그램',
   'A step-by-step program that begins with breath and body awareness and expands into sound, vibration, and improvisation',
   '호흡·신체 인식 → 소리 → 진동 → 즉흥연주',
   'Breath & body awareness → Sound → Vibration → Improvisation',
   '', '', '', ''),
  ('music-therapy', 3, 'open', null,
   'Music Therapy', 'Music Therapy',
   '임상 / 케어 환경', 'Clinical / Care Settings',
   '병원, 요양시설 등에서 개인의 상태와 필요에 맞추어 음악치료적 접근으로 진행',
   'Conducted as a music therapy approach tailored to each person''s condition and needs in hospitals, care facilities, and similar settings',
   '', '', '', '',
   '병원, 요양시설 등', 'Hospitals, care facilities, and similar settings'),
  ('sound-meditation', 4, 'open', null,
   'Sound Meditation with Didgeridoo', 'Sound Meditation with Didgeridoo',
   '세션 / 리트릿', 'Session / Retreat',
   '디저리두의 지속적인 소리와 진동을 통해 경청과 호흡, 신체 감각에 주의를 기울이는 시간',
   'Time spent attending to listening, breath, and bodily sensation through the didgeridoo''s continuous sound and vibration',
   '', '', '', '', '', ''),
  ('workshops-collaborations', 5, 'open', null,
   'Workshops & Collaborations', 'Workshops & Collaborations',
   '워크숍 / 협업', 'Workshop / Collaboration',
   '기관, 기업, 커뮤니티 등과 협력하여 대상과 목적에 맞는 체험형 프로그램 구성',
   'Experiential programs designed in collaboration with organizations, companies, and communities to fit the audience and purpose',
   '', '',
   '기관, 기업, 커뮤니티 등', 'Organizations, companies, and communities',
   '', '');

insert into public.site_settings (key, value) values
  ('application_form', '{"name_required": false}'),
  ('privacy', $json$
  {
    "reviewed": false,
    "controller": "진사랑 (Jin Sarang)",
    "contact_email": "fullmoonstay@naver.com",
    "purpose_ko": "프로그램 신청 접수, 참가 여부 검토 및 안내, 일정 변경·취소 연락",
    "purpose_en": "Receiving and reviewing program applications, and contacting you about schedules, changes and cancellations",
    "items_ko": "이름, 연령대, 성별, 연락처, 디저리두 청취 경험, 참여 이유, 기대하는 경험",
    "items_en": "Name, age group, gender, contact, prior didgeridoo listening experience, reasons for joining, expectations",
    "retention_ko": "프로그램 종료 후 1년간 보관 후 파기",
    "retention_en": "Kept for one year after the program ends, then destroyed",
    "sensitive_purpose_ko": "참여 시 주의가 필요한 건강상의 사항을 확인하여 안전한 프로그램 진행에 활용",
    "sensitive_purpose_en": "To check health matters that need attention so the program can be run safely",
    "sensitive_retention_ko": "프로그램 종료 후 3개월 이내 파기",
    "sensitive_retention_en": "Destroyed within three months after the program ends",
    "refusal_ko": "동의를 거부할 수 있으며, 거부 시 프로그램 신청이 제한됩니다. 건강 관련 정보 제공은 선택이며 동의하지 않아도 신청할 수 있습니다.",
    "refusal_en": "You may refuse consent, in which case the application cannot be accepted. Providing health information is optional and you can apply without it."
  }
  $json$);

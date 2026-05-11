/**
 * Vietnamese display names for catalog entities.
 *
 * Strategy: keep ENGLISH the canonical name on each fixture (`displayName`,
 * `title`); store VI variants here keyed by id. The hook layer (use-localized-names)
 * does the lookup at render time. This avoids:
 *   - Cross-package contract changes for adding `displayNameVi`
 *   - Touching every fixture file to bilingualize
 *   - Bloating chat-store / catalog-api payloads with a second language
 *
 * If an id is missing from the map, we fall back to the entity's English
 * displayName/title — that's the right behaviour for ad-hoc / user-created
 * entities and for items where the English IS already in Vietnamese (e.g.
 * CFM-2 "Voting Vũ Khí SS1" needs no translation).
 *
 * Translations are concise — favour short Vietnamese phrases over literal
 * renderings, and keep the game-code prefix (CFM/PT/TF/NTH) as-is so they
 * remain recognisable at a glance.
 */

/** Segment id → Vietnamese display name. */
export const SEGMENT_NAMES_VI: Record<string, string> = {
  'seg-cfm-ss1-weapon-owners-2026':                  'CFM · Người sở hữu vũ khí SS1 2026',
  'seg-cfm-rfm-tier-1-2026':                         'CFM · Tier 1 cuối năm · Người mới',
  'seg-cfm-rfm-tier-2-2026':                         'CFM · Tier 2 cuối năm · Chi tiêu trung bình',
  'seg-cfm-rfm-tier-3-2026':                         'CFM · Tier 3 cuối năm · Chi tiêu cao',
  'seg-cfm-rfm-tier-4-2026':                         'CFM · Tier 4 cuối năm · Whale',
  'seg-tf-returning-coaches-2026':                   'TF · Huấn luyện viên quay lại 2026',
  'seg-cfm-low-coin-vip-2026':                       'CFM · VIP ít CF Coin',
  'seg-cfm-loss-streak-non-paying-2026-0508-a3f9':   'CFM · Chuỗi thua · Tích cực · Ngừng trả phí',
  'seg-cfm-veteran-pvp-2026':                        'CFM · Lõi PvP kỳ cựu',
  'seg-cfm-whale-at-risk-2026':                      'CFM · Whale có nguy cơ',
  'seg-cfm-new-player-d2-2026':                      'CFM · Khích lệ người chơi mới D2',
  'seg-cfm-shop-window-shopper-2026':                'CFM · Khách lượn cửa hàng',
  'seg-cfm-lapsed-mid-spender-2026':                 'CFM · Chi tiêu trung bình ngừng chơi',
  'seg-nth-whale-at-risk-2026':                      'NTH · Whale có nguy cơ · Drift đăng nhập',
  'seg-cfm-pass-stuck-vip-2026':                     'CFM · Pass tắc · VIP Tier',
};

/**
 * Campaign id → Vietnamese display name.
 *
 * Most campaigns already carry Vietnamese (CFM-2 "Voting Vũ Khí SS1",
 * CFM-11 "Lễ Hội Cuối Năm", TF-1 "Football Hub Học Viện Sân Cỏ"). We only
 * map the English-titled ones; the rest fall through to displayName.
 */
export const CAMPAIGN_NAMES_VI: Record<string, string> = {
  'cmp-cfm-407':                  'CFM-13 · Cứu hộ Pass tắc',
  'cmp-cfm-408':                  'CFM-18 · Ít CF Coin + Item nổi bật',
  'cmp-cfm-pass-stuck-variant-b': 'CFM · Cứu hộ Pass tắc · Biến thể B (Agent đề xuất)',
  'cmp-nth-whale-comeback':       'NTH · Chiến dịch gọi lại Whale (Agent đề xuất)',
};

/** Chat thread id → Vietnamese title. */
export const THREAD_TITLES_VI: Record<string, string> = {
  'thread-001':                     'CPI cao có thật sự cho ra LTV cao hơn không?',
  'thread-002':                     'Giữ chân D7 từ kênh Facebook',
  'thread-004':                     'Tạo phân khúc chi tiêu trên $50 trong 30 ngày qua',
  'thread-005':                     'So sánh tiêu gem giữa PT-6 và PT-10',
  'thread-006':                     'ROI tier cuối năm CFM-11',
  'thread-007':                     'Người chơi gặp chuỗi thua xếp hạng liên tiếp',
  'thread-008':                     'Tìm whale PT đang có nguy cơ rời bỏ',
  'thread-demo-livops-2026':              'ARPDAU CFM giảm trong quý vừa rồi vì sao?',
  'thread-demo-agent-livops-2026':        'Hermes phát hiện: ARPDAU CFM giảm 7%',
  'thread-demo-agent-d7-fb-cohort-2026':  'Hermes phát hiện: D7 cohort FB giảm 4pp',
  'thread-demo-agent-whale-recall-2026':  'Hermes phát hiện: Recall whale giảm còn 38%',
};

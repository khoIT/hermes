/**
 * EN / VI translation dictionary for Hermes.
 *
 * Pattern: shallow flat keys, dot-namespaced for organization. Add new strings
 * by extending both `en` and `vi` simultaneously — TypeScript will block the
 * build if a key is missing in either. Translations are concise; favor short
 * Vietnamese phrases over literal-but-long renderings.
 *
 * Coverage focus (2026-05-10):
 *   - Settings page (full)
 *   - Welcome page panels (HermesNoticed / RecentThreads / StartSomething / KpiStrip / HeroStrip)
 *   - Sidebar nav labels
 *   - Chat input placeholders + section labels
 *   - Common buttons (Save, Cancel, Confirm, Close)
 *
 * Out of scope this round (English-only): chart axis labels, tooltip
 * micro-copy, fixture data inside threads. Add as needed.
 */

export const en = {
  // ─── Common ─────────────────────────────────────────────────────────────
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.confirm': 'Confirm',
  'common.close': 'Close',
  'common.continue': 'Continue',
  'common.back': 'Back',
  'common.next': 'Next',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.search': 'Search',
  'common.loading': 'Loading…',
  'common.error': 'Error',
  'common.recommended': 'Recommended',
  'common.optional': 'Optional',
  'common.required': 'Required',

  // ─── Sidebar ────────────────────────────────────────────────────────────
  'nav.welcome': 'Welcome',
  'nav.chat': 'Ask Hermes',
  'nav.featureStore': 'Feature Store',
  'nav.segments': 'Segments',
  'nav.campaigns': 'Campaigns',
  'nav.canvas': 'Canvas',
  'nav.knowledge': 'Knowledge',
  'nav.funnels': 'Funnels',
  'nav.retentions': 'Retentions',
  'nav.playbooks': 'Playbooks',
  'nav.explore': 'Explore',
  'nav.settings': 'Settings',
  'nav.account': 'Account',

  // ─── Welcome page ───────────────────────────────────────────────────────
  'welcome.hero.title': 'LiveOps cockpit',
  'welcome.hero.subtitle': 'Decisions, not dashboards.',

  'welcome.kpi.dau': 'Daily active users',
  'welcome.kpi.arpdau': 'ARPDAU',
  'welcome.kpi.payingDau': 'Paying-DAU %',
  'welcome.kpi.d7': 'D7 retention',
  'welcome.kpi.activeCampaigns': 'Active campaigns',

  'welcome.activeCampaigns.title': 'Active campaigns',
  'welcome.activeCampaigns.empty': 'No active campaigns. Launch one from a segment to see it here.',

  'welcome.startSomething.title': 'Start something',
  'welcome.startSomething.askHermes': 'Ask Hermes',
  'welcome.startSomething.newSegment': 'New segment',
  'welcome.startSomething.newCampaign': 'New campaign',

  'welcome.recentThreads.title': 'Recent threads',
  'welcome.recentThreads.empty': 'No chats yet. Ask Hermes a question to get started.',

  'welcome.hermesNoticed.title': 'Hermes noticed',
  'welcome.hermesNoticed.tag': 'AGENT-FIRST DEMO',
  'welcome.hermesNoticed.cta': 'Investigate',
  // Card A — CFM ARPDAU drift (existing canonical agent-first arc).
  'welcome.hermesNoticed.cardArpdauHeadline': 'CFM ARPDAU is down 7% vs last 4 weeks.',
  'welcome.hermesNoticed.cardArpdauBody':
    'Traced to mid-skill ranked players hitting loss-streaks ≥ 5 — that bucket grew 3.2× this quarter. ' +
    'ARPPU is flat; this is a conversion problem, not a spend problem.',
  // Card B — D7 retention drop on FB-acquired May cohort.
  'welcome.hermesNoticed.cardD7Headline': 'D7 retention dropped 4pp for FB-acquired May cohort.',
  'welcome.hermesNoticed.cardD7Body':
    'Drop concentrated in users who saw the legacy onboarding tutorial. Blended D7 = 22.4%, FB cohort = 18.2%. ' +
    'Ranked-tutorial completion correlates with the gap.',
  // Card C — Top-1% spender recall decline.
  'welcome.hermesNoticed.cardWhaleHeadline': 'Top-1% spender 30-day recall fell from 52% → 38%.',
  'welcome.hermesNoticed.cardWhaleBody':
    'Traced to 4 named whales going dormant after the Apr-21 ranked-season reset. ' +
    'Estimated $14k MRR at risk if pattern persists into May ranked-end.',

  // ─── Chat ───────────────────────────────────────────────────────────────
  'chat.input.placeholder': 'Ask a follow-up…',
  'chat.input.placeholderLanding': 'Ask Hermes anything about your data…',
  'chat.followups.label': 'Follow-ups',
  'chat.threadNotFound': 'Thread not found',
  'chat.threadNotFound.body': 'The conversation may have been deleted.',
  'chat.threadNotFound.back': 'Back to chat landing',

  // ─── Settings page ──────────────────────────────────────────────────────
  'settings.title': 'Settings',
  'settings.subtitle': 'Workspace preferences, account, integrations.',

  'settings.section.account': 'Account',
  'settings.section.appearance': 'Appearance',
  'settings.section.language': 'Language & region',
  'settings.section.notifications': 'Notifications',
  'settings.section.workspace': 'Workspace',
  'settings.section.integrations': 'Integrations',
  'settings.section.security': 'Security',
  'settings.section.danger': 'Danger zone',

  'settings.account.email': 'Email',
  'settings.account.role': 'Role',
  'settings.account.team': 'Team',
  'settings.account.signOut': 'Sign out',

  'settings.appearance.theme': 'Theme',
  'settings.appearance.theme.light': 'Light',
  'settings.appearance.theme.dark': 'Dark',
  'settings.appearance.theme.system': 'Match system',
  'settings.appearance.density': 'Density',
  'settings.appearance.density.comfortable': 'Comfortable',
  'settings.appearance.density.compact': 'Compact',
  'settings.appearance.accent': 'Accent color',

  'settings.language.label': 'Language',
  'settings.language.timezone': 'Timezone',
  'settings.language.dateFormat': 'Date format',
  'settings.language.numberFormat': 'Number format',

  'settings.notifications.email': 'Email notifications',
  'settings.notifications.email.desc': 'Daily digest of agent-flagged opportunities.',
  'settings.notifications.slack': 'Slack alerts',
  'settings.notifications.slack.desc': 'Instant ping when a campaign auto-pause guardrail fires.',
  'settings.notifications.weeklyRecap': 'Weekly recap',
  'settings.notifications.weeklyRecap.desc': 'Mondays · what Hermes shipped, what it learned.',

  'settings.workspace.name': 'Workspace name',
  'settings.workspace.studioBindings': 'Game studio bindings',
  'settings.workspace.studioBindings.desc': 'Games this workspace can read from and write to.',
  'settings.workspace.dataResidency': 'Data residency',

  'settings.integrations.title': 'Connected services',
  'settings.integrations.trino': 'Trino warehouse',
  'settings.integrations.apollo': 'Apollo TEE',
  'settings.integrations.hatchet': 'Hatchet',
  'settings.integrations.iceberg': 'Iceberg',
  'settings.integrations.slack': 'Slack',
  'settings.integrations.connected': 'Connected',
  'settings.integrations.disconnected': 'Not connected',

  'settings.danger.transferOwnership': 'Transfer workspace ownership',
  'settings.danger.deleteWorkspace': 'Delete workspace',
  'settings.danger.deleteWorkspace.desc':
    'Permanently delete this workspace and all of its segments, campaigns, boards and chat history. This cannot be undone.',
  'settings.danger.delete': 'Delete',
};

export const vi: Record<keyof typeof en, string> = {
  // ─── Common ─────────────────────────────────────────────────────────────
  'common.save': 'Lưu',
  'common.cancel': 'Hủy',
  'common.confirm': 'Xác nhận',
  'common.close': 'Đóng',
  'common.continue': 'Tiếp tục',
  'common.back': 'Quay lại',
  'common.next': 'Tiếp theo',
  'common.delete': 'Xóa',
  'common.edit': 'Chỉnh sửa',
  'common.search': 'Tìm kiếm',
  'common.loading': 'Đang tải…',
  'common.error': 'Lỗi',
  'common.recommended': 'Khuyến nghị',
  'common.optional': 'Tùy chọn',
  'common.required': 'Bắt buộc',

  // ─── Sidebar ────────────────────────────────────────────────────────────
  'nav.welcome': 'Trang chủ',
  'nav.chat': 'Ask Hermes',
  'nav.featureStore': 'Kho Feature',
  'nav.segments': 'Phân khúc',
  'nav.campaigns': 'Chiến dịch',
  'nav.canvas': 'Bảng',
  'nav.knowledge': 'Tri thức',
  'nav.funnels': 'Phễu chuyển đổi',
  'nav.retentions': 'Giữ chân',
  'nav.playbooks': 'Sổ tay',
  'nav.explore': 'Khám phá',
  'nav.settings': 'Cài đặt',
  'nav.account': 'Tài khoản',

  // ─── Welcome page ───────────────────────────────────────────────────────
  'welcome.hero.title': 'Trung tâm điều hành LiveOps',
  'welcome.hero.subtitle': 'Quyết định, không phải bảng số liệu.',

  'welcome.kpi.dau': 'Người dùng hoạt động hằng ngày',
  'welcome.kpi.arpdau': 'ARPDAU',
  'welcome.kpi.payingDau': '% DAU trả phí',
  'welcome.kpi.d7': 'Giữ chân D7',
  'welcome.kpi.activeCampaigns': 'Chiến dịch đang chạy',

  'welcome.activeCampaigns.title': 'Chiến dịch đang chạy',
  'welcome.activeCampaigns.empty': 'Chưa có chiến dịch nào. Khởi chạy từ một phân khúc để xuất hiện ở đây.',

  'welcome.startSomething.title': 'Bắt đầu',
  'welcome.startSomething.askHermes': 'Hỏi Hermes',
  'welcome.startSomething.newSegment': 'Phân khúc mới',
  'welcome.startSomething.newCampaign': 'Chiến dịch mới',

  'welcome.recentThreads.title': 'Trò chuyện gần đây',
  'welcome.recentThreads.empty': 'Chưa có cuộc trò chuyện. Hỏi Hermes để bắt đầu.',

  'welcome.hermesNoticed.title': 'Hermes phát hiện',
  'welcome.hermesNoticed.tag': 'DEMO AGENT-FIRST',
  'welcome.hermesNoticed.cta': 'Khám phá',
  // Card A — ARPDAU drift.
  'welcome.hermesNoticed.cardArpdauHeadline': 'ARPDAU của CFM giảm 7% so với 4 tuần trước.',
  'welcome.hermesNoticed.cardArpdauBody':
    'Nguyên nhân là người chơi rank tầm trung gặp chuỗi thua ≥ 5 — nhóm này tăng 3.2× trong quý này. ' +
    'ARPPU vẫn ổn định; đây là vấn đề chuyển đổi, không phải vấn đề chi tiêu.',
  // Card B — D7 cohort FB.
  'welcome.hermesNoticed.cardD7Headline': 'D7 retention giảm 4pp ở cohort FB tháng 5.',
  'welcome.hermesNoticed.cardD7Body':
    'Tập trung ở người dùng xem onboarding cũ. D7 chung 22.4%, cohort FB 18.2%. ' +
    'Liên quan đến tỉ lệ hoàn thành tutorial ranked.',
  // Card C — Whale recall.
  'welcome.hermesNoticed.cardWhaleHeadline': 'Recall 30 ngày của top-1% spender giảm từ 52% → 38%.',
  'welcome.hermesNoticed.cardWhaleBody':
    '4 whale dormant sau reset season ranked 21/4. ' +
    'Khoảng $14k MRR rủi ro nếu kéo dài qua cuối tháng 5.',

  // ─── Chat ───────────────────────────────────────────────────────────────
  'chat.input.placeholder': 'Hỏi tiếp…',
  'chat.input.placeholderLanding': 'Hỏi Hermes bất kỳ điều gì về dữ liệu của bạn…',
  'chat.followups.label': 'Câu hỏi gợi ý',
  'chat.threadNotFound': 'Không tìm thấy cuộc trò chuyện',
  'chat.threadNotFound.body': 'Cuộc trò chuyện có thể đã bị xóa.',
  'chat.threadNotFound.back': 'Về trang trò chuyện',

  // ─── Settings page ──────────────────────────────────────────────────────
  'settings.title': 'Cài đặt',
  'settings.subtitle': 'Tùy chọn workspace, tài khoản, tích hợp.',

  'settings.section.account': 'Tài khoản',
  'settings.section.appearance': 'Giao diện',
  'settings.section.language': 'Ngôn ngữ & khu vực',
  'settings.section.notifications': 'Thông báo',
  'settings.section.workspace': 'Workspace',
  'settings.section.integrations': 'Tích hợp',
  'settings.section.security': 'Bảo mật',
  'settings.section.danger': 'Vùng nguy hiểm',

  'settings.account.email': 'Email',
  'settings.account.role': 'Vai trò',
  'settings.account.team': 'Đội',
  'settings.account.signOut': 'Đăng xuất',

  'settings.appearance.theme': 'Chủ đề',
  'settings.appearance.theme.light': 'Sáng',
  'settings.appearance.theme.dark': 'Tối',
  'settings.appearance.theme.system': 'Theo hệ thống',
  'settings.appearance.density': 'Mật độ',
  'settings.appearance.density.comfortable': 'Thoải mái',
  'settings.appearance.density.compact': 'Gọn',
  'settings.appearance.accent': 'Màu nhấn',

  'settings.language.label': 'Ngôn ngữ',
  'settings.language.timezone': 'Múi giờ',
  'settings.language.dateFormat': 'Định dạng ngày',
  'settings.language.numberFormat': 'Định dạng số',

  'settings.notifications.email': 'Thông báo email',
  'settings.notifications.email.desc': 'Tóm tắt hằng ngày các cơ hội Hermes phát hiện.',
  'settings.notifications.slack': 'Cảnh báo Slack',
  'settings.notifications.slack.desc': 'Ping ngay khi guardrail tự ngắt chiến dịch kích hoạt.',
  'settings.notifications.weeklyRecap': 'Tổng kết hằng tuần',
  'settings.notifications.weeklyRecap.desc': 'Thứ Hai · Hermes đã làm gì, học được gì.',

  'settings.workspace.name': 'Tên workspace',
  'settings.workspace.studioBindings': 'Liên kết studio game',
  'settings.workspace.studioBindings.desc': 'Các game workspace này có quyền đọc/ghi.',
  'settings.workspace.dataResidency': 'Khu vực lưu trữ dữ liệu',

  'settings.integrations.title': 'Dịch vụ kết nối',
  'settings.integrations.trino': 'Kho Trino',
  'settings.integrations.apollo': 'Apollo TEE',
  'settings.integrations.hatchet': 'Hatchet',
  'settings.integrations.iceberg': 'Iceberg',
  'settings.integrations.slack': 'Slack',
  'settings.integrations.connected': 'Đã kết nối',
  'settings.integrations.disconnected': 'Chưa kết nối',

  'settings.danger.transferOwnership': 'Chuyển quyền sở hữu workspace',
  'settings.danger.deleteWorkspace': 'Xóa workspace',
  'settings.danger.deleteWorkspace.desc':
    'Xóa vĩnh viễn workspace này cùng toàn bộ phân khúc, chiến dịch, bảng và lịch sử trò chuyện. Hành động này không thể hoàn tác.',
  'settings.danger.delete': 'Xóa',
};

export type TranslationKey = keyof typeof en;

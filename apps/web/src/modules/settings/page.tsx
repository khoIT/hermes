/**
 * Settings — state-of-the-art liveops analytics platform settings.
 *
 * Layout:
 *   ┌─────────────────────────────────────────────────────────┐
 *   │ Settings                                                │
 *   │ Subtitle / breadcrumb                                   │
 *   ├──────────────┬──────────────────────────────────────────┤
 *   │ side-nav     │  active section content                  │
 *   │ - Account    │  ┌────────────────────────────────────┐  │
 *   │ - Appearance │  │ section header                     │  │
 *   │ - Language   │  ├────────────────────────────────────┤  │
 *   │ - Notif…     │  │ form rows (label · control · desc) │  │
 *   │ - Workspace  │  └────────────────────────────────────┘  │
 *   │ - Integrat…  │                                          │
 *   │ - Security   │                                          │
 *   │ - Danger     │                                          │
 *   └──────────────┴──────────────────────────────────────────┘
 *
 * Wired-and-functional toggles (persist to localStorage):
 *   - Theme: light / dark
 *   - Language: en / vi
 *
 * Mocked-but-realistic surfaces (no backend):
 *   - Account profile read-only
 *   - Notifications: 3 toggles persisted in component state
 *   - Workspace + Integrations: read-only display
 *   - Danger zone: confirm-typed delete UI (does not actually delete)
 */
import React from 'react';
import {
  User, Palette, Languages, Bell, Briefcase, Plug, Shield,
  AlertTriangle, Sun, Moon, Monitor, Check,
} from 'lucide-react';
import { T, Icon, Switch, Select, Button, Input } from '../../theme';
import { useTheme, type ThemeMode } from '../../utils/theme-provider';
import { useI18n, useT, type Language } from '../../i18n/i18n-provider';

type SectionId =
  | 'account' | 'appearance' | 'language' | 'notifications'
  | 'workspace' | 'integrations' | 'security' | 'danger';

export default function SettingsPage() {
  const t = useT();
  const [active, setActive] = React.useState<SectionId>('appearance');

  const navItems: Array<{ id: SectionId; icon: typeof User; labelKey: Parameters<typeof t>[0] }> = [
    { id: 'account',       icon: User,           labelKey: 'settings.section.account' },
    { id: 'appearance',    icon: Palette,        labelKey: 'settings.section.appearance' },
    { id: 'language',      icon: Languages,      labelKey: 'settings.section.language' },
    { id: 'notifications', icon: Bell,           labelKey: 'settings.section.notifications' },
    { id: 'workspace',     icon: Briefcase,      labelKey: 'settings.section.workspace' },
    { id: 'integrations',  icon: Plug,           labelKey: 'settings.section.integrations' },
    { id: 'security',      icon: Shield,         labelKey: 'settings.section.security' },
    { id: 'danger',        icon: AlertTriangle,  labelKey: 'settings.section.danger' },
  ];

  return (
    <div style={{
      maxWidth: 1180, margin: '0 auto',
      padding: '32px 48px 56px',
      fontFamily: T.fSans,
    }}>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{
          fontFamily: T.fDisp, fontSize: 40, fontWeight: 400,
          color: T.n950, margin: 0, letterSpacing: '0.005em',
          textTransform: 'uppercase', lineHeight: 1,
        }}>
          {t('settings.title')}
        </h1>
        <p style={{ fontSize: 13, color: T.n500, margin: '8px 0 0' }}>
          {t('settings.subtitle')}
        </p>
      </header>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '220px minmax(0, 1fr)',
        gap: 32,
        alignItems: 'flex-start',
      }}>
        {/* Side nav */}
        <nav style={{
          position: 'sticky', top: 16, alignSelf: 'flex-start',
          display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          {navItems.map(item => (
            <SideNavItem
              key={item.id}
              icon={item.icon}
              label={t(item.labelKey)}
              active={active === item.id}
              danger={item.id === 'danger'}
              onClick={() => setActive(item.id)}
            />
          ))}
        </nav>

        {/* Content */}
        <main>
          {active === 'account'       && <AccountSection />}
          {active === 'appearance'    && <AppearanceSection />}
          {active === 'language'      && <LanguageSection />}
          {active === 'notifications' && <NotificationsSection />}
          {active === 'workspace'     && <WorkspaceSection />}
          {active === 'integrations'  && <IntegrationsSection />}
          {active === 'security'      && <SecuritySection />}
          {active === 'danger'        && <DangerSection />}
        </main>
      </div>
    </div>
  );
}

// ─── Side nav item ──────────────────────────────────────────────────────────

function SideNavItem({
  icon, label, active, danger, onClick,
}: {
  icon: typeof User;
  label: string;
  active: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  const [hover, setHover] = React.useState(false);
  const accent = danger ? T.red600 : T.brand;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px',
        background: active ? T.brandSoft : hover ? T.n100 : 'transparent',
        color: active ? accent : T.n800,
        border: 'none', borderRadius: 8, cursor: 'pointer',
        fontFamily: T.fSans, fontSize: 13, fontWeight: active ? 600 : 500,
        textAlign: 'left', transition: 'background .12s, color .12s',
      }}
    >
      <Icon icon={icon} size={14} color={active ? accent : T.n500} />
      {label}
    </button>
  );
}

// ─── Section primitives ─────────────────────────────────────────────────────

function SectionCard({
  title, children,
}: { title: string; children: React.ReactNode }) {
  return (
    <section
      data-hermes-surface="card"
      style={{
        background: T.surface,
        border: `1px solid ${T.n200}`,
        borderRadius: 12,
        padding: 0,
        marginBottom: 20,
        overflow: 'hidden',
      }}
    >
      <header style={{
        padding: '16px 24px',
        borderBottom: `1px solid ${T.n100}`,
      }}>
        <h2 style={{
          fontFamily: T.fSans, fontSize: 16, fontWeight: 600,
          color: T.n900, margin: 0, letterSpacing: '-0.005em',
        }}>
          {title}
        </h2>
      </header>
      <div style={{ padding: '20px 24px' }}>
        {children}
      </div>
    </section>
  );
}

function SettingRow({
  label, description, control,
}: {
  label: string;
  description?: string;
  control: React.ReactNode;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 24,
      padding: '14px 0',
      borderBottom: `1px solid ${T.n100}`,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: T.n900 }}>
          {label}
        </div>
        {description && (
          <div style={{ fontSize: 12, color: T.n500, marginTop: 4, lineHeight: 1.5 }}>
            {description}
          </div>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>
        {control}
      </div>
    </div>
  );
}

// ─── Section: Account ───────────────────────────────────────────────────────

function AccountSection() {
  const t = useT();
  return (
    <SectionCard title={t('settings.section.account')}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '4px 0 20px',
        borderBottom: `1px solid ${T.n100}`, marginBottom: 4,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 28,
          background: T.brandSoft, color: T.brand,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: T.fSans, fontWeight: 600, fontSize: 22,
        }}>
          KN
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: T.n900 }}>
            Khoi Nguyen
          </div>
          <div style={{ fontSize: 12, color: T.n500, marginTop: 2 }}>
            khoitn@vng.com.vn
          </div>
        </div>
      </div>
      <SettingRow
        label={t('settings.account.role')}
        control={<span style={{ fontSize: 12, color: T.n700 }}>Workspace owner · GDS PM</span>}
      />
      <SettingRow
        label={t('settings.account.team')}
        control={<span style={{ fontSize: 12, color: T.n700 }}>VNG Games · LiveOps</span>}
      />
      <div style={{ marginTop: 16 }}>
        <Button variant="outline" size="sm">{t('settings.account.signOut')}</Button>
      </div>
    </SectionCard>
  );
}

// ─── Section: Appearance ────────────────────────────────────────────────────

function AppearanceSection() {
  const t = useT();
  const { mode, setMode } = useTheme();

  const themes: Array<{ id: ThemeMode | 'system'; icon: typeof Sun; labelKey: Parameters<typeof t>[0] }> = [
    { id: 'light',  icon: Sun,     labelKey: 'settings.appearance.theme.light' },
    { id: 'dark',   icon: Moon,    labelKey: 'settings.appearance.theme.dark' },
    { id: 'system', icon: Monitor, labelKey: 'settings.appearance.theme.system' },
  ];

  return (
    <SectionCard title={t('settings.section.appearance')}>
      <SettingRow
        label={t('settings.appearance.theme')}
        control={
          <div style={{ display: 'flex', gap: 8 }}>
            {themes.map(opt => (
              <ThemeChip
                key={opt.id}
                icon={opt.icon}
                label={t(opt.labelKey)}
                active={
                  opt.id === 'system'
                    ? false /* system not persisted as a mode in this build */
                    : mode === opt.id
                }
                onClick={() => {
                  if (opt.id === 'system') {
                    const sys = window.matchMedia('(prefers-color-scheme: light)').matches
                      ? 'dark' : 'light';
                    setMode(sys);
                  } else {
                    setMode(opt.id);
                  }
                }}
              />
            ))}
          </div>
        }
      />
      <SettingRow
        label={t('settings.appearance.density')}
        control={
          <Select
            value="comfortable"
            onChange={() => { /* mock */ }}
            options={[
              { value: 'comfortable', label: t('settings.appearance.density.comfortable') },
              { value: 'compact',     label: t('settings.appearance.density.compact') },
            ]}
            size="sm"
          />
        }
      />
      <SettingRow
        label={t('settings.appearance.accent')}
        control={
          <div style={{ display: 'flex', gap: 6 }}>
            {['#f05a22', '#3f8dff', '#059669', '#a855f7'].map(c => (
              <button key={c}
                style={{
                  width: 24, height: 24, borderRadius: 12,
                  background: c, border: c === '#f05a22' ? `2px solid ${T.n900}` : `1px solid ${T.n200}`,
                  cursor: 'pointer',
                }}
                aria-label={`Accent ${c}`}
              />
            ))}
          </div>
        }
      />
    </SectionCard>
  );
}

function ThemeChip({
  icon, label, active, onClick,
}: {
  icon: typeof Sun;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '6px 12px', borderRadius: 8,
        background: active ? T.brandSoft : T.surface,
        color: active ? T.brand : T.n800,
        border: `1px solid ${active ? T.brandBorder : T.n200}`,
        cursor: 'pointer', fontFamily: T.fSans, fontSize: 12, fontWeight: 500,
        transition: 'background .12s, border-color .12s, color .12s',
      }}
    >
      <Icon icon={icon} size={13} color={active ? T.brand : T.n500} />
      {label}
      {active && <Icon icon={Check} size={12} color={T.brand} />}
    </button>
  );
}

// ─── Section: Language ──────────────────────────────────────────────────────

function LanguageSection() {
  const t = useT();
  const { lang, setLang } = useI18n();

  return (
    <SectionCard title={t('settings.section.language')}>
      <SettingRow
        label={t('settings.language.label')}
        control={
          <div style={{ display: 'flex', gap: 8 }}>
            <LanguageChip
              flag="🇬🇧"
              label="English"
              code="EN"
              active={lang === 'en'}
              onClick={() => setLang('en')}
            />
            <LanguageChip
              flag="🇻🇳"
              label="Tiếng Việt"
              code="VI"
              active={lang === 'vi'}
              onClick={() => setLang('vi')}
            />
          </div>
        }
      />
      <SettingRow
        label={t('settings.language.timezone')}
        control={
          <Select
            value="Asia/Bangkok"
            onChange={() => { /* mock */ }}
            options={[
              'Asia/Bangkok', 'Asia/Ho_Chi_Minh', 'Asia/Singapore',
              'Asia/Tokyo', 'UTC',
            ]}
            size="sm"
          />
        }
      />
      <SettingRow
        label={t('settings.language.dateFormat')}
        control={
          <Select
            value="YYYY-MM-DD"
            onChange={() => { /* mock */ }}
            options={['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY']}
            size="sm"
          />
        }
      />
      <SettingRow
        label={t('settings.language.numberFormat')}
        control={
          <Select
            value="en-US"
            onChange={() => { /* mock */ }}
            options={[
              { value: 'en-US', label: '1,234.56 (en-US)' },
              { value: 'vi-VN', label: '1.234,56 (vi-VN)' },
            ]}
            size="sm"
          />
        }
      />
    </SectionCard>
  );
}

function LanguageChip({
  flag, label, code, active, onClick,
}: {
  flag: string; label: string; code: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '8px 14px', borderRadius: 8, minWidth: 140,
        background: active ? T.brandSoft : T.surface,
        color: active ? T.brand : T.n900,
        border: `1px solid ${active ? T.brandBorder : T.n200}`,
        cursor: 'pointer', fontFamily: T.fSans, fontSize: 13, fontWeight: 500,
        textAlign: 'left',
      }}
    >
      <span style={{ fontSize: 18 }}>{flag}</span>
      <span style={{ flex: 1 }}>{label}</span>
      <span style={{
        fontFamily: T.fMono, fontSize: 10, color: T.n500,
        background: T.n100, padding: '1px 6px', borderRadius: 4,
        letterSpacing: '0.04em',
      }}>
        {code}
      </span>
      {active && <Icon icon={Check} size={13} color={T.brand} />}
    </button>
  );
}

// ─── Section: Notifications ─────────────────────────────────────────────────

function NotificationsSection() {
  const t = useT();
  const [emailOn, setEmailOn] = React.useState(true);
  const [slackOn, setSlackOn] = React.useState(true);
  const [recapOn, setRecapOn] = React.useState(false);

  return (
    <SectionCard title={t('settings.section.notifications')}>
      <SettingRow
        label={t('settings.notifications.email')}
        description={t('settings.notifications.email.desc')}
        control={<Switch checked={emailOn} onChange={setEmailOn} />}
      />
      <SettingRow
        label={t('settings.notifications.slack')}
        description={t('settings.notifications.slack.desc')}
        control={<Switch checked={slackOn} onChange={setSlackOn} />}
      />
      <SettingRow
        label={t('settings.notifications.weeklyRecap')}
        description={t('settings.notifications.weeklyRecap.desc')}
        control={<Switch checked={recapOn} onChange={setRecapOn} />}
      />
    </SectionCard>
  );
}

// ─── Section: Workspace ─────────────────────────────────────────────────────

function WorkspaceSection() {
  const t = useT();
  return (
    <SectionCard title={t('settings.section.workspace')}>
      <SettingRow
        label={t('settings.workspace.name')}
        control={
          <Input defaultValue="VNG Games · LiveOps" size="sm" style={{ width: 240 }} />
        }
      />
      <SettingRow
        label={t('settings.workspace.studioBindings')}
        description={t('settings.workspace.studioBindings.desc')}
        control={
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 280 }}>
            {['CFM', 'PT', 'NTH', 'TF', 'COS'].map(g => (
              <span key={g} style={{
                fontFamily: T.fMono, fontSize: 11, fontWeight: 600,
                background: T.n100, color: T.n800,
                padding: '3px 8px', borderRadius: 4,
              }}>
                {g}
              </span>
            ))}
          </div>
        }
      />
      <SettingRow
        label={t('settings.workspace.dataResidency')}
        control={
          <Select
            value="ap-southeast-1"
            onChange={() => { /* mock */ }}
            options={[
              { value: 'ap-southeast-1', label: 'Singapore (ap-southeast-1)' },
              { value: 'ap-southeast-2', label: 'Sydney (ap-southeast-2)' },
              { value: 'us-east-1',      label: 'Virginia (us-east-1)' },
            ]}
            size="sm"
          />
        }
      />
    </SectionCard>
  );
}

// ─── Section: Integrations ──────────────────────────────────────────────────

function IntegrationsSection() {
  const t = useT();
  const integrations = [
    { key: 'trino',   name: t('settings.integrations.trino'),   status: 'connected', detail: 'cfm_vn @ 10.164.54.181:8080' },
    { key: 'apollo',  name: t('settings.integrations.apollo'),  status: 'connected', detail: 'TEE-prod-1 · 12 active triggers' },
    { key: 'hatchet', name: t('settings.integrations.hatchet'), status: 'connected', detail: 'batch-cluster-2 · last run 14m ago' },
    { key: 'iceberg', name: t('settings.integrations.iceberg'), status: 'connected', detail: '47 tables · 2.4 TB indexed' },
    { key: 'slack',   name: t('settings.integrations.slack'),   status: 'disconnected', detail: '—' },
  ] as const;
  return (
    <SectionCard title={t('settings.integrations.title')}>
      {integrations.map(int => (
        <div key={int.key} style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '14px 0',
          borderBottom: `1px solid ${T.n100}`,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: T.n100, color: T.n700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: T.fMono, fontWeight: 600, fontSize: 11,
            flexShrink: 0,
          }}>
            {int.name.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.n900 }}>
              {int.name}
            </div>
            <div style={{ fontSize: 11, color: T.n500, marginTop: 2, fontFamily: T.fMono }}>
              {int.detail}
            </div>
          </div>
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: int.status === 'connected' ? T.green600 : T.n500,
            background: int.status === 'connected' ? T.greenSoft : T.n100,
            padding: '3px 10px', borderRadius: 12,
          }}>
            ● {int.status === 'connected' ? t('settings.integrations.connected') : t('settings.integrations.disconnected')}
          </span>
        </div>
      ))}
    </SectionCard>
  );
}

// ─── Section: Security ──────────────────────────────────────────────────────

function SecuritySection() {
  const t = useT();
  return (
    <SectionCard title={t('settings.section.security')}>
      <SettingRow
        label="Single sign-on (SSO)"
        description="VNG Active Directory · automatic"
        control={<span style={{ fontSize: 11, color: T.green600, fontWeight: 600 }}>● Active</span>}
      />
      <SettingRow
        label="Two-factor authentication"
        description="Enforced via VNG SSO policy"
        control={<span style={{ fontSize: 11, color: T.green600, fontWeight: 600 }}>● Enforced</span>}
      />
      <SettingRow
        label="Session timeout"
        control={
          <Select value="8h" onChange={() => { /* mock */ }} options={['1h', '4h', '8h', '24h']} size="sm" />
        }
      />
      <SettingRow
        label="API tokens"
        description="0 active tokens"
        control={<Button variant="outline" size="sm">Generate token</Button>}
      />
    </SectionCard>
  );
}

// ─── Section: Danger zone ───────────────────────────────────────────────────

function DangerSection() {
  const t = useT();
  return (
    <section
      data-hermes-surface="card"
      style={{
        background: T.surface,
        border: `1px solid ${T.red600}`,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 20,
      }}
    >
      <header style={{
        padding: '16px 24px',
        borderBottom: `1px solid ${T.red500}`,
        background: T.redSoft,
      }}>
        <h2 style={{
          fontFamily: T.fSans, fontSize: 16, fontWeight: 600,
          color: T.red600, margin: 0, letterSpacing: '-0.005em',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Icon icon={AlertTriangle} size={16} color={T.red600} />
          {t('settings.section.danger')}
        </h2>
      </header>
      <div style={{ padding: '20px 24px' }}>
        <SettingRow
          label={t('settings.danger.transferOwnership')}
          control={<Button variant="outline" size="sm">{t('common.continue')}</Button>}
        />
        <div style={{ paddingTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: T.n900, marginBottom: 4 }}>
            {t('settings.danger.deleteWorkspace')}
          </div>
          <div style={{ fontSize: 12, color: T.n500, marginBottom: 14, lineHeight: 1.55 }}>
            {t('settings.danger.deleteWorkspace.desc')}
          </div>
          <Button variant="destructive" size="sm">
            {t('settings.danger.delete')}
          </Button>
        </div>
      </div>
    </section>
  );
}

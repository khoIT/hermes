/**
 * Hermes Design Tokens + Primitive Components
 * Typed TSX port of the VNGGames GDS (segment-builder theme.jsx).
 * This file is the canonical token/primitive source — do NOT duplicate tokens elsewhere.
 *
 * Theming model (260510-2327): each color token resolves to a CSS custom
 * property defined in `theme-tokens.css`. ThemeProvider toggles `html.dark`
 * which flips the underlying values app-wide, no per-component refactor.
 * Hardcoded white card backgrounds in inline styles can opt into the dark
 * surface by setting `data-hermes-surface="card"` (or `"muted"`) on the
 * outermost container — see theme-tokens.css selectors.
 */
import React from 'react';

// ── Design tokens ────────────────────────────────────────────────────────────
export const T = {
  // Neutral scale
  n50:  'var(--hermes-n50)',
  n100: 'var(--hermes-n100)',
  n200: 'var(--hermes-n200)',
  n300: 'var(--hermes-n300)',
  n400: 'var(--hermes-n400)',
  n500: 'var(--hermes-n500)',
  n600: 'var(--hermes-n600)',
  n700: 'var(--hermes-n700)',
  n800: 'var(--hermes-n800)',
  n900: 'var(--hermes-n900)',
  n950: 'var(--hermes-n950)',
  // Brand + status
  brand:       'var(--hermes-brand)',
  brandHover:  'var(--hermes-brand-hover)',
  brandSoft:   'var(--hermes-brand-soft)',
  brandBorder: 'var(--hermes-brand-border)',
  red500:  'var(--hermes-red500)',
  red600:  'var(--hermes-red600)',
  redSoft: 'var(--hermes-red-soft)',
  blue500:  'var(--hermes-blue500)',
  blue600:  'var(--hermes-blue600)',
  blueSoft: 'var(--hermes-blue-soft)',
  green600:  'var(--hermes-green600)',
  greenSoft: 'var(--hermes-green-soft)',
  amber500:  'var(--hermes-amber500)',
  amberSoft: 'var(--hermes-amber-soft)',
  purple500:  'var(--hermes-purple500)',
  purpleSoft: 'var(--hermes-purple-soft)',
  // Surface (use these instead of hardcoded #fff where dark mode is desired)
  surface:       'var(--hermes-surface)',
  surfaceMuted:  'var(--hermes-surface-muted)',
  surfaceSubtle: 'var(--hermes-surface-subtle)',
  // Chrome surfaces — shell (outer gap), sidebar, topbar
  shell:    'var(--hermes-shell)',
  sidebar:  'var(--hermes-sidebar)',
  topbar:   'var(--hermes-topbar)',
  // Fonts
  fDisp: '"League Gothic", "Inter", sans-serif',
  fSans: '"Inter", ui-sans-serif, system-ui, sans-serif',
  fMono: '"Geist Mono", "JetBrains Mono", ui-monospace, Menlo, monospace',
} as const;

// Chart palette (stable order for series colouring)
export const CHART: string[] = [
  '#f05a22', '#3f8dff', '#059669', '#f59e0b', '#a855f7', '#ef4444', '#0891b2', '#db2777',
];

/** Merge class names, filtering falsy values. */
export const cx = (...args: (string | false | null | undefined)[]): string =>
  args.filter(Boolean).join(' ');

// ── Icon (lucide-react package — NOT CDN window.lucide) ──────────────────────
// Uses lucide-react's named exports so tree-shaking works at build time.
// Callers import the icon component and pass it via the `icon` prop.
export type LucideIcon = React.ComponentType<{
  size?: string | number;
  color?: string;
  strokeWidth?: string | number;
  style?: React.CSSProperties;
  className?: string;
}>;

interface IconProps {
  icon: LucideIcon;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}

export const Icon = React.memo<IconProps>(({
  icon: IconComponent,
  size = 16,
  color,
  strokeWidth = 1.75,
  style,
}) => (
  <IconComponent
    size={size}
    color={color ?? 'currentColor'}
    strokeWidth={strokeWidth}
    style={{ flexShrink: 0, display: 'inline-block', ...style }}
  />
));
Icon.displayName = 'Icon';

// ── Button ───────────────────────────────────────────────────────────────────
type ButtonVariant = 'primary' | 'neutral' | 'outline' | 'ghost' | 'soft' | 'destructive' | 'brand';
type ButtonSize = 'default' | 'sm' | 'xs' | 'lg' | 'icon' | 'icon-sm';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  active?: boolean;
}

const BUTTON_SIZES: Record<ButtonSize, React.CSSProperties> = {
  default:  { padding: '0 14px', fontSize: 13, height: 34, gap: 6 },
  sm:       { padding: '0 10px', fontSize: 12, height: 28, gap: 5 },
  xs:       { padding: '0 8px',  fontSize: 11, height: 22, gap: 4 },
  lg:       { padding: '0 18px', fontSize: 14, height: 40, gap: 8 },
  icon:     { padding: '0',      height: 34,   width: 34,  gap: 0 },
  'icon-sm':{ padding: '0',      height: 28,   width: 28,  gap: 0 },
};

const BUTTON_VARIANTS: Record<ButtonVariant, { bg: string; fg: string; bd: string; hover: string }> = {
  primary:     { bg: T.brand,     fg: '#fff',  bd: T.brand,       hover: T.brandHover },
  neutral:     { bg: T.n900,      fg: T.n50,   bd: T.n900,        hover: T.n800 },
  outline:     { bg: '#fff',      fg: T.n900,  bd: T.n200,        hover: T.n50 },
  ghost:       { bg: 'transparent', fg: T.n800, bd: 'transparent', hover: T.n100 },
  soft:        { bg: T.n100,      fg: T.n900,  bd: 'transparent', hover: T.n200 },
  destructive: { bg: T.red600,    fg: '#fff',  bd: T.red600,      hover: '#b91c1c' },
  brand:       { bg: T.brandSoft, fg: T.brand, bd: T.brandBorder, hover: '#ffedd5' },
};

export const Button = React.memo<ButtonProps>(({
  variant = 'primary', size = 'default', children, leftIcon, rightIcon,
  onClick, disabled, active, style, ...rest
}) => {
  const v = BUTTON_VARIANTS[variant];
  const s = BUTTON_SIZES[size];
  const iconSize = size === 'xs' ? 12 : size === 'sm' ? 13 : 14;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: T.fSans, fontWeight: 500, letterSpacing: '-0.005em',
        borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1, lineHeight: 1, whiteSpace: 'nowrap',
        transition: 'background .12s, color .12s, border-color .12s, box-shadow .12s',
        background: active ? v.hover : v.bg, color: v.fg, border: `1px solid ${v.bd}`,
        ...s, ...style,
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = v.hover; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = active ? v.hover : v.bg; }}
      {...rest}
    >
      {leftIcon && <Icon icon={leftIcon} size={iconSize} />}
      {children}
      {rightIcon && <Icon icon={rightIcon} size={iconSize} />}
    </button>
  );
});
Button.displayName = 'Button';

// ── Badge ────────────────────────────────────────────────────────────────────
type BadgeVariant =
  | 'neutral' | 'brand' | 'brandSoft' | 'mlSoft' | 'secondary'
  | 'outline' | 'destructive' | 'success' | 'warning' | 'info' | 'live';

interface BadgeProps {
  variant?: BadgeVariant;
  dot?: boolean;
  leftIcon?: LucideIcon;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

const BADGE_VARIANTS: Record<BadgeVariant, { bg: string; fg: string; bd?: string }> = {
  neutral:     { bg: T.n900,       fg: '#fff' },
  brand:       { bg: T.brand,      fg: '#fff' },
  brandSoft:   { bg: T.brandSoft,  fg: T.brand,     bd: T.brandBorder },
  mlSoft:      { bg: T.purpleSoft, fg: T.purple500, bd: '#e9d5ff' },
  secondary:   { bg: T.n100,       fg: T.n900 },
  outline:     { bg: '#fff',       fg: T.n800,      bd: T.n200 },
  destructive: { bg: '#fee2e2',    fg: '#991b1b' },
  success:     { bg: '#d1fae5',    fg: '#065f46' },
  warning:     { bg: '#fef3c7',    fg: '#92400e' },
  info:        { bg: '#dbeafe',    fg: '#1e40af' },
  live:        { bg: '#dcfce7',    fg: '#166534' },
};

export const Badge = React.memo<BadgeProps>(({ variant = 'secondary', children, dot, leftIcon, style }) => {
  const v = BADGE_VARIANTS[variant];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontFamily: T.fSans, fontWeight: 600, fontSize: 11, lineHeight: 1.4,
      padding: '2px 8px', borderRadius: 9999,
      border: `1px solid ${v.bd ?? 'transparent'}`,
      background: v.bg, color: v.fg, ...style,
    }}>
      {dot && (
        <span style={{
          width: 6, height: 6, borderRadius: 9999, background: 'currentColor',
          ...(variant === 'live' ? { animation: 'pulse-dot 1.6s infinite' } : {}),
        }} />
      )}
      {leftIcon && <Icon icon={leftIcon} size={11} />}
      {children}
    </span>
  );
});
Badge.displayName = 'Badge';

// ── Card ─────────────────────────────────────────────────────────────────────
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: number | string;
  hoverable?: boolean;
}

export const Card = React.memo<CardProps>(({ children, style, padding = 20, hoverable: _hoverable, ...rest }) => (
  <div style={{
    background: T.surface, border: `1px solid ${T.n200}`, borderRadius: 10,
    boxShadow: '0 1px 2px -1px rgba(0,0,0,0.05), 0 1px 3px 0 rgba(0,0,0,0.06)',
    padding, ...style,
  }} {...rest}>{children}</div>
));
Card.displayName = 'Card';

// ── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  error?: boolean;
  size?: 'default' | 'sm';
}

export const Input = React.memo<InputProps>(({
  leftIcon, rightIcon, error, style, size = 'default', ...rest
}) => {
  const [focus, setFocus] = React.useState(false);
  const h = size === 'sm' ? 28 : 34;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '0 12px', height: h, boxSizing: 'border-box',
      border: `1px solid ${error ? T.red600 : focus ? T.n400 : T.n200}`, borderRadius: 8,
      background: T.surface,
      boxShadow: focus ? '0 0 0 3px rgba(163,163,163,0.15)' : 'none',
      transition: 'border-color .12s, box-shadow .12s', ...style,
    }}>
      {leftIcon && <Icon icon={leftIcon} size={14} color={T.n500} />}
      <input
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          border: 0, outline: 0, flex: 1, minWidth: 0,
          fontFamily: T.fSans, fontSize: 13, color: T.n900,
          background: 'transparent', height: '100%',
        }}
        {...rest}
      />
      {rightIcon && <Icon icon={rightIcon} size={14} color={T.n500} />}
    </div>
  );
});
Input.displayName = 'Input';

// ── Select ───────────────────────────────────────────────────────────────────
interface SelectOption { value: string; label: string }

interface SelectProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: (SelectOption | string)[];
  size?: 'default' | 'sm';
  leftIcon?: LucideIcon;
  style?: React.CSSProperties;
}

export const Select = React.memo<SelectProps>(({ value, onChange, options, size = 'default', style, leftIcon }) => {
  const h = size === 'sm' ? 28 : 34;
  return (
    <label style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, position: 'relative',
      padding: `0 28px 0 12px`, height: h, borderRadius: 8,
      border: `1px solid ${T.n200}`, background: T.surface,
      fontFamily: T.fSans, fontSize: 13, color: T.n900,
      cursor: 'pointer', ...style,
    }}>
      {leftIcon && <Icon icon={leftIcon} size={14} color={T.n500} />}
      <select
        value={value}
        onChange={onChange}
        style={{
          appearance: 'none', border: 0, outline: 0, background: 'transparent',
          font: 'inherit', color: 'inherit', cursor: 'pointer', paddingRight: 4,
          position: 'absolute', inset: 0, paddingLeft: leftIcon ? 32 : 12,
        }}
      >
        {options.map(o => {
          const val = typeof o === 'string' ? o : o.value;
          const label = typeof o === 'string' ? o : o.label;
          return <option key={val} value={val}>{label}</option>;
        })}
      </select>
      <span style={{ pointerEvents: 'none', position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
        {/* chevron-down inline SVG avoids circular dependency with Icon */}
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={T.n500} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </span>
    </label>
  );
});
Select.displayName = 'Select';

// ── Switch ───────────────────────────────────────────────────────────────────
interface SwitchProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
}

export const Switch = React.memo<SwitchProps>(({ checked, onChange }) => (
  <div
    role="switch"
    aria-checked={checked}
    tabIndex={0}
    onClick={() => onChange?.(!checked)}
    onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') onChange?.(!checked); }}
    style={{
      width: 36, height: 20, borderRadius: 9999, cursor: 'pointer',
      background: checked ? T.brand : T.n300, position: 'relative',
      transition: 'background .12s', flexShrink: 0,
    }}
  >
    <div style={{
      position: 'absolute', top: 2, left: checked ? 18 : 2, width: 16, height: 16,
      borderRadius: 9999, background: '#fff', transition: 'left .12s',
      boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
    }} />
  </div>
));
Switch.displayName = 'Switch';

// ── Tabs ─────────────────────────────────────────────────────────────────────
interface TabItem { value: string; label: string }

interface TabsProps {
  tabs: TabItem[];
  value: string;
  onChange: (value: string) => void;
  style?: React.CSSProperties;
}

export const Tabs = React.memo<TabsProps>(({ tabs, value, onChange, style }) => (
  <div style={{ display: 'inline-flex', background: 'rgba(10,10,10,0.05)', borderRadius: 8, padding: 3, gap: 2, ...style }}>
    {tabs.map(t => (
      <span
        key={t.value}
        onClick={() => onChange(t.value)}
        style={{
          fontFamily: T.fSans, fontWeight: 500, fontSize: 12, color: T.n950,
          padding: '5px 10px', borderRadius: 6, cursor: 'pointer',
          background: value === t.value ? T.surface : 'transparent',
          boxShadow: value === t.value ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
          userSelect: 'none',
        }}
      >
        {t.label}
      </span>
    ))}
  </div>
));
Tabs.displayName = 'Tabs';

// ── Avatar ───────────────────────────────────────────────────────────────────
interface AvatarProps {
  name?: string;
  size?: number;
  src?: string;
  style?: React.CSSProperties;
}

const AVATAR_PALETTE = ['#f05a22', '#3f8dff', '#059669', '#a855f7', '#db2777'];

export const Avatar = React.memo<AvatarProps>(({ name = '?', size = 32, src, style }) => {
  const init = name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
  const bg = AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: 9999,
      background: src ? `url(${src}) center/cover` : bg,
      color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: T.fSans, fontWeight: 600, fontSize: size * 0.38,
      flexShrink: 0, boxSizing: 'border-box', ...style,
    }}>
      {!src && init}
    </div>
  );
});
Avatar.displayName = 'Avatar';

// ── Kpi (stat card) ──────────────────────────────────────────────────────────
type DeltaDir = 'up' | 'down' | 'flat';

interface KpiProps {
  label: string;
  value: React.ReactNode;
  delta?: string;
  deltaDir?: DeltaDir;
  icon?: LucideIcon;
  sub?: string;
  style?: React.CSSProperties;
}

export const Kpi = React.memo<KpiProps>(({ label, value, delta, deltaDir, icon, sub, style }) => (
  <Card padding={16} style={style}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
      <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.n500, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label}
      </span>
      {icon && (
        <div style={{ width: 28, height: 28, borderRadius: 8, background: T.n100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon icon={icon} size={14} color={T.n600} />
        </div>
      )}
    </div>
    <div style={{ fontFamily: T.fDisp, fontSize: 36, fontWeight: 400, color: T.n950, lineHeight: 1, letterSpacing: '0.005em', textTransform: 'uppercase' }}>
      {value}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
      {delta && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 2,
          fontFamily: T.fSans, fontSize: 12, fontWeight: 600,
          color: deltaDir === 'up' ? T.green600 : deltaDir === 'down' ? T.red600 : T.n500,
        }}>
          {delta}
        </span>
      )}
      {sub && <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.n500 }}>{sub}</span>}
    </div>
  </Card>
));
Kpi.displayName = 'Kpi';

// ── SectionHeader ────────────────────────────────────────────────────────────
interface SectionHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export const SectionHeader = React.memo<SectionHeaderProps>(({ title, description, eyebrow, right, children, style }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, ...style }}>
    <div style={{ minWidth: 0 }}>
      {eyebrow && (
        <div style={{ fontFamily: T.fSans, fontSize: 11, fontWeight: 600, color: T.n500, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
          {eyebrow}
        </div>
      )}
      <h1 style={{ fontFamily: T.fDisp, fontSize: 40, fontWeight: 400, lineHeight: 0.98, letterSpacing: '0.005em', textTransform: 'uppercase', color: T.n950, margin: 0 }}>
        {title}
      </h1>
      {description && (
        <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.n500, margin: '8px 0 0', maxWidth: 600 }}>
          {description}
        </p>
      )}
    </div>
    {(right || children) && (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
        {right}{children}
      </div>
    )}
  </div>
));
SectionHeader.displayName = 'SectionHeader';

// ── Sparkline ────────────────────────────────────────────────────────────────
interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
}

export const Sparkline = React.memo<SparklineProps>(({ data, width = 80, height = 24, color = T.brand, fill = true }) => {
  if (!data?.length) return null;
  const mn = Math.min(...data), mx = Math.max(...data);
  const rng = mx - mn || 1;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * width,
    height - ((v - mn) / rng) * (height - 2) - 1,
  ] as [number, number]);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${path} L${width} ${height} L0 ${height} Z`;
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {fill && <path d={area} fill={color} opacity={0.12} />}
      <path d={path} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
});
Sparkline.displayName = 'Sparkline';

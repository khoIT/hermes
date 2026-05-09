/**
 * Form primitives shared across register sections — section card, label,
 * text input, textarea, select, error line. Centralised so each section
 * stays focused on its own composition.
 */
import React from 'react';
import { T } from '../../../theme';

export const SectionCard: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <section
    style={{
      background: '#fff',
      border: `1px solid ${T.n200}`,
      borderRadius: 10,
      padding: '14px 18px',
    }}
  >
    <div
      style={{
        fontFamily: T.fSans,
        fontSize: 10,
        fontWeight: 700,
        color: T.n400,
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        marginBottom: 12,
      }}
    >
      {title}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
  </section>
);

export const Field: React.FC<{
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}> = ({ label, hint, error, children }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <span
      style={{
        fontFamily: T.fSans,
        fontSize: 11,
        fontWeight: 600,
        color: T.n600,
      }}
    >
      {label}
    </span>
    {children}
    {hint && (
      <span style={{ fontFamily: T.fSans, fontSize: 10, color: T.n400, fontStyle: 'italic' }}>
        {hint}
      </span>
    )}
    {error && (
      <span style={{ fontFamily: T.fSans, fontSize: 11, color: '#b91c1c', fontWeight: 500 }}>
        {error}
      </span>
    )}
  </label>
);

export const TextInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }> = ({
  error,
  style,
  ...rest
}) => (
  <input
    {...rest}
    style={{
      fontFamily: T.fMono,
      fontSize: 12,
      padding: '7px 10px',
      borderRadius: 6,
      border: `1px solid ${error ? '#fca5a5' : T.n200}`,
      background: '#fff',
      color: T.n900,
      outline: 'none',
      ...style,
    }}
  />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({
  style,
  children,
  ...rest
}) => (
  <select
    {...rest}
    style={{
      fontFamily: T.fSans,
      fontSize: 12,
      padding: '7px 10px',
      borderRadius: 6,
      border: `1px solid ${T.n200}`,
      background: '#fff',
      color: T.n900,
      outline: 'none',
      ...style,
    }}
  >
    {children}
  </select>
);

export const Textarea: React.FC<
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }
> = ({ error, style, ...rest }) => (
  <textarea
    {...rest}
    style={{
      fontFamily: T.fMono,
      fontSize: 12,
      lineHeight: 1.55,
      padding: '8px 10px',
      borderRadius: 6,
      border: `1px solid ${error ? '#fca5a5' : T.n200}`,
      background: '#fff',
      color: T.n900,
      outline: 'none',
      resize: 'vertical',
      ...style,
    }}
  />
);

export const Toggle: React.FC<{
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}> = ({ checked, onChange, label }) => (
  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      style={{ accentColor: T.brand }}
    />
    <span style={{ fontFamily: T.fSans, fontSize: 12, color: T.n700 }}>{label}</span>
  </label>
);

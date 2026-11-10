/**
 * 2026-style glass stat card.
 * tone: 'default' | 'accent' (green) | 'warn' | 'danger' | 'muted'
 */
export function StatCard({ title, value, subtitle, icon, tone = 'default' }) {
  const valueColor =
    tone === 'accent' ? 'var(--f-green-text)' :
    tone === 'warn'   ? 'var(--f-warn)'       :
    tone === 'danger' ? 'var(--f-danger)'      :
    'var(--f-text)';

  const shimmerColor =
    tone === 'accent' ? 'rgba(47,75,216,0.5)' :
    tone === 'warn'   ? 'rgba(240,184,64,0.5)' :
    tone === 'danger' ? 'rgba(240,120,96,0.5)' :
    'rgba(255,255,255,0.2)';

  const iconBg =
    tone === 'accent' ? 'var(--f-green-bg)'           :
    tone === 'warn'   ? 'rgba(240,184,64,0.15)'        :
    tone === 'danger' ? 'var(--f-danger-bg)'           :
    'rgba(255,255,255,0.06)';

  const iconColor =
    tone === 'accent' ? 'var(--f-green-text)' :
    tone === 'warn'   ? 'var(--f-warn)'        :
    tone === 'danger' ? 'var(--f-danger)'      :
    'var(--f-text-soft)';

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'var(--f-radius-md)',
        padding: '18px 18px 16px',
        background: 'var(--f-surface)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--f-border)',
        boxShadow: 'none',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--f-border)')}
    >
      {/* Top shimmer */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent, ${shimmerColor}, transparent)`,
        }}
      />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <p
            style={{
              fontSize: 10,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--f-text-subtle)',
              fontFamily: 'var(--f-font-mono)',
            }}
          >
            {title}
          </p>
          <p style={{ marginTop: 10, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: valueColor }}>
            {value}
          </p>
          {subtitle && (
            <p style={{ marginTop: 4, fontSize: 11, color: 'var(--f-text-subtle)', fontFamily: 'var(--f-font-mono)' }}>
              {subtitle}
            </p>
          )}
        </div>

        {icon && (
          <div
            style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: iconBg,
              border: '1px solid rgba(255,255,255,0.08)',
              color: iconColor,
              fontSize: 18,
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

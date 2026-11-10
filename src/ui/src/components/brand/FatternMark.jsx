/**
 * The Fattern mark: a lowercase f whose crossbar is a moustache
 * ("fattern" = "the dad"), on an ink tile with a cobalt dot.
 *
 * Colours follow --f-mark-tile / --f-mark-ink, which dark themes swap;
 * `inverse` swaps them explicitly.
 * Below 28 px the heavier small-size drawing is used so the
 * moustache stays legible.
 */
const MOUSTACHE =
  'M29 30C26 27 21 27 18 30C16 32 13 32 11 30C12 35 17 38 22 37C25 36.5 27 35 29 33C31 35 33 36.5 36 37C41 38 46 35 47 30C45 32 42 32 40 30C37 27 32 27 29 30Z';

export function FatternMark({ size = 32, inverse = false, title = 'Fattern', style }) {
  // Theme-aware by default (tokens flip on dark themes); `inverse` forces the swap.
  const tile = inverse ? 'var(--f-mark-ink, #F4F2EC)' : 'var(--f-mark-tile, #15171A)';
  const ink = inverse ? 'var(--f-mark-tile, #15171A)' : 'var(--f-mark-ink, #F4F2EC)';
  const small = size < 28;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role={title ? 'img' : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      style={{ display: 'block', flexShrink: 0, ...style }}
    >
      <rect width="64" height="64" rx={small ? 12 : 14} fill={tile} />
      {small ? (
        <>
          <path d="M30 56V25A11 11 0 0 1 41 14H47" stroke={ink} strokeWidth="9" fill="none" />
          <path d={MOUSTACHE} fill={ink} transform="translate(-4.2 -3.3) scale(1.15)" />
        </>
      ) : (
        <>
          <path d="M29 54V26A11 11 0 0 1 40 15H45" stroke={ink} strokeWidth="7" fill="none" />
          <path d={MOUSTACHE} fill={ink} />
          <circle cx="51" cy="51" r="3.5" fill="#2F4BD8" />
        </>
      )}
    </svg>
  );
}

/** Mark + "fattern" wordmark. */
export function FatternLogo({ size = 28, inverse = false, color }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: Math.round(size * 0.36) }}>
      <FatternMark size={size} inverse={inverse} title="" />
      <span
        style={{
          fontFamily: 'var(--f-font-display)',
          fontWeight: 600,
          fontSize: Math.round(size * 0.66),
          letterSpacing: '-0.035em',
          lineHeight: 1,
          color: color || 'var(--f-text)',
        }}
      >
        fattern
      </span>
    </span>
  );
}

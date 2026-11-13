import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconTerminal2 } from '@tabler/icons-react';
import { FatternMark } from './brand/FatternMark';

export function TitleBar({ title = 'Fattern', showBrand = false }) {
  const { t } = useTranslation();
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (window.fattern?.window?.isMaximized) {
      window.fattern.window.isMaximized().then(setIsMaximized);
    }
    const handleResize = () => {
      if (window.fattern?.window?.isMaximized) {
        window.fattern.window.isMaximized().then(setIsMaximized);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMinimize = () => window.fattern?.window?.minimize?.();
  const handleMaximize = () => window.fattern?.window?.maximize?.();
  const handleClose    = () => window.fattern?.window?.close?.();
  const handleDevTools = () => window.fattern?.window?.toggleDevTools?.();

  return (
    <div
      style={{
        height: 'var(--topbar-h)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 18px',
        flexShrink: 0,
        background: 'var(--bg)',
        WebkitAppRegion: 'drag',
        userSelect: 'none',
        zIndex: 100,
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        {showBrand && <FatternMark size={18} title="" />}
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-muted)', letterSpacing: '-0.01em' }}>
          {title}
        </span>
      </div>

      {/* Window controls — no-drag zone */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 6, WebkitAppRegion: 'no-drag' }}
      >
        {/* Dev tools — subtle icon button */}
        <button
          onClick={handleDevTools}
          title={t('layout.dev_tools')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--ink-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 22, height: 22, borderRadius: 'var(--radius-md)',
            transition: 'color 0.12s',
            marginRight: 4,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink-muted)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-subtle)')}
        >
          <IconTerminal2 size={13} stroke={1.6} />
        </button>

        {/* macOS-style traffic lights */}
        {[
          { color: '#f0c060', labelKey: 'layout.minimize', action: handleMinimize },
          { color: '#70c87a', labelKey: isMaximized ? 'layout.restore' : 'layout.maximize', action: handleMaximize },
          { color: 'var(--danger)', labelKey: 'layout.close', action: handleClose },
        ].map(({ color, labelKey, action }) => (
          <button
            key={labelKey}
            onClick={action}
            aria-label={t(labelKey)}
            style={{
              width: 12, height: 12, borderRadius: '50%',
              background: color,
              border: 'none', cursor: 'pointer', padding: 0,
              boxShadow: `0 0 0 0.5px rgba(0,0,0,0.25)`,
              transition: 'filter 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.15)')}
            onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
          />
        ))}
      </div>
    </div>
  );
}

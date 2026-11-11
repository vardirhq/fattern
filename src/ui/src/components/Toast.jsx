import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconX,
  IconCircleCheck,
  IconAlertCircle,
  IconAlertTriangle,
  IconInfoCircle,
} from '@tabler/icons-react';

const variants = {
  success: {
    bg: 'rgba(47,75,216,0.12)',
    border: '1px solid rgba(47,75,216,0.25)',
    text: 'var(--f-text)',
    icon: IconCircleCheck,
    iconColor: 'var(--f-green)',
    progress: 'var(--f-green)',
  },
  error: {
    bg: 'rgba(240,120,96,0.12)',
    border: '1px solid rgba(240,120,96,0.25)',
    text: 'var(--f-text)',
    icon: IconAlertCircle,
    iconColor: 'var(--f-danger)',
    progress: 'var(--f-danger)',
  },
  warning: {
    bg: 'rgba(240,184,64,0.12)',
    border: '1px solid rgba(240,184,64,0.25)',
    text: 'var(--f-text)',
    icon: IconAlertTriangle,
    iconColor: 'var(--f-warn)',
    progress: 'var(--f-warn)',
  },
  info: {
    bg: 'rgba(80,140,220,0.12)',
    border: '1px solid rgba(80,140,220,0.25)',
    text: 'var(--f-text)',
    icon: IconInfoCircle,
    iconColor: 'var(--f-blue)',
    progress: 'var(--f-blue)',
  },
};

export function Toast({ id, message, variant = 'info', duration = 4000, onClose }) {
  const style = variants[variant] || variants.info;
  const Icon = style.icon;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (duration > 0) {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
        setProgress(remaining);
        if (remaining === 0) {
          clearInterval(interval);
          onClose?.(id);
        }
      }, 16);
      return () => clearInterval(interval);
    }
  }, [id, duration, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        borderRadius: 'var(--f-radius-md)',
        border: style.border,
        background: style.bg,
        backdropFilter: 'blur(20px)',
        color: style.text,
        padding: '12px 14px',
        boxShadow: '0 12px 32px var(--f-tooltip-shadow)',
        minWidth: 300,
        maxWidth: 420,
      }}
    >
      <Icon size={18} stroke={1.8} style={{ color: style.iconColor, flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.4 }}>{message}</div>
        {duration > 0 && (
          <div
            style={{
              marginTop: 8,
              height: 2,
              width: '100%',
              borderRadius: 2,
              background: 'var(--f-hover-elevated)',
              overflow: 'hidden',
            }}
          >
            <motion.div
              style={{ height: '100%', background: style.progress, borderRadius: 2 }}
              initial={{ width: '100%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1, ease: 'linear' }}
            />
          </div>
        )}
      </div>
      <button
        onClick={() => onClose?.(id)}
        aria-label="Lukk"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--f-text-subtle)', flexShrink: 0, padding: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 4,
          transition: 'color 0.1s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--f-text-body)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--f-text-subtle)')}
      >
        <IconX size={14} stroke={2} />
      </button>
    </motion.div>
  );
}

export function ToastContainer({ toasts, onClose }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 'calc(var(--f-topbar-h) + 12px)',
        right: 16,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} style={{ pointerEvents: 'auto' }}>
            <Toast {...toast} onClose={onClose} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

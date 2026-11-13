import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-6xl',
};

export function Modal({ isOpen, onClose, title, description, children, footer, size = 'md' }) {
  const { t } = useTranslation();
  const maxWidthClass = sizeClasses[size] || sizeClasses.md;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-40 flex items-center justify-center px-4"
          style={{ background: 'var(--scrim)', backdropFilter: 'blur(6px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className={`relative flex flex-col w-full ${maxWidthClass} max-h-90vh r-lg overflow-hidden ft-card ft-raised`}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-10 r-full px-2 py-0-5 text-xs font-medium transition"
              style={{
                background: 'var(--hover-strong)',
                border: '1px solid var(--line)',
                color: 'var(--ink-muted)',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-muted)')}
            >
              {t('common.close')}
            </button>

            {(title || description) && (
              <header
                className="shrink-0 px-6 pt-6 pb-4"
                style={{ borderBottom: '1px solid var(--line)' }}
              >
                {title ? (
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>{title}</h2>
                ) : null}
                {description ? (
                  <p className="mt-1 text-sm" style={{ color: 'var(--ink-muted)' }}>{description}</p>
                ) : null}
              </header>
            )}

            <div className="flex-1 overflow-y-auto px-6">
              <div className="space-y-4 text-sm py-5" style={{ color: 'var(--ink)' }}>{children}</div>
            </div>

            {footer ? (
              <footer
                className="shrink-0 px-6 pb-6 pt-4 flex items-center justify-end gap-3"
                style={{ borderTop: '1px solid var(--line)', background: 'var(--surface-sunken)' }}
              >
                {footer}
              </footer>
            ) : null}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

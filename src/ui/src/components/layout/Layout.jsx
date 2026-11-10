import { Sidebar } from './Sidebar';

/**
 * App shell: labelled sidebar on the paper ground, and the page
 * content on a white sheet beside it.
 * The outer flex-column frame (title bar, bottom bar) lives in App.jsx.
 */
export function Layout({ children, company, navItems, workflowShortcuts, activeNavItem, onNavigate, badges }) {
  return (
    <>
      <Sidebar
        navItems={navItems}
        activeNavItem={activeNavItem}
        onNavigate={onNavigate}
        badges={badges}
      />
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          padding: '0 12px 12px 0',
        }}
      >
        <main
          style={{
            flex: 1,
            minWidth: 0,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--f-surface)',
            border: '1px solid var(--f-border)',
            borderRadius: 'var(--f-radius-xl)',
          }}
        >
          {children}
        </main>
      </div>
    </>
  );
}

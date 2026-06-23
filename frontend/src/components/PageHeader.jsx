import React from 'react';

/**
 * PageHeader — used at the top of every page for consistent hierarchy.
 * Props:
 *   - icon: Lucide icon component (optional)
 *   - title: string (required)
 *   - subtitle: string (optional)
 *   - actions: ReactNode (optional – buttons, links, etc.)
 *   - accent: boolean (optional – show animated accent bar, default true)
 */
const PageHeader = ({ icon: Icon, title, subtitle, actions, accent = true }) => (
  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
    <div className="flex items-start gap-4">
      {Icon && (
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            boxShadow: '0 4px 12px var(--primary-ring)',
            animation: 'scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          <Icon size={21} />
        </div>
      )}
      <div>
        <h1
          className="text-2xl font-extrabold leading-tight"
          style={{
            color: 'var(--text-1)',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="text-sm mt-0.5"
            style={{ color: 'var(--text-3)' }}
          >
            {subtitle}
          </p>
        )}
        {accent && (
          <div
            className="page-header-accent"
          />
        )}
      </div>
    </div>
    {actions && (
      <div className="flex items-center gap-2 flex-shrink-0">
        {actions}
      </div>
    )}
  </div>
);

export default PageHeader;

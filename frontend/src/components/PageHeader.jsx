import React from 'react';

/**
 * PageHeader — used at the top of every page for consistent hierarchy.
 * Props:
 *   - icon: Lucide icon component (optional)
 *   - title: string (required)
 *   - subtitle: string (optional)
 *   - actions: ReactNode (optional – buttons, links, etc.)
 */
const PageHeader = ({ icon: Icon, title, subtitle, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
    <div className="flex items-start gap-3">
      {Icon && (
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}
        >
          <Icon size={20} />
        </div>
      )}
      <div>
        <h1
          className="text-2xl font-extrabold leading-tight"
          style={{ color: 'var(--text-1)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
            {subtitle}
          </p>
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

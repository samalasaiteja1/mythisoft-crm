import { Link, NavLink } from 'react-router-dom';
import { ArrowRight, Inbox, Shield } from 'lucide-react';

export const ADMIN_BRAND_ICON = Shield;

export function AdminPageShell({ children, className = '' }) {
  return <div className={`space-y-4 ${className}`}>{children}</div>;
}

export function AdminPageHeader({
  icon: Icon = ADMIN_BRAND_ICON,
  title,
  subtitle,
  actions,
  workflow,
  workflowLabel = 'Workflow',
  meta,
}) {
  return (
    <div className="card border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-myth-accent/5 to-purple-500/5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            {Icon && <Icon size={22} className="text-orange-400 shrink-0" />}
            {title}
          </h1>
          {subtitle && <p className="text-sm text-gray-400 mt-1 max-w-2xl">{subtitle}</p>}
          {meta && <p className="text-xs text-gray-500 mt-2">{meta}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
      </div>
      {workflow?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-myth-border/60">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">{workflowLabel}</p>
          <div className="flex flex-wrap items-center gap-1.5 text-sm text-gray-300">
            {workflow.map((step, i) => (
              <span key={step} className="flex items-center gap-1.5">
                {i > 0 && <ArrowRight size={12} className="text-gray-600" />}
                {step}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminStatStrip({ stats = [] }) {
  if (!stats.length) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((stat) => {
        const inner = (
          <>
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${stat.color || 'text-white'}`}>{stat.value ?? 0}</p>
          </>
        );
        const cls = `p-3 rounded-xl border transition-colors hover:border-myth-accent/35 ${
          stat.highlight ? 'border-myth-accent/35 bg-myth-accent/8' : 'border-myth-border bg-myth-surface/40'
        } ${stat.active ? 'border-myth-accent/40 bg-myth-accent/10' : ''}`;
        if (stat.onClick) {
          return (
            <button key={stat.label} type="button" onClick={stat.onClick} className={`${cls} text-left`}>
              {inner}
            </button>
          );
        }
        return stat.link ? (
          <Link key={stat.label} to={stat.link} className={cls}>{inner}</Link>
        ) : (
          <div key={stat.label} className={cls}>{inner}</div>
        );
      })}
    </div>
  );
}

export function AdminTabBar({ tabs = [], activeKey }) {
  if (!tabs.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <NavLink
          key={tab.key}
          to={tab.path}
          end={tab.end}
          onClick={tab.onClick}
          className={({ isActive }) => `text-sm px-3 py-1.5 rounded-lg border transition-colors ${
            (activeKey ? tab.key === activeKey : isActive)
              ? 'border-myth-accent/50 bg-myth-accent/10 text-cyan-200'
              : 'border-myth-border text-gray-400 hover:text-gray-200 hover:border-myth-border/80'
          }`}
        >
          {tab.label}
          {typeof tab.count === 'number' && (
            <span className="ml-1.5 text-xs opacity-80">({tab.count})</span>
          )}
        </NavLink>
      ))}
    </div>
  );
}

export function AdminContentCard({ title, toolbar, children, className = '' }) {
  return (
    <div className={`card border border-myth-border/80 ${className}`}>
      {title && (
        <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${children ? 'mb-4' : ''}`}>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {toolbar && <div className="flex flex-wrap gap-2">{toolbar}</div>}
        </div>
      )}
      {!title && toolbar && (
        <div className={`flex flex-wrap gap-3 ${children ? 'mb-4' : ''}`}>{toolbar}</div>
      )}
      {children}
    </div>
  );
}

export function AdminEmptyState({ message = 'Nothing here yet.', children, icon: Icon = Inbox }) {
  return (
    <div className="card flex flex-col items-center justify-center py-12 text-center border-dashed border-myth-border">
      <Icon size={32} className="text-gray-600 mb-3" />
      <div className="text-sm text-gray-500">{children || message}</div>
    </div>
  );
}

export function AdminInfoBanner({ children, className = '' }) {
  return (
    <div className={`card border-myth-accent/20 bg-myth-accent/5 text-sm text-gray-400 ${className}`}>
      {children}
    </div>
  );
}

export function AdminSectionTitle({ icon: Icon, title, action }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <h2 className="text-base font-semibold text-white flex items-center gap-2">
        {Icon && <Icon size={18} className="text-orange-400" />}
        {title}
      </h2>
      {action}
    </div>
  );
}

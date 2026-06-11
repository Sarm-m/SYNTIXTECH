import React from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, ArrowRight, Inbox, Loader2, RotateCcw, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext.jsx';

export function PageHeader({ eyebrow, title, description, actions, compact = false }) {
  const { isDarkMode } = useTheme();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="max-w-3xl">
        {eyebrow && (
          <p className="eyebrow mb-2">
            {eyebrow}
          </p>
        )}
        <h1 className={`${compact ? 'text-2xl' : 'text-3xl'} font-black tracking-tight ${
          isDarkMode ? 'text-slate-100' : 'text-syntix-navy'
        }`}>
          {title}
        </h1>
        {description && (
          <p className={`mt-2 max-w-2xl text-sm leading-6 ${
            isDarkMode ? 'text-slate-400' : 'text-slate-600'
          }`}>
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div>}
    </div>
  );
}

export function SurfaceCard({ children, className = '', as: Tag = 'section', ...props }) {
  const { isDarkMode } = useTheme();

  return (
    <Tag {...props} className={`rounded-2xl border shadow-premium transition-shadow ${
      isDarkMode ? 'border-slate-800 bg-slate-900 shadow-premium-dark' : 'border-slate-200/80 bg-white'
    } ${className}`}>
      {children}
    </Tag>
  );
}

export function MetricCard({ icon: Icon, label, value, hint, tone = 'navy' }) {
  const { isDarkMode } = useTheme();
  const tones = {
    navy: isDarkMode ? 'bg-blue-500/10 text-blue-200' : 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    red: 'bg-red-500/10 text-red-600 dark:text-red-400',
    blue: 'bg-sky-500/10 text-sky-600 dark:text-sky-300',
  };

  return (
    <SurfaceCard className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-sm font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {label}
          </p>
          <p className={`mt-2 text-3xl font-black tracking-tight ${
            isDarkMode ? 'text-slate-100' : 'text-syntix-navy'
          }`}>
            {value}
          </p>
          {hint && <p className={`mt-1 text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{hint}</p>}
        </div>
        {Icon && <div className={`rounded-xl p-3 ${tones[tone] || tones.navy}`}><Icon className="h-5 w-5" /></div>}
      </div>
    </SurfaceCard>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  actionTo,
  compact = false,
}) {
  const { isDarkMode } = useTheme();
  const actionClass = 'btn-primary mt-5';

  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl border border-dashed text-center ${
      compact ? 'p-6' : 'p-10'
    } ${isDarkMode ? 'border-slate-700 bg-slate-950/40' : 'border-slate-200 bg-slate-50/70'}`}>
      <div className={`mb-4 rounded-2xl p-3 ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-white text-syntix-navy shadow-sm'}`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className={`font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{title}</h3>
      <p className={`mt-2 max-w-lg text-sm leading-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
        {description}
      </p>
      {actionLabel && actionTo && <Link to={actionTo} className={actionClass}>{actionLabel}<ArrowRight className="h-4 w-4" /></Link>}
      {actionLabel && onAction && <button type="button" onClick={onAction} className={actionClass}>{actionLabel}<ArrowRight className="h-4 w-4" /></button>}
    </div>
  );
}

export function LoadingState({ label = 'Cargando información de la flota...' }) {
  const { isDarkMode } = useTheme();

  return (
    <div className={`flex min-h-44 items-center justify-center gap-3 rounded-2xl border ${
      isDarkMode ? 'border-slate-800 bg-slate-900 text-slate-300' : 'border-slate-200 bg-white text-slate-600'
    }`} role="status">
      <Loader2 className="h-5 w-5 animate-spin text-syntix-accent" />
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  const { isDarkMode } = useTheme();

  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl border p-8 text-center ${
      isDarkMode ? 'border-red-900/60 bg-red-950/20' : 'border-red-200 bg-red-50'
    }`} role="alert">
      <div className="rounded-2xl bg-red-500/10 p-3 text-red-600 dark:text-red-400">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className={`mt-4 font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>No pudimos cargar toda la información</h3>
      <p className={`mt-2 max-w-xl text-sm leading-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-primary mt-5">
          <RotateCcw className="h-4 w-4" /> Reintentar
        </button>
      )}
    </div>
  );
}

export function DemoBanner() {
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-semibold text-amber-900">
      Modo demo de solo lectura. Los datos son ficticios y ninguna acción modifica información real.
    </div>
  );
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  busy = false,
  destructive = false,
}) {
  const { isDarkMode } = useTheme();
  if (!isOpen) return null;

  return (
    <div className="safe-area-px safe-area-py fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/65 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${
        isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'
      }`} role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="confirm-dialog-title" className={`text-lg font-black ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>{title}</h2>
            <p className={`mt-2 text-sm leading-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{description}</p>
          </div>
          <button type="button" onClick={onCancel} className="btn-icon" aria-label="Cerrar confirmación">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} disabled={busy} className="btn-ghost">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} disabled={busy} className={destructive ? 'btn-danger' : 'btn-primary'}>
            {busy ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

PageHeader.propTypes = {
  eyebrow: PropTypes.string,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  actions: PropTypes.node,
  compact: PropTypes.bool,
};

SurfaceCard.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  as: PropTypes.elementType,
};

MetricCard.propTypes = {
  icon: PropTypes.elementType,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  hint: PropTypes.string,
  tone: PropTypes.oneOf(['navy', 'green', 'amber', 'red', 'blue']),
};

EmptyState.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
  actionTo: PropTypes.string,
  compact: PropTypes.bool,
};

LoadingState.propTypes = { label: PropTypes.string };
ErrorState.propTypes = { message: PropTypes.string.isRequired, onRetry: PropTypes.func };

ConfirmDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  confirmLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  busy: PropTypes.bool,
  destructive: PropTypes.bool,
};

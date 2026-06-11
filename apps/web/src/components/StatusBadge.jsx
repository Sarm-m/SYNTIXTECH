import React from 'react';
import PropTypes from 'prop-types';
import { getStatusLabel } from '@/utils/dateUtils.js';

// Badge visual reutilizable para traducir estados del dominio a un código de color consistente.
export default function StatusBadge({ status, label }) {
  const colors = {
    verde: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
    vigente: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
    completado: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
    amarillo: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
    pendiente: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300',
    rojo: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300',
    vencido: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300',
  };
  const labels = {
    vigente: 'Vigente',
    completado: 'Completado',
    pendiente: 'Pendiente',
    vencido: 'Vencido',
  };

  const defaultColor = 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300';
  const colorClass = colors[status?.toLowerCase()] || defaultColor;

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${colorClass}`}>
      {label || labels[status?.toLowerCase()] || getStatusLabel(status)}
    </span>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string,
  label: PropTypes.string,
};

import React from 'react';
import PropTypes from 'prop-types';
import { getStatusLabel } from '@/utils/dateUtils.js';

// Badge visual reutilizable para traducir estados del dominio a un código de color consistente.
export default function StatusBadge({ status, label }) {
  const colors = {
    verde: 'bg-syntix-green/10 text-syntix-green border-syntix-green/20',
    vigente: 'bg-syntix-green/10 text-syntix-green border-syntix-green/20',
    completado: 'bg-syntix-green/10 text-syntix-green border-syntix-green/20',
    amarillo: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
    pendiente: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
    rojo: 'bg-syntix-red/10 text-syntix-red border-syntix-red/20',
    vencido: 'bg-syntix-red/10 text-syntix-red border-syntix-red/20',
  };
  const labels = {
    vigente: 'Vigente',
    completado: 'Completado',
    pendiente: 'Pendiente',
    vencido: 'Vencido',
  };

  const defaultColor = 'bg-gray-100 text-gray-800 border-gray-200';
  const colorClass = colors[status?.toLowerCase()] || defaultColor;

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${colorClass}`}>
      {label || labels[status?.toLowerCase()] || getStatusLabel(status)}
    </span>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string,
  label: PropTypes.string,
};

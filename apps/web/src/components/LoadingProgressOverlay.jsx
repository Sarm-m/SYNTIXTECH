import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { CheckCircle } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext.jsx';

function LoadingProgressOverlay({ message, done, doneMessage, onClose }) {
  const { isDarkMode } = useTheme();

  return (
    <div className="safe-area-px safe-area-py fixed inset-0 z-[90] flex items-center justify-center bg-black/60">
      <div
        className={`flex w-[440px] max-w-full flex-col gap-4 rounded-2xl border p-5 shadow-lg sm:p-6 ${
          isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-white'
        }`}
      >
        {!done ? (
          <div className="flex items-center gap-3" role="status" aria-live="polite">
            <div
              className={`h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-t-transparent ${
                isDarkMode ? 'border-syntix-green' : 'border-syntix-navy'
              }`}
              aria-hidden="true"
            />
            <p
              className={`text-sm font-semibold ${
                isDarkMode ? 'text-slate-200' : 'text-syntix-navy'
              }`}
            >
              {message}
            </p>
          </div>
        ) : (
          <div
            className={`flex flex-col gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
              isDarkMode
                ? 'border-emerald-800 bg-emerald-950/60'
                : 'border-emerald-200 bg-emerald-50'
            }`}
            role="status"
            aria-live="polite"
          >
            <div className="flex min-w-0 items-center gap-2">
              <CheckCircle
                className={`h-5 w-5 shrink-0 ${
                  isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                }`}
                aria-hidden="true"
              />
              <p
                className={`text-sm font-semibold ${
                  isDarkMode ? 'text-emerald-300' : 'text-emerald-800'
                }`}
              >
                {doneMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                isDarkMode
                  ? 'bg-emerald-700 text-white hover:bg-emerald-600'
                  : 'bg-emerald-700 text-white hover:bg-emerald-800'
              }`}
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

LoadingProgressOverlay.propTypes = {
  message: PropTypes.string.isRequired,
  done: PropTypes.bool,
  doneMessage: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};

LoadingProgressOverlay.defaultProps = {
  done: false,
  doneMessage: '',
};

export default memo(LoadingProgressOverlay);

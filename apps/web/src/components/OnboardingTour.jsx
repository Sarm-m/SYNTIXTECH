import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Sparkles, ArrowLeft, ArrowRight, X, CheckCircle2 } from 'lucide-react';
import { useOnboarding } from '@/contexts/OnboardingContext.jsx';

const OVERLAY_PADDING = 12;
const VIEWPORT_EDGE_PADDING = 8;

const getViewportSize = () => {
  if (typeof globalThis === 'undefined') {
    return { width: 0, height: 0 };
  }

  const visualViewport = globalThis.visualViewport;
  const documentElement = globalThis.document?.documentElement;

  return {
    width: visualViewport?.width || globalThis.innerWidth || documentElement?.clientWidth || 0,
    height: visualViewport?.height || globalThis.innerHeight || documentElement?.clientHeight || 0,
  };
};

const getTargetElement = (targetName) => {
  if (!targetName || typeof document === 'undefined') {
    return null;
  }

  return document.querySelector(`[data-onboarding="${targetName}"]`);
};

const getTargetRect = (targetName) => {
  const targetElement = getTargetElement(targetName);
  if (!targetElement) {
    return null;
  }

  const rect = targetElement.getBoundingClientRect();
  const { width: viewportWidth, height: viewportHeight } = getViewportSize();
  const rawTop = rect.top - OVERLAY_PADDING;
  const rawLeft = rect.left - OVERLAY_PADDING;
  const rawRight = rect.right + OVERLAY_PADDING;
  const rawBottom = rect.bottom + OVERLAY_PADDING;

  if (
    rect.width <= 0 ||
    rect.height <= 0 ||
    rawRight < 0 ||
    rawBottom < 0 ||
    rawLeft > viewportWidth ||
    rawTop > viewportHeight
  ) {
    return null;
  }

  const top = Math.max(rawTop, VIEWPORT_EDGE_PADDING);
  const left = Math.max(rawLeft, VIEWPORT_EDGE_PADDING);
  const right = Math.min(rawRight, Math.max(viewportWidth - VIEWPORT_EDGE_PADDING, VIEWPORT_EDGE_PADDING));
  const bottom = Math.min(rawBottom, Math.max(viewportHeight - VIEWPORT_EDGE_PADDING, VIEWPORT_EDGE_PADDING));
  const width = Math.max(right - left, 0);
  const height = Math.max(bottom - top, 0);

  if (width < 4 || height < 4) {
    return null;
  }

  return { top, left, width, height };
};

function TourShell({ children }) {
  return (
    <div className="onboarding-modal-viewport safe-area-px safe-area-py fixed inset-0 z-[80] overflow-hidden bg-slate-950/70">
      <div className="flex h-full min-h-0 items-center justify-center">
        <div className="ios-touch-scroll max-h-full w-full max-w-xl overflow-y-auto overflow-x-hidden overscroll-contain rounded-2xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}

TourShell.propTypes = {
  children: PropTypes.node.isRequired,
};

export default function OnboardingTour() {
  const {
    currentStep,
    currentStepIndex,
    isTourActive,
    showCompletion,
    showWelcome,
    startTour,
    skipWelcome,
    skipTour,
    closeCompletion,
    finishTour,
    goToNextStep,
    goToPreviousStep,
    steps,
  } = useOnboarding();
  const [targetRect, setTargetRect] = useState(null);

  useEffect(() => {
    if (!isTourActive || !currentStep?.target) {
      setTargetRect(null);
      return undefined;
    }

    let frameId = null;
    let hasScrolledToStep = false;
    const retryTimeouts = [];
    const visualViewport = typeof globalThis !== 'undefined' ? globalThis.visualViewport : null;

    const updateRect = ({ shouldScroll = false } = {}) => {
      if (frameId) {
        globalThis.cancelAnimationFrame(frameId);
      }

      frameId = globalThis.requestAnimationFrame(() => {
        const targetElement = getTargetElement(currentStep.target);

        if (targetElement && shouldScroll && !hasScrolledToStep) {
          hasScrolledToStep = true;
          targetElement.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
        }

        setTargetRect(getTargetRect(currentStep.target));
      });
    };

    updateRect({ shouldScroll: true });
    [120, 360, 720].forEach((delay) => {
      retryTimeouts.push(globalThis.setTimeout(() => updateRect({ shouldScroll: true }), delay));
    });

    globalThis.addEventListener('resize', updateRect);
    globalThis.addEventListener('scroll', updateRect, true);
    visualViewport?.addEventListener('resize', updateRect);
    visualViewport?.addEventListener('scroll', updateRect);

    return () => {
      if (frameId) {
        globalThis.cancelAnimationFrame(frameId);
      }

      retryTimeouts.forEach((timeoutId) => globalThis.clearTimeout(timeoutId));
      globalThis.removeEventListener('resize', updateRect);
      globalThis.removeEventListener('scroll', updateRect, true);
      visualViewport?.removeEventListener('resize', updateRect);
      visualViewport?.removeEventListener('scroll', updateRect);
    };
  }, [currentStep?.id, currentStep?.target, isTourActive]);

  const progressPercentage = useMemo(() => {
    if (!steps.length) {
      return 0;
    }

    return Math.round(((currentStepIndex + 1) / steps.length) * 100);
  }, [currentStepIndex, steps.length]);

  if (showWelcome) {
    return (
      <TourShell>
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-syntix-green/10 text-syntix-green">
          <Sparkles className="h-6 w-6" />
        </div>

        <h2 className="mt-5 text-2xl font-bold text-syntix-navy">Bienvenido a Drive Control</h2>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          Detectamos que tu cuenta acaba de completar el ingreso inicial. Si quieres, te guiamos por el
          dashboard, las alertas, reportes, validacion RUNT, configuracion y el flujo para agregar tu
          primer vehiculo. Si ya entendiste la plataforma, puedes omitir este paso y entrar de una vez.
        </p>

        <div className="mt-6 rounded-2xl border border-syntix-green/20 bg-syntix-green/5 p-4 text-sm text-gray-700">
          El recorrido solo aparece automaticamente para cuentas nuevas. Luego podras volver a abrirlo
          manualmente desde el encabezado del dashboard cuando quieras repasarlo.
        </div>

        <div className="mt-6 grid gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700 sm:grid-cols-2">
          <div>
            <p className="font-semibold text-syntix-navy">Que vas a recorrer</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>Dashboard y accesos rapidos</li>
              <li>Vehiculos, conductores y documentos</li>
              <li>Alertas, RUNT e historial</li>
              <li>Reportes y configuracion</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-syntix-navy">Que lograras al final</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>Entender la navegacion completa</li>
              <li>Saber donde registrar informacion</li>
              <li>Detectar donde revisar riesgos y evidencias</li>
              <li>Ubicar ajustes y respaldos del sistema</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={skipWelcome}
            className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Ya entendi, ir al inicio
          </button>
          <button
            type="button"
            onClick={startTour}
            className="rounded-xl bg-syntix-navy px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-syntix-navy/90"
          >
            Si, mostrar tutorial
          </button>
        </div>
      </TourShell>
    );
  }

  if (!isTourActive || !currentStep) {
    if (showCompletion) {
      return (
        <TourShell>
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-syntix-green/10 text-syntix-green">
            <CheckCircle2 className="h-6 w-6" />
          </div>

          <h2 className="mt-5 text-2xl font-bold text-syntix-navy">Todo listo para comenzar</h2>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            Ya recorriste los puntos principales de Drive Control. Desde este momento puedes usar el
            dashboard como centro de trabajo y moverte con mas seguridad por vehiculos, documentos,
            alertas, RUNT, reportes y configuracion.
          </p>

          <div className="mt-6 rounded-2xl border border-syntix-green/20 bg-syntix-green/5 p-4 text-sm text-gray-700">
            Tu cuenta ya quedo preparada para empezar a operar el software con una vista clara de donde
            registrar informacion, donde revisar riesgos y donde hacer seguimiento.
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={closeCompletion}
              className="w-full rounded-xl bg-syntix-navy px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-syntix-navy/90 sm:w-auto"
            >
              Ir al dashboard
            </button>
          </div>
        </TourShell>
      );
    }

    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] overflow-hidden pointer-events-auto">
      <div className="absolute inset-0 bg-slate-950/45" />

      {targetRect && (
        <div
          className="pointer-events-none absolute rounded-3xl border-2 border-syntix-green shadow-[0_0_0_9999px_rgba(15,23,42,0.35)] transition-all duration-300"
          style={targetRect}
        />
      )}

      <div className="absolute inset-x-2 bottom-0 z-[72] mx-auto flex max-h-[calc(100vh-0.5rem)] max-h-[calc(100dvh-0.5rem)] w-[calc(100%-1rem)] max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:bottom-4 sm:left-auto sm:right-4 sm:mx-0 sm:max-h-[calc(100vh-2rem)] sm:max-h-[calc(100dvh-2rem)] sm:w-full sm:rounded-3xl">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-syntix-green/10 px-3 py-1 text-xs font-semibold text-syntix-green">
                <Sparkles className="h-4 w-4" />
                Paso {currentStepIndex + 1} de {steps.length}
              </div>
              <h3 className="mt-3 text-lg font-bold text-syntix-navy">{currentStep.title}</h3>
            </div>

            <button
              type="button"
              onClick={skipTour}
              className="shrink-0 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              title="Saltar tutorial"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="mt-3 text-sm leading-6 text-gray-600">{currentStep.description}</p>

          {Array.isArray(currentStep.learnings) && currentStep.learnings.length > 0 && (
            <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">En esta parte te guiamos por</p>
              <ul className="mt-2 space-y-2 text-sm text-gray-700">
                {currentStep.learnings.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-syntix-green" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="safe-area-bottom shrink-0 border-t border-gray-100 bg-white p-4 sm:p-6 sm:pb-6">
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-syntix-green transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <button
                type="button"
                onClick={goToPreviousStep}
                disabled={currentStepIndex === 0}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:py-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Atras
              </button>

              <button
                type="button"
                onClick={skipTour}
                className="rounded-xl border border-transparent px-4 py-3 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-50 sm:py-2"
              >
                Ya entendi
              </button>
            </div>

            {currentStepIndex === steps.length - 1 ? (
              <button
                type="button"
                onClick={finishTour}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-syntix-green px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-syntix-green/90 sm:w-auto sm:py-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Finalizar
              </button>
            ) : (
              <button
                type="button"
                onClick={goToNextStep}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-syntix-navy px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-syntix-navy/90 sm:w-auto sm:py-2"
              >
                Siguiente
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

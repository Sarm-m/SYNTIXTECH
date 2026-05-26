import { beforeEach, describe, expect, it, vi } from 'vitest';
import AlertHubSingleton from '../patterns/singleton/AlertHubSingleton.js';

describe('AlertHubSingleton', () => {
  let hub;

  beforeEach(() => {
    AlertHubSingleton.instance = null;
    hub = AlertHubSingleton.getInstance();
    hub.reset();
  });

  it('registerSourceAlerts registra una fuente nueva y notifica', () => {
    const listener = vi.fn();
    hub.subscribe(listener);
    listener.mockClear();

    hub.registerSourceAlerts('soats', [{ id: 'soat-1', tipo: 'SOAT', prioridad: 'rojo' }]);

    expect(hub.getAllAlerts()).toHaveLength(1);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('registerSourceAlerts con las mismas alertas no notifica otra vez', () => {
    const listener = vi.fn();
    const alerts = [{ id: 'soat-1', tipo: 'SOAT', prioridad: 'rojo', diasRestantes: -2 }];

    hub.subscribe(listener);
    hub.registerSourceAlerts('soats', alerts);
    listener.mockClear();

    hub.registerSourceAlerts('soats', [...alerts]);

    expect(listener).not.toHaveBeenCalled();
  });

  it('clearSourceAlerts sobre fuente inexistente no notifica', () => {
    const listener = vi.fn();
    hub.subscribe(listener);
    listener.mockClear();

    hub.clearSourceAlerts('soats');

    expect(listener).not.toHaveBeenCalled();
  });

  it('reset sobre hub vacio no notifica', () => {
    const listener = vi.fn();
    hub.subscribe(listener);
    listener.mockClear();

    hub.reset();

    expect(listener).not.toHaveBeenCalled();
  });

  it('reset con datos limpia todo', () => {
    hub.registerSourceAlerts('soats', [{ id: 'soat-1', tipo: 'SOAT', prioridad: 'rojo' }]);
    hub.reset();

    expect(hub.getAllAlerts()).toHaveLength(0);
  });

  it('registerAllSources actualiza varias fuentes con una sola notificacion', () => {
    const listener = vi.fn();
    hub.subscribe(listener);
    listener.mockClear();

    hub.registerAllSources({
      soats: [{ id: 'soat-1', tipo: 'SOAT', prioridad: 'rojo' }],
      rtms: [{ id: 'rtm-1', tipo: 'RTM', prioridad: 'amarillo', diasRestantes: 5 }],
      conductores: [],
      vehiculos: [],
    });

    expect(hub.getAllAlerts()).toHaveLength(2);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('mantiene total estable si no cambian las alertas', () => {
    const alerts = [{ id: 'soat-1', tipo: 'SOAT', prioridad: 'rojo', diasRestantes: -1 }];
    hub.registerAllSources({ soats: alerts, rtms: [], conductores: [], vehiculos: [] });
    const firstTotal = hub.getAllAlerts().length;

    hub.registerAllSources({ soats: alerts, rtms: [], conductores: [], vehiculos: [] });
    const secondTotal = hub.getAllAlerts().length;

    expect(secondTotal).toBe(firstTotal);
  });

  it('no duplica alertas con el mismo id entre fuentes', () => {
    const alert = { id: 'shared-1', tipo: 'SOAT', prioridad: 'rojo' };
    hub.registerSourceAlerts('soats', [alert]);
    hub.registerSourceAlerts('vehiculos', [alert]);

    expect(hub.getAllAlerts()).toHaveLength(1);
  });
});

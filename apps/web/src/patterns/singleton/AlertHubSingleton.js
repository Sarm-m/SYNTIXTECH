import PriorityAlertSortStrategy from '@/patterns/strategy/PriorityAlertSortStrategy.js';
import { buildAlertSignature } from '@/utils/alertSignature.js';

const DEFAULT_SOURCE_KEYS = ['soats', 'rtms', 'conductores', 'vehiculos'];

// Hub único de alertas: fusiona múltiples fuentes y entrega una lista ya ordenada a la UI.
export default class AlertHubSingleton {
  static instance = null;

  constructor() {
    if (AlertHubSingleton.instance) {
      return AlertHubSingleton.instance;
    }

    this.listeners = new Set();
    this.sourceAlerts = new Map();
    this.sourceSignatures = new Map();
    this.currentAlerts = [];
    this.sortStrategy = new PriorityAlertSortStrategy();
    this.sortStrategyKey = PriorityAlertSortStrategy.name;

    AlertHubSingleton.instance = this;
  }

  static getInstance() {
    if (!AlertHubSingleton.instance) {
      AlertHubSingleton.instance = new AlertHubSingleton();
    }

    return AlertHubSingleton.instance;
  }

  setSortStrategy(strategy) {
    const nextKey = strategy?.constructor?.name || 'unknown';

    if (this.sortStrategyKey === nextKey) {
      return;
    }

    this.sortStrategy = strategy;
    this.sortStrategyKey = nextKey;
    this.notifyListeners();
  }

  buildAlerts() {
    const merged = [];
    const seen = new Set();

    // Se deduplican alertas por id para que una misma fuente no contamine el tablero con repetidos.
    Array.from(this.sourceAlerts.values())
      .flat()
      .forEach((alert) => {
        if (!alert || !alert.id) return;
        if (seen.has(alert.id)) return;

        seen.add(alert.id);
        merged.push(alert);
      });

    return this.sortStrategy.sort(merged);
  }

  notifyListeners() {
    const nextAlerts = this.buildAlerts();
    const nextSignature = buildAlertSignature(nextAlerts);
    const currentSignature = buildAlertSignature(this.currentAlerts);

    if (nextSignature === currentSignature) {
      return;
    }

    this.currentAlerts = nextAlerts;
    this.listeners.forEach((listener) => listener(this.currentAlerts));
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.currentAlerts);
    return () => this.listeners.delete(listener);
  }

  registerSourceAlerts(sourceKey, alerts = []) {
    const nextAlerts = Array.isArray(alerts) ? alerts : [];
    const nextSignature = buildAlertSignature(nextAlerts);
    const previousSignature = this.sourceSignatures.get(sourceKey);

    if (previousSignature === nextSignature) {
      return;
    }

    this.sourceSignatures.set(sourceKey, nextSignature);
    this.sourceAlerts.set(sourceKey, nextAlerts);
    this.notifyListeners();
  }

  registerAllSources(sources = {}) {
    let changed = false;

    DEFAULT_SOURCE_KEYS.forEach((sourceKey) => {
      if (!(sourceKey in sources)) {
        return;
      }

      const nextAlerts = Array.isArray(sources[sourceKey]) ? sources[sourceKey] : [];
      const nextSignature = buildAlertSignature(nextAlerts);
      const previousSignature = this.sourceSignatures.get(sourceKey);

      if (previousSignature === nextSignature) {
        return;
      }

      this.sourceSignatures.set(sourceKey, nextSignature);
      this.sourceAlerts.set(sourceKey, nextAlerts);
      changed = true;
    });

    if (changed) {
      this.notifyListeners();
    }
  }

  clearSourceAlerts(sourceKey) {
    if (!this.sourceAlerts.has(sourceKey) && !this.sourceSignatures.has(sourceKey)) {
      return;
    }

    this.sourceAlerts.delete(sourceKey);
    this.sourceSignatures.delete(sourceKey);
    this.notifyListeners();
  }

  reset() {
    if (this.sourceAlerts.size === 0 && this.currentAlerts.length === 0) {
      return;
    }

    this.sourceAlerts.clear();
    this.sourceSignatures.clear();
    this.currentAlerts = [];
    this.notifyListeners();
  }

  getAllAlerts() {
    return this.currentAlerts;
  }
}

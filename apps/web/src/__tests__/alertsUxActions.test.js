import { describe, expect, it } from 'vitest';
import {
  getAlertActionModel,
  getAlertPresentation,
  getAlertsSummary,
} from '@/utils/alertActions.js';

describe('Alertas UX actions', () => {
  it('abre el flujo existente para registrar un SOAT faltante', () => {
    expect(getAlertActionModel({
      id: 'missing-soat-vehicle-1',
      categoria: 'vehiculos',
      grupo: 'SOAT',
    })).toEqual({
      primary: {
        label: 'Registrar SOAT',
        kind: 'register-soat',
        route: '/documentos',
        canMutate: true,
      },
      secondary: {
        label: 'Ver vehículo',
        route: '/vehiculos',
      },
    });
  });

  it('diferencia actualizar documentos existentes y registrar faltantes', () => {
    expect(getAlertActionModel({
      id: 'rtm-42',
      categoria: 'vehiculos',
      grupo: 'RTM',
    }).primary).toMatchObject({
      label: 'Actualizar documento',
      kind: 'update-rtm',
    });
  });

  it('dirige las licencias al flujo existente de conductores', () => {
    expect(getAlertActionModel({
      id: 'lic-driver-1',
      categoria: 'conductores',
      grupo: 'Licencias',
    })).toMatchObject({
      primary: {
        label: 'Actualizar licencia',
        kind: 'update-license',
        route: '/conductores',
        canMutate: true,
      },
      secondary: {
        label: 'Ver conductor',
        route: '/conductores',
      },
    });
  });

  it('produce copy profesional para documentos faltantes', () => {
    expect(getAlertPresentation({
      id: 'missing-soat-vehicle-1',
      entidad: 'Vehiculo JSU502',
    })).toEqual({
      title: 'Documento faltante',
      description: 'Vehículo JSU502 requiere registro de SOAT para quedar al día.',
      guidance: 'Registra la póliza para cerrar esta alerta.',
    });
  });

  it('calcula el resumen ejecutivo por severidad y entidad afectada', () => {
    expect(getAlertsSummary([
      { prioridad: 'rojo', categoria: 'vehiculos', entidad: 'Vehiculo JSU502' },
      { prioridad: 'amarillo', categoria: 'vehiculos', entidad: 'Vehiculo JSU502' },
      { prioridad: 'rojo', categoria: 'conductores', entidad: 'Laura Pérez' },
    ])).toEqual({
      critical: 2,
      preventive: 1,
      vehicles: 1,
      conductors: 1,
    });
  });
});

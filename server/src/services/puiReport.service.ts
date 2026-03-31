export type PuiReportStatus = 'active' | 'inactive';

export type PuiReportTraceEvent = {
  at: string;
  source: string;
  action: 'activate' | 'deactivate';
};

export type PuiReportRecord = {
  curp: string;
  status: PuiReportStatus;
  createdAt: string;
  updatedAt: string;
  activatedAt?: string;
  deactivatedAt?: string;
  history: PuiReportTraceEvent[];
};

// Almacenamiento temporal en memoria.
// En producción debe reemplazarse por persistencia real (DB) sin cambiar la interfaz pública del servicio.
const reports = new Map<string, PuiReportRecord>();

function nowIso(): string {
  return new Date().toISOString();
}

export function activateReport(curp: string, source: string): PuiReportRecord {
  const now = nowIso();
  const existing = reports.get(curp);
  if (!existing) {
    const rec: PuiReportRecord = {
      curp,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      activatedAt: now,
      history: [{ at: now, source, action: 'activate' }]
    };
    reports.set(curp, rec);
    return rec;
  }

  const { deactivatedAt: _deactivatedAt, ...rest } = existing;
  const updated: PuiReportRecord = {
    ...rest,
    status: 'active',
    updatedAt: now,
    activatedAt: now,
    history: [...existing.history, { at: now, source, action: 'activate' }]
  };
  reports.set(curp, updated);
  return updated;
}

export function deactivateReport(curp: string, source: string): PuiReportRecord {
  const now = nowIso();
  const existing = reports.get(curp);
  if (!existing) {
    const rec: PuiReportRecord = {
      curp,
      status: 'inactive',
      createdAt: now,
      updatedAt: now,
      deactivatedAt: now,
      history: [{ at: now, source, action: 'deactivate' }]
    };
    reports.set(curp, rec);
    return rec;
  }

  const updated: PuiReportRecord = {
    ...existing,
    status: 'inactive',
    updatedAt: now,
    deactivatedAt: now,
    history: [...existing.history, { at: now, source, action: 'deactivate' }]
  };
  reports.set(curp, updated);
  return updated;
}

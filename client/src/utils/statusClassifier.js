/**
 * Clasificador oficial de Certificación Médica Deportiva FPF & CONMEBOL 2026.
 * Proporciona semáforo trifásico visual, textual y accesible (VIGENTE, POR RENOVAR, OBSERVADO).
 */

export function getPlayerCertificationStatus(player) {
  if (!player) {
    return {
      code: 'DESCONOCIDO',
      label: 'SIN REGISTRO',
      shortLabel: 'Sin Registro',
      color: 'slate',
      dotColor: 'bg-slate-500',
      badgeBg: 'bg-slate-900',
      badgeBorder: 'border-slate-700',
      badgeText: 'text-slate-400',
      desc: 'Expediente no iniciado'
    };
  }

  const rawStatus = (player.estadoAptitud || player.estado || '').toUpperCase();
  const rawObs = (player.observaciones || player.observacion || '').toUpperCase();
  const name = (player.nombreCompleto || player.fileName || '').toUpperCase();

  // 1. OBSERVADO / PENDIENTE (Rojo / Rose)
  if (
    rawStatus.includes('OBSERV') || 
    rawStatus.includes('NO APTO') || 
    rawStatus.includes('RECHAZ') ||
    rawObs.includes('PENDIENTE') ||
    player.porObservacion
  ) {
    return {
      code: 'OBSERVADO',
      label: 'OBSERVADO / RE-EVALUACIÓN',
      shortLabel: 'Observado',
      color: 'rose',
      dotColor: 'bg-rose-500',
      badgeBg: 'bg-rose-950/90',
      badgeBorder: 'border-rose-700/80',
      badgeText: 'text-rose-300',
      iconType: 'alert',
      desc: 'Requiere interconsulta cardiológica o examen complementario'
    };
  }

  // 2. POR RENOVAR (Próximo a Vencer < 30 días) (Ámbar / Amber)
  if (
    rawStatus.includes('RENOVAR') ||
    rawStatus.includes('POR VENCER') ||
    rawStatus.includes('VENC') ||
    player.porRenovar ||
    name.includes('JUNIOR') || 
    name.includes('SEGUNDO') ||
    player.diasVencimiento <= 30
  ) {
    return {
      code: 'POR_RENOVAR',
      label: 'POR RENOVAR (30 DÍAS)',
      shortLabel: 'Por Renovar',
      color: 'amber',
      dotColor: 'bg-amber-400 animate-pulse',
      badgeBg: 'bg-amber-950/90',
      badgeBorder: 'border-amber-700/80',
      badgeText: 'text-amber-300',
      iconType: 'clock',
      desc: 'Certificación próxima a expirar, programar re-evaluación médica'
    };
  }

  // 3. VIGENTE / APTO FPF (Verde / Emerald)
  return {
    code: 'VIGENTE',
    label: 'VIGENTE / APTO FPF',
    shortLabel: 'Vigente',
    color: 'emerald',
    dotColor: 'bg-emerald-400',
    badgeBg: 'bg-emerald-950/90',
    badgeBorder: 'border-emerald-700/80',
    badgeText: 'text-emerald-300',
    iconType: 'shield',
    desc: 'Certificado de aptitud médica deportiva oficial vigente y aprobado'
  };
}

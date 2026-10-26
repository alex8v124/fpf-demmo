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
      dotColor: 'bg-slate-400',
      badgeBg: 'bg-slate-100',
      badgeBorder: 'border-0',
      badgeText: 'text-slate-600',
      desc: 'Expediente no iniciado'
    };
  }

  const rawStatus = (player.estadoAptitud || player.estado || '').toUpperCase();
  const rawObs = (player.observaciones || player.observacion || '').toUpperCase();
  const name = (player.nombreCompleto || player.fileName || '').toUpperCase();

  // 1. OBSERVADO / PENDIENTE (Rojo Clínico Pastel)
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
      dotColor: 'bg-[#991B1B]',
      badgeBg: 'bg-[#FEE2E2]',
      badgeBorder: 'border-0',
      badgeText: 'text-[#991B1B]',
      iconType: 'alert',
      desc: 'Requiere interconsulta cardiológica o examen complementario'
    };
  }

  // 2. POR RENOVAR (Próximo a Vencer < 30 días) (Ámbar Clínico Pastel)
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
      dotColor: 'bg-[#92400E] animate-pulse',
      badgeBg: 'bg-[#FEF3C7]',
      badgeBorder: 'border-0',
      badgeText: 'text-[#92400E]',
      iconType: 'clock',
      desc: 'Certificación próxima a expirar, programar re-evaluación médica'
    };
  }

  // 3. VIGENTE / APTO FPF (Verde Clínico Pastel)
  return {
    code: 'VIGENTE',
    label: 'VIGENTE / APTO FPF',
    shortLabel: 'Vigente',
    color: 'emerald',
    dotColor: 'bg-[#166534]',
    badgeBg: 'bg-[#DCFCE7]',
    badgeBorder: 'border-0',
    badgeText: 'text-[#166534]',
    iconType: 'shield',
    desc: 'Certificado de aptitud médica deportiva oficial vigente y aprobado'
  };
}

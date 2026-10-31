export const getFechaHoyISO = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const normalizeDate = (d?: string | null): string => {
  if (!d) return '';
  const trimmed = d.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.includes('T')) {
    return trimmed.slice(0, 10);
  }
  const parts = trimmed.split(/[/.-]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    if (parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  return trimmed;
};

export const isFechaHoy = (fechaStr?: string | null, targetDateISO?: string): boolean => {
  if (!fechaStr) return false;
  const target = targetDateISO || getFechaHoyISO();
  return normalizeDate(fechaStr) === target;
};

export const matchMesa = (mesa1?: string, mesa2?: string): boolean => {
  if (!mesa1 || !mesa2) return false;
  const clean1 = mesa1.trim().toLowerCase().replace(/\s+/g, '');
  const clean2 = mesa2.trim().toLowerCase().replace(/\s+/g, '');
  return clean1 === clean2;
};

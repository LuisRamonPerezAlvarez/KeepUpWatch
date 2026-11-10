import { TaskStatus } from '@/types/models';

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateCompact(dateString?: string | null): string {
  if (!dateString) return '--';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
      });
    }
    return dateString;
  } catch {
    return dateString;
  }
}

export function getDaysRemaining(targetDateStr: string): number {
  const todayStr = getTodayDateString();
  const [ty, tm, td] = todayStr.split('-').map(Number);
  const [ny, nm, nd] = targetDateStr.split('-').map(Number);

  const today = new Date(ty, tm - 1, td).getTime();
  const target = new Date(ny, nm - 1, nd).getTime();

  const diffTime = target - today;
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function getTaskStatus(nextDate: string): TaskStatus {
  const days = getDaysRemaining(nextDate);
  if (days < 0) return 'overdue';
  if (days <= 7) return 'pending';
  return 'upcoming';
}

export function addDaysToDate(dateStr: string, daysToAdd: number): string {
  const parts = dateStr.split('-');
  let base: Date;
  if (parts.length === 3) {
    base = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  } else {
    base = new Date(dateStr);
  }
  base.setDate(base.getDate() + daysToAdd);

  const year = base.getFullYear();
  const month = String(base.getMonth() + 1).padStart(2, '0');
  const day = String(base.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatFrequency(value: number, unit: string): string {
  const unitNames: Record<string, { singular: string; plural: string }> = {
    days: { singular: 'día', plural: 'días' },
    weeks: { singular: 'semana', plural: 'semanas' },
    months: { singular: 'mes', plural: 'meses' },
    years: { singular: 'año', plural: 'años' },
  };

  const name = value === 1 ? unitNames[unit]?.singular || unit : unitNames[unit]?.plural || unit;
  return `Cada ${value} ${name}`;
}


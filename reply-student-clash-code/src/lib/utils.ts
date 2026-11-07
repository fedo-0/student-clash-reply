import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
export const round = (v: number, digits = 0) => {
  const f = 10 ** digits;
  return Math.round(v * f) / f;
};
export const fmt = (v: number, digits = 1) =>
  v.toLocaleString('it-IT', { minimumFractionDigits: digits, maximumFractionDigits: digits });
export const pct = (v01: number, digits = 0) => `${fmt(v01 * 100, digits)}%`;

/*! Giterp Multi-School Enterprise ERP Core v1.2.0 */
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getSchoolInitials(school?: any): string {
  if (!school) return 'DPS';
  if (typeof school === 'string') {
    const letters = school.replace(/[^A-Za-z]/g, '').toUpperCase();
    if (letters.length >= 2 && letters.length <= 6) return letters;
    const words = school
      .replace(/[^a-zA-Z\s]/g, '')
      .split(/\s+/)
      .filter((w: string) => w.length > 0 && !/^(and|of|the|for|in|at|to)$/i.test(w));
    if (words.length >= 2) {
      return words.slice(0, 4).map((w: string) => w[0].toUpperCase()).join('');
    }
    return school.slice(0, 3).toUpperCase() || 'DPS';
  }
  if (school.school_code || school.code) {
    const code = school.school_code || school.code;
    const letters = code.replace(/[^A-Za-z]/g, '').toUpperCase();
    if (letters.length >= 2 && letters.length <= 6) return letters;
  }
  if (school.school_name || school.name) {
    const name = school.school_name || school.name;
    const words = name
      .replace(/[^a-zA-Z\s]/g, '')
      .split(/\s+/)
      .filter((w: string) => w.length > 0 && !/^(and|of|the|for|in|at|to)$/i.test(w));
    if (words.length >= 2) {
      return words.slice(0, 4).map((w: string) => w[0].toUpperCase()).join('');
    }
    return name.slice(0, 3).toUpperCase();
  }
  return 'DPS';
}


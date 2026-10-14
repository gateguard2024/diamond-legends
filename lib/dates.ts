// Date helpers that work on plain YYYY-MM-DD strings in local time.

export const pad = (n: number) => String(n).padStart(2, '0');

export function iso(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parse(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const today = () => iso(new Date());

export function addDays(s: string, n: number) {
  const d = parse(s);
  d.setDate(d.getDate() + n);
  return iso(d);
}

export function diffDays(a: string, b: string) {
  return Math.round((parse(a).getTime() - parse(b).getTime()) / 86400000);
}

/** Monday of the week containing s. */
export function weekStart(s: string) {
  const d = parse(s);
  const dow = (d.getDay() + 6) % 7; // Mon = 0
  d.setDate(d.getDate() - dow);
  return iso(d);
}

/** 0 = Monday … 6 = Sunday */
export const dayIndex = (s: string) => (parse(s).getDay() + 6) % 7;

export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function short(s: string) {
  const d = parse(s);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function long(s: string) {
  const d = parse(s);
  return `${DAY_NAMES[(d.getDay() + 6) % 7]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

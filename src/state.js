export const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
export const DOW = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']; // Domingo a Sábado

const now = new Date();

export const state = {
  user: null, // objeto do Supabase Auth (session.user)
  month: now.getMonth(), // 0-indexed
  year: now.getFullYear(),
  period: 'mensal', // mensal | semanal | diario (usado na seção Diário)
  week: 0,
  day: now.getDate()
};

export function daysInMonth(month = state.month, year = state.year) {
  return new Date(year, month + 1, 0).getDate();
}

export function firstWeekdayOffset(month = state.month, year = state.year) {
  return new Date(year, month, 1).getDay(); // 0 = domingo, já alinhado com DOW
}

export function currentWeekIndex() {
  const now = new Date();
  if (now.getMonth() !== state.month || now.getFullYear() !== state.year) return null;
  const offset = firstWeekdayOffset();
  return Math.floor((offset + now.getDate() - 1) / 7);
}

export function isToday(day, month = state.month, year = state.year) {
  const n = new Date();
  return n.getDate() === day && n.getMonth() === month && n.getFullYear() === year;
}

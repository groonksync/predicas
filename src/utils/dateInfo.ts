export interface DateInfo {
  weekday: string;
  long: string;
  message: string;
  tone: 'hoy' | 'proxima' | 'futura' | 'pasada' | 'vacia';
}

// Interpreta 'YYYY-MM-DD' como fecha local (evita desfases por zona horaria)
export const getDateInfo = (iso?: string): DateInfo => {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return { weekday: '', long: 'Sin fecha', message: 'Asigna una fecha de predicación', tone: 'vacia' };
  }
  const [y, m, d] = iso.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);

  const weekday = target.toLocaleDateString('es-ES', { weekday: 'long' });
  const long = target.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  const cap = weekday.charAt(0).toUpperCase() + weekday.slice(1);

  if (diff === 0) return { weekday: cap, long, message: '¡Hoy es el día de predicar!', tone: 'hoy' };
  if (diff === 1) return { weekday: cap, long, message: 'Mañana es la predicación', tone: 'proxima' };
  if (diff > 1 && diff <= 7) return { weekday: cap, long, message: `Faltan ${diff} días para predicar`, tone: 'proxima' };
  if (diff > 7) return { weekday: cap, long, message: `Faltan ${diff} días para esta predicación`, tone: 'futura' };
  if (diff === -1) return { weekday: cap, long, message: 'Se predicó ayer', tone: 'pasada' };
  return { weekday: cap, long, message: `Se predicó hace ${Math.abs(diff)} días`, tone: 'pasada' };
};

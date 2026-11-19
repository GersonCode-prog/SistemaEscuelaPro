// ============================================================
//  FORMATOS: fechas, dinero y texto seguro
// ============================================================

export const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
export const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

const dos = (n: number) => String(n).padStart(2, '0');

export const fechaISO = (d: Date) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
export const hoy = () => fechaISO(new Date());
export const aFecha = (f: string) => new Date(f.length === 10 ? `${f}T12:00:00` : f);

export function sumarDias(f: string, dias: number) {
  const d = aFecha(f);
  d.setDate(d.getDate() + dias);
  return fechaISO(d);
}

export const diasEntre = (desde: string, hasta: string) =>
  Math.round((aFecha(hasta).getTime() - aFecha(desde).getTime()) / 86400000);

export const fechaCorta = (f: string) => aFecha(f).toLocaleDateString('es-GT', { day: 'numeric', month: 'short' });
export const fechaMedia = (f: string) => aFecha(f).toLocaleDateString('es-GT', { day: 'numeric', month: 'short', year: 'numeric' });
export const fechaLarga = (f: string) => {
  const t = aFecha(f).toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return t.charAt(0).toUpperCase() + t.slice(1);
};
export const hora = (f: string) => aFecha(f).toLocaleTimeString('es-GT', { hour: 'numeric', minute: '2-digit' });

// "Hoy", "Mañana", "En 3 días", "Hace 2 días"
export function relativa(f: string) {
  const d = diasEntre(hoy(), f.slice(0, 10));
  if (d === 0) return 'Hoy';
  if (d === 1) return 'Mañana';
  if (d === -1) return 'Ayer';
  return d > 0 ? `En ${d} días` : `Hace ${-d} días`;
}

// "hace 5 min", "hace 3 h", "ayer", "12 nov"
export function haceTiempo(f: string) {
  const min = Math.round((Date.now() - aFecha(f).getTime()) / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  if (min < 60 * 24) return `hace ${Math.round(min / 60)} h`;
  if (min < 60 * 48) return 'ayer';
  return fechaCorta(f);
}

export const moneda = (n: number) =>
  'Q ' + n.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const monedaCorta = (n: number) => 'Q ' + Math.round(n).toLocaleString('es-GT');

export const escapar = (texto: unknown) =>
  String(texto ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

// Texto con saltos de línea → HTML seguro
export const parrafos = (texto: string) => escapar(texto).replace(/\n/g, '<br />');

export const sinAcentos = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '');
export const coincide = (texto: string, busqueda: string) =>
  sinAcentos(texto.toLowerCase()).includes(sinAcentos(busqueda.toLowerCase().trim()));

export const saludo = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
};

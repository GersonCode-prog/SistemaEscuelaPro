// ============================================================
//  "BASE DE DATOS" EN EL NAVEGADOR (localStorage)
//  Cuando exista un servidor, solo hay que cambiar este archivo.
// ============================================================
import type { Colecciones, Config, Notas } from './tipos';
import { generarDatos, VERSION } from './semilla';

const PREFIJO = 'ep_';
const cache = new Map<string, unknown>();

export class SinEspacioError extends Error {}

function leerCrudo<T>(clave: string, defecto: T): T {
  if (cache.has(clave)) return cache.get(clave) as T;
  try {
    const texto = localStorage.getItem(PREFIJO + clave);
    const valor = texto ? JSON.parse(texto) : defecto;
    cache.set(clave, valor);
    return valor;
  } catch {
    return defecto;
  }
}

// Avisa a la interfaz (insignias, campana) que algo cambió
let cambioPendiente = false;
function avisarCambio() {
  if (cambioPendiente || typeof document === 'undefined') return;
  cambioPendiente = true;
  setTimeout(() => { cambioPendiente = false; document.dispatchEvent(new CustomEvent('ep:cambio')); }, 0);
}

function escribirCrudo(clave: string, valor: unknown) {
  try {
    localStorage.setItem(PREFIJO + clave, JSON.stringify(valor));
    cache.set(clave, valor);
  } catch {
    throw new SinEspacioError('No hay espacio suficiente en el navegador');
  }
  avisarCambio();
}

// Carga los datos ficticios la primera vez (o cuando cambia la versión)
export function asegurarDatos() {
  if (localStorage.getItem(PREFIJO + 'version') === String(VERSION)) return;
  borrarTodo();
  const datos = generarDatos();
  Object.entries(datos).forEach(([clave, valor]) => escribirCrudo(clave, valor));
  localStorage.setItem(PREFIJO + 'version', String(VERSION));
}

function borrarTodo() {
  Object.keys(localStorage).filter((k) => k.startsWith(PREFIJO) && k !== PREFIJO + 'sesion').forEach((k) => localStorage.removeItem(k));
  cache.clear();
}

export function restablecerDatos() {
  localStorage.removeItem(PREFIJO + 'version');
  asegurarDatos();
}

// ---------- Colecciones ----------
export function obtener<K extends keyof Colecciones>(nombre: K): Colecciones[K][] {
  asegurarDatos();
  return leerCrudo<Colecciones[K][]>(nombre, []);
}

export function guardar<K extends keyof Colecciones>(nombre: K, lista: Colecciones[K][]) {
  escribirCrudo(nombre, lista);
}

export function porId<K extends keyof Colecciones>(nombre: K, id: string | null | undefined): Colecciones[K] | undefined {
  if (!id) return undefined;
  return obtener(nombre).find((x) => (x as { id: string }).id === id);
}

export function guardarItem<K extends keyof Colecciones>(nombre: K, item: Colecciones[K]) {
  const lista = obtener(nombre);
  const i = lista.findIndex((x) => (x as { id: string }).id === (item as { id: string }).id);
  if (i >= 0) lista[i] = item;
  else lista.unshift(item);
  guardar(nombre, lista);
}

export function eliminarItem<K extends keyof Colecciones>(nombre: K, id: string) {
  guardar(nombre, obtener(nombre).filter((x) => (x as { id: string }).id !== id));
}

// ---------- Notas y configuración ----------
export function obtenerNotas(): Notas { asegurarDatos(); return leerCrudo<Notas>('notas', {}); }
export function guardarNotas(notas: Notas) { escribirCrudo('notas', notas); }

export function config(): Config { asegurarDatos(); return leerCrudo<Config>('config', {} as Config); }
export function guardarConfig(c: Config) { escribirCrudo('config', c); }

export const nuevoId = (prefijo = '') => prefijo + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// ---------- Respaldo ----------
export function exportarTodo() {
  const datos: Record<string, unknown> = {};
  Object.keys(localStorage).filter((k) => k.startsWith(PREFIJO) && k !== PREFIJO + 'sesion')
    .forEach((k) => { datos[k.slice(PREFIJO.length)] = JSON.parse(localStorage.getItem(k) || 'null'); });
  return datos;
}

export function importarTodo(datos: Record<string, unknown>) {
  if (!datos || typeof datos !== 'object' || !('usuarios' in datos)) throw new Error('El archivo no es un respaldo válido');
  borrarTodo();
  Object.entries(datos).forEach(([k, v]) => localStorage.setItem(PREFIJO + k, typeof v === 'string' ? v : JSON.stringify(v)));
  cache.clear();
}

export function espacioUsado() {
  let caracteres = 0;
  Object.keys(localStorage).forEach((k) => { caracteres += k.length + (localStorage.getItem(k)?.length ?? 0); });
  return { kb: Math.round((caracteres * 2) / 1024), porcentaje: Math.min(100, Math.round((caracteres / (5 * 1024 * 1024)) * 100)) };
}

// ============================================================
//  SESIÓN E INICIO DE SESIÓN POR ROL
// ============================================================
import type { Rol, Usuario } from './tipos';
import { obtener, guardarItem } from './datos';
import { ROLES } from './escuela';
import { ruta } from './ruta';

const CLAVE = 'ep_sesion';
interface Sesion { usuarioId: string; rol: Rol; }

export function leerSesion(): Sesion | null {
  try { return JSON.parse(sessionStorage.getItem(CLAVE) || localStorage.getItem(CLAVE) || 'null'); } catch { return null; }
}

export function iniciarSesion(usuario: string, clave: string, rol: Rol, recordar: boolean): { ok: true; usuario: Usuario } | { ok: false; error: string } {
  const u = obtener('usuarios').find((x) => x.usuario.toLowerCase() === usuario.trim().toLowerCase());
  if (!u || u.clave !== clave) return { ok: false, error: 'Usuario o contraseña incorrectos.' };
  if (!u.activo) return { ok: false, error: 'Este usuario está desactivado. Comunícate con la administración.' };
  if (u.rol !== rol) return { ok: false, error: `Este usuario pertenece al ${ROLES[u.rol].portal}. Selecciona ese rol para entrar.` };
  const sesion: Sesion = { usuarioId: u.id, rol: u.rol };
  (recordar ? localStorage : sessionStorage).setItem(CLAVE, JSON.stringify(sesion));
  guardarItem('usuarios', { ...u, ultimoAcceso: new Date().toISOString() });
  return { ok: true, usuario: u };
}

export function usuarioActual(): Usuario | null {
  const s = leerSesion();
  if (!s) return null;
  const u = obtener('usuarios').find((x) => x.id === s.usuarioId);
  return u && u.activo && u.rol === s.rol ? u : null;
}

export function cerrarSesion() {
  sessionStorage.removeItem(CLAVE);
  localStorage.removeItem(CLAVE);
  sessionStorage.removeItem('ep_hijo');
  location.replace(ruta('/login'));
}

export const inicioDeRol = (rol: Rol) => ruta(`/${rol}/`);

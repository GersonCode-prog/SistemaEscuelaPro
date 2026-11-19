// ============================================================
//  ARRANQUE DE CADA PÁGINA DEL PORTAL
// ============================================================
import type { Estudiante, Rol, Usuario } from './tipos';
import { usuarioActual } from './sesion';
import { porId } from './datos';
import { hijosDe } from './escuela';
import { vacio } from './vistas';

export interface Contexto {
  usuario: Usuario;
  rol: Rol;
  vista: HTMLElement;
  estudiante?: Estudiante;      // estudiante: él mismo · padre: el hijo seleccionado
  refrescar: () => void;
}

export function hijoSeleccionado(u: Usuario): Estudiante | undefined {
  const hijos = hijosDe(u.refId!);
  const guardado = sessionStorage.getItem('ep_hijo');
  return hijos.find((h) => h.id === guardado) ?? hijos[0];
}

export function iniciar(render: (ctx: Contexto) => void) {
  let vista = document.getElementById('vista') as HTMLElement;
  const ejecutar = () => {
    const usuario = usuarioActual();
    if (!usuario) return;
    // Se reemplaza el contenedor para limpiar los eventos anteriores
    const nueva = vista.cloneNode(false) as HTMLElement;
    vista.replaceWith(nueva);
    vista = nueva;
    const estudiante = usuario.rol === 'estudiante' ? porId('estudiantes', usuario.refId) : usuario.rol === 'padre' ? hijoSeleccionado(usuario) : undefined;
    try {
      render({ usuario, rol: usuario.rol, vista, estudiante, refrescar: ejecutar });
    } catch (e) {
      console.error(e);
      vista.innerHTML = vacio('⚠️', 'No se pudo cargar esta sección', 'Intenta recargar la página.');
    }
  };
  ejecutar();
  document.addEventListener('ep:hijo', ejecutar);
}

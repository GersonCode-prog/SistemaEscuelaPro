// ============================================================
//  TEXTOS DE PRESENTACIÓN DE CADA PORTAL (sitio e inicio de sesión)
// ============================================================
import type { Rol } from './tipos';

export const ORDEN_ROLES: Rol[] = ['estudiante', 'maestro', 'padre', 'director', 'admin'];

export const NOMBRE_CORTO: Record<Rol, string> = { estudiante: 'Estudiante', maestro: 'Maestro', padre: 'Padre', director: 'Director', admin: 'Admin' };

// Usuario de demostración de cada portal (contraseña 12345)
export const USUARIO_DEMO: Record<Rol, string> = { estudiante: 'estudiante', maestro: 'maestro', padre: 'padre', director: 'director', admin: 'admin' };

export const PUNTOS_ROL: Record<Rol, string[]> = {
  estudiante: ['Calificaciones por unidad y boleta', 'Entrega de tareas en línea', 'Horario y clase en curso', 'Asistencia y calendario'],
  maestro: ['Ingreso rápido de notas', 'Asistencia en un clic', 'Tareas y revisión de entregas', 'Mensajes con las familias'],
  padre: ['Progreso de cada hijo', 'Alertas de tareas y asistencia', 'Pagos y recibos', 'Comunicación con maestros'],
  director: ['Indicadores en tiempo real', 'Cuadro de honor y alertas', 'Reportes por grado y curso', 'Avisos institucionales'],
  admin: ['Inscripciones y familias', 'Usuarios y accesos', 'Validación de pagos', 'Configuración del colegio'],
};

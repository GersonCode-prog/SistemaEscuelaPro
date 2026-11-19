import type { Rol } from './tipos';

export interface ItemMenu { id: string; texto: string; icono: string; ruta: string; grupo?: string; }

const m = (rol: Rol, id: string, texto: string, icono: string, grupo?: string): ItemMenu =>
  ({ id, texto, icono, ruta: id === 'inicio' ? `/${rol}/` : `/${rol}/${id}`, grupo });

export const MENUS: Record<Rol, ItemMenu[]> = {
  estudiante: [
    m('estudiante', 'inicio', 'Inicio', 'inicio', 'Mi escuela'), m('estudiante', 'calificaciones', 'Calificaciones', 'notas'),
    m('estudiante', 'tareas', 'Tareas', 'tareas'), m('estudiante', 'horario', 'Horario', 'reloj'), m('estudiante', 'asistencia', 'Asistencia', 'asistencia'),
    m('estudiante', 'mensajes', 'Mensajes', 'mensajes', 'Comunicación'), m('estudiante', 'avisos', 'Avisos', 'avisos'), m('estudiante', 'calendario', 'Calendario', 'calendario'),
  ],
  maestro: [
    m('maestro', 'inicio', 'Inicio', 'inicio', 'Docencia'), m('maestro', 'clases', 'Mis clases', 'libro'), m('maestro', 'calificaciones', 'Calificaciones', 'notas'),
    m('maestro', 'asistencia', 'Asistencia', 'asistencia'), m('maestro', 'tareas', 'Tareas', 'tareas'), m('maestro', 'horario', 'Horario', 'reloj'),
    m('maestro', 'mensajes', 'Mensajes', 'mensajes', 'Comunicación'), m('maestro', 'avisos', 'Avisos', 'avisos'), m('maestro', 'calendario', 'Calendario', 'calendario'),
  ],
  padre: [
    m('padre', 'inicio', 'Inicio', 'inicio', 'Mis hijos'), m('padre', 'calificaciones', 'Calificaciones', 'notas'), m('padre', 'tareas', 'Tareas', 'tareas'),
    m('padre', 'asistencia', 'Asistencia', 'asistencia'), m('padre', 'horario', 'Horario', 'reloj'), m('padre', 'pagos', 'Pagos', 'pagos', 'Administración'),
    m('padre', 'mensajes', 'Mensajes', 'mensajes', 'Comunicación'), m('padre', 'avisos', 'Avisos', 'avisos'), m('padre', 'calendario', 'Calendario', 'calendario'),
  ],
  director: [
    m('director', 'inicio', 'Panel general', 'grafica', 'Dirección'), m('director', 'estudiantes', 'Estudiantes', 'birrete'), m('director', 'maestros', 'Maestros', 'pizarra'),
    m('director', 'reportes', 'Reportes', 'notas'), m('director', 'mensajes', 'Mensajes', 'mensajes', 'Comunicación'), m('director', 'avisos', 'Avisos', 'avisos'), m('director', 'calendario', 'Calendario', 'calendario'),
  ],
  admin: [
    m('admin', 'inicio', 'Inicio', 'inicio', 'Gestión'), m('admin', 'estudiantes', 'Estudiantes', 'birrete'), m('admin', 'maestros', 'Maestros', 'pizarra'),
    m('admin', 'familias', 'Familias', 'familia'), m('admin', 'academico', 'Académico', 'capas'), m('admin', 'pagos', 'Pagos', 'pagos', 'Finanzas y accesos'),
    m('admin', 'usuarios', 'Usuarios', 'usuarios'), m('admin', 'avisos', 'Avisos', 'avisos', 'Comunicación'), m('admin', 'calendario', 'Calendario', 'calendario'), m('admin', 'configuracion', 'Configuración', 'ajustes', 'Sistema'),
  ],
};

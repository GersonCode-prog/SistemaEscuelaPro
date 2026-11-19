// ============================================================
//  TIPOS DE DATOS DEL SISTEMA
// ============================================================

export type Rol = 'estudiante' | 'maestro' | 'padre' | 'director' | 'admin';

export interface Config {
  colegio: string;
  lema: string;
  ciclo: number;
  unidadActual: number;
  colegiaturaPrimaria: number;
  colegiaturaBasico: number;
  inscripcion: number;
  direccion: string;
  telefono: string;
  correo: string;
}

export interface Curso { id: string; nombre: string; corto: string; icono: string; color: string; }

export interface Grado {
  id: string;
  nombre: string;        // ej. "1ro Básico"
  seccion: string;       // ej. "A"
  nivel: 'Primaria' | 'Básico';
  orden: number;         // 0..5, se usa para el horario
  guiaId: string;        // maestro guía
  aula: string;
}

export interface Maestro {
  id: string; nombres: string; apellidos: string; genero: 'F' | 'M';
  especialidad: string; correo: string; telefono: string; ingreso: string;
}

export interface Estudiante {
  id: string; carnet: string; nombres: string; apellidos: string; genero: 'F' | 'M';
  nacimiento: string; gradoId: string; padreId: string; estado: 'Activo' | 'Retirado'; inscrito: string;
}

export interface Padre {
  id: string; nombres: string; apellidos: string; parentesco: 'Madre' | 'Padre' | 'Encargado';
  telefono: string; correo: string; direccion: string;
}

export interface Usuario {
  id: string;
  usuario: string;
  clave: string;          // solo demo: en un sistema real se guarda cifrada en el servidor
  rol: Rol;
  refId: string | null;   // estudiante, maestro o padre vinculado
  nombre: string;
  cargo: string;
  activo: boolean;
  color: string;
  ultimoAcceso: string | null;
  vistoAvisos: string | null;
}

// Qué maestro imparte qué curso en qué sección
export interface Asignacion { id: string; gradoId: string; cursoId: string; maestroId: string; }

// Calificaciones: clave "estudianteId|asignacionId|unidad" -> nota (0 a 100)
export type Notas = Record<string, number>;

// Asistencia diaria de una sección (solo se guardan ausencias y tardanzas)
export interface Asistencia {
  id: string; gradoId: string; fecha: string; ausentes: string[]; tardes: string[]; tomadaPor: string;
}

export interface Tarea {
  id: string; asignacionId: string; titulo: string; descripcion: string;
  entrega: string; punteo: number; unidad: number; creada: string;
}

export interface Entrega {
  id: string; tareaId: string; estudianteId: string; fecha: string;
  texto: string; enlace: string; nota: number | null; comentario: string;
}

export type Audiencia = 'todos' | 'estudiantes' | 'padres' | 'familias' | 'maestros';

export interface Anuncio {
  id: string; titulo: string; contenido: string;
  categoria: 'General' | 'Académico' | 'Evento' | 'Urgente';
  audiencia: Audiencia; gradoId: string | null;
  autorId: string; fecha: string; fijado: boolean;
}

export interface Evento {
  id: string; titulo: string; fecha: string;
  tipo: 'Académico' | 'Evento' | 'Reunión' | 'Feriado'; descripcion: string;
}

export interface Pago {
  id: string; estudianteId: string; concepto: string; mes: number; monto: number; vence: string;
  estado: 'Pagado' | 'Pendiente' | 'En revisión';
  fechaPago: string | null; metodo: string; referencia: string; recibo: string; observacion: string;
}

export interface Mensaje { de: string; texto: string; fecha: string; }

export interface Conversacion {
  id: string; a: string; b: string; asunto: string;
  mensajes: Mensaje[];
  leido: Record<string, string>;  // usuarioId -> fecha de última lectura
}

export interface Colecciones {
  cursos: Curso; grados: Grado; maestros: Maestro; estudiantes: Estudiante; padres: Padre;
  usuarios: Usuario; asignaciones: Asignacion; asistencia: Asistencia; tareas: Tarea; entregas: Entrega;
  anuncios: Anuncio; eventos: Evento; pagos: Pago; conversaciones: Conversacion;
}

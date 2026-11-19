// ============================================================
//  LÓGICA DE LA ESCUELA: promedios, horario, asistencia, etc.
// ============================================================
import type { Anuncio, Asignacion, Curso, Estudiante, Grado, Maestro, Pago, Rol, Tarea, Entrega, Usuario } from './tipos';
import { obtener, obtenerNotas, porId, config } from './datos';
import { hoy, diasEntre } from './formato';

export const ROLES: Record<Rol, { nombre: string; portal: string; emoji: string; color: string; descripcion: string }> = {
  estudiante: { nombre: 'Estudiante', portal: 'Portal del Estudiante', emoji: '🎓', color: '#4f46e5', descripcion: 'Consulta tus notas, entrega tareas y revisa tu horario.' },
  maestro: { nombre: 'Maestro', portal: 'Portal Docente', emoji: '👩‍🏫', color: '#059669', descripcion: 'Ingresa notas, toma asistencia y gestiona tus tareas.' },
  padre: { nombre: 'Padre de familia', portal: 'Portal de Padres', emoji: '👨‍👩‍👧', color: '#ea580c', descripcion: 'Sigue el progreso de tus hijos, sus pagos y avisos.' },
  director: { nombre: 'Director', portal: 'Portal de Dirección', emoji: '🏫', color: '#7c3aed', descripcion: 'Indicadores, reportes y comunicación institucional.' },
  admin: { nombre: 'Administrador', portal: 'Portal Administrativo', emoji: '⚙️', color: '#0284c7', descripcion: 'Inscripciones, usuarios, pagos y configuración.' },
};

// ---------- Personas ----------
export const nombreCompleto = (p?: { nombres: string; apellidos: string }) => (p ? `${p.nombres} ${p.apellidos}` : '—');
export const nombreCorto = (p?: { nombres: string; apellidos: string }) => (p ? `${p.nombres.split(' ')[0]} ${p.apellidos.split(' ')[0]}` : '—');
export const tituloMaestro = (m?: Maestro) => (m ? `${m.genero === 'F' ? 'Profa.' : 'Prof.'} ${nombreCorto(m)}` : '—');
export const edad = (nacimiento: string) => {
  const n = new Date(nacimiento + 'T12:00:00'); const h = new Date();
  return h.getFullYear() - n.getFullYear() - (h < new Date(h.getFullYear(), n.getMonth(), n.getDate()) ? 1 : 0);
};

export const grado = (id?: string | null) => porId('grados', id);
export const curso = (id?: string | null) => porId('cursos', id);
export const nombreGrado = (g?: Grado) => (g ? `${g.nombre} ${g.seccion}` : '—');
export const gradosOrdenados = () => [...obtener('grados')].sort((a, b) => a.orden - b.orden);

export const estudiantesDeGrado = (gradoId: string) =>
  obtener('estudiantes').filter((e) => e.gradoId === gradoId && e.estado === 'Activo')
    .sort((a, b) => a.apellidos.localeCompare(b.apellidos) || a.nombres.localeCompare(b.nombres));
export const estudiantesActivos = () => obtener('estudiantes').filter((e) => e.estado === 'Activo');
export const hijosDe = (padreId: string) => obtener('estudiantes').filter((e) => e.padreId === padreId && e.estado === 'Activo');

export const asignacionesDeGrado = (gradoId: string) => {
  const orden = obtener('cursos').map((c) => c.id);
  return obtener('asignaciones').filter((a) => a.gradoId === gradoId).sort((a, b) => orden.indexOf(a.cursoId) - orden.indexOf(b.cursoId));
};
export const asignacionesDeMaestro = (maestroId: string) => {
  const g = gradosOrdenados().map((x) => x.id);
  return obtener('asignaciones').filter((a) => a.maestroId === maestroId).sort((a, b) => g.indexOf(a.gradoId) - g.indexOf(b.gradoId));
};
export const gradosDeMaestro = (maestroId: string) =>
  gradosOrdenados().filter((g) => asignacionesDeMaestro(maestroId).some((a) => a.gradoId === g.id));
export const nombreAsignacion = (a?: Asignacion) => (a ? `${curso(a.cursoId)?.nombre} · ${nombreGrado(grado(a.gradoId))}` : '—');

export const usuarioDe = (rol: Rol, refId: string) => obtener('usuarios').find((u) => u.rol === rol && u.refId === refId);

// ---------- Notas ----------
export const UNIDADES = [1, 2, 3, 4];

export function promedio(valores: (number | null | undefined)[]) {
  const v = valores.filter((x): x is number => typeof x === 'number');
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null;
}

export const notaDe = (estId: string, asigId: string, unidad: number) => {
  const n = obtenerNotas()[`${estId}|${asigId}|${unidad}`];
  return typeof n === 'number' ? n : null;
};
export const notasCurso = (estId: string, asigId: string) => UNIDADES.map((u) => notaDe(estId, asigId, u));
export const promedioCurso = (estId: string, asigId: string) => promedio(notasCurso(estId, asigId));

export interface FilaBoleta { asig: Asignacion; curso: Curso; maestro?: Maestro; unidades: (number | null)[]; promedio: number | null; }

export function boleta(est: Estudiante): FilaBoleta[] {
  return asignacionesDeGrado(est.gradoId).map((a) => {
    const unidades = notasCurso(est.id, a.id);
    return { asig: a, curso: curso(a.cursoId)!, maestro: porId('maestros', a.maestroId), unidades, promedio: promedio(unidades) };
  });
}

export const promedioGeneral = (est: Estudiante) => promedio(boleta(est).map((f) => f.promedio));
export const promedioUnidad = (est: Estudiante, unidad: number) => promedio(boleta(est).map((f) => f.unidades[unidad - 1]));
export const cursosEnRiesgo = (est: Estudiante) => boleta(est).filter((f) => f.promedio !== null && f.promedio < 60);

export function promedioAsignacion(asigId: string, unidad?: number) {
  const a = porId('asignaciones', asigId);
  if (!a) return null;
  return promedio(estudiantesDeGrado(a.gradoId).map((e) => (unidad ? notaDe(e.id, a.id, unidad) : promedioCurso(e.id, a.id))));
}
export const promedioGrado = (gradoId: string) => promedio(estudiantesDeGrado(gradoId).map((e) => promedioGeneral(e)));

export function nivelNota(n: number | null) {
  if (n === null) return { texto: 'Sin nota', clase: 'neutral', color: '#94a3b8' };
  if (n >= 85) return { texto: 'Excelente', clase: 'ok', color: '#16a34a' };
  if (n >= 70) return { texto: 'Bueno', clase: 'info', color: '#2563eb' };
  if (n >= 60) return { texto: 'Regular', clase: 'warn', color: '#d97706' };
  return { texto: 'En riesgo', clase: 'bad', color: '#dc2626' };
}
export const fmtNota = (n: number | null, decimales = 0) => (n === null ? '—' : n.toFixed(decimales));

// ---------- Asistencia ----------
export const registrosDeGrado = (gradoId: string) =>
  obtener('asistencia').filter((r) => r.gradoId === gradoId).sort((a, b) => a.fecha.localeCompare(b.fecha));

export type EstadoAsistencia = 'P' | 'A' | 'T';
export function asistenciaDe(est: Estudiante) {
  const dias = registrosDeGrado(est.gradoId).filter((r) => r.fecha >= est.inscrito).map((r) => ({
    fecha: r.fecha,
    estado: (r.ausentes.includes(est.id) ? 'A' : r.tardes.includes(est.id) ? 'T' : 'P') as EstadoAsistencia,
  }));
  const ausencias = dias.filter((d) => d.estado === 'A').length;
  const tardanzas = dias.filter((d) => d.estado === 'T').length;
  return { dias, total: dias.length, ausencias, tardanzas, presentes: dias.length - ausencias, porcentaje: dias.length ? ((dias.length - ausencias) / dias.length) * 100 : 100 };
}
export function asistenciaDeGrado(gradoId: string) {
  const regs = registrosDeGrado(gradoId);
  const n = estudiantesDeGrado(gradoId).length || 1;
  const aus = regs.reduce((s, r) => s + r.ausentes.length, 0);
  return { porcentaje: regs.length ? 100 - (aus / (regs.length * n)) * 100 : 100, ausencias: aus, tardanzas: regs.reduce((s, r) => s + r.tardes.length, 0), dias: regs.length };
}

// ---------- Horario (5 días x 6 periodos, sin choques entre secciones) ----------
export const PERIODOS = [
  { inicio: '07:30', fin: '08:15' }, { inicio: '08:15', fin: '09:00' }, { inicio: '09:00', fin: '09:45' },
  { inicio: '10:15', fin: '11:00' }, { inicio: '11:00', fin: '11:45' }, { inicio: '11:45', fin: '12:30' },
];
export const RECESO = { inicio: '09:45', fin: '10:15', despuesDe: 2 };
const PATRON = ['mat', 'com', 'cn', 'cs', 'ing', 'tac', 'mat', 'com', 'cn', 'cs', 'ing', 'ef', 'mat', 'com', 'cn', 'cs', 'ing', 'tac', 'mat', 'com', 'ef', 'art', 'cs', 'ing', 'mat', 'com', 'cn', 'ef', 'tac', 'art'];

export function horarioDeGrado(gradoId: string): (Asignacion | null)[][] {
  const g = grado(gradoId);
  const asigs = asignacionesDeGrado(gradoId);
  return [0, 1, 2, 3, 4].map((d) => PERIODOS.map((_, p) => {
    if (!g) return null;
    const cursoId = PATRON[(d * 6 + p + 5 * g.orden) % 30];
    return asigs.find((a) => a.cursoId === cursoId) ?? null;
  }));
}

export function horarioDeMaestro(maestroId: string): (Asignacion | null)[][] {
  const mias = asignacionesDeMaestro(maestroId);
  const vacio: (Asignacion | null)[][] = [0, 1, 2, 3, 4].map(() => PERIODOS.map(() => null));
  new Set(mias.map((a) => a.gradoId)).forEach((gid) => {
    horarioDeGrado(gid).forEach((fila, d) => fila.forEach((a, p) => { if (a && a.maestroId === maestroId) vacio[d][p] = a; }));
  });
  return vacio;
}

export const periodosPorSemana = (matriz: (Asignacion | null)[][]) => matriz.flat().filter(Boolean).length;

const aMin = (h: string) => { const [a, b] = h.split(':').map(Number); return a * 60 + b; };

// Clase actual y siguiente según la hora del dispositivo
export function momentoDeClase(matriz: (Asignacion | null)[][]) {
  const ahora = new Date();
  const d = ahora.getDay() - 1;
  const min = ahora.getHours() * 60 + ahora.getMinutes();
  const enSemana = d >= 0 && d <= 4;
  let actual: { d: number; p: number } | null = null;
  let siguiente: { d: number; p: number } | null = null;
  if (enSemana) {
    PERIODOS.forEach((per, p) => {
      if (min >= aMin(per.inicio) && min < aMin(per.fin) && matriz[d][p]) actual = { d, p };
      if (!siguiente && aMin(per.inicio) > min && matriz[d][p]) siguiente = { d, p };
    });
  }
  if (!siguiente) {
    for (let k = 1; k <= 7 && !siguiente; k++) {
      const dd = (ahora.getDay() - 1 + k + 7) % 7;
      if (dd > 4) continue;
      const p = matriz[dd].findIndex(Boolean);
      if (p >= 0) siguiente = { d: dd, p };
    }
  }
  return { actual, siguiente, hoy: enSemana ? d : -1, enReceso: enSemana && min >= aMin(RECESO.inicio) && min < aMin(RECESO.fin) };
}

// ---------- Tareas ----------
export type EstadoTarea = 'Pendiente' | 'Atrasada' | 'Entregada' | 'Calificada';
export interface TareaEstudiante { tarea: Tarea; asig: Asignacion; curso: Curso; entrega?: Entrega; estado: EstadoTarea; }

export function tareasDeEstudiante(est: Estudiante): TareaEstudiante[] {
  const asigs = asignacionesDeGrado(est.gradoId);
  const entregas = obtener('entregas').filter((x) => x.estudianteId === est.id);
  const h = hoy();
  return obtener('tareas').filter((t) => asigs.some((a) => a.id === t.asignacionId)).map((t) => {
    const asig = asigs.find((a) => a.id === t.asignacionId)!;
    const entrega = entregas.find((x) => x.tareaId === t.id);
    const estado: EstadoTarea = entrega ? (entrega.nota === null ? 'Entregada' : 'Calificada') : t.entrega < h ? 'Atrasada' : 'Pendiente';
    return { tarea: t, asig, curso: curso(asig.cursoId)!, entrega, estado };
  }).sort((a, b) => a.tarea.entrega.localeCompare(b.tarea.entrega));
}

export const tareasPorHacer = (est: Estudiante) => tareasDeEstudiante(est).filter((t) => t.estado === 'Pendiente' || t.estado === 'Atrasada');
export const entregasPorCalificar = (maestroId: string) => {
  const asigs = asignacionesDeMaestro(maestroId).map((a) => a.id);
  const tareas = obtener('tareas').filter((t) => asigs.includes(t.asignacionId)).map((t) => t.id);
  return obtener('entregas').filter((e) => tareas.includes(e.tareaId) && e.nota === null);
};

// ---------- Pagos ----------
export type EstadoPago = 'Pagado' | 'Pendiente' | 'Vencido' | 'En revisión';
export const estadoPago = (p: Pago): EstadoPago => (p.estado === 'Pendiente' && p.vence < hoy() ? 'Vencido' : p.estado);
export const pagosDe = (estId: string) => obtener('pagos').filter((p) => p.estudianteId === estId).sort((a, b) => a.mes - b.mes);
export const claseEstadoPago: Record<EstadoPago, string> = { Pagado: 'ok', Pendiente: 'neutral', Vencido: 'bad', 'En revisión': 'warn' };

export function resumenPagos(pagos: Pago[]) {
  const suma = (estado: EstadoPago) => pagos.filter((p) => estadoPago(p) === estado).reduce((s, p) => s + p.monto, 0);
  return { pagado: suma('Pagado'), pendiente: suma('Pendiente'), vencido: suma('Vencido'), revision: suma('En revisión') };
}

// ---------- Avisos según quién los ve ----------
export function anunciosPara(u: Usuario): Anuncio[] {
  const todos = obtener('anuncios');
  let visibles = todos;
  if (u.rol === 'estudiante') {
    const g = porId('estudiantes', u.refId)?.gradoId;
    visibles = todos.filter((a) => ['todos', 'estudiantes', 'familias'].includes(a.audiencia) && (!a.gradoId || a.gradoId === g));
  } else if (u.rol === 'padre') {
    const gs = hijosDe(u.refId!).map((h) => h.gradoId);
    visibles = todos.filter((a) => ['todos', 'padres', 'familias'].includes(a.audiencia) && (!a.gradoId || gs.includes(a.gradoId)));
  } else if (u.rol === 'maestro') {
    const gs = gradosDeMaestro(u.refId!).map((g) => g.id);
    visibles = todos.filter((a) => a.autorId === u.id || a.audiencia === 'todos' || a.audiencia === 'maestros' || (a.gradoId && gs.includes(a.gradoId)));
  }
  return [...visibles].sort((a, b) => Number(b.fijado) - Number(a.fijado) || b.fecha.localeCompare(a.fecha));
}

export const textoAudiencia = (a: Anuncio) => {
  const base = { todos: 'Toda la comunidad', estudiantes: 'Estudiantes', padres: 'Padres de familia', familias: 'Estudiantes y padres', maestros: 'Docentes' }[a.audiencia];
  return a.gradoId ? `${base} · ${nombreGrado(grado(a.gradoId))}` : base;
};

// ---------- Mensajes ----------
export function contactosPara(u: Usuario): { usuario: Usuario; detalle: string }[] {
  const usuarios = obtener('usuarios').filter((x) => x.activo && x.id !== u.id);
  const porRef = (rol: Rol, ref: string) => usuarios.find((x) => x.rol === rol && x.refId === ref);
  const lista: { usuario: Usuario; detalle: string }[] = [];
  const agregar = (x: Usuario | undefined, detalle: string) => { if (x && !lista.some((l) => l.usuario.id === x.id)) lista.push({ usuario: x, detalle }); };
  const director = usuarios.find((x) => x.rol === 'director');

  if (u.rol === 'estudiante' || u.rol === 'padre') {
    const hijos = u.rol === 'estudiante' ? [porId('estudiantes', u.refId)!].filter(Boolean) : hijosDe(u.refId!);
    hijos.forEach((h) => asignacionesDeGrado(h.gradoId).forEach((a) => {
      agregar(porRef('maestro', a.maestroId), `${curso(a.cursoId)?.nombre}${u.rol === 'padre' ? ` · ${h.nombres.split(' ')[0]}` : ''}`);
    }));
    if (u.rol === 'padre') agregar(director, 'Dirección');
  } else if (u.rol === 'maestro') {
    gradosDeMaestro(u.refId!).forEach((g) => estudiantesDeGrado(g.id).forEach((e) => {
      const p = porId('padres', e.padreId);
      agregar(porRef('padre', e.padreId), `${p?.parentesco ?? 'Encargado'} de ${e.nombres.split(' ')[0]} · ${nombreGrado(g)}`);
    }));
    agregar(director, 'Dirección');
  } else if (u.rol === 'director') {
    usuarios.filter((x) => x.rol === 'maestro').forEach((x) => agregar(x, x.cargo || 'Docente'));
    usuarios.filter((x) => x.rol === 'padre').forEach((x) => {
      const hijos = hijosDe(x.refId!).map((h) => h.nombres.split(' ')[0]).join(', ');
      agregar(x, `Familia de ${hijos || '—'}`);
    });
  }
  return lista;
}

export const noLeidos = (u: Usuario) => obtener('conversaciones')
  .filter((c) => c.a === u.id || c.b === u.id)
  .reduce((s, c) => s + c.mensajes.filter((m) => m.de !== u.id && m.fecha > (c.leido[u.id] ?? '')).length, 0);

// ---------- Indicadores generales ----------
export function unidadActual() { return config().unidadActual || 4; }
export const diasParaEntrega = (t: Tarea) => diasEntre(hoy(), t.entrega);

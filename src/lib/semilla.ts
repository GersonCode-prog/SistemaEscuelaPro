// ============================================================
//  DATOS FICTICIOS DE DEMOSTRACIÓN
//  Todos los nombres, teléfonos y correos son inventados.
// ============================================================
import type {
  Anuncio, Asignacion, Asistencia, Config, Conversacion, Curso, Entrega, Estudiante, Evento,
  Grado, Maestro, Notas, Padre, Pago, Rol, Tarea, Usuario,
} from './tipos';
import { fechaISO, MESES, sinAcentos, sumarDias, diasEntre } from './formato';

export const VERSION = 1;

// Generador de números aleatorios con semilla: los datos salen siempre iguales
function crearAzar(semilla: number) {
  return () => {
    semilla |= 0; semilla = (semilla + 0x6d2b79f5) | 0;
    let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PALETA = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];

const NOMBRES_F = ['Valentina', 'Camila', 'Isabella', 'Mariana', 'Gabriela', 'Daniela', 'Andrea', 'Fernanda', 'Lucía', 'Ximena', 'Paola', 'Alejandra', 'Natalia', 'María José', 'Jimena', 'Renata', 'Abigail', 'Valeria', 'Emily', 'Ana Sofía'];
const NOMBRES_M = ['Santiago', 'Mateo', 'Sebastián', 'José', 'Luis', 'Andrés', 'Javier', 'Emilio', 'Daniel', 'Pablo', 'Fernando', 'Rodrigo', 'Esteban', 'Gabriel', 'Samuel', 'Ángel', 'Josué', 'Adrián', 'Diego Alejandro', 'Joaquín'];
const MADRES = ['María', 'Claudia', 'Karla', 'Silvia', 'Gloria', 'Patricia', 'Rosa', 'Lorena', 'Mónica', 'Elena', 'Carmen', 'Verónica', 'Sandra', 'Beatriz', 'Julia'];
const PADRES = ['José', 'Luis', 'Mario', 'Juan', 'Edgar', 'Hugo', 'Marco', 'Óscar', 'Raúl', 'Byron', 'Erick', 'Julio', 'César', 'Alfredo', 'Rolando'];
const APELLIDOS = ['López', 'Hernández', 'Pérez', 'Morales', 'Castillo', 'Rodríguez', 'González', 'Martínez', 'Flores', 'Chávez', 'Ortiz', 'Barrios', 'Orellana', 'Recinos', 'Alvarado', 'Cabrera', 'Velásquez', 'Sandoval', 'Batres', 'Paiz', 'Aguilar', 'Mejía', 'Solórzano', 'Quiñónez', 'Lemus', 'Arriaza', 'Toledo', 'Girón', 'Reyes', 'Coronado'];

const TAREAS: Record<string, [string, string][]> = {
  mat: [['Hoja de trabajo: ecuaciones', 'Resuelve los 10 ejercicios de la hoja y muestra el procedimiento completo de cada uno.'], ['Problemas de aplicación', 'Plantea y resuelve 5 problemas de la vida diaria usando lo visto en clase.'], ['Proyecto: estadística del aula', 'Recolecta datos de tus compañeros, elabora una tabla de frecuencias y una gráfica de barras.']],
  com: [['Análisis de un cuento corto', 'Lee el cuento asignado e identifica personajes, ambiente, conflicto y desenlace.'], ['Ortografía: uso de la tilde', 'Completa la guía de ejercicios sobre palabras agudas, graves y esdrújulas.'], ['Ensayo: mi lugar favorito', 'Escribe un ensayo de una página con introducción, desarrollo y conclusión.']],
  cn: [['Laboratorio: la célula', 'Dibuja y rotula las partes de la célula animal y vegetal que observaste en el laboratorio.'], ['Ecosistemas de Guatemala', 'Investiga dos ecosistemas del país y describe su flora y su fauna.'], ['Maqueta del sistema solar', 'Elabora una maqueta con materiales reciclados y prepara una exposición de 3 minutos.']],
  cs: [['Línea de tiempo: Independencia', 'Elabora una línea de tiempo con los hechos principales de 1821.'], ['Mapa de los departamentos', 'Ubica y colorea los 22 departamentos de Guatemala con sus cabeceras.'], ['Exposición: culturas de Guatemala', 'Prepara una exposición sobre los pueblos maya, garífuna, xinca y ladino.']],
  ing: [['Vocabulary quiz: daily routines', 'Study the vocabulary list and complete the practice exercises.'], ['Short essay: my family', 'Write a 120-word paragraph describing your family members.'], ['Reading comprehension', 'Read the story and answer the ten comprehension questions.']],
  tac: [['Presentación: internet seguro', 'Crea una presentación de 8 diapositivas sobre el uso responsable de internet.'], ['Hoja de cálculo: presupuesto', 'Elabora un presupuesto familiar mensual usando fórmulas de suma y promedio.'], ['Mecanografía: práctica 5', 'Completa la práctica de mecanografía y anota tus palabras por minuto.']],
  ef: [['Registro de actividad física', 'Anota durante una semana tus minutos diarios de actividad física.'], ['Reglas del baloncesto', 'Resume las reglas básicas del baloncesto con ilustraciones.'], ['Rutina de calentamiento', 'Diseña una rutina de calentamiento de 10 minutos y explica cada ejercicio.']],
  art: [['Dibujo en perspectiva', 'Dibuja tu calle usando perspectiva con un punto de fuga.'], ['Collage con material reciclado', 'Elabora un collage con el tema "mi comunidad" usando materiales reciclados.'], ['Apreciación musical: la marimba', 'Escucha una pieza de marimba guatemalteca y escribe lo que te transmite.']],
};

const RESPUESTAS = ['Aquí está mi trabajo, profe.', 'Adjunto la tarea resuelta.', 'Entregué también la hoja impresa en clase.', 'Listo, quedo atento a sus comentarios.', 'Hice el trabajo con mi grupo.'];

export function generarDatos() {
  const azar = crearAzar(20261118);
  const entre = (a: number, b: number) => a + azar() * (b - a);
  const entero = (a: number, b: number) => Math.floor(entre(a, b + 1));
  const elegir = <T,>(lista: T[]) => lista[Math.floor(azar() * lista.length)];
  const sucede = (p: number) => azar() < p;
  const normal = () => { let s = 0; for (let i = 0; i < 6; i++) s += azar(); return (s - 3) * 1.414; };
  const limitar = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

  const ahora = new Date();
  const ciclo = ahora.getFullYear();
  const HOY = fechaISO(ahora);
  const dia = (desplazamiento: number) => { const d = new Date(); d.setDate(d.getDate() + desplazamiento); return fechaISO(d); };
  const momento = (dias: number, h: number, m: number) => { const d = new Date(); d.setDate(d.getDate() - dias); d.setHours(h, m, 0, 0); return d.toISOString(); };
  const horasAtras = (h: number) => new Date(Date.now() - h * 3600000).toISOString();
  const slug = (t: string) => sinAcentos(t.split(' ')[0].toLowerCase());

  // ---------- Configuración ----------
  const config: Config = {
    colegio: 'Colegio Valle Esmeralda', lema: 'Aprender, crecer y servir', ciclo, unidadActual: 4,
    colegiaturaPrimaria: 450, colegiaturaBasico: 550, inscripcion: 300,
    direccion: 'Ciudad de Guatemala', telefono: '2200-1234', correo: 'contacto@valleesmeralda.demo',
  };

  // ---------- Cursos ----------
  const cursos: Curso[] = [
    { id: 'mat', nombre: 'Matemáticas', corto: 'Matemáticas', icono: '➗', color: '#4f46e5' },
    { id: 'com', nombre: 'Comunicación y Lenguaje', corto: 'Comunicación', icono: '📖', color: '#e11d48' },
    { id: 'cn', nombre: 'Ciencias Naturales', corto: 'C. Naturales', icono: '🔬', color: '#059669' },
    { id: 'cs', nombre: 'Ciencias Sociales', corto: 'C. Sociales', icono: '🌎', color: '#d97706' },
    { id: 'ing', nombre: 'Inglés', corto: 'Inglés', icono: '🔤', color: '#0284c7' },
    { id: 'tac', nombre: 'Tecnología (TAC)', corto: 'Tecnología', icono: '💻', color: '#7c3aed' },
    { id: 'ef', nombre: 'Educación Física', corto: 'Ed. Física', icono: '⚽', color: '#0d9488' },
    { id: 'art', nombre: 'Expresión Artística', corto: 'Artes', icono: '🎨', color: '#db2777' },
  ];

  // ---------- Maestros ----------
  const datosMaestros: [string, string, string, 'F' | 'M', string][] = [
    ['m1', 'Carlos', 'Ramírez Ortiz', 'M', 'Matemáticas · Básico'],
    ['m2', 'Lucía', 'Herrera Paz', 'F', 'Matemáticas · Primaria'],
    ['m3', 'Marta', 'Gómez Juárez', 'F', 'Comunicación y Lenguaje · Básico'],
    ['m4', 'Jorge', 'Castillo Rivas', 'M', 'Comunicación y Lenguaje · Primaria'],
    ['m5', 'Ana Lucía', 'Pérez Monroy', 'F', 'Ciencias Naturales'],
    ['m6', 'Roberto', 'Morales Lima', 'M', 'Ciencias Sociales'],
    ['m7', 'Daniela', 'Cifuentes Vega', 'F', 'Inglés'],
    ['m8', 'Kevin', 'Ajú Tzoc', 'M', 'Tecnología (TAC)'],
    ['m9', 'Pedro', 'Xicará Chen', 'M', 'Educación Física'],
    ['m10', 'Valeria', 'Monzón Ríos', 'F', 'Expresión Artística'],
  ];
  const maestros: Maestro[] = datosMaestros.map(([id, nombres, apellidos, genero, especialidad]) => ({
    id, nombres, apellidos, genero, especialidad,
    correo: `${slug(nombres)}.${slug(apellidos)}@valleesmeralda.demo`,
    telefono: `${entero(3, 5)}${entero(100, 999)}-${entero(1000, 9999)}`,
    ingreso: `${ciclo - entero(1, 12)}-01-${String(entero(5, 20)).padStart(2, '0')}`,
  }));

  // ---------- Grados y secciones ----------
  const grados: Grado[] = [
    { id: '4p', nombre: '4to Primaria', seccion: 'A', nivel: 'Primaria', orden: 0, guiaId: 'm2', aula: 'Aula 4' },
    { id: '5p', nombre: '5to Primaria', seccion: 'A', nivel: 'Primaria', orden: 1, guiaId: 'm4', aula: 'Aula 5' },
    { id: '6p', nombre: '6to Primaria', seccion: 'A', nivel: 'Primaria', orden: 2, guiaId: 'm5', aula: 'Aula 6' },
    { id: '1b', nombre: '1ro Básico', seccion: 'A', nivel: 'Básico', orden: 3, guiaId: 'm1', aula: 'Aula 7' },
    { id: '2b', nombre: '2do Básico', seccion: 'A', nivel: 'Básico', orden: 4, guiaId: 'm3', aula: 'Aula 8' },
    { id: '3b', nombre: '3ro Básico', seccion: 'A', nivel: 'Básico', orden: 5, guiaId: 'm6', aula: 'Aula 9' },
  ];
  const edades: Record<string, number> = { '4p': 10, '5p': 11, '6p': 12, '1b': 13, '2b': 14, '3b': 15 };

  // ---------- Asignaciones (curso + sección + maestro) ----------
  const maestroPorCurso: Record<string, string> = { cn: 'm5', cs: 'm6', ing: 'm7', tac: 'm8', ef: 'm9', art: 'm10' };
  const asignaciones: Asignacion[] = [];
  grados.forEach((g) => cursos.forEach((c) => {
    const basico = g.nivel === 'Básico';
    const maestroId = c.id === 'mat' ? (basico ? 'm1' : 'm2') : c.id === 'com' ? (basico ? 'm3' : 'm4') : maestroPorCurso[c.id];
    asignaciones.push({ id: `${g.id}-${c.id}`, gradoId: g.id, cursoId: c.id, maestroId });
  }));

  // ---------- Familias y estudiantes ----------
  const padres: Padre[] = [];
  const estudiantes: Estudiante[] = [];
  const habilidad = new Map<string, number>();     // nivel académico de cada estudiante
  const ajusteCurso = new Map<string, number>();   // fortalezas y debilidades por curso
  const familiaMorosa = new Set<string>();
  const nombresUsados = new Set<string>();

  function crearPadre(ap1: string, ap2: string, fijo?: Partial<Padre>): Padre {
    const t = azar();
    let p: Padre;
    if (t < 0.62) p = { id: '', nombres: elegir(MADRES), apellidos: `${ap2} de ${ap1}`, parentesco: 'Madre', telefono: '', correo: '', direccion: '' };
    else if (t < 0.92) p = { id: '', nombres: elegir(PADRES), apellidos: `${ap1} ${elegir(APELLIDOS)}`, parentesco: 'Padre', telefono: '', correo: '', direccion: '' };
    else p = { id: '', nombres: elegir(MADRES), apellidos: `${elegir(APELLIDOS)} ${ap1}`, parentesco: 'Encargado', telefono: '', correo: '', direccion: '' };
    Object.assign(p, fijo);
    p.id = `p${padres.length + 1}`;
    p.telefono = p.telefono || `${entero(3, 5)}${entero(100, 999)}-${entero(1000, 9999)}`;
    p.correo = p.correo || `${slug(p.nombres)}.${slug(ap1)}${entero(1, 99)}@correo.demo`;
    p.direccion = p.direccion || `Zona ${entero(1, 18)}, Ciudad de Guatemala`;
    padres.push(p);
    if (sucede(0.15)) familiaMorosa.add(p.id);
    return p;
  }

  function crearEstudiante(gradoId: string, nombres: string, ap1: string, ap2: string, genero: 'F' | 'M', padreId: string, base?: number) {
    const id = `e${estudiantes.length + 1}`;
    const edad = edades[gradoId];
    estudiantes.push({
      id, carnet: '', nombres, apellidos: `${ap1} ${ap2}`, genero,
      nacimiento: `${ciclo - edad}-${String(entero(1, 12)).padStart(2, '0')}-${String(entero(1, 28)).padStart(2, '0')}`,
      gradoId, padreId, estado: 'Activo', inscrito: `${ciclo}-01-${String(entero(5, 15)).padStart(2, '0')}`,
    });
    nombresUsados.add(`${nombres} ${ap1}`);
    habilidad.set(id, base ?? (sucede(0.12) ? entre(51, 60) : limitar(80 + normal() * 8, 60, 97)));
    return id;
  }

  function nombreNuevo(genero: 'F' | 'M', ap1: string) {
    let n = elegir(genero === 'F' ? NOMBRES_F : NOMBRES_M);
    while (nombresUsados.has(`${n} ${ap1}`)) n = elegir(genero === 'F' ? NOMBRES_F : NOMBRES_M);
    return n;
  }

  // Familia de demostración: Ana (madre) con Sofía y Diego
  const ana = crearPadre('Méndez', 'García', { nombres: 'Ana', apellidos: 'García de Méndez', parentesco: 'Madre', telefono: '5512-3456', correo: 'ana.mendez@correo.demo', direccion: 'Zona 11, Ciudad de Guatemala' });
  familiaMorosa.delete(ana.id);
  const sofia = crearEstudiante('1b', 'Sofía', 'Méndez', 'García', 'F', ana.id, 88);
  const diego = crearEstudiante('5p', 'Diego', 'Méndez', 'García', 'M', ana.id, 68);
  ajusteCurso.set(`${sofia}|mat`, -13);
  ajusteCurso.set(`${diego}|mat`, -14);

  // Otras dos familias con hermanos
  [['4p', '2b'], ['6p', '3b']].forEach(([g1, g2]) => {
    const ap1 = elegir(APELLIDOS); let ap2 = elegir(APELLIDOS); while (ap2 === ap1) ap2 = elegir(APELLIDOS);
    const p = crearPadre(ap1, ap2);
    [g1, g2].forEach((g) => { const gen = sucede(0.5) ? 'F' : 'M'; crearEstudiante(g, nombreNuevo(gen, ap1), ap1, ap2, gen, p.id); });
  });

  // Completar 8 estudiantes por sección
  grados.forEach((g) => {
    while (estudiantes.filter((e) => e.gradoId === g.id).length < 8) {
      const ap1 = elegir(APELLIDOS); let ap2 = elegir(APELLIDOS); while (ap2 === ap1) ap2 = elegir(APELLIDOS);
      const gen = sucede(0.5) ? 'F' : 'M';
      const p = crearPadre(ap1, ap2);
      crearEstudiante(g.id, nombreNuevo(gen, ap1), ap1, ap2, gen, p.id);
    }
  });
  [...estudiantes].sort((a, b) => grados.findIndex((g) => g.id === a.gradoId) - grados.findIndex((g) => g.id === b.gradoId) || a.apellidos.localeCompare(b.apellidos))
    .forEach((e, i) => { e.carnet = `${ciclo}-${String(i + 1).padStart(4, '0')}`; });

  // ---------- Usuarios (todos con contraseña 12345) ----------
  const usuarios: Usuario[] = [];
  const nombresDeUsuario = new Set<string>();
  function crearUsuario(id: string, usuario: string, rol: Rol, refId: string | null, nombre: string, cargo = '') {
    let u = usuario; let n = 2;
    while (nombresDeUsuario.has(u)) u = `${usuario}${n++}`;
    nombresDeUsuario.add(u);
    usuarios.push({
      id, usuario: u, clave: '12345', rol, refId, nombre, cargo, activo: true, color: elegir(PALETA),
      ultimoAcceso: sucede(0.6) ? horasAtras(entero(2, 170)) : null, vistoAvisos: horasAtras(60),
    });
  }
  crearUsuario('u-director', 'director', 'director', null, 'Fernando Estrada', 'Director general');
  crearUsuario('u-admin', 'admin', 'admin', null, 'Patricia Solís', 'Administración y secretaría');
  maestros.forEach((m) => crearUsuario(`u-${m.id}`, m.id === 'm1' ? 'maestro' : `${slug(m.nombres)}.${slug(m.apellidos)}`, 'maestro', m.id, `${m.nombres} ${m.apellidos}`, m.especialidad));
  padres.forEach((p) => crearUsuario(`u-${p.id}`, p.id === ana.id ? 'padre' : `${slug(p.nombres)}.${slug(p.apellidos.replace('de ', ''))}`, 'padre', p.id, `${p.nombres} ${p.apellidos}`, p.parentesco));
  estudiantes.forEach((e) => crearUsuario(`u-${e.id}`, e.id === sofia ? 'estudiante' : `${slug(e.nombres)}.${slug(e.apellidos)}`, 'estudiante', e.id, `${e.nombres} ${e.apellidos}`));
  const uDe = (refId: string) => `u-${refId}`;

  // ---------- Calificaciones (unidades 1 a 4) ----------
  const dificultad: Record<string, number> = { mat: -4, com: 0, cn: -1, cs: 1, ing: 0, tac: 4, ef: 7, art: 6 };
  const notas: Notas = {};
  estudiantes.forEach((e) => {
    const base = habilidad.get(e.id)!;
    const tendencia = entre(-1.5, 2.5);
    asignaciones.filter((a) => a.gradoId === e.gradoId).forEach((a) => {
      const ajuste = ajusteCurso.get(`${e.id}|${a.cursoId}`) ?? normal() * 5;
      for (let u = 1; u <= 4; u++) {
        if (u === 4 && a.maestroId === 'm1') continue; // el maestro de demo aún debe ingresar la unidad 4
        notas[`${e.id}|${a.id}|${u}`] = Math.round(limitar(base + dificultad[a.cursoId] + ajuste + normal() * 4 + (u - 2.5) * tendencia, 25, 100));
      }
    });
  });

  // ---------- Asistencia: últimos 40 días hábiles ----------
  const diasHabiles: string[] = [];
  const cursor = new Date();
  while (diasHabiles.length < 40) {
    cursor.setDate(cursor.getDate() - 1);
    if (cursor.getDay() !== 0 && cursor.getDay() !== 6) diasHabiles.unshift(fechaISO(cursor));
  }
  const asistencia: Asistencia[] = [];
  grados.forEach((g) => {
    const lista = estudiantes.filter((e) => e.gradoId === g.id);
    diasHabiles.forEach((fecha) => {
      const ausentes = lista.filter((e) => e.id !== sofia && sucede(habilidad.get(e.id)! < 62 ? 0.08 : 0.025)).map((e) => e.id);
      const tardes = lista.filter((e) => !ausentes.includes(e.id) && sucede(0.045)).map((e) => e.id);
      asistencia.push({ id: `${g.id}|${fecha}`, gradoId: g.id, fecha, ausentes, tardes, tomadaPor: g.guiaId });
    });
  });
  [5, 17, 31].forEach((i) => {
    const r = asistencia.find((x) => x.id === `5p|${diasHabiles[i]}`)!;
    if (!r.ausentes.includes(diego)) r.ausentes.push(diego);
    r.tardes = r.tardes.filter((t) => t !== diego);
  });

  // ---------- Tareas y entregas ----------
  const tareas: Tarea[] = [];
  const entregas: Entrega[] = [];
  asignaciones.forEach((a) => {
    const lista = estudiantes.filter((e) => e.gradoId === a.gradoId);
    const plantillas = TAREAS[a.cursoId];
    const fechas = [dia(-12), dia(-2), dia(entero(3, 8))];
    const punteos = [10, 15, 10];
    plantillas.forEach(([titulo, descripcion], i) => {
      const tarea: Tarea = {
        id: `t-${a.id}-${i + 1}`, asignacionId: a.id, titulo, descripcion,
        entrega: fechas[i], punteo: punteos[i], unidad: 4, creada: fechaISO(new Date(new Date(fechas[i] + 'T12:00:00').getTime() - 8 * 86400000)),
      };
      tareas.push(tarea);
      lista.forEach((e) => {
        const base = habilidad.get(e.id)!;
        const diegoDebe = e.id === diego && a.cursoId === 'mat' && i < 2;
        const entrego = i < 2 ? !diegoDebe && (e.id === sofia || sucede(base < 62 ? 0.65 : 0.93)) : e.id !== sofia && sucede(0.2);
        if (!entrego) return;
        const calificada = i === 0;
        const nota = calificada ? Math.round(limitar((tarea.punteo * (base + normal() * 8)) / 100, tarea.punteo * 0.3, tarea.punteo)) : null;
        entregas.push({
          id: `en-${tarea.id}-${e.id}`, tareaId: tarea.id, estudianteId: e.id,
          fecha: momento(Math.max(0, -Math.round((new Date(tarea.entrega + 'T12:00:00').getTime() - Date.now()) / 86400000)) + entero(0, 1), entero(14, 21), entero(0, 59)),
          texto: elegir(RESPUESTAS), enlace: '', nota,
          comentario: nota === null ? '' : nota >= tarea.punteo * 0.9 ? '¡Excelente trabajo!' : nota >= tarea.punteo * 0.7 ? 'Buen trabajo, sigue así.' : 'Revisa las correcciones y repasa el tema.',
        });
      });
    });
  });

  // ---------- Pagos: inscripción + 10 colegiaturas ----------
  const pagos: Pago[] = [];
  const metodos = ['Depósito · Banrural', 'Depósito · Banco Industrial', 'Transferencia bancaria', 'Tarjeta en caja', 'Efectivo en caja'];
  let recibo = 1;
  estudiantes.forEach((e) => {
    const g = grados.find((x) => x.id === e.gradoId)!;
    const mensual = g.nivel === 'Básico' ? config.colegiaturaBasico : config.colegiaturaPrimaria;
    const cuotas = Array.from({ length: 11 }, (_, m) => ({
      mes: m, concepto: m === 0 ? `Inscripción ${ciclo}` : `Colegiatura ${MESES[m - 1]}`,
      monto: m === 0 ? config.inscripcion : mensual, vence: `${ciclo}-${String(Math.max(m, 1)).padStart(2, '0')}-05`,
    }));
    const vencidas = cuotas.filter((c) => c.vence <= HOY);
    let sinPagar = familiaMorosa.has(e.padreId) ? entero(1, 3) : sucede(0.06) ? 1 : 0;
    if (e.id === sofia) sinPagar = 0;
    if (e.id === diego) sinPagar = 1;
    const pendientes = new Set(vencidas.slice(vencidas.length - sinPagar).map((c) => c.mes));
    const ultima = vencidas[vencidas.length - 1];
    cuotas.forEach((c) => {
      const pagado = c.vence <= HOY && !pendientes.has(c.mes);
      const fp = new Date(c.vence + 'T12:00:00'); fp.setDate(fp.getDate() + entero(-6, 3));
      let fechaPago = fechaISO(fp);
      // Algunas familias pagan la última cuota con atraso, dentro del mes en curso
      if (pagado && c.mes === ultima?.mes && sucede(0.4)) {
        const desde = [sumarDias(c.vence, 1), HOY.slice(0, 8) + '01'].sort()[1];
        const rango = diasEntre(desde, HOY);
        if (rango >= 0) fechaPago = sumarDias(desde, entero(0, rango));
      }
      pagos.push({
        id: `pg-${e.id}-${c.mes}`, estudianteId: e.id, concepto: c.concepto, mes: c.mes, monto: c.monto, vence: c.vence,
        estado: pagado ? 'Pagado' : 'Pendiente', fechaPago: pagado ? fechaPago : null,
        metodo: pagado ? elegir(metodos) : '', referencia: pagado ? String(entero(100000000, 999999999)) : '',
        recibo: pagado ? `R-${ciclo}-${String(recibo++).padStart(5, '0')}` : '', observacion: '',
      });
    });
  });
  // Tres pagos reportados por padres, esperando validación
  pagos.filter((p) => p.estado === 'Pendiente' && p.vence <= HOY && !p.id.startsWith(`pg-${diego}-`)).slice(0, 3).forEach((p, i) => {
    p.estado = 'En revisión'; p.fechaPago = dia(-i - 1); p.metodo = metodos[i % 2]; p.referencia = String(entero(100000000, 999999999));
  });

  // ---------- Avisos ----------
  const anuncios: Anuncio[] = [
    { id: 'a1', titulo: '¡Bienvenidos a EscuelaPro! 🎉', contenido: 'Desde ahora pueden consultar calificaciones, tareas, asistencia, horarios y pagos en un solo lugar.\nSi tienen dudas sobre su usuario, comuníquense con la administración.', categoria: 'General', audiencia: 'todos', gradoId: null, autorId: 'u-director', fecha: horasAtras(30), fijado: true },
    { id: 'a2', titulo: 'Evaluación de Matemáticas — Unidad 4', contenido: 'La evaluación de la Unidad 4 será la próxima semana. Temas: ecuaciones de primer grado y problemas de aplicación.\nRepasen las hojas de trabajo publicadas en la plataforma.', categoria: 'Académico', audiencia: 'familias', gradoId: '1b', autorId: uDe('m1'), fecha: horasAtras(20), fijado: false },
    { id: 'a3', titulo: 'Reunión general de padres de familia', contenido: `Les invitamos a la reunión general de padres el ${new Date(dia(6) + 'T12:00:00').toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long' })} a las 17:00 horas en el salón de usos múltiples.\nSe entregará información sobre el cierre del ciclo escolar.`, categoria: 'Evento', audiencia: 'padres', gradoId: null, autorId: 'u-director', fecha: horasAtras(52), fijado: false },
    { id: 'a4', titulo: 'Recordatorio: pago de colegiatura', contenido: 'Les recordamos que la colegiatura vence el día 5 de cada mes. Pueden reportar su boleta de depósito desde la sección Pagos de la plataforma.', categoria: 'General', audiencia: 'padres', gradoId: null, autorId: 'u-admin', fecha: horasAtras(96), fijado: false },
    { id: 'a5', titulo: 'Feria de Ciencias 🔬', contenido: 'Este año la Feria de Ciencias tendrá como tema "Guatemala sostenible". Cada sección presentará un proyecto. ¡Prepárense!', categoria: 'Evento', audiencia: 'estudiantes', gradoId: null, autorId: uDe('m5'), fecha: horasAtras(120), fijado: false },
    { id: 'a6', titulo: 'Ingreso de notas de la Unidad 4', contenido: 'Docentes: la fecha límite para ingresar las calificaciones de la Unidad 4 en la plataforma es el próximo viernes.', categoria: 'Académico', audiencia: 'maestros', gradoId: null, autorId: 'u-director', fecha: horasAtras(26), fijado: false },
    { id: 'a7', titulo: 'Laboratorio: traer bata', contenido: 'Para la práctica de laboratorio de esta semana es obligatorio traer bata blanca y cuaderno de ciencias.', categoria: 'Académico', audiencia: 'familias', gradoId: '6p', autorId: uDe('m5'), fecha: horasAtras(140), fijado: false },
    { id: 'a8', titulo: 'Día del deporte ⚽', contenido: 'Habrá torneos de fútbol, baloncesto y carreras de relevos. Los estudiantes deben asistir con uniforme de educación física.', categoria: 'Evento', audiencia: 'familias', gradoId: null, autorId: uDe('m9'), fecha: horasAtras(170), fijado: false },
  ];

  // ---------- Calendario ----------
  const eventos: Evento[] = [
    { id: 'ev1', titulo: 'Feria de Ciencias', fecha: dia(2), tipo: 'Evento', descripcion: 'Exposición de proyectos de todas las secciones en el patio central.' },
    { id: 'ev2', titulo: 'Reunión general de padres', fecha: dia(6), tipo: 'Reunión', descripcion: 'Salón de usos múltiples, 17:00 horas.' },
    { id: 'ev3', titulo: 'Inicio de evaluaciones finales', fecha: dia(9), tipo: 'Académico', descripcion: 'Evaluaciones de la Unidad 4 según el calendario de cada sección.' },
    { id: 'ev4', titulo: 'Fin de evaluaciones finales', fecha: dia(13), tipo: 'Académico', descripcion: 'Último día de evaluaciones.' },
    { id: 'ev5', titulo: 'Día del deporte', fecha: dia(16), tipo: 'Evento', descripcion: 'Torneos deportivos para toda la comunidad educativa.' },
    { id: 'ev6', titulo: 'Entrega de boletas', fecha: dia(20), tipo: 'Académico', descripcion: 'Entrega de calificaciones finales a padres de familia.' },
    { id: 'ev7', titulo: 'Clausura del ciclo escolar', fecha: dia(23), tipo: 'Evento', descripcion: 'Acto de clausura y graduación.' },
    { id: 'ev8', titulo: 'Concurso de lectura', fecha: dia(-5), tipo: 'Evento', descripcion: 'Concurso de lectura en voz alta por niveles.' },
    { id: 'ev9', titulo: 'Jornada de salud', fecha: dia(-12), tipo: 'Evento', descripcion: 'Revisión médica y odontológica para estudiantes.' },
    ...[['01-01', 'Año Nuevo'], ['05-01', 'Día del Trabajo'], ['06-30', 'Día del Ejército'], ['09-15', 'Día de la Independencia'], ['10-20', 'Día de la Revolución'], ['11-01', 'Día de Todos los Santos'], ['12-25', 'Navidad']]
      .map(([f, t], i) => ({ id: `fe${i}`, titulo: t, fecha: `${ciclo}-${f}`, tipo: 'Feriado' as const, descripcion: 'Día de asueto.' })),
  ];

  // ---------- Mensajes ----------
  const conversaciones: Conversacion[] = [
    { id: 'c1', a: uDe(ana.id), b: uDe('m1'), asunto: 'Rendimiento de Sofía en Matemáticas', mensajes: [
      { de: uDe(ana.id), texto: 'Buenas tardes, profesor Ramírez. Quería consultarle cómo va Sofía en Matemáticas; noto que le está costando el tema de ecuaciones.', fecha: momento(3, 18, 20) },
      { de: uDe('m1'), texto: 'Buenos días, señora Méndez. Sofía es muy participativa en clase. Le recomiendo practicar con la hoja de trabajo de la plataforma; los martes doy reforzamiento a las 12:30.', fecha: momento(2, 7, 45) },
      { de: uDe(ana.id), texto: '¡Muchas gracias, profe! La inscribiré al reforzamiento del martes.', fecha: horasAtras(3) },
    ], leido: { [uDe(ana.id)]: horasAtras(3), [uDe('m1')]: momento(2, 7, 45) } },
    { id: 'c2', a: uDe('m2'), b: uDe(ana.id), asunto: 'Tareas pendientes de Diego', mensajes: [
      { de: uDe('m2'), texto: 'Buenas tardes, señora Méndez. Le escribo porque Diego tiene dos tareas de Matemáticas sin entregar. ¿Podríamos apoyarlo para que se ponga al día esta semana?', fecha: horasAtras(20) },
    ], leido: { [uDe('m2')]: horasAtras(20) } },
    { id: 'c3', a: 'u-director', b: uDe('m1'), asunto: 'Planificación de la Unidad 4', mensajes: [
      { de: 'u-director', texto: 'Profesor Ramírez, ¿me puede compartir la planificación de la evaluación final de Matemáticas para 1ro Básico?', fecha: momento(4, 9, 10) },
      { de: uDe('m1'), texto: 'Claro, director. Se la envío hoy por la tarde con la tabla de especificaciones.', fecha: momento(4, 10, 2) },
    ], leido: { 'u-director': momento(4, 11, 0), [uDe('m1')]: momento(4, 10, 2) } },
    { id: 'c4', a: uDe(sofia), b: uDe('m1'), asunto: 'Duda sobre la hoja de trabajo', mensajes: [
      { de: uDe(sofia), texto: 'Profe, ¿el ejercicio 5 se resuelve con el método de sustitución?', fecha: momento(1, 19, 5) },
      { de: uDe('m1'), texto: '¡Así es, Sofía! También puedes comprobar tu respuesta por igualación.', fecha: momento(0, 7, 15) },
    ], leido: { [uDe(sofia)]: momento(1, 19, 5), [uDe('m1')]: momento(0, 7, 15) } },
  ];

  return {
    config, cursos, grados, maestros, estudiantes, padres, usuarios, asignaciones,
    notas, asistencia, tareas, entregas, anuncios, eventos, pagos, conversaciones,
  };
}

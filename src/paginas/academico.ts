// ============================================================
//  PÁGINAS ACADÉMICAS COMPARTIDAS (estudiante y padre)
//  calificaciones · tareas · asistencia · horario
// ============================================================
import type { Contexto } from '../lib/app';
import type { Entrega } from '../lib/tipos';
import { obtener, porId, guardarItem, config } from '../lib/datos';
import {
  boleta, promedioGeneral, promedioUnidad, promedio, nivelNota, fmtNota, nombreGrado, grado, estudiantesDeGrado,
  tareasDeEstudiante, asistenciaDe, horarioDeGrado, horarioDeMaestro, momentoDeClase, PERIODOS, curso, tituloMaestro,
  periodosPorSemana, asignacionesDeGrado, asignacionesDeMaestro, type EstadoTarea, nombreCompleto,
} from '../lib/escuela';
import { tablaBoleta, graficaLinea, anillo, stat, vacio, badge, tablaHorario, avatar, tarjeta, barrasH, chipCurso } from '../lib/vistas';
import { escapar, fechaMedia, relativa, fechaCorta, MESES, hoy, aFecha, diasEntre, fechaLarga } from '../lib/formato';
import { icono } from '../lib/iconos';
import { abrirModal, aviso, campo } from '../lib/ui';

const sinEstudiante = (ctx: Contexto) => {
  ctx.vista.innerHTML = vacio('👨‍👩‍👧', 'No hay estudiantes vinculados', 'Comunícate con la administración del colegio.');
};

// ---------- Calificaciones ----------
export function paginaCalificaciones(ctx: Contexto) {
  const est = ctx.estudiante;
  if (!est) return sinEstudiante(ctx);
  const filas = boleta(est);
  const general = promedioGeneral(est);
  const nv = nivelNota(general);
  const aprobados = filas.filter((f) => f.promedio !== null && f.promedio >= 60).length;
  const ordenados = filas.filter((f) => f.promedio !== null).sort((a, b) => b.promedio! - a.promedio!);
  const companeros = estudiantesDeGrado(est.gradoId);
  const promGrado = [1, 2, 3, 4].map((u) => promedio(companeros.map((c) => promedioUnidad(c, u))));
  const cfg = config();
  const g = grado(est.gradoId);
  const yo = ctx.rol === 'estudiante';

  ctx.vista.innerHTML = `
    <div class="hero">
      ${avatar(nombreCompleto(est), porId('usuarios', `u-${est.id}`)?.color, 'lg')}
      <div><h2>${yo ? 'Mis calificaciones' : `Calificaciones de ${escapar(est.nombres.split(' ')[0])}`}</h2>
        <p>${escapar(nombreCompleto(est))} · ${escapar(nombreGrado(g))} · Carné ${escapar(est.carnet)}</p>
        <div class="hero-chips"><span>Ciclo ${cfg.ciclo}</span><span>Unidad actual: ${cfg.unidadActual}</span><span>${aprobados} de ${filas.length} cursos aprobados</span></div></div>
      <div class="hero-derecha">${anillo(general ?? 0, '#fff', fmtNota(general, 1), 92)}</div>
    </div>

    <div class="grid g4 mb">
      ${stat({ icono: '📊', etiqueta: 'Promedio general', valor: fmtNota(general, 1), nota: nv.texto, tono: nv.clase === 'bad' ? 'rojo' : nv.clase === 'warn' ? 'ambar' : 'verde' })}
      ${stat({ icono: '✅', etiqueta: 'Cursos aprobados', valor: `${aprobados}/${filas.length}`, nota: 'Nota mínima: 60 puntos', tono: 'azul' })}
      ${stat({ icono: '🏆', etiqueta: 'Mejor curso', valor: ordenados[0] ? fmtNota(ordenados[0].promedio, 1) : '—', nota: ordenados[0]?.curso.nombre ?? '', tono: 'morado' })}
      ${stat({ icono: '🎯', etiqueta: 'Por mejorar', valor: ordenados.at(-1) ? fmtNota(ordenados.at(-1)!.promedio, 1) : '—', nota: ordenados.at(-1)?.curso.nombre ?? '', tono: 'ambar' })}
    </div>

    <section class="card mb imprimible" id="boleta">
      <div class="solo-imprimir" style="padding:1.2rem 1.3rem 0">
        <h2>${escapar(cfg.colegio)} — Boleta de calificaciones</h2>
        <p>${escapar(nombreCompleto(est))} · ${escapar(nombreGrado(g))} · Carné ${escapar(est.carnet)} · Ciclo ${cfg.ciclo}</p>
      </div>
      <div class="card-cabecera"><h2>${icono('notas')} Boleta de calificaciones</h2>
        <button type="button" class="btn btn-secundario btn-sm no-imprimir" id="imprimir">${icono('imprimir', 16)} Imprimir boleta</button></div>
      <div class="card-cuerpo sin-relleno">${tablaBoleta(filas, general)}</div>
    </section>

    <div class="grid g-2-1">
      ${tarjeta(`${icono('grafica')} Progreso por unidad`, graficaLinea([
        { nombre: yo ? 'Mi promedio' : `Promedio de ${est.nombres.split(' ')[0]}`, color: 'var(--rol)', valores: [1, 2, 3, 4].map((u) => promedioUnidad(est, u)) },
        { nombre: `Promedio de ${nombreGrado(g)}`, color: '#94a3b8', valores: promGrado, punteada: true },
      ], ['Unidad 1', 'Unidad 2', 'Unidad 3', 'Unidad 4']))}
      ${tarjeta('💡 Fortalezas y áreas de mejora', `
        <p class="stat-etiqueta" style="margin-bottom:.6rem">Mejores cursos</p>
        ${barrasH(ordenados.slice(0, 3).map((f) => ({ etiqueta: f.curso.corto, icono: f.curso.icono, valor: f.promedio!, max: 100, color: f.curso.color, texto: fmtNota(f.promedio, 1) })))}
        <p class="stat-etiqueta" style="margin:1.1rem 0 .6rem">Necesitan más práctica</p>
        ${barrasH(ordenados.slice(-2).reverse().map((f) => ({ etiqueta: f.curso.corto, icono: f.curso.icono, valor: f.promedio!, max: 100, color: nivelNota(f.promedio).color, texto: fmtNota(f.promedio, 1) })))}
        ${ordenados.some((f) => f.promedio! < 60) ? `<div class="alerta roja" style="margin-top:1rem">${icono('alerta', 18)}<span>Hay cursos por debajo de 60. ${yo ? 'Habla con tu maestro para recibir reforzamiento.' : 'Le recomendamos comunicarse con el maestro del curso.'}</span></div>` : ''}`)}
    </div>`;

  ctx.vista.querySelector('#imprimir')!.addEventListener('click', () => window.print());
}

// ---------- Tareas ----------
const claseEstadoTarea: Record<EstadoTarea, string> = { Pendiente: 'info', Atrasada: 'bad', Entregada: 'warn', Calificada: 'ok' };

export function paginaTareas(ctx: Contexto) {
  const est = ctx.estudiante;
  if (!est) return sinEstudiante(ctx);
  const puedeEntregar = ctx.rol === 'estudiante';
  let filtro = 'porHacer';
  let cursoFiltro = '';

  const pintar = () => {
    const todas = tareasDeEstudiante(est);
    const cuenta = (f: (e: EstadoTarea) => boolean) => todas.filter((t) => f(t.estado)).length;
    const grupos: Record<string, (e: EstadoTarea) => boolean> = {
      porHacer: (e) => e === 'Pendiente' || e === 'Atrasada', entregadas: (e) => e === 'Entregada', calificadas: (e) => e === 'Calificada', todas: () => true,
    };
    const lista = todas.filter((t) => grupos[filtro](t.estado) && (!cursoFiltro || t.curso.id === cursoFiltro));
    if (filtro !== 'porHacer') lista.reverse();
    const cursos = asignacionesDeGrado(est.gradoId).map((a) => curso(a.cursoId)!);

    ctx.vista.innerHTML = `
      <div class="grid g4 mb">
        ${stat({ icono: '📝', etiqueta: 'Por entregar', valor: String(cuenta((e) => e === 'Pendiente')), nota: 'Dentro del plazo', tono: 'azul' })}
        ${stat({ icono: '⏰', etiqueta: 'Atrasadas', valor: String(cuenta((e) => e === 'Atrasada')), nota: 'Fecha vencida', tono: 'rojo' })}
        ${stat({ icono: '📤', etiqueta: 'Entregadas', valor: String(cuenta((e) => e === 'Entregada')), nota: 'Esperando nota', tono: 'ambar' })}
        ${stat({ icono: '✅', etiqueta: 'Calificadas', valor: String(cuenta((e) => e === 'Calificada')), nota: 'Con nota del maestro', tono: 'verde' })}
      </div>
      <div class="herramientas mb">
        <div class="chips">
          ${[['porHacer', 'Por hacer', cuenta(grupos.porHacer)], ['entregadas', 'Entregadas', cuenta(grupos.entregadas)], ['calificadas', 'Calificadas', cuenta(grupos.calificadas)], ['todas', 'Todas', todas.length]]
            .map(([id, t, n]) => `<button type="button" class="chip ${filtro === id ? 'activo' : ''}" data-filtro="${id}">${t} <span class="cuenta">${n}</span></button>`).join('')}
        </div>
        <select class="control" id="filtro-curso" style="margin-left:auto"><option value="">Todos los cursos</option>${cursos.map((c) => `<option value="${c.id}" ${c.id === cursoFiltro ? 'selected' : ''}>${c.icono} ${escapar(c.nombre)}</option>`).join('')}</select>
      </div>
      <div class="pila">
        ${lista.length ? lista.map((t) => {
          const dias = diasEntre(hoy(), t.tarea.entrega);
          const urgencia = t.estado === 'Atrasada' ? 'bad' : t.estado === 'Pendiente' && dias <= 2 ? 'warn' : 'neutral';
          return `
          <article class="tarea" style="--c:${t.curso.color}">
            <div class="tarea-cuerpo">
              ${chipCurso(t.curso.id)}
              <h3>${escapar(t.tarea.titulo)}</h3>
              <p>${escapar(t.tarea.descripcion)}</p>
              <div class="tarea-meta">
                ${badge(t.estado, claseEstadoTarea[t.estado])}
                <span class="badge ${urgencia}">${icono('calendario', 13)} ${t.estado === 'Atrasada' ? 'Venció' : 'Entrega'} ${relativa(t.tarea.entrega).toLowerCase()} · ${fechaCorta(t.tarea.entrega)}</span>
                <span>${t.tarea.punteo} puntos</span><span>· ${escapar(tituloMaestro(porId('maestros', t.asig.maestroId)))}</span>
              </div>
              ${t.entrega ? `<div class="comentario"><strong>${ctx.rol === 'padre' ? 'Entrega' : t.estado === 'Calificada' ? 'Entregada' : 'Tu entrega'}:</strong> ${escapar(t.entrega.texto)}${t.entrega.enlace ? ` · <a class="enlace" href="${escapar(t.entrega.enlace)}" target="_blank" rel="noopener">Ver enlace</a>` : ''}${t.entrega.comentario ? `<br><strong>💬 Maestro:</strong> ${escapar(t.entrega.comentario)}` : ''}</div>` : ''}
            </div>
            <div class="tarea-lado">
              ${t.estado === 'Calificada' ? `<div class="tarea-nota" style="color:${nivelNota((t.entrega!.nota! / t.tarea.punteo) * 100).color}">${t.entrega!.nota}<small>/${t.tarea.punteo}</small></div>` : '<span></span>'}
              ${puedeEntregar && t.estado !== 'Calificada' ? `<button type="button" class="btn ${t.entrega ? 'btn-secundario' : 'btn-primario'} btn-sm" data-entregar="${t.tarea.id}">${icono(t.entrega ? 'editar' : 'subir', 16)} ${t.entrega ? 'Editar entrega' : 'Entregar'}</button>` : ''}
            </div>
          </article>`;
        }).join('') : `<div class="card">${vacio(filtro === 'porHacer' ? '🎉' : '📭', filtro === 'porHacer' ? '¡Todo al día!' : 'No hay tareas aquí', filtro === 'porHacer' ? 'No hay tareas pendientes por ahora.' : '')}</div>`}
      </div>`;

    ctx.vista.querySelectorAll<HTMLButtonElement>('[data-filtro]').forEach((b) => b.addEventListener('click', () => { filtro = b.dataset.filtro!; pintar(); }));
    ctx.vista.querySelector<HTMLSelectElement>('#filtro-curso')!.addEventListener('change', (e) => { cursoFiltro = (e.target as HTMLSelectElement).value; pintar(); });
    ctx.vista.querySelectorAll<HTMLButtonElement>('[data-entregar]').forEach((b) => b.addEventListener('click', () => abrirEntrega(b.dataset.entregar!)));
  };

  const abrirEntrega = (tareaId: string) => {
    const t = tareasDeEstudiante(est).find((x) => x.tarea.id === tareaId)!;
    const d = abrirModal({
      titulo: `${t.curso.icono} ${escapar(t.tarea.titulo)}`,
      cuerpo: `<form class="form-modal" id="form-entrega">
        <div class="ayuda completo">${escapar(t.tarea.descripcion)}<br><strong>Fecha de entrega:</strong> ${fechaLarga(t.tarea.entrega)} · ${t.tarea.punteo} puntos</div>
        ${campo('Tu respuesta o comentario *', `<textarea name="texto" required placeholder="Describe tu trabajo o escribe tu respuesta...">${escapar(t.entrega?.texto ?? '')}</textarea>`, 'completo')}
        ${campo('Enlace a tu archivo (opcional)', `<input name="enlace" type="url" placeholder="https://drive.google.com/..." value="${escapar(t.entrega?.enlace ?? '')}" />`, 'completo')}
        ${t.estado === 'Atrasada' ? '<div class="alerta completo">⏰ La fecha ya pasó. Tu maestro verá que la entrega fue tardía.</div>' : ''}
      </form>`,
      pie: `<button type="button" class="btn btn-secundario" data-cerrar>Cancelar</button><button type="button" class="btn btn-primario" id="enviar-entrega">${icono('enviar', 16)} ${t.entrega ? 'Guardar cambios' : 'Entregar tarea'}</button>`,
    });
    d.querySelector('#enviar-entrega')!.addEventListener('click', () => {
      const form = d.querySelector<HTMLFormElement>('#form-entrega')!;
      if (!form.reportValidity()) return;
      const datos = new FormData(form);
      const entrega: Entrega = {
        id: t.entrega?.id ?? `en-${t.tarea.id}-${est.id}`, tareaId: t.tarea.id, estudianteId: est.id, fecha: new Date().toISOString(),
        texto: String(datos.get('texto')).trim(), enlace: String(datos.get('enlace')).trim(), nota: null, comentario: '',
      };
      guardarItem('entregas', entrega);
      d.close();
      aviso(t.entrega ? 'Entrega actualizada' : '¡Tarea entregada! 🎉');
      pintar();
    });
  };

  pintar();
}

// ---------- Asistencia ----------
export function paginaAsistencia(ctx: Contexto) {
  const est = ctx.estudiante;
  if (!est) return sinEstudiante(ctx);
  const a = asistenciaDe(est);
  const meses = [...new Set(a.dias.map((d) => d.fecha.slice(0, 7)))];
  let mes = meses.at(-1) ?? hoy().slice(0, 7);
  const tono = a.porcentaje >= 95 ? '#16a34a' : a.porcentaje >= 85 ? '#d97706' : '#dc2626';

  const pintarCalendario = () => {
    const [y, m] = mes.split('-').map(Number);
    const primero = new Date(y, m - 1, 1);
    const totalDias = new Date(y, m, 0).getDate();
    const desplazamiento = (primero.getDay() + 6) % 7;
    const mapa = new Map(a.dias.map((d) => [d.fecha, d.estado]));
    const celdas: string[] = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => `<span class="dia-nombre">${d}</span>`);
    for (let i = 0; i < desplazamiento; i++) celdas.push('<span class="cal-dia vacia"></span>');
    for (let d = 1; d <= totalDias; d++) {
      const f = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dow = new Date(y, m - 1, d).getDay();
      const estado = mapa.get(f);
      const titulo = estado === 'A' ? 'Ausente' : estado === 'T' ? 'Tarde' : estado === 'P' ? 'Presente' : '';
      celdas.push(`<span class="cal-dia ${dow === 0 || dow === 6 ? 'fin' : estado ?? ''} ${f === hoy() ? 'hoy' : ''}" title="${titulo}">${d}</span>`);
    }
    const i = meses.indexOf(mes);
    ctx.vista.querySelector('#cal')!.innerHTML = `
      <div class="herramientas mb" style="justify-content:space-between">
        <button type="button" class="btn-icono borde" data-mover="-1" ${i <= 0 ? 'disabled' : ''}>${icono('izquierda')}</button>
        <strong>${MESES[m - 1]} ${y}</strong>
        <button type="button" class="btn-icono borde" data-mover="1" ${i >= meses.length - 1 ? 'disabled' : ''}>${icono('derecha')}</button>
      </div>
      <div class="cal-asist">${celdas.join('')}</div>
      <div class="leyenda" style="justify-content:center;margin-top:1rem"><span><i style="background:#86efac"></i>Presente</span><span><i style="background:#fcd34d"></i>Tarde</span><span><i style="background:#fca5a5"></i>Ausente</span></div>`;
    ctx.vista.querySelectorAll<HTMLButtonElement>('[data-mover]').forEach((b) => b.addEventListener('click', () => {
      const n = meses[i + Number(b.dataset.mover)];
      if (n) { mes = n; pintarCalendario(); }
    }));
  };

  const incidencias = a.dias.filter((d) => d.estado !== 'P').reverse();
  ctx.vista.innerHTML = `
    <div class="grid g4 mb">
      <div class="card stat">${anillo(a.porcentaje, tono, `${Math.round(a.porcentaje)}%`, 60)}<div><p class="stat-etiqueta">Asistencia</p><p class="stat-valor">${a.porcentaje.toFixed(1)}%</p><p class="stat-nota">Últimos ${a.total} días de clase</p></div></div>
      ${stat({ icono: '✅', etiqueta: 'Días presente', valor: String(a.presentes), tono: 'verde' })}
      ${stat({ icono: '⏰', etiqueta: 'Llegadas tarde', valor: String(a.tardanzas), tono: 'ambar' })}
      ${stat({ icono: '❌', etiqueta: 'Ausencias', valor: String(a.ausencias), tono: 'rojo' })}
    </div>
    <div class="grid g-2-1">
      ${tarjeta(`${icono('calendario')} Calendario de asistencia`, '<div id="cal"></div>')}
      ${tarjeta(`${icono('alerta')} Ausencias y tardanzas`, incidencias.length ? `<div class="lista">${incidencias.slice(0, 12).map((d) => `
        <div class="lista-item"><span class="fecha-caja"><b>${aFecha(d.fecha).getDate()}</b><span>${MESES[aFecha(d.fecha).getMonth()].slice(0, 3)}</span></span>
        <div class="crece"><strong>${d.estado === 'A' ? 'Ausencia' : 'Llegada tarde'}</strong><small>${fechaLarga(d.fecha)}</small></div>${badge(d.estado === 'A' ? 'Ausente' : 'Tarde', d.estado === 'A' ? 'bad' : 'warn')}</div>`).join('')}</div>`
        : vacio('🌟', '¡Asistencia perfecta!', 'Sin ausencias ni tardanzas en este periodo.'))}
    </div>`;
  pintarCalendario();
}

// ---------- Horario ----------
export function paginaHorario(ctx: Contexto) {
  const esMaestro = ctx.rol === 'maestro';
  const est = ctx.estudiante;
  if (!esMaestro && !est) return sinEstudiante(ctx);
  const matriz = esMaestro ? horarioDeMaestro(ctx.usuario.refId!) : horarioDeGrado(est!.gradoId);
  const m = momentoDeClase(matriz);
  const tarjetaClase = (pos: { d: number; p: number } | null, etiqueta: string) => {
    if (!pos) return '';
    const a = matriz[pos.d][pos.p]!;
    const c = curso(a.cursoId)!;
    const per = PERIODOS[pos.p];
    const quien = esMaestro ? `${nombreGrado(grado(a.gradoId))} · ${grado(a.gradoId)?.aula}` : `${tituloMaestro(porId('maestros', a.maestroId))} · ${grado(a.gradoId)?.aula}`;
    const cuando = pos.d === m.hoy ? `${per.inicio} – ${per.fin}` : `${['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'][pos.d]} · ${per.inicio}`;
    return `<div class="ahora" style="--c:${c.color}"><span class="ahora-icono">${c.icono}</span><div><small>${etiqueta}</small><strong>${escapar(c.nombre)}</strong><span>${escapar(quien)} · ${cuando}</span></div></div>`;
  };
  const asigs = esMaestro ? asignacionesDeMaestro(ctx.usuario.refId!) : asignacionesDeGrado(est!.gradoId);
  const horas = (asigId: string) => matriz.flat().filter((x) => x?.id === asigId).length;

  ctx.vista.innerHTML = `
    <div class="grid g2 mb">
      ${tarjetaClase(m.actual, '🔴 En clase ahora') || `<div class="ahora"><span class="ahora-icono">${m.enReceso ? '☀️' : m.hoy < 0 ? '🎉' : '📚'}</span><div><small>Ahora</small><strong>${m.enReceso ? 'Receso' : m.hoy < 0 ? 'Fin de semana' : 'Sin clase en este momento'}</strong><span>${m.hoy < 0 ? '¡Disfruta tu descanso!' : 'Revisa tu próxima clase.'}</span></div></div>`}
      ${tarjetaClase(m.siguiente, '⏭️ Siguiente clase')}
    </div>
    ${tarjeta(`${icono('reloj')} ${esMaestro ? 'Mi horario semanal' : `Horario de ${nombreGrado(grado(est!.gradoId))}`}`, tablaHorario(matriz, esMaestro ? 'maestro' : 'grado', m.actual, m.hoy),
      `<span class="badge rol">${periodosPorSemana(matriz)} periodos por semana</span>`, 'mb')}
    ${tarjeta('📚 Cursos y horas por semana', `<div class="grid g-auto">${asigs.map((a) => {
      const c = curso(a.cursoId)!;
      return `<div class="curso-card" style="--c:${c.color}"><div class="curso-card-cab"><span class="curso-icono" style="--c:${c.color}">${c.icono}</span><div><strong>${escapar(c.nombre)}</strong><small>${escapar(esMaestro ? nombreGrado(grado(a.gradoId)) : tituloMaestro(porId('maestros', a.maestroId)))}</small></div></div><div class="curso-card-pie"><span class="badge">${horas(a.id)} periodos</span><span class="stat-nota">45 min c/u</span></div></div>`;
    }).join('')}</div>`)}`;
}


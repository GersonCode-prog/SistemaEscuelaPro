// ============================================================
//  PORTAL DEL MAESTRO
//  inicio · mis clases · calificaciones · asistencia · tareas
// ============================================================
import type { Contexto } from '../lib/app';
import type { Asignacion, Tarea } from '../lib/tipos';
import { obtener, porId, guardarItem, eliminarItem, nuevoId, obtenerNotas, guardarNotas, config } from '../lib/datos';
import {
  asignacionesDeMaestro, gradosDeMaestro, estudiantesDeGrado, nombreGrado, grado, curso, promedioAsignacion, promedioCurso,
  notaDe, nivelNota, fmtNota, entregasPorCalificar, horarioDeMaestro, momentoDeClase, PERIODOS, nombreCompleto, promedio,
  asistenciaDe, tituloMaestro, usuarioDe, noLeidos, anunciosPara, UNIDADES, nombreAsignacion,
} from '../lib/escuela';
import { stat, anillo, tarjeta, vacio, badge, avatar, chipCurso, graficaBarras } from '../lib/vistas';
import { escapar, saludo, relativa, haceTiempo, hoy, fechaMedia, fechaCorta, fechaLarga, sumarDias, aFecha } from '../lib/formato';
import { icono } from '../lib/iconos';
import { ruta } from '../lib/ruta';
import { abrirModal, aviso, confirmar, modalFormulario, campo, opciones } from '../lib/ui';

const nombreClase = (a: Asignacion) => `${curso(a.cursoId)?.icono} ${curso(a.cursoId)?.nombre} — ${nombreGrado(grado(a.gradoId))}`;
const opcionesClases = (asigs: Asignacion[], sel = '') => asigs.map((a) => `<option value="${a.id}" ${a.id === sel ? 'selected' : ''}>${escapar(nombreClase(a))}</option>`).join('');

// ---------- Inicio ----------
export function inicioMaestro(ctx: Contexto) {
  const m = porId('maestros', ctx.usuario.refId)!;
  const asigs = asignacionesDeMaestro(m.id);
  const alumnos = new Set(asigs.flatMap((a) => estudiantesDeGrado(a.gradoId).map((e) => e.id))).size;
  const porCalificar = entregasPorCalificar(m.id);
  const matriz = horarioDeMaestro(m.id);
  const mom = momentoDeClase(matriz);
  const dia = mom.hoy >= 0 ? mom.hoy : (mom.siguiente?.d ?? 0);
  const clasesHoy = matriz[dia].filter(Boolean).length;
  const ahoraMin = new Date().getHours() * 60 + new Date().getMinutes();
  const aMin = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3));
  const u = config().unidadActual;
  const sinNotas = asigs.filter((a) => estudiantesDeGrado(a.gradoId).some((e) => notaDe(e.id, a.id, u) === null));
  const guias = obtener('grados').filter((g) => g.guiaId === m.id);
  const esDiaHabil = new Date().getDay() > 0 && new Date().getDay() < 6;
  const pendientesAsis = guias.filter((g) => esDiaHabil && !porId('asistencia', `${g.id}|${hoy()}`));
  const tareasConEntregas = obtener('tareas').filter((t) => porCalificar.some((e) => e.tareaId === t.id));
  const mensajes = noLeidos(ctx.usuario);

  ctx.vista.innerHTML = `
    <div class="hero">
      ${avatar(ctx.usuario.nombre, ctx.usuario.color, 'lg')}
      <div><h2>${saludo()}, ${escapar(tituloMaestro(m))}! 👋</h2>
        <p>${mom.hoy >= 0 ? `Hoy tienes ${clasesHoy} clase${clasesHoy === 1 ? '' : 's'}.` : 'Es fin de semana: buen momento para planificar.'} ¡Gracias por inspirar a tus estudiantes!</p>
        <div class="hero-chips"><span>📚 ${escapar(m.especialidad)}</span>${guias.map((g) => `<span>⭐ Guía de ${escapar(nombreGrado(g))}</span>`).join('')}${mensajes ? `<span>💬 ${mensajes} mensaje${mensajes > 1 ? 's' : ''} sin leer</span>` : ''}</div></div>
    </div>
    <div class="grid g4 mb">
      ${stat({ icono: '📚', etiqueta: 'Mis clases', valor: String(asigs.length), nota: `${gradosDeMaestro(m.id).length} secciones` })}
      ${stat({ icono: '👥', etiqueta: 'Estudiantes', valor: String(alumnos), nota: 'En todas tus clases', tono: 'azul' })}
      ${stat({ icono: '📥', etiqueta: 'Por calificar', valor: String(porCalificar.length), nota: 'Entregas de tareas', tono: porCalificar.length ? 'ambar' : 'verde' })}
      ${stat({ icono: '📊', etiqueta: 'Promedio de mis clases', valor: fmtNota(promedio(asigs.map((a) => promedioAsignacion(a.id))), 1), tono: 'morado' })}
    </div>
    <div class="grid g-2-1 mb">
      ${tarjeta(`${icono('reloj')} ${mom.hoy >= 0 ? 'Mi día' : 'Próximo día de clases'}`, matriz[dia].some(Boolean) ? `<div class="timeline">${matriz[dia].map((a, p) => {
        if (!a) return `<div class="tl-item pasada"><span class="tl-hora">${PERIODOS[p].inicio}<small>${PERIODOS[p].fin}</small></span><span class="stat-nota">Periodo libre</span></div>`;
        const c = curso(a.cursoId)!; const per = PERIODOS[p];
        const est = mom.hoy < 0 ? '' : ahoraMin >= aMin(per.fin) ? 'pasada' : ahoraMin >= aMin(per.inicio) ? 'activa' : '';
        return `<div class="tl-item ${est}" style="--c:${c.color}"><span class="tl-hora">${per.inicio}<small>${per.fin}</small></span><span class="curso-icono" style="--c:${c.color}">${c.icono}</span>
          <div style="flex:1"><strong>${escapar(nombreGrado(grado(a.gradoId)))}</strong><small class="stat-nota" style="display:block">${escapar(c.nombre)} · ${grado(a.gradoId)?.aula}</small></div>${est === 'activa' ? badge('Ahora', 'rol') : ''}</div>`;
      }).join('')}</div>` : vacio('☕', 'Sin clases este día'), `<a class="enlace" href="${ruta('/maestro/horario')}">Horario ${icono('derecha', 14)}</a>`)}
      ${tarjeta(`${icono('alerta')} Pendientes`, `<div class="lista">
        ${pendientesAsis.map((g) => `<a class="lista-item" href="${ruta('/maestro/asistencia')}"><span class="curso-icono" style="--c:#059669">🙋</span><div class="crece"><strong>Tomar asistencia de hoy</strong><small>${escapar(nombreGrado(g))}</small></div>${icono('derecha', 16)}</a>`).join('')}
        ${tareasConEntregas.slice(0, 4).map((t) => `<a class="lista-item" href="${ruta(`/maestro/tareas?t=${t.id}`)}"><span class="curso-icono" style="--c:#d97706">📥</span><div class="crece"><strong>${escapar(t.titulo)}</strong><small>${porCalificar.filter((e) => e.tareaId === t.id).length} por calificar · ${escapar(nombreGrado(grado(porId('asignaciones', t.asignacionId)?.gradoId)))}</small></div>${icono('derecha', 16)}</a>`).join('')}
        ${sinNotas.length ? `<a class="lista-item" href="${ruta('/maestro/calificaciones')}"><span class="curso-icono" style="--c:#7c3aed">📝</span><div class="crece"><strong>Notas de la Unidad ${u} incompletas</strong><small>${sinNotas.length} clase${sinNotas.length > 1 ? 's' : ''} por completar</small></div>${icono('derecha', 16)}</a>` : ''}
        ${!pendientesAsis.length && !tareasConEntregas.length && !sinNotas.length ? vacio('🎉', '¡Todo al día!') : ''}</div>`)}
    </div>
    ${tarjeta(`${icono('libro')} Mis clases`, `<div class="grid g-auto">${asigs.map((a) => tarjetaClase(a)).join('')}</div>`, `<a class="enlace" href="${ruta('/maestro/clases')}">Ver detalle ${icono('derecha', 14)}</a>`, 'mb')}
    ${tarjeta(`${icono('avisos')} Avisos recientes`, `<div class="lista">${anunciosPara(ctx.usuario).slice(0, 3).map((a) => `<a class="lista-item" href="${ruta('/maestro/avisos')}"><span class="curso-icono" style="--c:var(--rol)">📢</span><div class="crece"><strong>${escapar(a.titulo)}</strong><small>${haceTiempo(a.fecha)}</small></div></a>`).join('')}</div>`)}`;
}

function tarjetaClase(a: Asignacion) {
  const c = curso(a.cursoId)!;
  const prom = promedioAsignacion(a.id);
  const nv = nivelNota(prom);
  const n = estudiantesDeGrado(a.gradoId).length;
  return `<div class="curso-card" style="--c:${c.color}">
    <div class="curso-card-cab"><span class="curso-icono" style="--c:${c.color}">${c.icono}</span><div><strong>${escapar(nombreGrado(grado(a.gradoId)))}</strong><small>${escapar(c.nombre)} · ${n} estudiantes</small></div></div>
    <div class="curso-card-pie">${anillo(prom ?? 0, nv.color, fmtNota(prom), 50)}
      <div class="acciones"><a class="btn-icono borde" title="Calificaciones" href="${ruta(`/maestro/calificaciones?c=${a.id}`)}">${icono('notas', 17)}</a>
      <a class="btn-icono borde" title="Asistencia" href="${ruta(`/maestro/asistencia?g=${a.gradoId}`)}">${icono('asistencia', 17)}</a>
      <a class="btn-icono borde" title="Ver clase" href="${ruta(`/maestro/clases?c=${a.id}`)}">${icono('derecha', 17)}</a></div></div></div>`;
}

// ---------- Mis clases ----------
export function clasesMaestro(ctx: Contexto) {
  const asigs = asignacionesDeMaestro(ctx.usuario.refId!);
  const id = new URLSearchParams(location.search).get('c');
  const a = asigs.find((x) => x.id === id);
  if (!a) {
    ctx.vista.innerHTML = `<p class="stat-nota mb">Selecciona una clase para ver a sus estudiantes, su rendimiento y su asistencia.</p><div class="grid g-auto">${asigs.map(tarjetaClase).join('')}</div>`;
    return;
  }
  const c = curso(a.cursoId)!;
  const ests = estudiantesDeGrado(a.gradoId);
  const tareas = obtener('tareas').filter((t) => t.asignacionId === a.id);
  const entregas = obtener('entregas');
  const filas = ests.map((e) => ({
    e, prom: promedioCurso(e.id, a.id),
    entregadas: tareas.filter((t) => entregas.some((x) => x.tareaId === t.id && x.estudianteId === e.id)).length,
    asis: asistenciaDe(e).porcentaje,
  }));
  const dist = [['< 60', 0, 60, '#dc2626'], ['60-69', 60, 70, '#d97706'], ['70-84', 70, 85, '#2563eb'], ['85-100', 85, 101, '#16a34a']] as const;

  ctx.vista.innerHTML = `
    <div class="herramientas mb"><a class="btn btn-secundario btn-sm" href="${ruta('/maestro/clases')}">${icono('izquierda', 16)} Todas mis clases</a>
      <select class="control" id="cambiar" style="margin-left:auto">${opcionesClases(asigs, a.id)}</select></div>
    <div class="hero" style="--rol:${c.color};--rol-2:color-mix(in srgb, ${c.color} 60%, white)">
      <span class="ahora-icono" style="width:64px;height:64px;font-size:2rem">${c.icono}</span>
      <div><h2>${escapar(c.nombre)} · ${escapar(nombreGrado(grado(a.gradoId)))}</h2><p>${ests.length} estudiantes · ${grado(a.gradoId)?.aula} · ${tareas.length} tareas</p></div>
      <div class="hero-derecha">${anillo(promedioAsignacion(a.id) ?? 0, '#fff', fmtNota(promedioAsignacion(a.id), 1), 86)}</div>
    </div>
    <div class="grid g-2-1">
      <section class="card"><div class="card-cabecera"><h2>${icono('usuarios')} Estudiantes</h2>
        <a class="btn btn-suave btn-sm" href="${ruta(`/maestro/calificaciones?c=${a.id}`)}">${icono('notas', 16)} Ingresar notas</a></div>
        <div class="card-cuerpo sin-relleno"><div class="tabla-scroll"><table class="tabla"><thead><tr><th>Estudiante</th><th class="centro">Promedio</th><th class="centro">Tareas</th><th class="centro">Asistencia</th><th></th></tr></thead>
        <tbody>${filas.map((f) => {
          const padre = usuarioDe('padre', f.e.padreId);
          return `<tr><td><div class="persona">${avatar(nombreCompleto(f.e), usuarioDe('estudiante', f.e.id)?.color, 'sm')}<div><strong>${escapar(nombreCompleto(f.e))}</strong><small>${escapar(f.e.carnet)}</small></div></div></td>
          <td class="centro">${f.prom === null ? '—' : `<span class="nota nota-${nivelNota(f.prom).clase}">${fmtNota(f.prom, 1)}</span>`}</td>
          <td class="centro">${f.entregadas}/${tareas.length}</td>
          <td class="centro">${badge(`${f.asis.toFixed(0)}%`, f.asis >= 95 ? 'ok' : f.asis >= 85 ? 'warn' : 'bad')}</td>
          <td class="derecha">${padre ? `<a class="btn-icono borde" title="Escribir al encargado" href="${ruta(`/maestro/mensajes?con=${padre.id}`)}">${icono('mensajes', 17)}</a>` : ''}</td></tr>`;
        }).join('')}</tbody></table></div></div></section>
      <div class="pila">
        ${tarjeta(`${icono('grafica')} Distribución de promedios`, graficaBarras(dist.map(([e, min, max, color]) => ({ etiqueta: e, valor: filas.filter((f) => f.prom !== null && f.prom >= min && f.prom < max).length, color, texto: String(filas.filter((f) => f.prom !== null && f.prom >= min && f.prom < max).length) })), Math.max(1, ests.length)))}
        ${tarjeta('⚠️ Necesitan apoyo', filas.filter((f) => f.prom !== null && f.prom < 65).length ? `<div class="lista">${filas.filter((f) => f.prom !== null && f.prom < 65).map((f) => `<div class="lista-item">${avatar(nombreCompleto(f.e), usuarioDe('estudiante', f.e.id)?.color, 'sm')}<div class="crece"><strong>${escapar(nombreCompleto(f.e))}</strong><small>Promedio ${fmtNota(f.prom, 1)} · ${f.entregadas}/${tareas.length} tareas</small></div></div>`).join('')}</div>` : vacio('🌟', 'Todos van bien'))}
      </div>
    </div>`;
  ctx.vista.querySelector<HTMLSelectElement>('#cambiar')!.addEventListener('change', (e) => { location.search = `?c=${(e.target as HTMLSelectElement).value}`; });
}

// ---------- Ingreso de calificaciones ----------
export function calificacionesMaestro(ctx: Contexto) {
  const asigs = asignacionesDeMaestro(ctx.usuario.refId!);
  const params = new URLSearchParams(location.search);
  let asigId = asigs.some((a) => a.id === params.get('c')) ? params.get('c')! : asigs[0]?.id;
  let unidad = config().unidadActual;
  let cambios = new Map<string, number | null>();

  window.addEventListener('beforeunload', (e) => { if (cambios.size) { e.preventDefault(); e.returnValue = ''; } });

  const pintar = () => {
    const a = porId('asignaciones', asigId);
    if (!a) { ctx.vista.innerHTML = vacio('📚', 'No tienes clases asignadas'); return; }
    const ests = estudiantesDeGrado(a.gradoId);
    const valor = (estId: string, u: number) => (u === unidad && cambios.has(estId) ? cambios.get(estId)! : notaDe(estId, a.id, u));

    ctx.vista.innerHTML = `
      <section class="card mb"><div class="card-cuerpo herramientas">
        <label class="campo" style="min-width:280px;flex:1"><span>Clase</span><select class="control" id="clase">${opcionesClases(asigs, a.id)}</select></label>
        <div class="campo"><span>Unidad a calificar</span><div class="segmentado">${UNIDADES.map((u) => `<button type="button" class="${u === unidad ? 'activo' : ''}" data-unidad="${u}">Unidad ${u}</button>`).join('')}</div></div>
      </div></section>
      <div class="grid g4 mb" id="resumen"></div>
      <section class="card"><div class="card-cabecera"><h2>${icono('notas')} ${escapar(nombreAsignacion(a))} · Unidad ${unidad}</h2><span class="stat-nota">Escribe notas de 0 a 100 · Enter para bajar</span></div>
        <div class="card-cuerpo sin-relleno"><div class="tabla-scroll"><table class="tabla">
          <thead><tr><th>#</th><th>Estudiante</th>${UNIDADES.map((u) => `<th class="centro">${u === unidad ? `<span class="badge rol">Unidad ${u}</span>` : `U${u}`}</th>`).join('')}<th class="centro">Promedio</th></tr></thead>
          <tbody>${ests.map((e, i) => `<tr>
            <td class="stat-nota">${i + 1}</td>
            <td><div class="persona">${avatar(nombreCompleto(e), usuarioDe('estudiante', e.id)?.color, 'sm')}<div><strong>${escapar(nombreCompleto(e))}</strong><small>${escapar(e.carnet)}</small></div></div></td>
            ${UNIDADES.map((u) => {
              const v = valor(e.id, u);
              return u === unidad
                ? `<td class="centro"><input class="input-nota ${cambios.has(e.id) ? 'cambiada' : ''}" type="number" min="0" max="100" step="1" inputmode="numeric" data-est="${e.id}" data-fila="${i}" value="${v ?? ''}" placeholder="—" aria-label="Nota de ${escapar(nombreCompleto(e))}" /></td>`
                : `<td class="centro">${v === null ? '<span class="pendiente">—</span>' : `<span class="nota nota-${nivelNota(v).clase}">${v}</span>`}</td>`;
            }).join('')}
            <td class="centro"><strong class="prom" data-prom="${e.id}"></strong></td></tr>`).join('')}</tbody></table></div></div></section>
      <div class="barra-guardar" id="barra" hidden><span id="texto-cambios"></span>
        <button type="button" class="btn btn-secundario btn-sm" id="descartar">Descartar</button>
        <button type="button" class="btn btn-exito btn-sm" id="guardar">${icono('guardar', 16)} Guardar calificaciones</button></div>`;

    const actualizar = () => {
      const notasUnidad = ests.map((e) => valor(e.id, unidad));
      const validas = notasUnidad.filter((n): n is number => n !== null);
      ctx.vista.querySelector('#resumen')!.innerHTML = `
        ${stat({ icono: '📊', etiqueta: `Promedio Unidad ${unidad}`, valor: fmtNota(promedio(validas), 1), tono: 'morado' })}
        ${stat({ icono: '✅', etiqueta: 'Aprobados', valor: String(validas.filter((n) => n >= 60).length), nota: 'Nota ≥ 60', tono: 'verde' })}
        ${stat({ icono: '⚠️', etiqueta: 'Reprobados', valor: String(validas.filter((n) => n < 60).length), nota: 'Nota < 60', tono: 'rojo' })}
        ${stat({ icono: '✏️', etiqueta: 'Sin nota', valor: String(notasUnidad.length - validas.length), nota: `de ${ests.length} estudiantes`, tono: 'ambar' })}`;
      ests.forEach((e) => {
        const p = promedio(UNIDADES.map((u) => valor(e.id, u)));
        const el = ctx.vista.querySelector<HTMLElement>(`[data-prom="${e.id}"]`)!;
        el.textContent = fmtNota(p, 1); el.style.color = nivelNota(p).color;
      });
      const barra = ctx.vista.querySelector<HTMLElement>('#barra')!;
      barra.hidden = !cambios.size;
      ctx.vista.querySelector('#texto-cambios')!.textContent = `Tienes ${cambios.size} cambio${cambios.size === 1 ? '' : 's'} sin guardar`;
    };
    actualizar();

    ctx.vista.querySelectorAll<HTMLInputElement>('.input-nota').forEach((inp) => {
      inp.addEventListener('input', () => {
        const txt = inp.value.trim();
        const n = txt === '' ? null : Number(txt);
        const valido = n === null || (Number.isInteger(n) && n >= 0 && n <= 100);
        inp.classList.toggle('invalida', !valido);
        if (!valido) return;
        const original = notaDe(inp.dataset.est!, a.id, unidad);
        if (n === original) cambios.delete(inp.dataset.est!); else cambios.set(inp.dataset.est!, n);
        inp.classList.toggle('cambiada', cambios.has(inp.dataset.est!));
        actualizar();
      });
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); ctx.vista.querySelector<HTMLInputElement>(`[data-fila="${Number(inp.dataset.fila) + 1}"]`)?.focus(); }
      });
      inp.addEventListener('focus', () => inp.select());
    });

    const cambiarSi = async (accion: () => void) => {
      if (cambios.size && !(await confirmar('Cambios sin guardar', '¿Quieres descartar los cambios que no has guardado?', 'Descartar'))) return;
      cambios = new Map(); accion(); pintar();
    };
    ctx.vista.querySelector<HTMLSelectElement>('#clase')!.addEventListener('change', (e) => { const v = (e.target as HTMLSelectElement).value; cambiarSi(() => { asigId = v; }); });
    ctx.vista.querySelectorAll<HTMLButtonElement>('[data-unidad]').forEach((b) => b.addEventListener('click', () => cambiarSi(() => { unidad = Number(b.dataset.unidad); })));
    ctx.vista.querySelector('#descartar')!.addEventListener('click', () => { cambios = new Map(); pintar(); });
    ctx.vista.querySelector('#guardar')!.addEventListener('click', () => {
      if (ctx.vista.querySelector('.input-nota.invalida')) return aviso('Corrige las notas marcadas en rojo (deben ser de 0 a 100)', 'error');
      const notas = obtenerNotas();
      cambios.forEach((n, estId) => {
        const clave = `${estId}|${a.id}|${unidad}`;
        if (n === null) delete notas[clave]; else notas[clave] = n;
      });
      guardarNotas(notas);
      aviso(`${cambios.size} calificación${cambios.size === 1 ? '' : 'es'} guardada${cambios.size === 1 ? '' : 's'} ✅`);
      cambios = new Map();
      pintar();
    });
  };
  pintar();
}

// ---------- Toma de asistencia ----------
export function asistenciaMaestro(ctx: Contexto) {
  const m = porId('maestros', ctx.usuario.refId)!;
  const secciones = gradosDeMaestro(m.id);
  const params = new URLSearchParams(location.search);
  const guia = obtener('grados').find((g) => g.guiaId === m.id && secciones.some((s) => s.id === g.id));
  let gradoId = secciones.some((g) => g.id === params.get('g')) ? params.get('g')! : guia?.id ?? secciones[0]?.id;
  let fecha = hoy();
  const finDeSemana = (f: string) => [0, 6].includes(aFecha(f).getDay());
  while (finDeSemana(fecha)) fecha = sumarDias(fecha, -1);
  let marcas = new Map<string, 'P' | 'A' | 'T'>();

  const cargar = () => {
    const r = porId('asistencia', `${gradoId}|${fecha}`);
    marcas = new Map(estudiantesDeGrado(gradoId).map((e) => [e.id, r?.ausentes.includes(e.id) ? 'A' : r?.tardes.includes(e.id) ? 'T' : 'P']));
  };

  const pintar = () => {
    const g = grado(gradoId);
    const ests = estudiantesDeGrado(gradoId);
    const registro = porId('asistencia', `${gradoId}|${fecha}`);
    const tomo = registro ? porId('maestros', registro.tomadaPor) : undefined;
    const cuenta = (e: string) => [...marcas.values()].filter((x) => x === e).length;
    const historial = obtener('asistencia').filter((r) => r.gradoId === gradoId).sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 8);
    const masAusencias = ests.map((e) => ({ e, a: asistenciaDe(e) })).sort((x, y) => y.a.ausencias - x.a.ausencias).filter((x) => x.a.ausencias > 0).slice(0, 5);

    ctx.vista.innerHTML = `
      <section class="card mb"><div class="card-cuerpo herramientas">
        <label class="campo" style="min-width:220px"><span>Sección</span><select class="control" id="seccion">${secciones.map((s) => `<option value="${s.id}" ${s.id === gradoId ? 'selected' : ''}>${escapar(nombreGrado(s))}${s.guiaId === m.id ? ' ⭐ (guía)' : ''}</option>`).join('')}</select></label>
        <label class="campo"><span>Fecha</span><input class="control" type="date" id="fecha" value="${fecha}" max="${hoy()}" /></label>
        <div style="margin-left:auto;display:flex;gap:.5rem;align-items:flex-end;align-self:flex-end">
          ${badge(`✅ ${cuenta('P')} presentes`, 'ok')}${badge(`⏰ ${cuenta('T')} tarde`, 'warn')}${badge(`❌ ${cuenta('A')} ausentes`, 'bad')}</div>
      </div></section>
      <div class="grid g-2-1">
        <section class="card"><div class="card-cabecera"><h2>${icono('asistencia')} ${escapar(nombreGrado(g))} · ${fechaLarga(fecha)}</h2>
          <button type="button" class="btn btn-secundario btn-sm" id="todos">${icono('check', 16)} Todos presentes</button></div>
          <div class="card-cuerpo">
            ${finDeSemana(fecha) ? vacio('🏖️', 'Fin de semana', 'No hay clases este día.') : `
            ${registro ? `<div class="alerta verde mb">${icono('check', 18)}<span>Asistencia registrada por ${escapar(tituloMaestro(tomo))}. Puedes corregirla si es necesario.</span></div>` : `<div class="alerta mb">${icono('info', 18)}<span>Aún no se ha tomado la asistencia de este día.</span></div>`}
            <div class="toma-lista">${ests.map((e) => `<div class="toma-fila">
              ${avatar(nombreCompleto(e), usuarioDe('estudiante', e.id)?.color, 'sm')}<div class="crece"><strong>${escapar(nombreCompleto(e))}</strong><small class="stat-nota" style="display:block">${escapar(e.carnet)}</small></div>
              <div class="toma-botones" data-est="${e.id}">${(['P', 'T', 'A'] as const).map((x) => `<button type="button" data-e="${x}" class="${marcas.get(e.id) === x ? 'activo' : ''}">${x === 'P' ? 'Presente' : x === 'T' ? 'Tarde' : 'Ausente'}</button>`).join('')}</div></div>`).join('')}</div>
            <div style="margin-top:1.2rem;display:flex;justify-content:flex-end"><button type="button" class="btn btn-primario" id="guardar">${icono('guardar', 18)} ${registro ? 'Actualizar asistencia' : 'Guardar asistencia'}</button></div>`}
          </div></section>
        <div class="pila">
          ${tarjeta('🗓️ Últimos registros', `<div class="lista">${historial.map((r) => `<button type="button" class="lista-item" style="width:100%;background:none;border-left:none;border-right:none;border-top:none;cursor:pointer;text-align:left" data-ir="${r.fecha}">
            <span class="fecha-caja"><b>${aFecha(r.fecha).getDate()}</b><span>${fechaCorta(r.fecha).split(' ')[1] ?? ''}</span></span>
            <div class="crece"><strong>${relativa(r.fecha)}</strong><small>${r.ausentes.length} ausentes · ${r.tardes.length} tarde</small></div>${badge(`${Math.round(100 - (r.ausentes.length / Math.max(1, ests.length)) * 100)}%`, r.ausentes.length ? 'warn' : 'ok')}</button>`).join('')}</div>`)}
          ${tarjeta('⚠️ Más ausencias', masAusencias.length ? `<div class="lista">${masAusencias.map((x) => `<div class="lista-item">${avatar(nombreCompleto(x.e), usuarioDe('estudiante', x.e.id)?.color, 'sm')}<div class="crece"><strong>${escapar(nombreCompleto(x.e))}</strong><small>${x.a.ausencias} ausencias · ${x.a.porcentaje.toFixed(0)}% asistencia</small></div></div>`).join('')}</div>` : vacio('🌟', 'Sin ausencias'))}
        </div>
      </div>`;

    ctx.vista.querySelector<HTMLSelectElement>('#seccion')!.addEventListener('change', (e) => { gradoId = (e.target as HTMLSelectElement).value; cargar(); pintar(); });
    ctx.vista.querySelector<HTMLInputElement>('#fecha')!.addEventListener('change', (e) => { const v = (e.target as HTMLInputElement).value; if (v) { fecha = v; cargar(); pintar(); } });
    ctx.vista.querySelectorAll<HTMLButtonElement>('[data-ir]').forEach((b) => b.addEventListener('click', () => { fecha = b.dataset.ir!; cargar(); pintar(); }));
    ctx.vista.querySelector('#todos')?.addEventListener('click', () => { ests.forEach((e) => marcas.set(e.id, 'P')); pintar(); });
    ctx.vista.querySelectorAll<HTMLElement>('.toma-botones').forEach((grupo) => grupo.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-e]');
      if (!b) return;
      marcas.set(grupo.dataset.est!, b.dataset.e as 'P' | 'A' | 'T');
      pintar();
    }));
    ctx.vista.querySelector('#guardar')?.addEventListener('click', () => {
      guardarItem('asistencia', {
        id: `${gradoId}|${fecha}`, gradoId, fecha, tomadaPor: m.id,
        ausentes: [...marcas].filter(([, v]) => v === 'A').map(([k]) => k), tardes: [...marcas].filter(([, v]) => v === 'T').map(([k]) => k),
      });
      aviso('Asistencia guardada ✅');
      pintar();
    });
  };
  if (!gradoId) { ctx.vista.innerHTML = vacio('📚', 'No tienes secciones asignadas'); return; }
  cargar(); pintar();
}

// ---------- Tareas del maestro ----------
export function tareasMaestro(ctx: Contexto) {
  const asigs = asignacionesDeMaestro(ctx.usuario.refId!);
  let filtroClase = '';
  let filtroEstado = 'todas';

  const pintar = () => {
    const entregas = obtener('entregas');
    const tareas = obtener('tareas').filter((t) => asigs.some((a) => a.id === t.asignacionId) && (!filtroClase || t.asignacionId === filtroClase))
      .filter((t) => filtroEstado === 'todas' || (filtroEstado === 'abiertas' ? t.entrega >= hoy() : filtroEstado === 'cerradas' ? t.entrega < hoy() : entregas.some((e) => e.tareaId === t.id && e.nota === null)))
      .sort((a, b) => b.entrega.localeCompare(a.entrega));
    ctx.vista.innerHTML = `
      <div class="herramientas mb">
        <select class="control" id="f-clase"><option value="">Todas mis clases</option>${opcionesClases(asigs, filtroClase)}</select>
        <div class="chips">${[['todas', 'Todas'], ['porCalificar', 'Por calificar'], ['abiertas', 'Abiertas'], ['cerradas', 'Cerradas']].map(([id, t]) => `<button type="button" class="chip ${filtroEstado === id ? 'activo' : ''}" data-estado="${id}">${t}</button>`).join('')}</div>
        <button type="button" class="btn btn-primario" id="nueva" style="margin-left:auto">${icono('mas', 18)} Nueva tarea</button>
      </div>
      <div class="pila">${tareas.length ? tareas.map((t) => {
        const a = porId('asignaciones', t.asignacionId)!;
        const c = curso(a.cursoId)!;
        const total = estudiantesDeGrado(a.gradoId).length;
        const ent = entregas.filter((e) => e.tareaId === t.id);
        const calif = ent.filter((e) => e.nota !== null).length;
        return `<article class="tarea" style="--c:${c.color}">
          <div class="tarea-cuerpo">${chipCurso(c.id)} <span class="badge">${escapar(nombreGrado(grado(a.gradoId)))}</span>
            <h3>${escapar(t.titulo)}</h3><p>${escapar(t.descripcion)}</p>
            <div class="tarea-meta"><span class="badge ${t.entrega < hoy() ? 'neutral' : 'info'}">${icono('calendario', 13)} ${t.entrega < hoy() ? 'Cerró' : 'Entrega'} ${relativa(t.entrega).toLowerCase()} · ${fechaCorta(t.entrega)}</span><span>${t.punteo} pts · Unidad ${t.unidad}</span></div>
            <div style="display:flex;gap:1.5rem;margin-top:.8rem;flex-wrap:wrap">
              <div style="min-width:160px"><div class="g-fila-cab"><span class="stat-nota">Entregas</span><strong>${ent.length}/${total}</strong></div>${'<div class="barra"><span style="width:' + (ent.length / Math.max(1, total)) * 100 + '%;background:var(--rol)"></span></div>'}</div>
              <div style="min-width:160px"><div class="g-fila-cab"><span class="stat-nota">Calificadas</span><strong>${calif}/${ent.length}</strong></div>${'<div class="barra"><span style="width:' + (calif / Math.max(1, ent.length)) * 100 + '%;background:#16a34a"></span></div>'}</div>
            </div></div>
          <div class="tarea-lado">
            <div class="acciones">${'<button type="button" class="btn-icono borde" title="Editar" data-editar="' + t.id + '">' + icono('editar', 17) + '</button><button type="button" class="btn-icono borde peligro" title="Eliminar" data-borrar="' + t.id + '">' + icono('borrar', 17) + '</button>'}</div>
            <button type="button" class="btn ${ent.length - calif ? 'btn-primario' : 'btn-secundario'} btn-sm" data-calificar="${t.id}">${icono('notas', 16)} ${ent.length - calif ? `Calificar (${ent.length - calif})` : 'Ver entregas'}</button>
          </div></article>`;
      }).join('') : `<div class="card">${vacio('📝', 'No hay tareas con estos filtros', 'Crea una con "Nueva tarea".')}</div>`}</div>`;

    ctx.vista.querySelector<HTMLSelectElement>('#f-clase')!.addEventListener('change', (e) => { filtroClase = (e.target as HTMLSelectElement).value; pintar(); });
    ctx.vista.querySelectorAll<HTMLButtonElement>('[data-estado]').forEach((b) => b.addEventListener('click', () => { filtroEstado = b.dataset.estado!; pintar(); }));
    ctx.vista.querySelector('#nueva')!.addEventListener('click', () => editar());
    ctx.vista.querySelectorAll<HTMLButtonElement>('[data-editar]').forEach((b) => b.addEventListener('click', () => editar(porId('tareas', b.dataset.editar))));
    ctx.vista.querySelectorAll<HTMLButtonElement>('[data-calificar]').forEach((b) => b.addEventListener('click', () => calificar(b.dataset.calificar!)));
    ctx.vista.querySelectorAll<HTMLButtonElement>('[data-borrar]').forEach((b) => b.addEventListener('click', async () => {
      const t = porId('tareas', b.dataset.borrar)!;
      if (!(await confirmar('¿Eliminar tarea?', `Se eliminará "${t.titulo}" y todas sus entregas.`))) return;
      eliminarItem('tareas', t.id);
      obtener('entregas').filter((e) => e.tareaId === t.id).forEach((e) => eliminarItem('entregas', e.id));
      aviso('Tarea eliminada'); pintar();
    }));
  };

  const editar = (t?: Tarea) => modalFormulario({
    titulo: t ? '✏️ Editar tarea' : '📝 Nueva tarea', textoGuardar: t ? 'Guardar' : 'Publicar tarea',
    campos: `
      ${campo('Clase *', `<select name="asignacionId" required>${opcionesClases(asigs, t?.asignacionId ?? filtroClase)}</select>`, 'completo')}
      ${campo('Título *', `<input name="titulo" required maxlength="80" value="${escapar(t?.titulo ?? '')}" placeholder="Ej. Hoja de trabajo: fracciones" />`, 'completo')}
      ${campo('Instrucciones *', `<textarea name="descripcion" required rows="4">${escapar(t?.descripcion ?? '')}</textarea>`, 'completo')}
      ${campo('Fecha de entrega *', `<input name="entrega" type="date" required value="${t?.entrega ?? sumarDias(hoy(), 7)}" />`)}
      ${campo('Punteo *', `<input name="punteo" type="number" min="1" max="100" required value="${t?.punteo ?? 10}" />`)}
      ${campo('Unidad', `<select name="unidad">${opciones(UNIDADES.map((u) => ({ valor: String(u), texto: `Unidad ${u}` })), String(t?.unidad ?? config().unidadActual))}</select>`)}`,
    alGuardar: (d) => {
      guardarItem('tareas', { id: t?.id ?? nuevoId('t'), asignacionId: d.asignacionId, titulo: d.titulo.trim(), descripcion: d.descripcion.trim(), entrega: d.entrega, punteo: Number(d.punteo), unidad: Number(d.unidad), creada: t?.creada ?? hoy() });
      aviso(t ? 'Tarea actualizada' : 'Tarea publicada 📝 Tus estudiantes ya pueden verla');
      pintar();
    },
  });

  const calificar = (tareaId: string) => {
    const t = porId('tareas', tareaId)!;
    const a = porId('asignaciones', t.asignacionId)!;
    const ests = estudiantesDeGrado(a.gradoId);
    const entregas = obtener('entregas').filter((e) => e.tareaId === t.id);
    const d = abrirModal({
      titulo: `📥 ${escapar(t.titulo)}`, ancho: 'lg',
      cuerpo: `<p class="stat-nota mb">${escapar(nombreAsignacion(a))} · ${t.punteo} puntos · Entrega ${fechaMedia(t.entrega)}</p>
        <div class="tabla-scroll"><table class="tabla"><thead><tr><th>Estudiante</th><th>Entrega</th><th class="centro">Nota (/${t.punteo})</th><th>Comentario</th></tr></thead>
        <tbody>${ests.map((e) => {
          const en = entregas.find((x) => x.estudianteId === e.id);
          return `<tr><td><div class="persona">${avatar(nombreCompleto(e), usuarioDe('estudiante', e.id)?.color, 'sm')}<div><strong>${escapar(nombreCompleto(e))}</strong>${en ? `<small>${haceTiempo(en.fecha)}${en.fecha.slice(0, 10) > t.entrega ? ' · tardía' : ''}</small>` : ''}</div></div></td>
            <td style="max-width:260px">${en ? `<small>${escapar(en.texto)}</small>${en.enlace ? `<br><a class="enlace" href="${escapar(en.enlace)}" target="_blank" rel="noopener">${icono('enlace', 14)} Archivo</a>` : ''}` : badge('Sin entregar', 'bad')}</td>
            <td class="centro">${en ? `<input class="input-nota" type="number" min="0" max="${t.punteo}" data-entrega="${en.id}" value="${en.nota ?? ''}" placeholder="—" />` : '—'}</td>
            <td>${en ? `<input class="control" data-comentario="${en.id}" value="${escapar(en.comentario)}" placeholder="Ej. ¡Buen trabajo!" />` : ''}</td></tr>`;
        }).join('')}</tbody></table></div>`,
      pie: `<button type="button" class="btn btn-secundario" data-cerrar>Cerrar</button><button type="button" class="btn btn-primario" id="guardar-notas">${icono('guardar', 16)} Guardar notas</button>`,
    });
    d.querySelector('#guardar-notas')!.addEventListener('click', () => {
      let errores = 0; let guardadas = 0;
      d.querySelectorAll<HTMLInputElement>('[data-entrega]').forEach((inp) => {
        const en = porId('entregas', inp.dataset.entrega)!;
        const txt = inp.value.trim();
        const n = txt === '' ? null : Number(txt);
        if (n !== null && (Number.isNaN(n) || n < 0 || n > t.punteo)) { errores++; inp.classList.add('invalida'); return; }
        const comentario = d.querySelector<HTMLInputElement>(`[data-comentario="${en.id}"]`)!.value.trim();
        if (n !== en.nota || comentario !== en.comentario) { guardarItem('entregas', { ...en, nota: n, comentario }); guardadas++; }
      });
      if (errores) return aviso(`Revisa ${errores} nota${errores > 1 ? 's' : ''}: deben ir de 0 a ${t.punteo}`, 'error');
      d.close();
      aviso(guardadas ? `${guardadas} entrega${guardadas > 1 ? 's' : ''} calificada${guardadas > 1 ? 's' : ''} ✅` : 'Sin cambios');
      pintar();
    });
  };

  pintar();
  const abrir = new URLSearchParams(location.search).get('t');
  if (abrir && porId('tareas', abrir)) calificar(abrir);
}


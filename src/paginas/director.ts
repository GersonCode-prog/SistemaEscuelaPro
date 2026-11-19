// ============================================================
//  PORTAL DE DIRECCIÓN — Panel general y reportes
// ============================================================
import type { Contexto } from '../lib/app';
import { obtener, porId, config } from '../lib/datos';
import {
  estudiantesActivos, gradosOrdenados, nombreGrado, grado, promedioGeneral, promedioGrado, asistenciaDeGrado, cursosEnRiesgo,
  nivelNota, fmtNota, nombreCompleto, usuarioDe, promedioAsignacion, asignacionesDeGrado, curso, promedio, estudiantesDeGrado,
  estadoPago, UNIDADES, asistenciaDe, promedioUnidad, registrosDeGrado,
} from '../lib/escuela';
import { stat, tarjeta, vacio, badge, avatar, graficaBarras, barrasH, dona, graficaLinea, anillo } from '../lib/vistas';
import { escapar, fechaLarga, monedaCorta, relativa, aFecha, MESES, hoy, fechaCorta } from '../lib/formato';
import { icono } from '../lib/iconos';
import { ruta } from '../lib/ruta';
import { descargar, aCSV } from '../lib/ui';
import { fichaEstudiante } from './gestion';

// Asistencia promedio por semana (últimas 8 semanas) de todo el colegio
function asistenciaSemanal() {
  const registros = obtener('asistencia');
  const total = estudiantesActivos().length / Math.max(1, gradosOrdenados().length);
  const porSemana = new Map<string, { aus: number; dias: number }>();
  registros.forEach((r) => {
    const d = aFecha(r.fecha); const lunes = new Date(d); lunes.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const k = lunes.toISOString().slice(0, 10);
    const s = porSemana.get(k) ?? { aus: 0, dias: 0 };
    s.aus += r.ausentes.length; s.dias += 1; porSemana.set(k, s);
  });
  return [...porSemana.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-8)
    .map(([k, s]) => ({ semana: fechaCorta(k), pct: 100 - (s.aus / Math.max(1, s.dias * total)) * 100 }));
}

export function inicioDirector(ctx: Contexto) {
  const cfg = config();
  const ests = estudiantesActivos();
  const proms = ests.map((e) => ({ e, p: promedioGeneral(e) })).filter((x) => x.p !== null) as { e: typeof ests[number]; p: number }[];
  const general = promedio(proms.map((x) => x.p));
  const grados = gradosOrdenados();
  const asisGeneral = promedio(grados.map((g) => asistenciaDeGrado(g.id).porcentaje));
  const riesgo = ests.map((e) => ({ e, r: cursosEnRiesgo(e) })).filter((x) => x.r.length).sort((a, b) => b.r.length - a.r.length);
  const filasCurso = obtener('asignaciones');
  const aprobacion = (() => { const vals = ests.flatMap((e) => asignacionesDeGrado(e.gradoId).map((a) => promedio([1, 2, 3, 4].map((u) => obtenerNota(e.id, a.id, u))))).filter((x): x is number => x !== null); return vals.length ? (vals.filter((v) => v >= 60).length / vals.length) * 100 : 0; })();
  const honor = [...proms].sort((a, b) => b.p - a.p).slice(0, 5);
  const bins = [['< 60', 0, 60, '#dc2626'], ['60–69', 60, 70, '#d97706'], ['70–84', 70, 85, '#2563eb'], ['85–100', 85, 101, '#16a34a']] as const;
  const vencidos = obtener('pagos').filter((p) => estadoPago(p) === 'Vencido');
  const familiasMorosas = new Set(vencidos.map((p) => porId('estudiantes', p.estudianteId)?.padreId)).size;
  const semanas = asistenciaSemanal();
  const eventos = obtener('eventos').filter((e) => e.fecha >= hoy()).sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, 4);
  const cursosProm = obtener('cursos').map((c) => ({ c, p: promedio(filasCurso.filter((a) => a.cursoId === c.id).map((a) => promedioAsignacion(a.id))) }));

  ctx.vista.innerHTML = `
    <div class="hero">
      <div><h2>Panel de Dirección 🏫</h2><p>${escapar(cfg.colegio)} · Ciclo ${cfg.ciclo} · Unidad ${cfg.unidadActual}</p>
        <div class="hero-chips"><span>📅 ${fechaLarga(hoy())}</span><span>🎓 ${ests.length} estudiantes</span><span>👩‍🏫 ${obtener('maestros').length} docentes</span></div></div>
      <div class="hero-derecha">${anillo(general ?? 0, '#fff', fmtNota(general, 1), 96)}<div><p style="font-weight:800;font-size:1.1rem">Promedio<br>institucional</p></div></div>
    </div>
    <div class="grid g4 mb">
      ${stat({ icono: '📊', etiqueta: 'Promedio general', valor: fmtNota(general, 1), nota: nivelNota(general).texto })}
      ${stat({ icono: '✅', etiqueta: 'Aprobación de cursos', valor: `${aprobacion.toFixed(1)}%`, nota: 'Cursos con promedio ≥ 60', tono: 'verde' })}
      ${stat({ icono: '🙋', etiqueta: 'Asistencia promedio', valor: `${(asisGeneral ?? 0).toFixed(1)}%`, nota: 'Últimos 40 días', tono: 'azul' })}
      ${stat({ icono: '⚠️', etiqueta: 'En riesgo académico', valor: String(riesgo.length), nota: `${((riesgo.length / Math.max(1, ests.length)) * 100).toFixed(0)}% de los estudiantes`, tono: 'rojo' })}
    </div>
    <div class="grid g-2-1 mb">
      ${tarjeta(`${icono('grafica')} Promedio por grado`, graficaBarras(grados.map((g) => { const p = promedioGrado(g.id) ?? 0; return { etiqueta: g.nombre.replace(' Primaria', ' Prim.').replace(' Básico', ' Bás.'), valor: p, color: nivelNota(p).color, texto: p.toFixed(1) }; })), `<a class="enlace" href="${ruta('/director/reportes')}">Reportes ${icono('derecha', 14)}</a>`)}
      ${tarjeta('🎯 Distribución de promedios', dona(bins.map(([e, min, max, color]) => ({ etiqueta: e, valor: proms.filter((x) => x.p >= min && x.p < max).length, color })), String(proms.length), 'estudiantes'))}
    </div>
    <div class="grid g2 mb">
      ${tarjeta(`${icono('asistencia')} Asistencia por semana`, graficaLinea([{ nombre: 'Asistencia del colegio (%)', color: 'var(--rol)', valores: semanas.map((s) => s.pct) }], semanas.map((s) => s.semana), 85, 100))}
      ${tarjeta(`${icono('libro')} Promedio por curso`, barrasH(cursosProm.map(({ c, p }) => ({ etiqueta: c.nombre, icono: c.icono, valor: p ?? 0, max: 100, color: c.color, texto: fmtNota(p, 1) }))))}
    </div>
    <div class="grid g3">
      ${tarjeta(`${icono('trofeo')} Cuadro de honor`, `<div class="lista">${honor.map((x, i) => `<button type="button" class="lista-item" data-ficha="${x.e.id}" style="width:100%;background:none;border-left:none;border-right:none;border-top:none;cursor:pointer;text-align:left">
        <span style="font-size:1.3rem;width:28px;text-align:center">${['🥇', '🥈', '🥉', '🏅', '🏅'][i]}</span>${avatar(nombreCompleto(x.e), usuarioDe('estudiante', x.e.id)?.color, 'sm')}
        <div class="crece"><strong>${escapar(nombreCompleto(x.e))}</strong><small>${escapar(nombreGrado(grado(x.e.gradoId)))}</small></div><span class="nota nota-ok">${x.p.toFixed(1)}</span></button>`).join('')}</div>`)}
      ${tarjeta('⚠️ Estudiantes en riesgo', riesgo.length ? `<div class="lista">${riesgo.slice(0, 6).map((x) => `<button type="button" class="lista-item" data-ficha="${x.e.id}" style="width:100%;background:none;border-left:none;border-right:none;border-top:none;cursor:pointer;text-align:left">
        ${avatar(nombreCompleto(x.e), usuarioDe('estudiante', x.e.id)?.color, 'sm')}<div class="crece"><strong>${escapar(nombreCompleto(x.e))}</strong><small>${escapar(grado(x.e.gradoId)?.nombre ?? '')} · ${x.r.map((r) => r.curso.corto).join(', ')}</small></div>${badge(`${x.r.length} curso${x.r.length > 1 ? 's' : ''}`, 'bad')}</button>`).join('')}</div>` : vacio('🌟', 'Ningún estudiante en riesgo'),
        `<a class="enlace" href="${ruta('/director/estudiantes')}">Ver todos ${icono('derecha', 14)}</a>`)}
      <div class="pila">
        ${tarjeta(`${icono('pagos')} Morosidad`, `<p class="stat-valor" style="color:var(--rojo)">${monedaCorta(vencidos.reduce((s, p) => s + p.monto, 0))}</p><p class="stat-nota">${vencidos.length} cuotas vencidas · ${familiasMorosas} familias</p>`)}
        ${tarjeta(`${icono('calendario')} Próximos eventos`, `<div class="lista">${eventos.map((e) => `<div class="lista-item"><span class="fecha-caja"><b>${aFecha(e.fecha).getDate()}</b><span>${MESES[aFecha(e.fecha).getMonth()].slice(0, 3)}</span></span><div class="crece"><strong>${escapar(e.titulo)}</strong><small>${relativa(e.fecha)}</small></div></div>`).join('')}</div>`)}
      </div>
    </div>`;
  ctx.vista.querySelectorAll<HTMLElement>('[data-ficha]').forEach((b) => b.addEventListener('click', () => fichaEstudiante(b.dataset.ficha!, ctx.rol)));
}

import { notaDe as obtenerNota } from '../lib/escuela';

// ---------- Reportes ----------
export function reportesDirector(ctx: Contexto) {
  let pestana = 0;
  let gradoId = gradosOrdenados()[0].id;
  let cursoId = obtener('cursos')[0].id;

  const pintar = () => {
    let cuerpo = ''; let csv: (string | number)[][] = [];
    if (pestana === 0) {
      const asigs = asignacionesDeGrado(gradoId);
      const ests = estudiantesDeGrado(gradoId);
      const filas = asigs.map((a) => ({ a, c: curso(a.cursoId)!, u: UNIDADES.map((u) => promedioAsignacion(a.id, u)), p: promedioAsignacion(a.id) }));
      const ranking = ests.map((e) => ({ e, p: promedioGeneral(e) })).sort((x, y) => (y.p ?? 0) - (x.p ?? 0));
      csv = [['Curso', 'Unidad 1', 'Unidad 2', 'Unidad 3', 'Unidad 4', 'Promedio'], ...filas.map((f) => [f.c.nombre, ...f.u.map((v) => fmtNota(v, 1)), fmtNota(f.p, 1)])];
      cuerpo = `<div class="grid g-2-1">
        <section class="card"><div class="card-cabecera"><h2>📚 Promedios por curso · ${escapar(nombreGrado(grado(gradoId)))}</h2></div><div class="card-cuerpo sin-relleno"><div class="tabla-scroll"><table class="tabla">
          <thead><tr><th>Curso</th>${UNIDADES.map((u) => `<th class="centro">U${u}</th>`).join('')}<th class="centro">Promedio</th></tr></thead>
          <tbody>${filas.map((f) => `<tr><td><div class="celda-curso"><span class="curso-icono" style="--c:${f.c.color}">${f.c.icono}</span><strong>${escapar(f.c.nombre)}</strong></div></td>${f.u.map((v) => `<td class="centro">${v === null ? '<span class="pendiente">—</span>' : `<span class="nota nota-${nivelNota(v).clase}">${v.toFixed(1)}</span>`}</td>`).join('')}<td class="centro"><strong class="prom" style="color:${nivelNota(f.p).color}">${fmtNota(f.p, 1)}</strong></td></tr>`).join('')}</tbody>
        </table></div></div></section>
        ${tarjeta('🏅 Ranking de la sección', `<div class="lista">${ranking.map((x, i) => `<button type="button" class="lista-item" data-ficha="${x.e.id}" style="width:100%;background:none;border-left:none;border-right:none;border-top:none;cursor:pointer;text-align:left"><span class="stat-nota" style="width:22px">${i + 1}</span>${avatar(nombreCompleto(x.e), usuarioDe('estudiante', x.e.id)?.color, 'xs')}<div class="crece"><strong>${escapar(nombreCompleto(x.e))}</strong></div><span class="nota nota-${nivelNota(x.p).clase}">${fmtNota(x.p, 1)}</span></button>`).join('')}</div>`)}
      </div>
      ${tarjeta('📈 Evolución del promedio por unidad', graficaLinea([{ nombre: nombreGrado(grado(gradoId)), color: 'var(--rol)', valores: UNIDADES.map((u) => promedio(ests.map((e) => promedioUnidad(e, u)))) },
        { nombre: 'Promedio del colegio', color: '#94a3b8', valores: UNIDADES.map((u) => promedio(estudiantesActivos().map((e) => promedioUnidad(e, u)))), punteada: true }], ['Unidad 1', 'Unidad 2', 'Unidad 3', 'Unidad 4']), '', 'mb')}`;
    } else if (pestana === 1) {
      const c = curso(cursoId)!;
      const grados = gradosOrdenados();
      const filas = grados.map((g) => { const a = obtener('asignaciones').find((x) => x.gradoId === g.id && x.cursoId === cursoId)!; return { g, a, m: porId('maestros', a?.maestroId), u: UNIDADES.map((u) => promedioAsignacion(a.id, u)), p: promedioAsignacion(a.id) }; });
      csv = [['Sección', 'Maestro', 'Unidad 1', 'Unidad 2', 'Unidad 3', 'Unidad 4', 'Promedio'], ...filas.map((f) => [nombreGrado(f.g), nombreCompleto(f.m), ...f.u.map((v) => fmtNota(v, 1)), fmtNota(f.p, 1)])];
      cuerpo = `<div class="grid g-2-1">
        ${tarjeta(`${c.icono} ${escapar(c.nombre)} por sección`, graficaBarras(filas.map((f) => ({ etiqueta: f.g.nombre.replace(' Primaria', ' P.').replace(' Básico', ' B.'), valor: f.p ?? 0, color: c.color, texto: fmtNota(f.p, 1) }))))}
        ${tarjeta('👩‍🏫 Docentes del curso', `<div class="lista">${[...new Set(filas.map((f) => f.m?.id))].map((id) => { const m = porId('maestros', id)!; return `<div class="lista-item">${avatar(nombreCompleto(m), usuarioDe('maestro', m.id)?.color, 'sm')}<div class="crece"><strong>${escapar(nombreCompleto(m))}</strong><small>${filas.filter((f) => f.m?.id === id).map((f) => f.g.nombre).join(', ')}</small></div></div>`; }).join('')}</div>`)}
      </div>
      <section class="card mb" style="margin-top:1.25rem"><div class="card-cuerpo sin-relleno"><div class="tabla-scroll"><table class="tabla"><thead><tr><th>Sección</th><th>Docente</th>${UNIDADES.map((u) => `<th class="centro">U${u}</th>`).join('')}<th class="centro">Promedio</th></tr></thead>
        <tbody>${filas.map((f) => `<tr><td><strong>${escapar(nombreGrado(f.g))}</strong></td><td>${escapar(nombreCompleto(f.m))}</td>${f.u.map((v) => `<td class="centro">${v === null ? '<span class="pendiente" title="Pendiente de ingresar">—</span>' : `<span class="nota nota-${nivelNota(v).clase}">${v.toFixed(1)}</span>`}</td>`).join('')}<td class="centro"><strong class="prom" style="color:${nivelNota(f.p).color}">${fmtNota(f.p, 1)}</strong></td></tr>`).join('')}</tbody></table></div></div></section>`;
    } else {
      const grados = gradosOrdenados();
      const filas = grados.map((g) => { const a = asistenciaDeGrado(g.id); const ests = estudiantesDeGrado(g.id); return { g, a, criticos: ests.filter((e) => asistenciaDe(e).ausencias >= 3), ultimo: registrosDeGrado(g.id).at(-1) }; });
      csv = [['Sección', 'Asistencia %', 'Ausencias', 'Tardanzas', 'Estudiantes con 3+ ausencias'], ...filas.map((f) => [nombreGrado(f.g), f.a.porcentaje.toFixed(1), f.a.ausencias, f.a.tardanzas, f.criticos.length])];
      cuerpo = `<div class="grid g-2-1">
        <section class="card"><div class="card-cuerpo sin-relleno"><div class="tabla-scroll"><table class="tabla"><thead><tr><th>Sección</th><th class="centro">Asistencia</th><th class="centro">Ausencias</th><th class="centro">Tardanzas</th><th>Último registro</th></tr></thead>
          <tbody>${filas.map((f) => `<tr><td><strong>${escapar(nombreGrado(f.g))}</strong><small class="stat-nota" style="display:block">Guía: ${escapar(nombreCompleto(porId('maestros', f.g.guiaId)))}</small></td>
            <td class="centro">${badge(`${f.a.porcentaje.toFixed(1)}%`, f.a.porcentaje >= 95 ? 'ok' : f.a.porcentaje >= 90 ? 'warn' : 'bad')}</td><td class="centro">${f.a.ausencias}</td><td class="centro">${f.a.tardanzas}</td>
            <td>${f.ultimo ? relativa(f.ultimo.fecha) : '—'}</td></tr>`).join('')}</tbody></table></div></div></section>
        ${tarjeta('🚩 Con 3 o más ausencias', `<div class="lista">${filas.flatMap((f) => f.criticos).map((e) => `<button type="button" class="lista-item" data-ficha="${e.id}" style="width:100%;background:none;border-left:none;border-right:none;border-top:none;cursor:pointer;text-align:left">${avatar(nombreCompleto(e), usuarioDe('estudiante', e.id)?.color, 'sm')}<div class="crece"><strong>${escapar(nombreCompleto(e))}</strong><small>${escapar(grado(e.gradoId)?.nombre ?? '')} · ${asistenciaDe(e).ausencias} ausencias</small></div></button>`).join('') || vacio('🌟', 'Nadie con 3+ ausencias')}</div>`)}
      </div>`;
    }

    ctx.vista.innerHTML = `
      <div class="tabs">${['Rendimiento por grado', 'Rendimiento por curso', 'Asistencia'].map((t, i) => `<button type="button" class="tab ${i === pestana ? 'activo' : ''}" data-tab="${i}">${t}</button>`).join('')}</div>
      <div class="herramientas mb">
        ${pestana === 0 ? `<select class="control" id="sel-grado">${gradosOrdenados().map((g) => `<option value="${g.id}" ${g.id === gradoId ? 'selected' : ''}>${escapar(nombreGrado(g))}</option>`).join('')}</select>` : ''}
        ${pestana === 1 ? `<select class="control" id="sel-curso">${obtener('cursos').map((c) => `<option value="${c.id}" ${c.id === cursoId ? 'selected' : ''}>${c.icono} ${escapar(c.nombre)}</option>`).join('')}</select>` : ''}
        <div style="margin-left:auto" class="herramientas"><button type="button" class="btn btn-secundario btn-sm" id="csv">${icono('descargar', 16)} Descargar CSV</button></div>
      </div>
      ${cuerpo}`;

    ctx.vista.querySelectorAll<HTMLElement>('[data-tab]').forEach((b) => b.addEventListener('click', () => { pestana = Number(b.dataset.tab); pintar(); }));
    ctx.vista.querySelector('#sel-grado')?.addEventListener('change', (e) => { gradoId = (e.target as HTMLSelectElement).value; pintar(); });
    ctx.vista.querySelector('#sel-curso')?.addEventListener('change', (e) => { cursoId = (e.target as HTMLSelectElement).value; pintar(); });
    ctx.vista.querySelector('#csv')!.addEventListener('click', () => descargar(`reporte-${['grado', 'curso', 'asistencia'][pestana]}.csv`, aCSV(csv), 'text/csv'));
    ctx.vista.querySelectorAll<HTMLElement>('[data-ficha]').forEach((b) => b.addEventListener('click', () => fichaEstudiante(b.dataset.ficha!, ctx.rol)));
  };
  pintar();
}

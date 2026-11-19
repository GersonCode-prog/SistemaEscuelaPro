// ============================================================
//  PORTAL DEL ESTUDIANTE — Inicio
// ============================================================
import type { Contexto } from '../lib/app';
import { obtener, porId, config } from '../lib/datos';
import {
  boleta, promedioGeneral, nivelNota, fmtNota, nombreGrado, grado, asistenciaDe, tareasPorHacer, horarioDeGrado,
  momentoDeClase, PERIODOS, curso, tituloMaestro, anunciosPara, noLeidos, estudiantesDeGrado,
} from '../lib/escuela';
import { stat, anillo, tarjeta, vacio, badge, avatar } from '../lib/vistas';
import { escapar, saludo, relativa, haceTiempo, aFecha, MESES, hoy } from '../lib/formato';
import { icono } from '../lib/iconos';
import { ruta } from '../lib/ruta';

export function inicioEstudiante(ctx: Contexto) {
  const est = ctx.estudiante!;
  const filas = boleta(est);
  const general = promedioGeneral(est);
  const asis = asistenciaDe(est);
  const porHacer = tareasPorHacer(est);
  const matriz = horarioDeGrado(est.gradoId);
  const m = momentoDeClase(matriz);
  const g = grado(est.gradoId);
  const ranking = estudiantesDeGrado(est.gradoId).map((e) => ({ id: e.id, p: promedioGeneral(e) ?? 0 })).sort((a, b) => b.p - a.p);
  const puesto = ranking.findIndex((r) => r.id === est.id) + 1;
  const diaMostrado = m.hoy >= 0 ? m.hoy : (m.siguiente?.d ?? 0);
  const ahoraMin = new Date().getHours() * 60 + new Date().getMinutes();
  const aMin = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3));
  const avisos = anunciosPara(ctx.usuario).slice(0, 3);
  const eventos = obtener('eventos').filter((e) => e.fecha >= hoy()).sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, 4);
  const mensajes = noLeidos(ctx.usuario);
  const frases = ['Cada día es una nueva oportunidad para aprender. 🚀', '¡Tú puedes con todo lo que te propongas! 💪', 'El esfuerzo de hoy es el éxito de mañana. 🌟'];

  ctx.vista.innerHTML = `
    <div class="hero">
      ${avatar(ctx.usuario.nombre, ctx.usuario.color, 'lg')}
      <div><h2>${saludo()}, ${escapar(est.nombres.split(' ')[0])}! 👋</h2>
        <p>${frases[new Date().getDate() % frases.length]}</p>
        <div class="hero-chips"><span>🎓 ${escapar(nombreGrado(g))}</span><span>🪪 ${escapar(est.carnet)}</span><span>📅 Unidad ${config().unidadActual}</span>${mensajes ? `<span>💬 ${mensajes} mensaje${mensajes > 1 ? 's' : ''} nuevo${mensajes > 1 ? 's' : ''}</span>` : ''}</div></div>
      <div class="hero-derecha">${anillo(general ?? 0, '#fff', fmtNota(general, 1), 96)}</div>
    </div>

    <div class="grid g4 mb">
      ${stat({ icono: '📊', etiqueta: 'Promedio general', valor: fmtNota(general, 1), nota: nivelNota(general).texto })}
      ${stat({ icono: '🏅', etiqueta: 'Posición en tu grado', valor: `#${puesto}`, nota: `de ${ranking.length} estudiantes`, tono: 'morado' })}
      ${stat({ icono: '✅', etiqueta: 'Asistencia', valor: `${asis.porcentaje.toFixed(0)}%`, nota: `${asis.ausencias} ausencias · ${asis.tardanzas} tardes`, tono: 'verde' })}
      ${stat({ icono: '📝', etiqueta: 'Tareas por entregar', valor: String(porHacer.length), nota: porHacer.some((t) => t.estado === 'Atrasada') ? 'Tienes tareas atrasadas' : 'Ninguna atrasada', tono: porHacer.some((t) => t.estado === 'Atrasada') ? 'rojo' : 'ambar' })}
    </div>

    <div class="grid g-2-1 mb">
      ${tarjeta(`${icono('reloj')} ${m.hoy >= 0 ? 'Tus clases de hoy' : `Clases del ${['lunes', 'martes', 'miércoles', 'jueves', 'viernes'][diaMostrado]}`}`, `<div class="timeline">${matriz[diaMostrado].map((a, p) => {
        if (!a) return '';
        const c = curso(a.cursoId)!; const per = PERIODOS[p];
        const estado = m.hoy < 0 ? '' : ahoraMin >= aMin(per.fin) ? 'pasada' : ahoraMin >= aMin(per.inicio) ? 'activa' : '';
        return `<div class="tl-item ${estado}" style="--c:${c.color}"><span class="tl-hora">${per.inicio}<small>${per.fin}</small></span>
          <span class="curso-icono" style="--c:${c.color}">${c.icono}</span><div class="crece" style="flex:1"><strong>${escapar(c.nombre)}</strong><small class="stat-nota" style="display:block">${escapar(tituloMaestro(porId('maestros', a.maestroId)))} · ${g?.aula}</small></div>
          ${estado === 'activa' ? badge('Ahora', 'rol') : estado === 'pasada' ? '<span class="stat-nota">✓</span>' : ''}</div>`;
      }).join('')}</div>`, `<a class="enlace" href="${ruta('/estudiante/horario')}">Ver semana ${icono('derecha', 14)}</a>`)}
      ${tarjeta(`${icono('tareas')} Próximas entregas`, porHacer.length ? `<div class="lista">${porHacer.slice(0, 5).map((t) => `
        <div class="lista-item"><span class="curso-icono" style="--c:${t.curso.color}">${t.curso.icono}</span>
        <div class="crece"><strong>${escapar(t.tarea.titulo)}</strong><small>${escapar(t.curso.corto)} · ${t.tarea.punteo} pts</small></div>
        ${badge(t.estado === 'Atrasada' ? 'Atrasada' : relativa(t.tarea.entrega), t.estado === 'Atrasada' ? 'bad' : 'info')}</div>`).join('')}</div>`
        : vacio('🎉', '¡Estás al día!', 'No tienes tareas pendientes.'), `<a class="enlace" href="${ruta('/estudiante/tareas')}">Ver todas ${icono('derecha', 14)}</a>`)}
    </div>

    ${tarjeta(`${icono('libro')} Mis cursos`, `<div class="grid g-auto">${filas.map((f) => {
      const nv = nivelNota(f.promedio);
      return `<a class="curso-card" href="${ruta('/estudiante/calificaciones')}" style="--c:${f.curso.color}">
        <div class="curso-card-cab"><span class="curso-icono" style="--c:${f.curso.color}">${f.curso.icono}</span><div><strong>${escapar(f.curso.nombre)}</strong><small>${escapar(tituloMaestro(f.maestro))}</small></div></div>
        <div class="curso-card-pie">${badge(nv.texto, nv.clase)}${anillo(f.promedio ?? 0, nv.color, fmtNota(f.promedio), 50)}</div></a>`;
    }).join('')}</div>`, '', 'mb')}

    <div class="grid g2">
      ${tarjeta(`${icono('avisos')} Avisos recientes`, avisos.length ? `<div class="lista">${avisos.map((a) => `
        <a class="lista-item" href="${ruta('/estudiante/avisos')}"><span class="curso-icono" style="--c:var(--rol)">${a.categoria === 'Evento' ? '🎉' : a.categoria === 'Académico' ? '📚' : '📢'}</span>
        <div class="crece"><strong>${escapar(a.titulo)}</strong><small>${haceTiempo(a.fecha)}</small></div></a>`).join('')}</div>` : vacio('📭', 'Sin avisos'),
        `<a class="enlace" href="${ruta('/estudiante/avisos')}">Ver todos ${icono('derecha', 14)}</a>`)}
      ${tarjeta(`${icono('calendario')} Próximos eventos`, eventos.length ? `<div class="lista">${eventos.map((e) => `
        <div class="lista-item"><span class="fecha-caja"><b>${aFecha(e.fecha).getDate()}</b><span>${MESES[aFecha(e.fecha).getMonth()].slice(0, 3)}</span></span>
        <div class="crece"><strong>${escapar(e.titulo)}</strong><small>${relativa(e.fecha)} · ${e.tipo}</small></div></div>`).join('')}</div>` : vacio('🗓️', 'Sin eventos próximos'),
        `<a class="enlace" href="${ruta('/estudiante/calendario')}">Calendario ${icono('derecha', 14)}</a>`)}
    </div>`;
}

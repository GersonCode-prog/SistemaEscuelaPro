// ============================================================
//  PORTAL DE PADRES — Inicio y pagos
// ============================================================
import type { Contexto } from '../lib/app';
import type { Pago } from '../lib/tipos';
import { obtener, porId, guardarItem, config } from '../lib/datos';
import {
  hijosDe, promedioGeneral, nivelNota, fmtNota, nombreGrado, grado, asistenciaDe, tareasPorHacer, cursosEnRiesgo,
  pagosDe, estadoPago, claseEstadoPago, resumenPagos, anunciosPara, nombreCompleto, boleta, tituloMaestro, usuarioDe,
} from '../lib/escuela';
import { stat, anillo, tarjeta, vacio, badge, avatar, barrasH } from '../lib/vistas';
import { escapar, saludo, relativa, haceTiempo, aFecha, MESES, hoy, moneda, monedaCorta, fechaMedia, fechaLarga } from '../lib/formato';
import { icono } from '../lib/iconos';
import { ruta } from '../lib/ruta';
import { abrirModal, aviso, modalFormulario, campo, opciones } from '../lib/ui';

const elegirHijo = (id: string) => { sessionStorage.setItem('ep_hijo', id); };

export function inicioPadre(ctx: Contexto) {
  const padre = porId('padres', ctx.usuario.refId)!;
  const hijos = hijosDe(padre.id);
  const avisos = anunciosPara(ctx.usuario).slice(0, 4);
  const eventos = obtener('eventos').filter((e) => e.fecha >= hoy()).sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, 4);
  const todosPagos = hijos.flatMap((h) => pagosDe(h.id));
  const resumen = resumenPagos(todosPagos);

  ctx.vista.innerHTML = `
    <div class="hero">
      <div><h2>${saludo()}, ${escapar(padre.nombres.split(' ')[0])}! 👋</h2>
        <p>Este es el resumen de ${hijos.length > 1 ? 'tus hijos' : 'tu hijo'} en ${escapar(config().colegio)}.</p>
        <div class="hero-chips"><span>👨‍👩‍👧 ${hijos.length} ${hijos.length === 1 ? 'estudiante' : 'estudiantes'}</span><span>📅 Ciclo ${config().ciclo} · Unidad ${config().unidadActual}</span></div></div>
      <div class="hero-derecha">${hijos.map((h) => avatar(nombreCompleto(h), usuarioDe('estudiante', h.id)?.color, 'lg')).join('')}</div>
    </div>

    <div class="grid ${hijos.length > 1 ? 'g2' : ''} mb">${hijos.map((h) => {
      const prom = promedioGeneral(h); const nv = nivelNota(prom);
      const asis = asistenciaDe(h);
      const pend = tareasPorHacer(h);
      const riesgo = cursosEnRiesgo(h);
      const vencidos = pagosDe(h.id).filter((p) => estadoPago(p) === 'Vencido');
      const alertas: string[] = [];
      riesgo.forEach((r) => alertas.push(`<div class="alerta roja">${icono('alerta', 18)}<span>En riesgo en <strong>${escapar(r.curso.nombre)}</strong> (${fmtNota(r.promedio, 1)}). ${escapar(tituloMaestro(r.maestro))} puede orientarle.</span></div>`));
      const atrasadas = pend.filter((t) => t.estado === 'Atrasada');
      if (atrasadas.length) alertas.push(`<div class="alerta">${icono('tareas', 18)}<span>${atrasadas.length} tarea${atrasadas.length > 1 ? 's' : ''} sin entregar: ${atrasadas.slice(0, 2).map((t) => escapar(t.tarea.titulo)).join(', ')}${atrasadas.length > 2 ? '…' : ''}</span></div>`);
      if (vencidos.length) alertas.push(`<div class="alerta roja">${icono('pagos', 18)}<span>${vencidos.length} pago${vencidos.length > 1 ? 's' : ''} vencido${vencidos.length > 1 ? 's' : ''} por ${monedaCorta(vencidos.reduce((s, p) => s + p.monto, 0))}.</span></div>`);
      if (!alertas.length) alertas.push(`<div class="alerta verde">${icono('check', 18)}<span>¡Todo en orden! ${escapar(h.nombres.split(' ')[0])} va muy bien.</span></div>`);
      return `<section class="card">
        <div class="card-cabecera"><div class="persona">${avatar(nombreCompleto(h), usuarioDe('estudiante', h.id)?.color, 'md')}<div><strong>${escapar(nombreCompleto(h))}</strong><small>${escapar(nombreGrado(grado(h.gradoId)))} · Carné ${escapar(h.carnet)}</small></div></div>
          ${anillo(prom ?? 0, nv.color, fmtNota(prom, 1), 58)}</div>
        <div class="card-cuerpo">
          <div class="grid g3" style="gap:.8rem;margin-bottom:1rem">
            <div><p class="stat-etiqueta">Promedio</p><p class="stat-valor" style="font-size:1.25rem;color:${nv.color}">${fmtNota(prom, 1)}</p></div>
            <div><p class="stat-etiqueta">Asistencia</p><p class="stat-valor" style="font-size:1.25rem">${asis.porcentaje.toFixed(0)}%</p></div>
            <div><p class="stat-etiqueta">Tareas pendientes</p><p class="stat-valor" style="font-size:1.25rem">${pend.length}</p></div>
          </div>
          <div class="pila" style="gap:.6rem">${alertas.join('')}</div>
          <div class="herramientas" style="margin-top:1rem">
            <a class="btn btn-suave btn-sm" data-hijo="${h.id}" href="${ruta('/padre/calificaciones')}">${icono('notas', 16)} Calificaciones</a>
            <a class="btn btn-secundario btn-sm" data-hijo="${h.id}" href="${ruta('/padre/tareas')}">${icono('tareas', 16)} Tareas</a>
            <a class="btn btn-secundario btn-sm" data-hijo="${h.id}" href="${ruta('/padre/asistencia')}">${icono('asistencia', 16)} Asistencia</a>
          </div>
        </div></section>`;
    }).join('') || `<div class="card">${vacio('👨‍👩‍👧', 'No hay estudiantes vinculados')}</div>`}</div>

    <div class="grid g3">
      ${tarjeta(`${icono('pagos')} Estado de cuenta`, `
        ${barrasH([
          { etiqueta: 'Pagado', valor: resumen.pagado, color: '#16a34a', texto: monedaCorta(resumen.pagado) },
          { etiqueta: 'En revisión', valor: resumen.revision, color: '#d97706', texto: monedaCorta(resumen.revision) },
          { etiqueta: 'Vencido', valor: resumen.vencido, color: '#dc2626', texto: monedaCorta(resumen.vencido) },
          { etiqueta: 'Por pagar', valor: resumen.pendiente, color: '#94a3b8', texto: monedaCorta(resumen.pendiente) },
        ])}`, `<a class="enlace" href="${ruta('/padre/pagos')}">Ver pagos ${icono('derecha', 14)}</a>`)}
      ${tarjeta(`${icono('avisos')} Avisos para padres`, avisos.length ? `<div class="lista">${avisos.map((a) => `
        <a class="lista-item" href="${ruta('/padre/avisos')}"><span class="curso-icono" style="--c:var(--rol)">${a.categoria === 'Evento' ? '🎉' : a.categoria === 'Académico' ? '📚' : '📢'}</span>
        <div class="crece"><strong>${escapar(a.titulo)}</strong><small>${haceTiempo(a.fecha)}</small></div></a>`).join('')}</div>` : vacio('📭', 'Sin avisos'))}
      ${tarjeta(`${icono('calendario')} Próximas fechas`, `<div class="lista">${eventos.map((e) => `
        <div class="lista-item"><span class="fecha-caja"><b>${aFecha(e.fecha).getDate()}</b><span>${MESES[aFecha(e.fecha).getMonth()].slice(0, 3)}</span></span>
        <div class="crece"><strong>${escapar(e.titulo)}</strong><small>${relativa(e.fecha)}</small></div></div>`).join('')}</div>`)}
    </div>`;

  ctx.vista.querySelectorAll<HTMLElement>('[data-hijo]').forEach((a) => a.addEventListener('click', () => elegirHijo(a.dataset.hijo!)));
}

// ---------- Pagos ----------
export function pagosPadre(ctx: Contexto) {
  const padre = porId('padres', ctx.usuario.refId)!;
  const cfg = config();

  const pintar = () => {
    const hijos = hijosDe(padre.id);
    const todos = hijos.flatMap((h) => pagosDe(h.id));
    const r = resumenPagos(todos);
    ctx.vista.innerHTML = `
      <div class="grid g4 mb">
        ${stat({ icono: '✅', etiqueta: 'Pagado este ciclo', valor: monedaCorta(r.pagado), tono: 'verde' })}
        ${stat({ icono: '⏳', etiqueta: 'En revisión', valor: monedaCorta(r.revision), nota: 'Boletas reportadas', tono: 'ambar' })}
        ${stat({ icono: '⚠️', etiqueta: 'Vencido', valor: monedaCorta(r.vencido), nota: r.vencido ? 'Ponte al día' : 'Sin atrasos', tono: 'rojo' })}
        ${stat({ icono: '🗓️', etiqueta: 'Por vencer', valor: monedaCorta(r.pendiente), nota: 'Cuotas futuras', tono: 'azul' })}
      </div>
      <div class="alerta azul mb">${icono('info', 18)}<span>¿Pagaste en el banco? Usa <strong>"Reportar pago"</strong> e ingresa el número de tu boleta. La administración lo validará y verás tu recibo aquí.</span></div>
      <div class="pila">${hijos.map((h) => {
        const pagos = pagosDe(h.id);
        return `<section class="card">
          <div class="card-cabecera"><div class="persona">${avatar(nombreCompleto(h), usuarioDe('estudiante', h.id)?.color, 'md')}<div><strong>${escapar(nombreCompleto(h))}</strong><small>${escapar(nombreGrado(grado(h.gradoId)))} · Colegiatura ${moneda(grado(h.gradoId)?.nivel === 'Básico' ? cfg.colegiaturaBasico : cfg.colegiaturaPrimaria)}</small></div></div></div>
          <div class="card-cuerpo sin-relleno"><div class="tabla-scroll"><table class="tabla">
            <thead><tr><th>Concepto</th><th>Vence</th><th class="derecha">Monto</th><th>Estado</th><th></th></tr></thead>
            <tbody>${pagos.map((p) => {
              const e = estadoPago(p);
              const accion = e === 'Pagado' ? `<button type="button" class="btn btn-secundario btn-sm" data-recibo="${p.id}">${icono('recibo', 15)} Recibo</button>`
                : e === 'En revisión' ? '<span class="stat-nota">Validando…</span>'
                : `<button type="button" class="btn ${e === 'Vencido' ? 'btn-primario' : 'btn-secundario'} btn-sm" data-reportar="${p.id}">${icono('subir', 15)} Reportar pago</button>`;
              return `<tr><td><strong>${escapar(p.concepto)}</strong>${p.observacion ? `<small class="stat-nota" style="display:block;color:var(--rojo)">⚠️ ${escapar(p.observacion)}</small>` : ''}</td>
                <td>${fechaMedia(p.vence)}${e === 'Vencido' ? `<small class="stat-nota" style="display:block">${relativa(p.vence)}</small>` : ''}</td>
                <td class="derecha"><strong>${moneda(p.monto)}</strong></td><td>${badge(e, claseEstadoPago[e])}</td><td class="derecha">${accion}</td></tr>`;
            }).join('')}</tbody></table></div></div></section>`;
      }).join('')}</div>`;

    ctx.vista.querySelectorAll<HTMLButtonElement>('[data-reportar]').forEach((b) => b.addEventListener('click', () => reportar(b.dataset.reportar!)));
    ctx.vista.querySelectorAll<HTMLButtonElement>('[data-recibo]').forEach((b) => b.addEventListener('click', () => verRecibo(b.dataset.recibo!)));
  };

  const reportar = (id: string) => {
    const p = porId('pagos', id)!;
    const h = porId('estudiantes', p.estudianteId)!;
    modalFormulario({
      titulo: '🧾 Reportar pago', textoGuardar: 'Enviar reporte',
      campos: `<div class="ayuda">${escapar(p.concepto)} de <strong>${escapar(nombreCompleto(h))}</strong> · ${moneda(p.monto)}</div>
        ${campo('Banco o forma de pago *', `<select name="metodo" required>${opciones(['Depósito · Banrural', 'Depósito · Banco Industrial', 'Depósito · BAM', 'Transferencia bancaria'].map((t) => ({ valor: t, texto: t })))}</select>`)}
        ${campo('Número de boleta o referencia *', '<input name="referencia" required inputmode="numeric" pattern="[0-9]{6,12}" title="Entre 6 y 12 dígitos" placeholder="Ej. 204587113" />')}
        ${campo('Fecha del pago *', `<input name="fecha" type="date" required max="${hoy()}" value="${hoy()}" />`)}
        ${campo('Monto pagado', `<input value="${moneda(p.monto)}" disabled />`)}`,
      alGuardar: (d) => {
        guardarItem('pagos', { ...p, estado: 'En revisión', metodo: d.metodo, referencia: d.referencia, fechaPago: d.fecha, observacion: '' } as Pago);
        aviso('Pago reportado. La administración lo validará pronto.');
        pintar();
      },
    });
  };

  const verRecibo = (id: string) => {
    const p = porId('pagos', id)!;
    const h = porId('estudiantes', p.estudianteId)!;
    const d = abrirModal({
      titulo: '🧾 Recibo de pago', ancho: 'md',
      cuerpo: `<div class="recibo">
        <div class="ficha-cab" style="justify-content:space-between"><div><h3>${escapar(cfg.colegio)}</h3><p class="stat-nota">${escapar(cfg.direccion)} · Tel. ${escapar(cfg.telefono)}</p></div>
          <div style="text-align:right"><strong class="mono">${escapar(p.recibo)}</strong><br>${badge('Pagado', 'ok')}</div></div>
        <dl class="ficha-datos">
          <div><dt>Estudiante</dt><dd>${escapar(nombreCompleto(h))}</dd></div><div><dt>Grado</dt><dd>${escapar(nombreGrado(grado(h.gradoId)))}</dd></div>
          <div><dt>Concepto</dt><dd>${escapar(p.concepto)}</dd></div><div><dt>Fecha de pago</dt><dd>${p.fechaPago ? fechaLarga(p.fechaPago) : '—'}</dd></div>
          <div><dt>Forma de pago</dt><dd>${escapar(p.metodo)}</dd></div><div><dt>Referencia</dt><dd class="mono">${escapar(p.referencia)}</dd></div>
        </dl>
        <div class="ahora" style="margin-top:1.2rem;justify-content:space-between"><strong>Total pagado</strong><strong style="font-size:1.4rem">${moneda(p.monto)}</strong></div>
        <p class="stat-nota" style="margin-top:1rem;text-align:center">Documento de demostración · Recibo generado por EscuelaPro</p></div>`,
      pie: `<button type="button" class="btn btn-secundario" data-cerrar>Cerrar</button><button type="button" class="btn btn-primario" id="imprimir">${icono('imprimir', 16)} Imprimir</button>`,
    });
    d.classList.add('imprimible');
    d.querySelector('#imprimir')!.addEventListener('click', () => window.print());
  };

  pintar();
}


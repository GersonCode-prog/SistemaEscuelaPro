// ============================================================
//  PORTAL ADMINISTRATIVO
//  inicio · familias · académico · pagos · usuarios · configuración
// ============================================================
import type { Contexto } from '../lib/app';
import type { Padre, Pago, Rol, Usuario } from '../lib/tipos';
import {
  obtener, porId, guardarItem, eliminarItem, nuevoId, config, guardarConfig, exportarTodo, importarTodo,
  restablecerDatos, espacioUsado,
} from '../lib/datos';
import {
  ROLES, estudiantesActivos, gradosOrdenados, nombreGrado, grado, nombreCompleto, nombreCorto, hijosDe, pagosDe, estadoPago,
  claseEstadoPago, resumenPagos, usuarioDe, asignacionesDeGrado, curso, estudiantesDeGrado, tituloMaestro, type EstadoPago,
} from '../lib/escuela';
import { stat, tarjeta, vacio, badge, avatar, graficaBarras, barrasH, botonIcono } from '../lib/vistas';
import { escapar, coincide, fechaMedia, moneda, monedaCorta, haceTiempo, MESES, hoy, fechaLarga } from '../lib/formato';
import { icono } from '../lib/iconos';
import { ruta } from '../lib/ruta';
import { abrirModal, aviso, confirmar, modalFormulario, campo, opciones, descargar, aCSV } from '../lib/ui';
import { crearUsuarioPara } from './gestion';

// ---------- Validar o rechazar pagos ----------
function validarPago(id: string, alTerminar: () => void) {
  const p = porId('pagos', id)!;
  const e = porId('estudiantes', p.estudianteId)!;
  const d = abrirModal({
    titulo: '🧾 Validar pago reportado', ancho: 'sm',
    cuerpo: `<dl class="ficha-datos">
      <div><dt>Estudiante</dt><dd>${escapar(nombreCompleto(e))}</dd></div><div><dt>Grado</dt><dd>${escapar(nombreGrado(grado(e.gradoId)))}</dd></div>
      <div><dt>Concepto</dt><dd>${escapar(p.concepto)}</dd></div><div><dt>Monto</dt><dd>${moneda(p.monto)}</dd></div>
      <div><dt>Forma de pago</dt><dd>${escapar(p.metodo)}</dd></div><div><dt>Boleta / referencia</dt><dd class="mono">${escapar(p.referencia)}</dd></div>
      <div><dt>Fecha reportada</dt><dd>${p.fechaPago ? fechaMedia(p.fechaPago) : '—'}</dd></div></dl>
      <div class="alerta azul" style="margin-top:1rem">${icono('info', 18)}<span>Verifica la boleta en el estado de cuenta del banco antes de aprobar.</span></div>`,
    pie: `<button type="button" class="btn btn-secundario" id="rechazar">${icono('cerrar', 16)} Rechazar</button><button type="button" class="btn btn-exito" id="aprobar">${icono('check', 16)} Aprobar pago</button>`,
  });
  d.querySelector('#aprobar')!.addEventListener('click', () => {
    const n = obtener('pagos').filter((x) => x.recibo).length + 1;
    guardarItem('pagos', { ...p, estado: 'Pagado', recibo: `R-${config().ciclo}-${String(n).padStart(5, '0')}`, observacion: '' });
    d.close(); aviso('Pago aprobado ✅ Se generó el recibo'); alTerminar();
  });
  d.querySelector('#rechazar')!.addEventListener('click', () => {
    d.close();
    modalFormulario({
      titulo: 'Rechazar pago', textoGuardar: 'Rechazar', ancho: 'sm',
      campos: campo('Motivo (lo verá el padre de familia) *', '<textarea name="motivo" required rows="3" placeholder="Ej. No encontramos la boleta en el banco. Verifique el número."></textarea>', 'completo'),
      alGuardar: (datos) => { guardarItem('pagos', { ...p, estado: 'Pendiente', observacion: datos.motivo.trim(), fechaPago: null }); aviso('Pago rechazado', 'info'); alTerminar(); },
    });
  });
}

// ---------- Inicio ----------
export function inicioAdmin(ctx: Contexto) {
  const cfg = config();
  const pagos = obtener('pagos');
  const mes = hoy().slice(0, 7);
  const ingresosMes = pagos.filter((p) => p.estado === 'Pagado' && p.fechaPago?.startsWith(mes)).reduce((s, p) => s + p.monto, 0);
  const r = resumenPagos(pagos);
  const revision = pagos.filter((p) => p.estado === 'En revisión');
  const usuarios = obtener('usuarios');
  const meses = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (5 - i)); return d.toISOString().slice(0, 7); });
  const ingresos = meses.map((m) => pagos.filter((p) => p.estado === 'Pagado' && p.fechaPago?.startsWith(m)).reduce((s, p) => s + p.monto, 0));
  const maxI = Math.max(...ingresos, 1);
  const recientes = [...usuarios].filter((u) => u.ultimoAcceso).sort((a, b) => b.ultimoAcceso!.localeCompare(a.ultimoAcceso!)).slice(0, 6);
  const morosidad = gradosOrdenados().map((g) => ({ g, v: pagos.filter((p) => estadoPago(p) === 'Vencido' && porId('estudiantes', p.estudianteId)?.gradoId === g.id).reduce((s, p) => s + p.monto, 0) }));

  const pintar = () => { ctx.refrescar(); };
  ctx.vista.innerHTML = `
    <div class="hero">
      <div><h2>Administración ⚙️</h2><p>${escapar(cfg.colegio)} · ${fechaLarga(hoy())}</p>
        <div class="hero-chips"><span>🎓 ${estudiantesActivos().length} inscritos</span><span>👤 ${usuarios.filter((u) => u.activo).length} usuarios activos</span><span>📅 Ciclo ${cfg.ciclo}</span></div></div>
      <div class="hero-derecha"><a class="btn btn-secundario" href="${ruta('/admin/estudiantes')}">${icono('mas', 18)} Inscribir estudiante</a></div>
    </div>
    <div class="grid g4 mb">
      ${stat({ icono: '💰', etiqueta: `Ingresos de ${MESES[new Date().getMonth()].toLowerCase()}`, valor: monedaCorta(ingresosMes), tono: 'verde' })}
      ${stat({ icono: '✅', etiqueta: 'Recaudado en el ciclo', valor: monedaCorta(r.pagado), tono: 'azul' })}
      ${stat({ icono: '🧾', etiqueta: 'Pagos por validar', valor: String(revision.length), nota: monedaCorta(r.revision), tono: 'ambar' })}
      ${stat({ icono: '⚠️', etiqueta: 'Saldo vencido', valor: monedaCorta(r.vencido), nota: `${pagos.filter((p) => estadoPago(p) === 'Vencido').length} cuotas`, tono: 'rojo' })}
    </div>
    <div class="grid g-2-1 mb">
      ${tarjeta(`${icono('grafica')} Ingresos por mes`, graficaBarras(meses.map((m, i) => ({ etiqueta: MESES[Number(m.slice(5)) - 1].slice(0, 3), valor: ingresos[i], texto: monedaCorta(ingresos[i]).replace('Q ', 'Q') })), maxI))}
      ${tarjeta('🧾 Pagos por validar', revision.length ? `<div class="lista">${revision.map((p) => { const e = porId('estudiantes', p.estudianteId)!; return `
        <div class="lista-item">${avatar(nombreCompleto(e), usuarioDe('estudiante', e.id)?.color, 'sm')}<div class="crece"><strong>${escapar(nombreCorto(e))}</strong><small>${escapar(p.concepto.replace(/^Colegiatura /, 'Cuota de '))} · ${monedaCorta(p.monto)}</small></div>
        <button type="button" class="btn btn-suave btn-sm" data-validar="${p.id}">Revisar</button></div>`; }).join('')}</div>` : vacio('✅', 'Nada por validar'),
        `<a class="enlace" href="${ruta('/admin/pagos')}">Pagos ${icono('derecha', 14)}</a>`)}
    </div>
    <div class="grid g2">
      ${tarjeta('⚠️ Saldo vencido por grado', barrasH(morosidad.map(({ g, v }) => ({ etiqueta: nombreGrado(g), valor: v, color: '#dc2626', texto: monedaCorta(v) }))))}
      ${tarjeta(`${icono('usuarios')} Accesos recientes`, `<div class="lista">${recientes.map((u) => `<div class="lista-item">${avatar(u.nombre, u.color, 'sm')}<div class="crece"><strong>${escapar(u.nombre)}</strong><small>@${escapar(u.usuario)}</small></div>${badge(ROLES[u.rol].nombre, 'rol')}<span class="stat-nota" style="width:70px;text-align:right">${haceTiempo(u.ultimoAcceso!)}</span></div>`).join('')}</div>`,
        `<a class="enlace" href="${ruta('/admin/usuarios')}">Usuarios ${icono('derecha', 14)}</a>`)}
    </div>`;
  ctx.vista.querySelectorAll<HTMLElement>('[data-validar]').forEach((b) => b.addEventListener('click', () => validarPago(b.dataset.validar!, pintar)));
}

// ---------- Familias ----------
export function familiasAdmin(ctx: Contexto) {
  let busqueda = '';
  const pintar = () => {
    const lista = obtener('padres').filter((p) => !busqueda || coincide(`${nombreCompleto(p)} ${p.telefono} ${hijosDe(p.id).map((h) => nombreCompleto(h)).join(' ')}`, busqueda))
      .sort((a, b) => a.apellidos.localeCompare(b.apellidos));
    ctx.vista.innerHTML = `<section class="card">
      <div class="card-cabecera"><div class="buscador">${icono('buscar', 18)}<input class="control" id="buscar" placeholder="Buscar encargado, teléfono o estudiante..." value="${escapar(busqueda)}" /></div>
        <span class="stat-nota">${lista.length} familias</span></div>
      <div class="card-cuerpo sin-relleno"><div class="tabla-scroll"><table class="tabla">
        <thead><tr><th>Encargado</th><th>Contacto</th><th>Hijos</th><th class="derecha">Saldo vencido</th><th>Usuario</th><th></th></tr></thead>
        <tbody>${lista.map((p) => {
          const hijos = hijosDe(p.id);
          const vencido = hijos.flatMap((h) => pagosDe(h.id)).filter((x) => estadoPago(x) === 'Vencido').reduce((s, x) => s + x.monto, 0);
          const u = usuarioDe('padre', p.id);
          return `<tr><td><div class="persona">${avatar(nombreCompleto(p), u?.color, 'sm')}<div><strong>${escapar(nombreCompleto(p))}</strong><small>${p.parentesco}</small></div></div></td>
            <td><small style="display:block">📞 ${escapar(p.telefono)}</small><small class="stat-nota">✉️ ${escapar(p.correo)}</small></td>
            <td><div class="chips">${hijos.map((h) => `<span class="badge">${escapar(h.nombres.split(' ')[0])} · ${escapar(grado(h.gradoId)?.nombre ?? '')}</span>`).join('') || '<span class="stat-nota">—</span>'}</div></td>
            <td class="derecha">${vencido ? `<strong style="color:var(--rojo)">${moneda(vencido)}</strong>` : badge('Al día', 'ok')}</td>
            <td>${u ? `<span class="mono">@${escapar(u.usuario)}</span>` : `<button type="button" class="btn btn-suave btn-sm" data-crear="${p.id}">Crear acceso</button>`}</td>
            <td><div class="acciones">${botonIcono('editar', 'Editar', `data-editar="${p.id}"`)}${hijos.length ? '' : botonIcono('borrar', 'Eliminar', `data-borrar="${p.id}"`, 'peligro')}</div></td></tr>`;
        }).join('')}</tbody></table></div></div></section>`;

    const b = ctx.vista.querySelector<HTMLInputElement>('#buscar')!;
    b.addEventListener('input', () => { busqueda = b.value; pintar(); const n = ctx.vista.querySelector<HTMLInputElement>('#buscar')!; n.focus(); n.setSelectionRange(busqueda.length, busqueda.length); });
    ctx.vista.querySelectorAll<HTMLElement>('[data-crear]').forEach((x) => x.addEventListener('click', () => {
      const p = porId('padres', x.dataset.crear)!; const u = crearUsuarioPara('padre', p.id, nombreCompleto(p), p.parentesco);
      aviso(`Acceso creado: @${u.usuario} (clave 12345)`); pintar();
    }));
    ctx.vista.querySelectorAll<HTMLElement>('[data-borrar]').forEach((x) => x.addEventListener('click', async () => {
      if (await confirmar('¿Eliminar familia?', 'Se eliminará el encargado y su usuario.')) { const u = usuarioDe('padre', x.dataset.borrar!); if (u) eliminarItem('usuarios', u.id); eliminarItem('padres', x.dataset.borrar!); aviso('Eliminado'); pintar(); }
    }));
    ctx.vista.querySelectorAll<HTMLElement>('[data-editar]').forEach((x) => x.addEventListener('click', () => {
      const p = porId('padres', x.dataset.editar)!;
      modalFormulario({
        titulo: '✏️ Editar encargado',
        campos: `${campo('Nombres *', `<input name="nombres" required value="${escapar(p.nombres)}" />`)}${campo('Apellidos *', `<input name="apellidos" required value="${escapar(p.apellidos)}" />`)}
          ${campo('Parentesco', `<select name="parentesco">${opciones(['Madre', 'Padre', 'Encargado'].map((t) => ({ valor: t, texto: t })), p.parentesco)}</select>`)}
          ${campo('Teléfono *', `<input name="telefono" required value="${escapar(p.telefono)}" />`)}${campo('Correo', `<input name="correo" type="email" value="${escapar(p.correo)}" />`)}
          ${campo('Dirección', `<input name="direccion" value="${escapar(p.direccion)}" />`)}`,
        alGuardar: (d) => {
          const nuevo: Padre = { ...p, nombres: d.nombres.trim(), apellidos: d.apellidos.trim(), parentesco: d.parentesco as Padre['parentesco'], telefono: d.telefono.trim(), correo: d.correo.trim(), direccion: d.direccion.trim() };
          guardarItem('padres', nuevo);
          const u = usuarioDe('padre', p.id); if (u) guardarItem('usuarios', { ...u, nombre: nombreCompleto(nuevo), cargo: nuevo.parentesco });
          aviso('Datos actualizados'); pintar();
        },
      });
    }));
  };
  pintar();
}

// ---------- Académico: secciones y asignación de cursos ----------
export function academicoAdmin(ctx: Contexto) {
  let gradoId = gradosOrdenados()[0].id;
  const pintar = () => {
    const maestros = [...obtener('maestros')].sort((a, b) => a.apellidos.localeCompare(b.apellidos));
    const asigs = asignacionesDeGrado(gradoId);
    ctx.vista.innerHTML = `
      ${tarjeta(`${icono('capas')} Grados y secciones`, `<div class="grid g-auto">${gradosOrdenados().map((g) => `
        <div class="curso-card" style="--c:var(--rol)"><div class="curso-card-cab"><span class="curso-icono" style="--c:var(--rol)">🏫</span><div><strong>${escapar(nombreGrado(g))}</strong><small>${g.nivel} · ${escapar(g.aula)} · ${estudiantesDeGrado(g.id).length} estudiantes</small></div></div>
        <label class="campo"><span>Maestro guía</span><select class="control" data-guia="${g.id}">${maestros.map((m) => `<option value="${m.id}" ${m.id === g.guiaId ? 'selected' : ''}>${escapar(nombreCompleto(m))}</option>`).join('')}</select></label></div>`).join('')}</div>`, '', 'mb')}
      <section class="card"><div class="card-cabecera"><h2>${icono('libro')} Asignación de cursos</h2>
        <select class="control" id="sel-grado" style="max-width:240px;margin-left:auto">${gradosOrdenados().map((g) => `<option value="${g.id}" ${g.id === gradoId ? 'selected' : ''}>${escapar(nombreGrado(g))}</option>`).join('')}</select></div>
        <div class="card-cuerpo sin-relleno"><div class="tabla-scroll"><table class="tabla"><thead><tr><th>Curso</th><th>Maestro asignado</th></tr></thead>
        <tbody>${asigs.map((a) => { const c = curso(a.cursoId)!; return `<tr><td><div class="celda-curso"><span class="curso-icono" style="--c:${c.color}">${c.icono}</span><strong>${escapar(c.nombre)}</strong></div></td>
          <td><select class="control" data-asig="${a.id}" style="max-width:460px">${maestros.map((m) => `<option value="${m.id}" ${m.id === a.maestroId ? 'selected' : ''}>${escapar(tituloMaestro(m))} — ${escapar(m.especialidad)}</option>`).join('')}</select></td></tr>`; }).join('')}</tbody></table></div></div>
        <div class="card-cuerpo"><p class="stat-nota">💡 Los cambios se guardan al instante. El horario de cada sección se mantiene y se actualiza con el nuevo maestro.</p></div></section>`;
    ctx.vista.querySelector<HTMLSelectElement>('#sel-grado')!.addEventListener('change', (e) => { gradoId = (e.target as HTMLSelectElement).value; pintar(); });
    ctx.vista.querySelectorAll<HTMLSelectElement>('[data-asig]').forEach((s) => s.addEventListener('change', () => {
      guardarItem('asignaciones', { ...porId('asignaciones', s.dataset.asig)!, maestroId: s.value }); aviso('Asignación actualizada');
    }));
    ctx.vista.querySelectorAll<HTMLSelectElement>('[data-guia]').forEach((s) => s.addEventListener('change', () => {
      guardarItem('grados', { ...porId('grados', s.dataset.guia)!, guiaId: s.value }); aviso('Maestro guía actualizado');
    }));
  };
  pintar();
}

// ---------- Pagos ----------
export function pagosAdmin(ctx: Contexto) {
  let busqueda = ''; let estadoF: EstadoPago | '' = ''; let gradoF = ''; let mesF = '';
  const pintar = () => {
    const todos = obtener('pagos');
    const r = resumenPagos(todos);
    const lista = todos.filter((p) => {
      const e = porId('estudiantes', p.estudianteId);
      return e && (!estadoF || estadoPago(p) === estadoF) && (!gradoF || e.gradoId === gradoF) && (mesF === '' || p.mes === Number(mesF)) && (!busqueda || coincide(`${nombreCompleto(e)} ${e.carnet} ${p.referencia} ${p.recibo}`, busqueda));
    }).sort((a, b) => {
      const prio: Record<EstadoPago, number> = { 'En revisión': 0, Vencido: 1, Pendiente: 2, Pagado: 3 };
      return prio[estadoPago(a)] - prio[estadoPago(b)] || b.vence.localeCompare(a.vence);
    });
    const visibles = lista.slice(0, 120);
    ctx.vista.innerHTML = `
      <div class="grid g4 mb">
        ${stat({ icono: '✅', etiqueta: 'Recaudado', valor: monedaCorta(r.pagado), tono: 'verde' })}
        ${stat({ icono: '🧾', etiqueta: 'Por validar', valor: monedaCorta(r.revision), nota: `${todos.filter((p) => p.estado === 'En revisión').length} reportes`, tono: 'ambar' })}
        ${stat({ icono: '⚠️', etiqueta: 'Vencido', valor: monedaCorta(r.vencido), tono: 'rojo' })}
        ${(() => { const est = estudiantesActivos(); const alDia = est.filter((e) => !pagosDe(e.id).some((x) => estadoPago(x) === 'Vencido')).length;
          return stat({ icono: '👨‍👩‍👧', etiqueta: 'Estudiantes al día', valor: `${Math.round((alDia / Math.max(est.length, 1)) * 100)}%`, nota: `${alDia} de ${est.length}${r.pendiente ? ` · ${monedaCorta(r.pendiente)} por cobrar` : ''}`, tono: 'azul' }); })()}
      </div>
      <section class="card">
        <div class="card-cabecera"><div class="herramientas" style="flex:1">
          <div class="buscador">${icono('buscar', 18)}<input class="control" id="buscar" placeholder="Estudiante, carné, boleta o recibo..." value="${escapar(busqueda)}" /></div>
          <select class="control" id="f-estado">${opciones([{ valor: '', texto: 'Todos los estados' }, ...(['En revisión', 'Vencido', 'Pendiente', 'Pagado'] as const).map((x) => ({ valor: x, texto: x }))], estadoF)}</select>
          <select class="control" id="f-grado"><option value="">Todos los grados</option>${gradosOrdenados().map((g) => `<option value="${g.id}" ${g.id === gradoF ? 'selected' : ''}>${escapar(nombreGrado(g))}</option>`).join('')}</select>
          <select class="control" id="f-mes"><option value="">Todos los meses</option><option value="0" ${mesF === '0' ? 'selected' : ''}>Inscripción</option>${MESES.slice(0, 10).map((m, i) => `<option value="${i + 1}" ${mesF === String(i + 1) ? 'selected' : ''}>${m}</option>`).join('')}</select>
        </div><button type="button" class="btn btn-secundario btn-sm" id="csv">${icono('descargar', 16)} CSV</button></div>
        <div class="card-cuerpo sin-relleno"><div class="tabla-scroll"><table class="tabla">
          <thead><tr><th>Estudiante</th><th>Concepto</th><th>Vence</th><th class="derecha">Monto</th><th>Estado</th><th>Referencia</th><th></th></tr></thead>
          <tbody>${visibles.map((p) => {
            const e = porId('estudiantes', p.estudianteId)!; const s = estadoPago(p);
            const accion = s === 'En revisión' ? `<button type="button" class="btn btn-primario btn-sm" data-validar="${p.id}">Validar</button>`
              : s === 'Pagado' ? `<span class="mono stat-nota">${escapar(p.recibo)}</span>` : `<button type="button" class="btn btn-secundario btn-sm" data-cobrar="${p.id}">Registrar pago</button>`;
            return `<tr><td><div class="persona">${avatar(nombreCompleto(e), usuarioDe('estudiante', e.id)?.color, 'xs')}<div><strong>${escapar(nombreCompleto(e))}</strong><small>${escapar(grado(e.gradoId)?.nombre ?? '')}</small></div></div></td>
              <td>${escapar(p.concepto)}</td><td>${fechaMedia(p.vence)}</td><td class="derecha"><strong>${moneda(p.monto)}</strong></td><td>${badge(s, claseEstadoPago[s])}</td>
              <td><small class="mono">${escapar(p.referencia || '—')}</small>${p.metodo ? `<small class="stat-nota" style="display:block">${escapar(p.metodo)}</small>` : ''}</td><td class="derecha">${accion}</td></tr>`;
          }).join('') || `<tr><td colspan="7">${vacio('🔍', 'Sin resultados')}</td></tr>`}</tbody></table></div></div>
        <div class="card-cuerpo"><span class="stat-nota">${lista.length > visibles.length ? `Mostrando ${visibles.length} de ${lista.length}. Usa los filtros para acotar.` : `${lista.length} registros`}</span></div>
      </section>`;

    const b = ctx.vista.querySelector<HTMLInputElement>('#buscar')!;
    b.addEventListener('input', () => { busqueda = b.value; pintar(); const n = ctx.vista.querySelector<HTMLInputElement>('#buscar')!; n.focus(); n.setSelectionRange(busqueda.length, busqueda.length); });
    ctx.vista.querySelector('#f-estado')!.addEventListener('change', (e) => { estadoF = (e.target as HTMLSelectElement).value as EstadoPago; pintar(); });
    ctx.vista.querySelector('#f-grado')!.addEventListener('change', (e) => { gradoF = (e.target as HTMLSelectElement).value; pintar(); });
    ctx.vista.querySelector('#f-mes')!.addEventListener('change', (e) => { mesF = (e.target as HTMLSelectElement).value; pintar(); });
    ctx.vista.querySelector('#csv')!.addEventListener('click', () => descargar('pagos.csv', aCSV([['Carné', 'Estudiante', 'Grado', 'Concepto', 'Vence', 'Monto', 'Estado', 'Fecha de pago', 'Método', 'Referencia', 'Recibo'],
      ...lista.map((p) => { const e = porId('estudiantes', p.estudianteId)!; return [e.carnet, nombreCompleto(e), nombreGrado(grado(e.gradoId)), p.concepto, p.vence, p.monto, estadoPago(p), p.fechaPago ?? '', p.metodo, p.referencia, p.recibo]; })]), 'text/csv'));
    ctx.vista.querySelectorAll<HTMLElement>('[data-validar]').forEach((x) => x.addEventListener('click', () => validarPago(x.dataset.validar!, pintar)));
    ctx.vista.querySelectorAll<HTMLElement>('[data-cobrar]').forEach((x) => x.addEventListener('click', () => {
      const p = porId('pagos', x.dataset.cobrar)!; const e = porId('estudiantes', p.estudianteId)!;
      modalFormulario({
        titulo: '💵 Registrar pago en caja', textoGuardar: 'Registrar y emitir recibo',
        campos: `<div class="ayuda">${escapar(p.concepto)} · <strong>${escapar(nombreCompleto(e))}</strong> · ${moneda(p.monto)}</div>
          ${campo('Forma de pago', `<select name="metodo">${opciones(['Efectivo en caja', 'Tarjeta en caja', 'Depósito · Banrural', 'Depósito · Banco Industrial', 'Transferencia bancaria'].map((t) => ({ valor: t, texto: t })))}</select>`)}
          ${campo('Referencia / boleta', '<input name="referencia" placeholder="Opcional en efectivo" />')}
          ${campo('Fecha de pago *', `<input name="fecha" type="date" required value="${hoy()}" max="${hoy()}" />`)}`,
        alGuardar: (d) => {
          const n = obtener('pagos').filter((z) => z.recibo).length + 1;
          guardarItem('pagos', { ...p, estado: 'Pagado', metodo: d.metodo, referencia: d.referencia.trim() || 'CAJA', fechaPago: d.fecha, recibo: `R-${config().ciclo}-${String(n).padStart(5, '0')}`, observacion: '' } as Pago);
          aviso('Pago registrado ✅'); pintar();
        },
      });
    }));
  };
  pintar();
}

// ---------- Usuarios ----------
export function usuariosAdmin(ctx: Contexto) {
  let busqueda = ''; let rolF: Rol | '' = '';
  const pintar = () => {
    const todos = obtener('usuarios');
    const lista = todos.filter((u) => (!rolF || u.rol === rolF) && (!busqueda || coincide(`${u.nombre} ${u.usuario}`, busqueda)))
      .sort((a, b) => Object.keys(ROLES).indexOf(a.rol) - Object.keys(ROLES).indexOf(b.rol) || a.nombre.localeCompare(b.nombre));
    ctx.vista.innerHTML = `
      <div class="grid mb" style="grid-template-columns:repeat(auto-fit,minmax(170px,1fr))">${(Object.keys(ROLES) as Rol[]).map((r) => `
        <button type="button" class="card stat" data-rol="${r}" style="cursor:pointer;text-align:left;font:inherit;${rolF === r ? 'box-shadow:0 0 0 2px ' + ROLES[r].color : ''}">
          <span class="stat-icono" style="background:color-mix(in srgb, ${ROLES[r].color} 12%, white);color:${ROLES[r].color}">${ROLES[r].emoji}</span>
          <div><p class="stat-etiqueta">${ROLES[r].nombre}</p><p class="stat-valor">${todos.filter((u) => u.rol === r).length}</p></div></button>`).join('')}</div>
      <section class="card">
        <div class="card-cabecera"><div class="herramientas" style="flex:1">
          <div class="buscador">${icono('buscar', 18)}<input class="control" id="buscar" placeholder="Buscar por nombre o usuario..." value="${escapar(busqueda)}" /></div>
          ${rolF ? `<button type="button" class="chip activo" id="quitar-rol">${ROLES[rolF].nombre} ✕</button>` : ''}</div>
          <button type="button" class="btn btn-primario btn-sm" id="nuevo">${icono('mas', 16)} Nuevo usuario</button></div>
        <div class="card-cuerpo sin-relleno"><div class="tabla-scroll"><table class="tabla">
          <thead><tr><th>Usuario</th><th>Rol</th><th>Vinculado a</th><th>Último acceso</th><th>Estado</th><th></th></tr></thead>
          <tbody>${lista.map((u) => {
            const vinculo = u.rol === 'estudiante' ? nombreGrado(grado(porId('estudiantes', u.refId)?.gradoId)) : u.rol === 'padre' ? `Familia de ${hijosDe(u.refId!).map((h) => h.nombres.split(' ')[0]).join(', ') || '—'}` : u.cargo || '—';
            return `<tr><td><div class="persona">${avatar(u.nombre, u.color, 'sm')}<div><strong>${escapar(u.nombre)}</strong><small class="mono">@${escapar(u.usuario)}</small></div></div></td>
              <td><span class="badge" style="background:color-mix(in srgb, ${ROLES[u.rol].color} 12%, white);color:${ROLES[u.rol].color}">${ROLES[u.rol].emoji} ${ROLES[u.rol].nombre}</span></td>
              <td><small>${escapar(vinculo)}</small></td><td><small>${u.ultimoAcceso ? haceTiempo(u.ultimoAcceso) : 'Nunca'}</small></td>
              <td>${u.id === ctx.usuario.id ? badge('Tú', 'rol') : `<label class="check"><input type="checkbox" data-activo="${u.id}" ${u.activo ? 'checked' : ''} /> ${u.activo ? 'Activo' : 'Inactivo'}</label>`}</td>
              <td><div class="acciones">${botonIcono('llave', 'Restablecer contraseña', `data-clave="${u.id}"`)}${u.id !== ctx.usuario.id && !u.refId ? botonIcono('borrar', 'Eliminar', `data-borrar="${u.id}"`, 'peligro') : ''}</div></td></tr>`;
          }).join('')}</tbody></table></div></div>
        <div class="card-cuerpo"><span class="stat-nota">${lista.length} usuarios · Todos los usuarios de demostración usan la contraseña 12345</span></div>
      </section>`;

    const b = ctx.vista.querySelector<HTMLInputElement>('#buscar')!;
    b.addEventListener('input', () => { busqueda = b.value; pintar(); const n = ctx.vista.querySelector<HTMLInputElement>('#buscar')!; n.focus(); n.setSelectionRange(busqueda.length, busqueda.length); });
    ctx.vista.querySelectorAll<HTMLElement>('[data-rol]').forEach((x) => x.addEventListener('click', () => { rolF = rolF === x.dataset.rol ? '' : x.dataset.rol as Rol; pintar(); }));
    ctx.vista.querySelector('#quitar-rol')?.addEventListener('click', () => { rolF = ''; pintar(); });
    ctx.vista.querySelectorAll<HTMLInputElement>('[data-activo]').forEach((x) => x.addEventListener('change', () => {
      const u = porId('usuarios', x.dataset.activo)!; guardarItem('usuarios', { ...u, activo: x.checked });
      aviso(x.checked ? `${u.nombre} puede ingresar` : `${u.nombre} ya no podrá ingresar`, x.checked ? 'exito' : 'info'); pintar();
    }));
    ctx.vista.querySelectorAll<HTMLElement>('[data-clave]').forEach((x) => x.addEventListener('click', () => {
      const u = porId('usuarios', x.dataset.clave)!;
      modalFormulario({
        titulo: `🔑 Contraseña de @${escapar(u.usuario)}`, textoGuardar: 'Restablecer', ancho: 'sm',
        campos: campo('Nueva contraseña *', '<input name="clave" required minlength="5" value="12345" />', 'completo') + '<div class="ayuda">Comunica la nueva contraseña al usuario por un medio seguro.</div>',
        alGuardar: (d) => { guardarItem('usuarios', { ...u, clave: d.clave }); aviso('Contraseña restablecida'); },
      });
    }));
    ctx.vista.querySelectorAll<HTMLElement>('[data-borrar]').forEach((x) => x.addEventListener('click', async () => {
      if (await confirmar('¿Eliminar usuario?', 'Esta persona ya no podrá ingresar al sistema.')) { eliminarItem('usuarios', x.dataset.borrar!); aviso('Usuario eliminado'); pintar(); }
    }));
    ctx.vista.querySelector('#nuevo')!.addEventListener('click', () => {
      modalFormulario({
        titulo: '👤 Nuevo usuario de personal', textoGuardar: 'Crear usuario',
        campos: `<div class="ayuda">Los usuarios de estudiantes, padres y maestros se crean al inscribirlos. Aquí puedes crear accesos para personal de dirección o administración.</div>
          ${campo('Nombre completo *', '<input name="nombre" required />', 'completo')}
          ${campo('Rol *', `<select name="rol">${opciones([{ valor: 'admin', texto: '⚙️ Administrador' }, { valor: 'director', texto: '🏫 Director / Coordinador' }])}</select>`)}
          ${campo('Cargo', '<input name="cargo" placeholder="Ej. Secretaría" />')}
          ${campo('Usuario *', '<input name="usuario" required pattern="[a-z0-9._]{3,30}" title="Minúsculas, números, punto o guion bajo" />')}
          ${campo('Contraseña *', '<input name="clave" required minlength="5" value="12345" />')}`,
        alGuardar: (d) => {
          if (obtener('usuarios').some((u) => u.usuario === d.usuario.trim())) { aviso('Ese nombre de usuario ya existe', 'error'); return false; }
          const u: Usuario = { id: nuevoId('u-'), usuario: d.usuario.trim(), clave: d.clave, rol: d.rol as Rol, refId: null, nombre: d.nombre.trim(), cargo: d.cargo.trim(), activo: true, color: ROLES[d.rol as Rol].color, ultimoAcceso: null, vistoAvisos: null };
          guardarItem('usuarios', u); aviso(`Usuario @${u.usuario} creado`); pintar();
        },
      });
    });
  };
  pintar();
}

// ---------- Configuración ----------
export function configuracionAdmin(ctx: Contexto) {
  const c = config();
  const esp = espacioUsado();
  const cuenta = (n: Parameters<typeof obtener>[0]) => obtener(n).length;
  ctx.vista.innerHTML = `<div class="grid g-2-1">
    <section class="card"><div class="card-cabecera"><h2>${icono('edificio')} Datos del colegio</h2></div><div class="card-cuerpo">
      <form class="form-modal" id="form-config">
        ${campo('Nombre del colegio *', `<input name="colegio" required value="${escapar(c.colegio)}" />`, 'completo')}
        ${campo('Lema', `<input name="lema" value="${escapar(c.lema)}" />`, 'completo')}
        ${campo('Dirección', `<input name="direccion" value="${escapar(c.direccion)}" />`, 'completo')}
        ${campo('Teléfono', `<input name="telefono" value="${escapar(c.telefono)}" />`)}${campo('Correo', `<input name="correo" type="email" value="${escapar(c.correo)}" />`)}
        ${campo('Ciclo escolar', `<input name="ciclo" type="number" min="2020" max="2100" value="${c.ciclo}" />`)}
        ${campo('Unidad en curso', `<select name="unidadActual">${opciones([1, 2, 3, 4].map((u) => ({ valor: String(u), texto: `Unidad ${u}` })), String(c.unidadActual))}</select>`)}
        ${campo('Colegiatura Primaria (Q)', `<input name="colegiaturaPrimaria" type="number" min="0" value="${c.colegiaturaPrimaria}" />`)}
        ${campo('Colegiatura Básico (Q)', `<input name="colegiaturaBasico" type="number" min="0" value="${c.colegiaturaBasico}" />`)}
        ${campo('Inscripción (Q)', `<input name="inscripcion" type="number" min="0" value="${c.inscripcion}" />`)}
        <div class="completo"><button type="submit" class="btn btn-primario">${icono('guardar', 18)} Guardar configuración</button></div>
      </form></div></section>
    <div class="pila">
      ${tarjeta(`${icono('capas')} Datos del sistema`, `${barrasH([{ etiqueta: 'Espacio usado del navegador', valor: esp.porcentaje, max: 100, color: esp.porcentaje > 80 ? '#dc2626' : '#16a34a', texto: `${esp.kb} KB · ${esp.porcentaje}%` }])}
        <dl class="ficha-datos" style="margin-top:1rem"><div><dt>Estudiantes</dt><dd>${cuenta('estudiantes')}</dd></div><div><dt>Usuarios</dt><dd>${cuenta('usuarios')}</dd></div>
        <div><dt>Tareas</dt><dd>${cuenta('tareas')}</dd></div><div><dt>Entregas</dt><dd>${cuenta('entregas')}</dd></div><div><dt>Pagos</dt><dd>${cuenta('pagos')}</dd></div><div><dt>Mensajes</dt><dd>${obtener('conversaciones').reduce((s, x) => s + x.mensajes.length, 0)}</dd></div></dl>`)}
      ${tarjeta(`${icono('descargar')} Respaldo`, `<p class="stat-nota mb">Descarga todos los datos en un archivo o restáuralos desde un respaldo.</p>
        <div class="herramientas"><button type="button" class="btn btn-secundario" id="exportar">${icono('descargar', 16)} Descargar respaldo</button>
        <label class="btn btn-secundario" style="cursor:pointer">${icono('subir', 16)} Restaurar<input type="file" id="importar" accept="application/json" hidden /></label></div>`)}
      ${tarjeta(`${icono('reiniciar')} Datos de demostración`, `<p class="stat-nota mb">Borra todos los cambios y vuelve a cargar los datos ficticios iniciales.</p>
        <button type="button" class="btn btn-peligro" id="restablecer">${icono('reiniciar', 16)} Restablecer datos</button>`)}
    </div></div>`;

  const form = ctx.vista.querySelector<HTMLFormElement>('#form-config')!;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const d = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    guardarConfig({ ...c, colegio: d.colegio.trim(), lema: d.lema.trim(), direccion: d.direccion.trim(), telefono: d.telefono.trim(), correo: d.correo.trim(), ciclo: Number(d.ciclo), unidadActual: Number(d.unidadActual), colegiaturaPrimaria: Number(d.colegiaturaPrimaria), colegiaturaBasico: Number(d.colegiaturaBasico), inscripcion: Number(d.inscripcion) });
    aviso('Configuración guardada ✅');
  });
  ctx.vista.querySelector('#exportar')!.addEventListener('click', () => descargar(`respaldo-escuelapro-${hoy()}.json`, JSON.stringify(exportarTodo(), null, 1), 'application/json'));
  ctx.vista.querySelector<HTMLInputElement>('#importar')!.addEventListener('change', async (e) => {
    const archivo = (e.target as HTMLInputElement).files?.[0];
    if (!archivo) return;
    try {
      const datos = JSON.parse(await archivo.text());
      if (!(await confirmar('¿Restaurar respaldo?', 'Se reemplazarán todos los datos actuales por los del archivo.', 'Restaurar'))) return;
      importarTodo(datos); aviso('Respaldo restaurado'); setTimeout(() => location.reload(), 700);
    } catch (err) { aviso((err as Error).message || 'Archivo no válido', 'error'); }
  });
  ctx.vista.querySelector('#restablecer')!.addEventListener('click', async () => {
    if (await confirmar('¿Restablecer todos los datos?', 'Se perderán todos los cambios y se cargarán los datos de demostración.', 'Restablecer')) {
      restablecerDatos(); aviso('Datos restablecidos'); setTimeout(() => location.reload(), 700);
    }
  });
}


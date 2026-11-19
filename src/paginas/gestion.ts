// ============================================================
//  GESTIÓN DE ESTUDIANTES Y MAESTROS
//  El director solo consulta; el administrador también edita.
// ============================================================
import type { Contexto } from '../lib/app';
import type { Estudiante, Maestro, Padre, Pago, Usuario } from '../lib/tipos';
import { obtener, porId, guardar, guardarItem, eliminarItem, nuevoId, config } from '../lib/datos';
import {
  gradosOrdenados, nombreGrado, grado, nombreCompleto, promedioGeneral, asistenciaDe, cursosEnRiesgo, nivelNota, fmtNota,
  boleta, edad, usuarioDe, pagosDe, estadoPago, claseEstadoPago, tareasDeEstudiante, asignacionesDeMaestro, curso,
  horarioDeMaestro, periodosPorSemana, promedioAsignacion, promedio, entregasPorCalificar, tituloMaestro, ROLES,
} from '../lib/escuela';
import { stat, badge, avatar, vacio, tablaBoleta, botonIcono } from '../lib/vistas';
import { escapar, coincide, fechaMedia, moneda, monedaCorta, hoy, MESES, sinAcentos } from '../lib/formato';
import { icono } from '../lib/iconos';
import { ruta } from '../lib/ruta';
import { abrirModal, aviso, confirmar, modalFormulario, campo, opciones, descargar, aCSV } from '../lib/ui';

// ---------- Ficha del estudiante ----------
export function fichaEstudiante(estId: string, rol: string) {
  const e = porId('estudiantes', estId)!;
  const p = porId('padres', e.padreId);
  const filas = boleta(e);
  const asis = asistenciaDe(e);
  const tareas = tareasDeEstudiante(e);
  const pagos = pagosDe(e.id);
  const u = usuarioDe('estudiante', e.id);
  const up = p ? usuarioDe('padre', p.id) : undefined;
  const prom = promedioGeneral(e);
  const d = abrirModal({
    titulo: '🪪 Ficha del estudiante', ancho: 'lg',
    cuerpo: `
      <div class="ficha-cab">${avatar(nombreCompleto(e), u?.color, 'lg')}
        <div style="flex:1"><h3>${escapar(nombreCompleto(e))}</h3><p class="stat-nota">${escapar(nombreGrado(grado(e.gradoId)))} · Carné ${escapar(e.carnet)} · ${edad(e.nacimiento)} años</p>
          <div class="chips" style="margin-top:.5rem">${badge(e.estado, e.estado === 'Activo' ? 'ok' : 'neutral')}${badge(`Promedio ${fmtNota(prom, 1)}`, nivelNota(prom).clase)}${badge(`Asistencia ${asis.porcentaje.toFixed(0)}%`, asis.porcentaje >= 90 ? 'ok' : 'warn')}</div></div>
        ${up ? `<a class="btn btn-suave btn-sm" href="${ruta(`/${rol}/mensajes?con=${up.id}`)}">${icono('mensajes', 16)} Escribir al encargado</a>` : ''}</div>
      <div class="tabs" id="tabs">${['Académico', 'Asistencia', 'Tareas', 'Familia y pagos'].map((t, i) => `<button type="button" class="tab ${i === 0 ? 'activo' : ''}" data-tab="${i}">${t}</button>`).join('')}</div>
      <div data-panel="0">${tablaBoleta(filas, prom)}</div>
      <div data-panel="1" hidden><div class="grid g3 mb">${stat({ icono: '✅', etiqueta: 'Presente', valor: String(asis.presentes), tono: 'verde' })}${stat({ icono: '⏰', etiqueta: 'Tardanzas', valor: String(asis.tardanzas), tono: 'ambar' })}${stat({ icono: '❌', etiqueta: 'Ausencias', valor: String(asis.ausencias), tono: 'rojo' })}</div>
        <p class="stat-nota">Ausencias: ${asis.dias.filter((x) => x.estado === 'A').map((x) => fechaMedia(x.fecha)).join(', ') || 'ninguna'}.</p></div>
      <div data-panel="2" hidden><div class="grid g4 mb">${(['Pendiente', 'Atrasada', 'Entregada', 'Calificada'] as const).map((s) => stat({ icono: s === 'Atrasada' ? '⏰' : s === 'Calificada' ? '✅' : s === 'Entregada' ? '📤' : '📝', etiqueta: s, valor: String(tareas.filter((t) => t.estado === s).length), tono: s === 'Atrasada' ? 'rojo' : s === 'Calificada' ? 'verde' : 'azul' })).join('')}</div>
        <div class="lista">${tareas.filter((t) => t.estado === 'Atrasada').map((t) => `<div class="lista-item"><span class="curso-icono" style="--c:${t.curso.color}">${t.curso.icono}</span><div class="crece"><strong>${escapar(t.tarea.titulo)}</strong><small>${escapar(t.curso.nombre)} · venció ${fechaMedia(t.tarea.entrega)}</small></div>${badge('Atrasada', 'bad')}</div>`).join('')}</div></div>
      <div data-panel="3" hidden>
        <dl class="ficha-datos mb">${p ? `<div><dt>Encargado</dt><dd>${escapar(nombreCompleto(p))} (${p.parentesco})</dd></div><div><dt>Teléfono</dt><dd>${escapar(p.telefono)}</dd></div><div><dt>Correo</dt><dd>${escapar(p.correo)}</dd></div><div><dt>Dirección</dt><dd>${escapar(p.direccion)}</dd></div>` : '<div><dt>Encargado</dt><dd>Sin registrar</dd></div>'}
          <div><dt>Fecha de nacimiento</dt><dd>${fechaMedia(e.nacimiento)}</dd></div><div><dt>Usuario</dt><dd>${u ? `@${escapar(u.usuario)}` : 'Sin acceso'}</dd></div></dl>
        <div class="chips">${pagos.map((x) => { const s = estadoPago(x); return `<span class="badge ${claseEstadoPago[s]}" title="${escapar(x.concepto)} · ${s}">${escapar(x.mes === 0 ? 'Insc.' : MESES[x.mes - 1].slice(0, 3))}: ${s}</span>`; }).join('')}</div></div>`,
    pie: '<button type="button" class="btn btn-secundario" data-cerrar>Cerrar</button>',
  });
  d.querySelector('#tabs')!.addEventListener('click', (ev) => {
    const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-tab]');
    if (!b) return;
    d.querySelectorAll('[data-tab]').forEach((x) => x.classList.toggle('activo', x === b));
    d.querySelectorAll<HTMLElement>('[data-panel]').forEach((x) => { x.hidden = x.dataset.panel !== b.dataset.tab; });
  });
}

// ---------- Generar cuotas del ciclo para un estudiante nuevo ----------
export function generarCuotas(e: Estudiante) {
  const cfg = config();
  const g = grado(e.gradoId);
  const mensual = g?.nivel === 'Básico' ? cfg.colegiaturaBasico : cfg.colegiaturaPrimaria;
  const nuevas: Pago[] = Array.from({ length: 11 }, (_, m) => ({
    id: `pg-${e.id}-${m}`, estudianteId: e.id, concepto: m === 0 ? `Inscripción ${cfg.ciclo}` : `Colegiatura ${MESES[m - 1]}`, mes: m,
    monto: m === 0 ? cfg.inscripcion : mensual, vence: m === 0 ? hoy() : `${cfg.ciclo}-${String(m).padStart(2, '0')}-05`,
    estado: 'Pendiente', fechaPago: null, metodo: '', referencia: '', recibo: '', observacion: '',
  }));
  // Las colegiaturas de meses ya pasados no se cobran a quien se inscribe tarde
  const lista = obtener('pagos').concat(nuevas.filter((p) => p.mes === 0 || p.vence >= hoy()));
  return lista;
}

export const crearUsuarioPara = (rol: 'estudiante' | 'padre' | 'maestro', refId: string, nombre: string, cargo = ''): Usuario => {
  const base = sinAcentos(nombre.split(' ')[0].toLowerCase()) + '.' + sinAcentos((nombre.split(' ').find((p, i) => i > 0 && p.length > 2) ?? 'usuario').toLowerCase());
  let usuario = base; let n = 2;
  while (obtener('usuarios').some((u) => u.usuario === usuario)) usuario = `${base}${n++}`;
  const u: Usuario = { id: `u-${refId}`, usuario, clave: '12345', rol, refId, nombre, cargo, activo: true, color: ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899'][Math.floor(Math.random() * 5)], ultimoAcceso: null, vistoAvisos: null };
  guardarItem('usuarios', u);
  return u;
};

// ---------- Estudiantes ----------
export function paginaEstudiantes(ctx: Contexto) {
  const editable = ctx.rol === 'admin';
  let busqueda = ''; let gradoF = ''; let estadoF = 'Activo'; let riesgoF = false;

  const pintar = () => {
    const todos = obtener('estudiantes');
    const lista = todos.filter((e) => (!gradoF || e.gradoId === gradoF) && (!estadoF || e.estado === estadoF)
      && (!busqueda || coincide(`${nombreCompleto(e)} ${e.carnet} ${nombreCompleto(porId('padres', e.padreId))}`, busqueda))
      && (!riesgoF || cursosEnRiesgo(e).length > 0))
      .sort((a, b) => (grado(a.gradoId)?.orden ?? 0) - (grado(b.gradoId)?.orden ?? 0) || a.apellidos.localeCompare(b.apellidos));
    const activos = todos.filter((e) => e.estado === 'Activo');
    const enRiesgo = activos.filter((e) => cursosEnRiesgo(e).length).length;

    ctx.vista.innerHTML = `
      <div class="grid g4 mb">
        ${stat({ icono: '🎓', etiqueta: 'Estudiantes activos', valor: String(activos.length), nota: `${gradosOrdenados().length} secciones` })}
        ${stat({ icono: '👧', etiqueta: 'Niñas', valor: String(activos.filter((e) => e.genero === 'F').length), tono: 'morado' })}
        ${stat({ icono: '👦', etiqueta: 'Niños', valor: String(activos.filter((e) => e.genero === 'M').length), tono: 'azul' })}
        ${stat({ icono: '⚠️', etiqueta: 'En riesgo académico', valor: String(enRiesgo), nota: 'Con algún curso < 60', tono: 'rojo' })}
      </div>
      <section class="card">
        <div class="card-cabecera"><div class="herramientas" style="flex:1">
          <div class="buscador">${icono('buscar', 18)}<input class="control" id="buscar" placeholder="Buscar por nombre, carné o encargado..." value="${escapar(busqueda)}" /></div>
          <select class="control" id="f-grado"><option value="">Todos los grados</option>${gradosOrdenados().map((g) => `<option value="${g.id}" ${g.id === gradoF ? 'selected' : ''}>${escapar(nombreGrado(g))}</option>`).join('')}</select>
          <select class="control" id="f-estado">${opciones([{ valor: 'Activo', texto: 'Activos' }, { valor: 'Retirado', texto: 'Retirados' }, { valor: '', texto: 'Todos' }], estadoF)}</select>
          <label class="check"><input type="checkbox" id="f-riesgo" ${riesgoF ? 'checked' : ''} /> Solo en riesgo</label>
        </div>
        <div class="herramientas"><button type="button" class="btn btn-secundario btn-sm" id="csv">${icono('descargar', 16)} Excel (CSV)</button>
          ${editable ? `<button type="button" class="btn btn-primario btn-sm" id="nuevo">${icono('mas', 16)} Inscribir estudiante</button>` : ''}</div></div>
        <div class="card-cuerpo sin-relleno"><div class="tabla-scroll"><table class="tabla">
          <thead><tr><th>Estudiante</th><th>Grado</th><th>Encargado</th><th class="centro">Promedio</th><th class="centro">Asistencia</th><th>Estado</th><th></th></tr></thead>
          <tbody>${lista.length ? lista.map((e) => {
            const prom = promedioGeneral(e); const asis = asistenciaDe(e); const p = porId('padres', e.padreId);
            const riesgo = cursosEnRiesgo(e);
            return `<tr><td><div class="persona">${avatar(nombreCompleto(e), usuarioDe('estudiante', e.id)?.color, 'sm')}<div><strong>${escapar(nombreCompleto(e))}</strong><small class="mono">${escapar(e.carnet)}</small></div></div></td>
              <td>${escapar(nombreGrado(grado(e.gradoId)))}</td>
              <td>${p ? `<strong style="font-size:.86rem">${escapar(nombreCompleto(p))}</strong><small class="stat-nota" style="display:block">${escapar(p.telefono)}</small>` : '—'}</td>
              <td class="centro"><span class="nota nota-${nivelNota(prom).clase}">${fmtNota(prom, 1)}</span>${riesgo.length ? `<small class="stat-nota" style="display:block;color:var(--rojo)">${riesgo.length} en riesgo</small>` : ''}</td>
              <td class="centro">${badge(`${asis.porcentaje.toFixed(0)}%`, asis.porcentaje >= 95 ? 'ok' : asis.porcentaje >= 85 ? 'warn' : 'bad')}</td>
              <td>${badge(e.estado, e.estado === 'Activo' ? 'ok' : 'neutral')}</td>
              <td><div class="acciones">${botonIcono('ojo', 'Ver ficha', `data-ficha="${e.id}"`)}${editable ? botonIcono('editar', 'Editar', `data-editar="${e.id}"`) + botonIcono(e.estado === 'Activo' ? 'salir' : 'reiniciar', e.estado === 'Activo' ? 'Retirar' : 'Reactivar', `data-estado="${e.id}"`, 'peligro') : ''}</div></td></tr>`;
          }).join('') : `<tr><td colspan="7">${vacio('🔍', 'No se encontraron estudiantes')}</td></tr>`}</tbody></table></div></div>
        <div class="card-cuerpo"><span class="stat-nota">${lista.length} estudiante${lista.length === 1 ? '' : 's'}</span></div>
      </section>`;

    const $ = <T extends HTMLElement>(s: string) => ctx.vista.querySelector<T>(s)!;
    $<HTMLInputElement>('#buscar').addEventListener('input', (e) => { busqueda = (e.target as HTMLInputElement).value; pintar(); $<HTMLInputElement>('#buscar').focus(); $<HTMLInputElement>('#buscar').setSelectionRange(busqueda.length, busqueda.length); });
    $('#f-grado').addEventListener('change', (e) => { gradoF = (e.target as HTMLSelectElement).value; pintar(); });
    $('#f-estado').addEventListener('change', (e) => { estadoF = (e.target as HTMLSelectElement).value; pintar(); });
    $('#f-riesgo').addEventListener('change', (e) => { riesgoF = (e.target as HTMLInputElement).checked; pintar(); });
    $('#csv').addEventListener('click', () => {
      descargar('estudiantes.csv', aCSV([['Carné', 'Nombre', 'Grado', 'Encargado', 'Teléfono', 'Promedio', 'Asistencia %', 'Estado'],
        ...lista.map((e) => { const p = porId('padres', e.padreId); return [e.carnet, nombreCompleto(e), nombreGrado(grado(e.gradoId)), nombreCompleto(p), p?.telefono ?? '', fmtNota(promedioGeneral(e), 1), asistenciaDe(e).porcentaje.toFixed(1), e.estado]; })]), 'text/csv');
    });
    ctx.vista.querySelectorAll<HTMLElement>('[data-ficha]').forEach((b) => b.addEventListener('click', () => fichaEstudiante(b.dataset.ficha!, ctx.rol)));
    ctx.vista.querySelector('#nuevo')?.addEventListener('click', () => formulario());
    ctx.vista.querySelectorAll<HTMLElement>('[data-editar]').forEach((b) => b.addEventListener('click', () => formulario(porId('estudiantes', b.dataset.editar))));
    ctx.vista.querySelectorAll<HTMLElement>('[data-estado]').forEach((b) => b.addEventListener('click', async () => {
      const e = porId('estudiantes', b.dataset.estado)!;
      const retirar = e.estado === 'Activo';
      if (!(await confirmar(retirar ? '¿Retirar estudiante?' : '¿Reactivar estudiante?', retirar ? `${nombreCompleto(e)} dejará de aparecer en listas y su usuario se desactivará.` : `${nombreCompleto(e)} volverá a estar activo.`, retirar ? 'Retirar' : 'Reactivar', retirar))) return;
      guardarItem('estudiantes', { ...e, estado: retirar ? 'Retirado' : 'Activo' });
      const u = usuarioDe('estudiante', e.id);
      if (u) guardarItem('usuarios', { ...u, activo: !retirar });
      aviso(retirar ? 'Estudiante retirado' : 'Estudiante reactivado'); pintar();
    }));
  };

  const formulario = (e?: Estudiante) => {
    const padres = [...obtener('padres')].sort((a, b) => a.apellidos.localeCompare(b.apellidos));
    modalFormulario({
      titulo: e ? '✏️ Editar estudiante' : '🎓 Inscribir estudiante', textoGuardar: e ? 'Guardar' : 'Inscribir', ancho: 'lg',
      campos: `
        ${campo('Nombres *', `<input name="nombres" required value="${escapar(e?.nombres ?? '')}" />`)}
        ${campo('Apellidos *', `<input name="apellidos" required value="${escapar(e?.apellidos ?? '')}" />`)}
        ${campo('Género', `<select name="genero">${opciones([{ valor: 'F', texto: 'Femenino' }, { valor: 'M', texto: 'Masculino' }], e?.genero)}</select>`)}
        ${campo('Fecha de nacimiento *', `<input name="nacimiento" type="date" required value="${e?.nacimiento ?? ''}" max="${hoy()}" />`)}
        ${campo('Grado y sección *', `<select name="gradoId" required>${gradosOrdenados().map((g) => `<option value="${g.id}" ${g.id === e?.gradoId ? 'selected' : ''}>${escapar(nombreGrado(g))}</option>`).join('')}</select>`)}
        ${campo('Encargado', `<select name="padreId" id="sel-padre"><option value="nuevo">➕ Registrar nuevo encargado</option>${padres.map((p) => `<option value="${p.id}" ${p.id === e?.padreId ? 'selected' : ''}>${escapar(nombreCompleto(p))}</option>`).join('')}</select>`)}
        <div class="completo grid g2" id="nuevo-padre" style="gap:1rem">
          ${campo('Nombres del encargado *', '<input name="pNombres" />')}${campo('Apellidos del encargado *', '<input name="pApellidos" />')}
          ${campo('Parentesco', `<select name="pParentesco">${opciones(['Madre', 'Padre', 'Encargado'].map((x) => ({ valor: x, texto: x })))}</select>`)}
          ${campo('Teléfono *', '<input name="pTelefono" placeholder="5555-5555" />')}${campo('Correo', '<input name="pCorreo" type="email" />', 'completo')}
        </div>
        ${!e ? '<label class="check completo"><input type="checkbox" name="usuarios" checked /> Crear usuarios de acceso (contraseña inicial: 12345)</label><div class="ayuda">Al inscribir se generan automáticamente las cuotas de inscripción y colegiatura del ciclo.</div>' : ''}`,
      alAbrir: (form) => {
        const sel = form.querySelector<HTMLSelectElement>('#sel-padre')!;
        const caja = form.querySelector<HTMLElement>('#nuevo-padre')!;
        const sync = () => { const nuevo = sel.value === 'nuevo'; caja.hidden = !nuevo; caja.querySelectorAll<HTMLInputElement>('[name="pNombres"],[name="pApellidos"],[name="pTelefono"]').forEach((i) => { i.required = nuevo; }); };
        if (!e) sel.value = 'nuevo';
        sel.addEventListener('change', sync); sync();
      },
      alGuardar: (d) => {
        let padreId = d.padreId;
        let padreNuevo: Padre | undefined;
        if (padreId === 'nuevo') {
          padreNuevo = { id: nuevoId('p'), nombres: d.pNombres.trim(), apellidos: d.pApellidos.trim(), parentesco: d.pParentesco as Padre['parentesco'], telefono: d.pTelefono.trim(), correo: d.pCorreo.trim(), direccion: '' };
          guardarItem('padres', padreNuevo);
          padreId = padreNuevo.id;
        }
        const est: Estudiante = {
          id: e?.id ?? nuevoId('e'), carnet: e?.carnet ?? `${config().ciclo}-${String(obtener('estudiantes').length + 1).padStart(4, '0')}`,
          nombres: d.nombres.trim(), apellidos: d.apellidos.trim(), genero: d.genero as 'F' | 'M', nacimiento: d.nacimiento, gradoId: d.gradoId,
          padreId, estado: e?.estado ?? 'Activo', inscrito: e?.inscrito ?? hoy(),
        };
        guardarItem('estudiantes', est);
        if (!e) {
          guardar('pagos', generarCuotas(est));
          if (d.usuarios === 'on') {
            const ue = crearUsuarioPara('estudiante', est.id, nombreCompleto(est));
            const up = padreNuevo ? crearUsuarioPara('padre', padreNuevo.id, nombreCompleto(padreNuevo), padreNuevo.parentesco) : undefined;
            aviso(`Inscrito ✅ Usuario: @${ue.usuario}${up ? ` · Encargado: @${up.usuario}` : ''} (clave 12345)`);
          } else aviso('Estudiante inscrito ✅');
        } else {
          const u = usuarioDe('estudiante', est.id);
          if (u) guardarItem('usuarios', { ...u, nombre: nombreCompleto(est) });
          if (padreNuevo && d.usuarios !== 'off') crearUsuarioPara('padre', padreNuevo.id, nombreCompleto(padreNuevo), padreNuevo.parentesco);
          aviso('Datos actualizados');
        }
        pintar();
      },
    });
  };
  pintar();
}

// ---------- Maestros ----------
export function paginaMaestros(ctx: Contexto) {
  const editable = ctx.rol === 'admin';
  let busqueda = '';

  const pintar = () => {
    const lista = obtener('maestros').filter((m) => !busqueda || coincide(`${nombreCompleto(m)} ${m.especialidad}`, busqueda))
      .sort((a, b) => a.apellidos.localeCompare(b.apellidos));
    ctx.vista.innerHTML = `
      <div class="herramientas mb">
        <div class="buscador">${icono('buscar', 18)}<input class="control" id="buscar" placeholder="Buscar maestro o especialidad..." value="${escapar(busqueda)}" /></div>
        ${editable ? `<button type="button" class="btn btn-primario" id="nuevo">${icono('mas', 18)} Agregar maestro</button>` : ''}
      </div>
      <div class="grid g-auto" style="grid-template-columns:repeat(auto-fill,minmax(320px,1fr))">${lista.map((m) => {
        const asigs = asignacionesDeMaestro(m.id);
        const u = usuarioDe('maestro', m.id);
        const prom = promedio(asigs.map((a) => promedioAsignacion(a.id)));
        const guia = obtener('grados').filter((g) => g.guiaId === m.id);
        return `<section class="card"><div class="card-cuerpo">
          <div class="persona" style="margin-bottom:1rem">${avatar(nombreCompleto(m), u?.color, 'lg')}<div style="flex:1;min-width:0"><strong style="font-size:1.02rem">${escapar(tituloMaestro(m))}</strong><small>${escapar(m.especialidad)}</small>
            ${guia.length ? `<span class="badge rol" style="margin-top:.3rem">⭐ Guía de ${escapar(guia.map((g) => nombreGrado(g)).join(', '))}</span>` : ''}</div></div>
          <div class="grid g3" style="gap:.6rem;margin-bottom:1rem">
            <div><p class="stat-etiqueta">Clases</p><p class="stat-valor" style="font-size:1.2rem">${asigs.length}</p></div>
            <div><p class="stat-etiqueta">Periodos/sem.</p><p class="stat-valor" style="font-size:1.2rem">${periodosPorSemana(horarioDeMaestro(m.id))}</p></div>
            <div><p class="stat-etiqueta">Promedio</p><p class="stat-valor" style="font-size:1.2rem;color:${nivelNota(prom).color}">${fmtNota(prom, 1)}</p></div>
          </div>
          <div class="chips" style="margin-bottom:1rem">${asigs.map((a) => `<span class="chip-curso" style="--c:${curso(a.cursoId)?.color}"><span>${curso(a.cursoId)?.icono}</span>${escapar(grado(a.gradoId)?.nombre ?? '')}</span>`).join('') || '<span class="stat-nota">Sin clases asignadas</span>'}</div>
          <p class="stat-nota">✉️ ${escapar(m.correo)} · 📞 ${escapar(m.telefono)}</p>
          <div class="herramientas" style="margin-top:.9rem;justify-content:space-between">
            <span class="stat-nota">${entregasPorCalificar(m.id).length} entregas por calificar</span>
            <div class="acciones">${u ? `<a class="btn-icono borde" title="Enviar mensaje" href="${ruta(`/${ctx.rol}/mensajes?con=${u.id}`)}">${icono('mensajes', 17)}</a>` : ''}
            ${editable ? botonIcono('editar', 'Editar', `data-editar="${m.id}"`, 'borde') + botonIcono('borrar', 'Eliminar', `data-borrar="${m.id}"`, 'borde peligro') : ''}</div>
          </div></div></section>`;
      }).join('') || `<div class="card">${vacio('🔍', 'Sin resultados')}</div>`}</div>`;

    const buscar = ctx.vista.querySelector<HTMLInputElement>('#buscar')!;
    buscar.addEventListener('input', () => { busqueda = buscar.value; pintar(); const b = ctx.vista.querySelector<HTMLInputElement>('#buscar')!; b.focus(); b.setSelectionRange(busqueda.length, busqueda.length); });
    ctx.vista.querySelector('#nuevo')?.addEventListener('click', () => formulario());
    ctx.vista.querySelectorAll<HTMLElement>('[data-editar]').forEach((b) => b.addEventListener('click', () => formulario(porId('maestros', b.dataset.editar))));
    ctx.vista.querySelectorAll<HTMLElement>('[data-borrar]').forEach((b) => b.addEventListener('click', async () => {
      const m = porId('maestros', b.dataset.borrar)!;
      if (asignacionesDeMaestro(m.id).length) return aviso('Primero reasigna sus clases en la sección Académico', 'error');
      if (!(await confirmar('¿Eliminar maestro?', `Se eliminará a ${nombreCompleto(m)} y su usuario de acceso.`))) return;
      eliminarItem('maestros', m.id);
      const u = usuarioDe('maestro', m.id); if (u) eliminarItem('usuarios', u.id);
      aviso('Maestro eliminado'); pintar();
    }));
  };

  const formulario = (m?: Maestro) => modalFormulario({
    titulo: m ? '✏️ Editar maestro' : '👩‍🏫 Agregar maestro', textoGuardar: m ? 'Guardar' : 'Agregar',
    campos: `
      ${campo('Nombres *', `<input name="nombres" required value="${escapar(m?.nombres ?? '')}" />`)}
      ${campo('Apellidos *', `<input name="apellidos" required value="${escapar(m?.apellidos ?? '')}" />`)}
      ${campo('Género', `<select name="genero">${opciones([{ valor: 'F', texto: 'Femenino' }, { valor: 'M', texto: 'Masculino' }], m?.genero)}</select>`)}
      ${campo('Especialidad *', `<input name="especialidad" required value="${escapar(m?.especialidad ?? '')}" placeholder="Ej. Matemáticas" />`)}
      ${campo('Correo *', `<input name="correo" type="email" required value="${escapar(m?.correo ?? '')}" />`)}
      ${campo('Teléfono', `<input name="telefono" value="${escapar(m?.telefono ?? '')}" />`)}
      ${!m ? '<div class="ayuda">Se creará su usuario de acceso con la contraseña inicial 12345. Asígnale clases en la sección Académico.</div>' : ''}`,
    alGuardar: (d) => {
      const nuevo: Maestro = { id: m?.id ?? nuevoId('m'), nombres: d.nombres.trim(), apellidos: d.apellidos.trim(), genero: d.genero as 'F' | 'M', especialidad: d.especialidad.trim(), correo: d.correo.trim(), telefono: d.telefono.trim(), ingreso: m?.ingreso ?? hoy() };
      guardarItem('maestros', nuevo);
      if (!m) { const u = crearUsuarioPara('maestro', nuevo.id, nombreCompleto(nuevo), nuevo.especialidad); aviso(`Maestro agregado ✅ Usuario: @${u.usuario}`); }
      else { const u = usuarioDe('maestro', m.id); if (u) guardarItem('usuarios', { ...u, nombre: nombreCompleto(nuevo), cargo: nuevo.especialidad }); aviso('Datos actualizados'); }
      pintar();
    },
  });
  pintar();
}


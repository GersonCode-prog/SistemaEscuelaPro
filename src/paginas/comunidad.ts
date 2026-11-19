// ============================================================
//  COMUNICACIÓN (todos los roles): mensajes · avisos · calendario · perfil
// ============================================================
import type { Contexto } from '../lib/app';
import type { Anuncio, Audiencia, Conversacion, Evento } from '../lib/tipos';
import { obtener, porId, guardarItem, eliminarItem, nuevoId } from '../lib/datos';
import {
  ROLES, anunciosPara, contactosPara, textoAudiencia, gradosDeMaestro, gradosOrdenados, nombreGrado, grado, hijosDe,
  tareasDeEstudiante, asignacionesDeMaestro, curso, nombreCompleto, asignacionesDeGrado, edad, nombreAsignacion,
} from '../lib/escuela';
import { avatar, badge, vacio, tarjeta } from '../lib/vistas';
import { escapar, parrafos, haceTiempo, hora, fechaLarga, fechaMedia, MESES, hoy, fechaISO, coincide, aFecha, relativa } from '../lib/formato';
import { icono } from '../lib/iconos';
import { aviso, confirmar, modalFormulario, campo, opciones, abrirModal } from '../lib/ui';
import { usuarioDe } from '../lib/escuela';

// ---------- Mensajes ----------
export function paginaMensajes(ctx: Contexto) {
  const yo = ctx.usuario;
  const params = new URLSearchParams(location.search);
  let activa = params.get('c') ?? '';
  let busqueda = '';
  const contactos = contactosPara(yo);
  const detalleDe = (id: string) => contactos.find((c) => c.usuario.id === id)?.detalle ?? ROLES[porId('usuarios', id)?.rol ?? 'admin'].nombre;
  const otroDe = (c: Conversacion) => porId('usuarios', c.a === yo.id ? c.b : c.a);
  const sinLeer = (c: Conversacion) => c.mensajes.filter((m) => m.de !== yo.id && m.fecha > (c.leido[yo.id] ?? '')).length;
  const mias = () => obtener('conversaciones').filter((c) => c.a === yo.id || c.b === yo.id)
    .sort((x, y) => (y.mensajes.at(-1)?.fecha ?? '').localeCompare(x.mensajes.at(-1)?.fecha ?? ''));

  // ?con=usuarioId abre (o prepara) una conversación con esa persona
  const con = params.get('con');
  if (con) {
    const existente = mias().find((c) => c.a === con || c.b === con);
    if (existente) activa = existente.id;
    else setTimeout(() => nuevaConversacion(con), 50);
  }

  ctx.vista.innerHTML = `<section class="card chat ${activa ? 'viendo' : ''}" id="chat">
    <div class="chat-lista">
      <div class="chat-lista-cab">
        <div class="herramientas" style="justify-content:space-between"><strong>Conversaciones</strong>
          <button type="button" class="btn btn-primario btn-sm" id="nuevo">${icono('mas', 16)} Nuevo</button></div>
        <div class="buscador">${icono('buscar', 18)}<input class="control" id="buscar" placeholder="Buscar conversación..." /></div>
      </div>
      <div class="chat-conversaciones" id="lista"></div>
    </div>
    <div class="chat-panel" id="panel"></div>
  </section>`;

  const chat = ctx.vista.querySelector<HTMLElement>('#chat')!;

  const pintarLista = () => {
    const lista = mias().filter((c) => !busqueda || coincide(`${otroDe(c)?.nombre ?? ''} ${c.asunto}`, busqueda));
    ctx.vista.querySelector('#lista')!.innerHTML = lista.length ? lista.map((c) => {
      const otro = otroDe(c);
      const ultimo = c.mensajes.at(-1);
      const n = sinLeer(c);
      return `<button type="button" class="conv ${c.id === activa ? 'activa' : ''}" data-conv="${c.id}">
        ${avatar(otro?.nombre ?? '?', otro?.color)}
        <span class="crece"><strong>${escapar(otro?.nombre ?? 'Usuario')}<em>${ultimo ? haceTiempo(ultimo.fecha) : ''}</em></strong>
        <small>${escapar(c.asunto)}</small><small>${ultimo ? `${ultimo.de === yo.id ? 'Tú: ' : ''}${escapar(ultimo.texto)}` : ''}</small></span>
        ${n ? `<span class="sin-leer">${n}</span>` : ''}</button>`;
    }).join('') : vacio('💬', 'Sin conversaciones', 'Inicia una con el botón "Nuevo".');
  };

  const pintarPanel = () => {
    const panel = ctx.vista.querySelector('#panel')!;
    const c = obtener('conversaciones').find((x) => x.id === activa);
    if (!c) {
      panel.innerHTML = vacio('📨', 'Selecciona una conversación', 'O escribe un mensaje nuevo a tus contactos.');
      chat.classList.remove('viendo');
      return;
    }
    // Marcar como leída
    if (sinLeer(c)) guardarItem('conversaciones', { ...c, leido: { ...c.leido, [yo.id]: new Date().toISOString() } });
    const otro = otroDe(c);
    let diaAnterior = '';
    panel.innerHTML = `
      <div class="chat-cab">
        <button type="button" class="btn-icono chat-volver" id="volver" aria-label="Volver">${icono('izquierda')}</button>
        ${avatar(otro?.nombre ?? '?', otro?.color)}
        <div><strong>${escapar(otro?.nombre ?? 'Usuario')}</strong><small>${escapar(detalleDe(otro?.id ?? ''))} · ${escapar(c.asunto)}</small></div>
      </div>
      <div class="chat-mensajes" id="mensajes">${c.mensajes.map((m) => {
        const dia = m.fecha.slice(0, 10);
        const sep = dia !== diaAnterior ? `<span class="chat-dia">${relativa(fechaISO(aFecha(m.fecha)))} · ${fechaMedia(fechaISO(aFecha(m.fecha)))}</span>` : '';
        diaAnterior = dia;
        return `${sep}<div class="burbuja ${m.de === yo.id ? 'mia' : ''}">${escapar(m.texto)}<time>${hora(m.fecha)}</time></div>`;
      }).join('')}</div>
      <form class="chat-escribir" id="escribir">
        <textarea name="texto" rows="1" placeholder="Escribe un mensaje... (Enter para enviar)" required></textarea>
        <button type="submit" class="btn btn-primario">${icono('enviar', 18)}</button>
      </form>`;
    chat.classList.add('viendo');
    const caja = panel.querySelector<HTMLElement>('#mensajes')!;
    caja.scrollTop = caja.scrollHeight;
    const form = panel.querySelector<HTMLFormElement>('#escribir')!;
    const area = form.querySelector('textarea')!;
    area.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const texto = area.value.trim();
      if (!texto) return;
      const actual = obtener('conversaciones').find((x) => x.id === c.id)!;
      const ahora = new Date().toISOString();
      guardarItem('conversaciones', { ...actual, mensajes: [...actual.mensajes, { de: yo.id, texto, fecha: ahora }], leido: { ...actual.leido, [yo.id]: ahora } });
      pintarLista(); pintarPanel();
      ctx.vista.querySelector<HTMLTextAreaElement>('#escribir textarea')?.focus();
    });
    panel.querySelector('#volver')!.addEventListener('click', () => { activa = ''; history.replaceState(null, '', location.pathname); pintarLista(); pintarPanel(); });
  };

  function nuevaConversacion(paraId = '') {
    if (!contactos.length) return aviso('No tienes contactos disponibles', 'info');
    modalFormulario({
      titulo: '✉️ Nuevo mensaje', textoGuardar: 'Enviar',
      campos: `
        ${campo('Para *', `<select name="para" required><option value="">Selecciona un contacto...</option>${contactos.map((c) => `<option value="${c.usuario.id}" ${c.usuario.id === paraId ? 'selected' : ''}>${escapar(c.usuario.nombre)} — ${escapar(c.detalle)}</option>`).join('')}</select>`, 'completo')}
        ${campo('Asunto *', '<input name="asunto" required maxlength="80" placeholder="Ej. Consulta sobre la tarea" />', 'completo')}
        ${campo('Mensaje *', '<textarea name="texto" required placeholder="Escribe tu mensaje..."></textarea>', 'completo')}`,
      alGuardar: (d) => {
        const ahora = new Date().toISOString();
        const c: Conversacion = { id: nuevoId('c'), a: yo.id, b: d.para, asunto: d.asunto.trim(), mensajes: [{ de: yo.id, texto: d.texto.trim(), fecha: ahora }], leido: { [yo.id]: ahora } };
        guardarItem('conversaciones', c);
        activa = c.id;
        aviso('Mensaje enviado');
        pintarLista(); pintarPanel();
      },
    });
  }

  ctx.vista.querySelector('#lista')!.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-conv]');
    if (!b) return;
    activa = b.dataset.conv!;
    pintarPanel(); pintarLista();
  });
  ctx.vista.querySelector('#buscar')!.addEventListener('input', (e) => { busqueda = (e.target as HTMLInputElement).value; pintarLista(); });
  ctx.vista.querySelector('#nuevo')!.addEventListener('click', () => nuevaConversacion());
  pintarPanel(); pintarLista();
}

// ---------- Avisos ----------
const COLOR_CATEGORIA: Record<Anuncio['categoria'], string> = { General: 'info', Académico: 'morado', Evento: 'ok', Urgente: 'bad' };
const EMOJI_CATEGORIA: Record<Anuncio['categoria'], string> = { General: '📢', Académico: '📚', Evento: '🎉', Urgente: '🚨' };

export function paginaAvisos(ctx: Contexto) {
  const yo = ctx.usuario;
  const puedePublicar = ['maestro', 'director', 'admin'].includes(ctx.rol);
  let categoria = '';
  // Marcar avisos como vistos al entrar
  const antes = yo.vistoAvisos ?? '';
  guardarItem('usuarios', { ...yo, vistoAvisos: new Date().toISOString() });

  const pintar = () => {
    const todos = anunciosPara(yo);
    const lista = todos.filter((a) => !categoria || a.categoria === categoria);
    ctx.vista.innerHTML = `
      <div class="herramientas mb">
        <div class="chips">${['', 'General', 'Académico', 'Evento', 'Urgente'].map((c) => `<button type="button" class="chip ${categoria === c ? 'activo' : ''}" data-cat="${c}">${c ? `${EMOJI_CATEGORIA[c as Anuncio['categoria']]} ${c}` : 'Todos'} <span class="cuenta">${todos.filter((a) => !c || a.categoria === c).length}</span></button>`).join('')}</div>
        ${puedePublicar ? `<button type="button" class="btn btn-primario" id="publicar" style="margin-left:auto">${icono('mas', 18)} Publicar aviso</button>` : ''}
      </div>
      <div class="grid g2">${lista.length ? lista.map((a) => {
        const autor = porId('usuarios', a.autorId);
        const puedeBorrar = a.autorId === yo.id || ctx.rol === 'director' || ctx.rol === 'admin';
        return `<article class="anuncio ${a.fijado ? 'fijado' : ''}">
          <div class="anuncio-cab">${avatar(autor?.nombre ?? '?', autor?.color, 'sm')}
            <div class="crece"><strong>${escapar(autor?.nombre ?? 'Colegio')}</strong><small>${escapar(autor ? ROLES[autor.rol].nombre : '')} · ${haceTiempo(a.fecha)}</small></div>
            ${a.fecha > antes ? badge('Nuevo', 'rol') : ''}${a.fijado ? `<span title="Fijado" style="color:var(--rol)">${icono('pin', 18)}</span>` : ''}
            ${puedeBorrar ? `<button type="button" class="btn-icono peligro" data-borrar="${a.id}" title="Eliminar aviso">${icono('borrar', 17)}</button>` : ''}</div>
          <h3>${EMOJI_CATEGORIA[a.categoria]} ${escapar(a.titulo)}</h3>
          <p>${parrafos(a.contenido)}</p>
          <div class="anuncio-pie">${badge(a.categoria, COLOR_CATEGORIA[a.categoria])}${badge(textoAudiencia(a))}</div>
        </article>`;
      }).join('') : `<div class="card" style="grid-column:1/-1">${vacio('📭', 'No hay avisos en esta categoría')}</div>`}</div>`;

    ctx.vista.querySelectorAll<HTMLButtonElement>('[data-cat]').forEach((b) => b.addEventListener('click', () => { categoria = b.dataset.cat!; pintar(); }));
    ctx.vista.querySelector('#publicar')?.addEventListener('click', publicar);
    ctx.vista.querySelectorAll<HTMLButtonElement>('[data-borrar]').forEach((b) => b.addEventListener('click', async () => {
      if (await confirmar('¿Eliminar aviso?', 'El aviso dejará de verse para todos.')) { eliminarItem('anuncios', b.dataset.borrar!); aviso('Aviso eliminado'); pintar(); }
    }));
  };

  const publicar = () => {
    const esMaestro = ctx.rol === 'maestro';
    const secciones = esMaestro ? gradosDeMaestro(yo.refId!) : gradosOrdenados();
    const audiencias: { valor: Audiencia; texto: string }[] = esMaestro
      ? [{ valor: 'familias', texto: 'Estudiantes y padres' }, { valor: 'estudiantes', texto: 'Solo estudiantes' }, { valor: 'padres', texto: 'Solo padres de familia' }]
      : [{ valor: 'todos', texto: 'Toda la comunidad' }, { valor: 'familias', texto: 'Estudiantes y padres' }, { valor: 'estudiantes', texto: 'Solo estudiantes' }, { valor: 'padres', texto: 'Solo padres de familia' }, { valor: 'maestros', texto: 'Solo docentes' }];
    modalFormulario({
      titulo: '📢 Publicar aviso', textoGuardar: 'Publicar',
      campos: `
        ${campo('Título *', '<input name="titulo" required maxlength="90" placeholder="Ej. Reunión de padres de familia" />', 'completo')}
        ${campo('Mensaje *', '<textarea name="contenido" required rows="5" placeholder="Escribe el aviso..."></textarea>', 'completo')}
        ${campo('Categoría', `<select name="categoria">${opciones(['General', 'Académico', 'Evento', 'Urgente'].map((c) => ({ valor: c, texto: c })))}</select>`)}
        ${campo('Dirigido a', `<select name="audiencia">${opciones(audiencias)}</select>`)}
        ${campo('Sección', `<select name="gradoId">${esMaestro ? '' : '<option value="">Todas las secciones</option>'}${secciones.map((g) => `<option value="${g.id}">${escapar(nombreGrado(g))}</option>`).join('')}</select>`)}
        ${!esMaestro ? '<label class="check completo"><input type="checkbox" name="fijado" /> 📌 Fijar arriba para que todos lo vean primero</label>' : ''}`,
      alGuardar: (d) => {
        guardarItem('anuncios', {
          id: nuevoId('a'), titulo: d.titulo.trim(), contenido: d.contenido.trim(), categoria: d.categoria as Anuncio['categoria'],
          audiencia: d.audiencia as Audiencia, gradoId: d.gradoId || null, autorId: yo.id, fecha: new Date().toISOString(), fijado: d.fijado === 'on',
        });
        aviso('Aviso publicado 📢');
        pintar();
      },
    });
  };

  pintar();
}

// ---------- Calendario ----------
const COLOR_EVENTO: Record<string, string> = { Académico: '#7c3aed', Evento: '#059669', Reunión: '#ea580c', Feriado: '#dc2626', Tarea: '#2563eb' };

export function paginaCalendario(ctx: Contexto) {
  const puedeEditar = ctx.rol === 'director' || ctx.rol === 'admin';
  let ref = new Date(); ref.setDate(1);
  let seleccion = hoy();

  // Tareas que aparecen en el calendario según el rol
  const tareas = (): { titulo: string; fecha: string; detalle: string }[] => {
    if (ctx.estudiante) return tareasDeEstudiante(ctx.estudiante).map((t) => ({ titulo: `${t.curso.icono} ${t.tarea.titulo}`, fecha: t.tarea.entrega, detalle: `Entrega de tarea · ${t.curso.nombre} · ${t.estado}` }));
    if (ctx.rol === 'maestro') {
      const asigs = asignacionesDeMaestro(ctx.usuario.refId!);
      return obtener('tareas').filter((t) => asigs.some((a) => a.id === t.asignacionId))
        .map((t) => ({ titulo: `${curso(porId('asignaciones', t.asignacionId)!.cursoId)?.icono} ${t.titulo}`, fecha: t.entrega, detalle: `Entrega · ${nombreAsignacion(porId('asignaciones', t.asignacionId))}` }));
    }
    return [];
  };

  const pintar = () => {
    const eventos = obtener('eventos');
    const listaTareas = tareas();
    const delDia = (f: string) => [
      ...eventos.filter((e) => e.fecha === f).map((e) => ({ id: e.id, titulo: e.titulo, color: COLOR_EVENTO[e.tipo], tipo: e.tipo, detalle: e.descripcion })),
      ...listaTareas.filter((t) => t.fecha === f).map((t) => ({ id: '', titulo: t.titulo, color: COLOR_EVENTO.Tarea, tipo: 'Tarea', detalle: t.detalle })),
    ];
    const y = ref.getFullYear(); const m = ref.getMonth();
    const inicio = new Date(y, m, 1 - ((new Date(y, m, 1).getDay() + 6) % 7));
    const celdas: string[] = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => `<div class="cal-cab">${d}</div>`);
    for (let i = 0; i < 42; i++) {
      const d = new Date(inicio); d.setDate(inicio.getDate() + i);
      const f = fechaISO(d);
      const items = delDia(f);
      celdas.push(`<div class="cal-celda ${d.getMonth() !== m ? 'fuera' : ''} ${f === hoy() ? 'hoy' : ''} ${f === seleccion ? 'seleccionada' : ''}" data-dia="${f}">
        <span class="cal-num">${d.getDate()}</span>
        ${items.slice(0, 2).map((e) => `<span class="cal-evento" style="--c:${e.color}" title="${escapar(e.titulo)}">${escapar(e.titulo)}</span>`).join('')}
        ${items.length > 2 ? `<span class="cal-mas">+${items.length - 2} más</span>` : ''}</div>`);
    }
    const proximos = [...eventos].filter((e) => e.fecha >= hoy()).sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, 6);
    const elegidos = delDia(seleccion);

    ctx.vista.innerHTML = `<div class="grid g-2-1">
      <section class="card">
        <div class="card-cabecera">
          <h2>${icono('calendario')} ${MESES[m]} ${y}</h2>
          <div class="herramientas">
            <button type="button" class="btn-icono borde" data-mes="-1" aria-label="Mes anterior">${icono('izquierda')}</button>
            <button type="button" class="btn btn-secundario btn-sm" data-mes="0">Hoy</button>
            <button type="button" class="btn-icono borde" data-mes="1" aria-label="Mes siguiente">${icono('derecha')}</button>
            ${puedeEditar ? `<button type="button" class="btn btn-primario btn-sm" id="nuevo-evento">${icono('mas', 16)} Evento</button>` : ''}
          </div>
        </div>
        <div class="calendario">${celdas.join('')}</div>
        <div class="card-cuerpo"><div class="leyenda">${Object.entries(COLOR_EVENTO).filter(([k]) => k !== 'Tarea' || listaTareas.length).map(([k, c]) => `<span><i style="background:${c}"></i>${k}</span>`).join('')}</div></div>
      </section>
      <div class="pila">
        ${tarjeta(`📌 ${fechaLarga(seleccion)}`, elegidos.length ? `<div class="lista">${elegidos.map((e) => `
          <div class="lista-item"><span class="curso-icono" style="--c:${e.color}">${e.tipo === 'Tarea' ? '📝' : e.tipo === 'Feriado' ? '🏖️' : e.tipo === 'Reunión' ? '👥' : e.tipo === 'Académico' ? '📚' : '🎉'}</span>
          <div class="crece"><strong>${escapar(e.titulo)}</strong><small>${escapar(e.detalle)}</small></div>
          ${puedeEditar && e.id ? `<button type="button" class="btn-icono peligro" data-borrar="${e.id}" title="Eliminar">${icono('borrar', 17)}</button>` : ''}</div>`).join('')}</div>`
          : vacio('🗓️', 'Sin actividades', 'No hay eventos para este día.'))}
        ${tarjeta('⏭️ Próximos eventos', proximos.length ? `<div class="lista">${proximos.map((e) => `
          <div class="lista-item"><span class="fecha-caja" style="background:color-mix(in srgb, ${COLOR_EVENTO[e.tipo]} 12%, white);color:${COLOR_EVENTO[e.tipo]}"><b>${aFecha(e.fecha).getDate()}</b><span>${MESES[aFecha(e.fecha).getMonth()].slice(0, 3)}</span></span>
          <div class="crece"><strong>${escapar(e.titulo)}</strong><small>${relativa(e.fecha)} · ${e.tipo}</small></div></div>`).join('')}</div>` : vacio('🗓️', 'No hay eventos próximos'))}
      </div></div>`;

    ctx.vista.querySelectorAll<HTMLButtonElement>('[data-mes]').forEach((b) => b.addEventListener('click', () => {
      const n = Number(b.dataset.mes);
      if (n === 0) { ref = new Date(); ref.setDate(1); seleccion = hoy(); } else ref = new Date(ref.getFullYear(), ref.getMonth() + n, 1);
      pintar();
    }));
    ctx.vista.querySelectorAll<HTMLElement>('[data-dia]').forEach((c) => c.addEventListener('click', () => { seleccion = c.dataset.dia!; pintar(); }));
    ctx.vista.querySelector('#nuevo-evento')?.addEventListener('click', () => modalFormulario({
      titulo: '🗓️ Nuevo evento', textoGuardar: 'Agregar',
      campos: `${campo('Título *', '<input name="titulo" required maxlength="80" />', 'completo')}
        ${campo('Fecha *', `<input name="fecha" type="date" required value="${seleccion}" />`)}
        ${campo('Tipo', `<select name="tipo">${opciones(['Académico', 'Evento', 'Reunión', 'Feriado'].map((t) => ({ valor: t, texto: t })))}</select>`)}
        ${campo('Descripción', '<textarea name="descripcion" rows="3"></textarea>', 'completo')}`,
      alGuardar: (d) => {
        guardarItem('eventos', { id: nuevoId('ev'), titulo: d.titulo.trim(), fecha: d.fecha, tipo: d.tipo as Evento['tipo'], descripcion: d.descripcion.trim() });
        seleccion = d.fecha; ref = new Date(aFecha(d.fecha).getFullYear(), aFecha(d.fecha).getMonth(), 1);
        aviso('Evento agregado'); pintar();
      },
    }));
    ctx.vista.querySelectorAll<HTMLButtonElement>('[data-borrar]').forEach((b) => b.addEventListener('click', async () => {
      if (await confirmar('¿Eliminar evento?', 'Se quitará del calendario de toda la comunidad.')) { eliminarItem('eventos', b.dataset.borrar!); aviso('Evento eliminado'); pintar(); }
    }));
  };
  pintar();
}

// ---------- Perfil ----------
const COLORES = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#334155'];

export function paginaPerfil(ctx: Contexto) {
  const u = ctx.usuario;
  const datos: [string, string][] = [];
  if (u.rol === 'estudiante') {
    const e = porId('estudiantes', u.refId)!;
    const p = porId('padres', e.padreId);
    datos.push(['Carné', e.carnet], ['Grado', nombreGrado(grado(e.gradoId))], ['Fecha de nacimiento', `${fechaMedia(e.nacimiento)} (${edad(e.nacimiento)} años)`], ['Encargado', p ? `${nombreCompleto(p)} (${p.parentesco})` : '—'], ['Maestro guía', nombreCompleto(porId('maestros', grado(e.gradoId)?.guiaId))], ['Cursos', String(asignacionesDeGrado(e.gradoId).length)]);
  } else if (u.rol === 'maestro') {
    const m = porId('maestros', u.refId)!;
    datos.push(['Especialidad', m.especialidad], ['Correo', m.correo], ['Teléfono', m.telefono], ['En el colegio desde', fechaMedia(m.ingreso)], ['Clases asignadas', String(asignacionesDeMaestro(m.id).length)], ['Maestro guía de', obtener('grados').filter((g) => g.guiaId === m.id).map((g) => nombreGrado(g)).join(', ') || '—']);
  } else if (u.rol === 'padre') {
    const p = porId('padres', u.refId)!;
    datos.push(['Parentesco', p.parentesco], ['Teléfono', p.telefono], ['Correo', p.correo], ['Dirección', p.direccion], ['Hijos inscritos', hijosDe(p.id).map((h) => `${h.nombres} (${grado(h.gradoId)?.nombre})`).join(', ')]);
  } else {
    datos.push(['Cargo', u.cargo || ROLES[u.rol].nombre], ['Acceso', ROLES[u.rol].portal]);
  }

  ctx.vista.innerHTML = `<div class="grid g-1-2">
    <section class="card"><div class="card-cuerpo" style="text-align:center">
      <div style="display:grid;place-items:center;margin:.5rem 0 1rem" id="avatar-grande">${avatar(u.nombre, u.color, 'xl')}</div>
      <h2 style="font-size:1.3rem">${escapar(u.nombre)}</h2>
      <p class="stat-nota" style="margin:.2rem 0 .8rem">@${escapar(u.usuario)}</p>
      ${badge(`${ROLES[u.rol].emoji} ${ROLES[u.rol].nombre}`, 'rol')}
      <p class="stat-etiqueta" style="margin:1.4rem 0 .6rem">Color de tu avatar</p>
      <div class="chips" style="justify-content:center">${COLORES.map((c) => `<button type="button" class="btn-icono" data-color="${c}" style="background:${c};border-radius:50%;width:30px;height:30px;${c === u.color ? 'box-shadow:0 0 0 3px #fff, 0 0 0 5px ' + c : ''}" aria-label="Color ${c}"></button>`).join('')}</div>
      <p class="stat-nota" style="margin-top:1.2rem">Último acceso: ${u.ultimoAcceso ? haceTiempo(u.ultimoAcceso) : '—'}</p>
    </div></section>
    <div class="pila">
      ${tarjeta(`${icono('usuario')} Mi información`, `<dl class="ficha-datos">${datos.map(([k, v]) => `<div><dt>${k}</dt><dd>${escapar(v)}</dd></div>`).join('')}</dl>
        <p class="stat-nota" style="margin-top:1rem">¿Algún dato incorrecto? Comunícate con la administración del colegio.</p>`)}
      ${tarjeta(`${icono('llave')} Cambiar contraseña`, `<form class="form-modal" id="form-clave">
        ${campo('Contraseña actual', '<input type="password" name="actual" required autocomplete="current-password" />', 'completo')}
        ${campo('Nueva contraseña', '<input type="password" name="nueva" required minlength="5" autocomplete="new-password" />')}
        ${campo('Confirmar nueva contraseña', '<input type="password" name="confirmar" required minlength="5" autocomplete="new-password" />')}
        <div class="completo"><button type="submit" class="btn btn-primario">${icono('check', 18)} Actualizar contraseña</button></div></form>`)}
    </div></div>`;

  ctx.vista.querySelectorAll<HTMLButtonElement>('[data-color]').forEach((b) => b.addEventListener('click', () => {
    guardarItem('usuarios', { ...u, color: b.dataset.color! });
    aviso('Color actualizado');
    setTimeout(() => location.reload(), 500);
  }));
  const form = ctx.vista.querySelector<HTMLFormElement>('#form-clave')!;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const d = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const actual = porId('usuarios', u.id)!;
    if (d.actual !== actual.clave) return aviso('La contraseña actual no es correcta', 'error');
    if (d.nueva !== d.confirmar) return aviso('Las contraseñas nuevas no coinciden', 'error');
    guardarItem('usuarios', { ...actual, clave: d.nueva });
    form.reset();
    aviso('Contraseña actualizada 🔐');
  });
}


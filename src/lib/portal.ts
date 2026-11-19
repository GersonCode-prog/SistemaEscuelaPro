// ============================================================
//  COMPORTAMIENTO DEL PORTAL: usuario, insignias, notificaciones,
//  selector de hijos, menú móvil y cierre de sesión
// ============================================================
import { usuarioActual, cerrarSesion } from './sesion';
import { obtener, porId, guardarItem } from './datos';
import { ROLES, anunciosPara, noLeidos, tareasPorHacer, hijosDe, nombreGrado, grado, entregasPorCalificar, estadoPago, pagosDe, diasParaEntrega, cursosEnRiesgo } from './escuela';
import { avatar } from './vistas';
import { icono } from './iconos';
import { confirmar } from './ui';
import { escapar, haceTiempo, relativa, hoy, monedaCorta } from './formato';
import { ruta } from './ruta';
import { hijoSeleccionado } from './app';
import type { Usuario } from './tipos';

interface Notificacion { icono: string; titulo: string; texto: string; url: string; fecha?: string; tono: string; }

export function notificacionesDe(u: Usuario): Notificacion[] {
  const lista: Notificacion[] = [];
  const base = `/${u.rol}`;
  obtener('conversaciones').filter((c) => c.a === u.id || c.b === u.id).forEach((c) => {
    const nuevos = c.mensajes.filter((m) => m.de !== u.id && m.fecha > (c.leido[u.id] ?? ''));
    if (!nuevos.length) return;
    const ultimo = nuevos[nuevos.length - 1];
    const autor = porId('usuarios', ultimo.de);
    lista.push({ icono: 'mensajes', titulo: `Mensaje de ${autor?.nombre ?? 'un usuario'}`, texto: ultimo.texto, url: ruta(`${base}/mensajes?c=${c.id}`), fecha: ultimo.fecha, tono: 'azul' });
  });
  anunciosPara(u).filter((a) => a.fecha > (u.vistoAvisos ?? '')).slice(0, 4).forEach((a) => {
    lista.push({ icono: 'avisos', titulo: a.titulo, texto: 'Nuevo aviso', url: ruta(`${base}/avisos`), fecha: a.fecha, tono: 'morado' });
  });
  if (u.rol === 'estudiante') {
    const est = porId('estudiantes', u.refId);
    if (est) tareasPorHacer(est).filter((t) => diasParaEntrega(t.tarea) >= 0 && diasParaEntrega(t.tarea) <= 3).slice(0, 3).forEach((t) => {
      lista.push({ icono: 'tareas', titulo: `Entrega pronto: ${t.tarea.titulo}`, texto: `${t.curso.nombre} · ${relativa(t.tarea.entrega)}`, url: ruta(`${base}/tareas`), tono: 'ambar' });
    });
  }
  if (u.rol === 'padre') {
    hijosDe(u.refId!).forEach((h) => {
      const vencidos = pagosDe(h.id).filter((p) => estadoPago(p) === 'Vencido');
      if (vencidos.length) lista.push({ icono: 'pagos', titulo: `Pago vencido de ${h.nombres.split(' ')[0]}`, texto: `${vencidos.length} cuota(s) · ${monedaCorta(vencidos.reduce((s, p) => s + p.monto, 0))}`, url: ruta(`${base}/pagos`), tono: 'rojo' });
      const riesgo = cursosEnRiesgo(h);
      if (riesgo.length) lista.push({ icono: 'alerta', titulo: `${h.nombres.split(' ')[0]} necesita apoyo`, texto: `En riesgo en ${riesgo.map((r) => r.curso.corto).join(', ')}`, url: ruta(`${base}/calificaciones`), tono: 'rojo' });
    });
  }
  if (u.rol === 'maestro') {
    const n = entregasPorCalificar(u.refId!).length;
    if (n) lista.push({ icono: 'tareas', titulo: `${n} entregas por calificar`, texto: 'Revisa las tareas de tus clases', url: ruta(`${base}/tareas`), tono: 'ambar' });
    const diaSemana = new Date().getDay();
    obtener('grados').filter((g) => g.guiaId === u.refId).forEach((g) => {
      if (diaSemana > 0 && diaSemana < 6 && !porId('asistencia', `${g.id}|${hoy()}`)) {
        lista.push({ icono: 'asistencia', titulo: 'Asistencia de hoy pendiente', texto: `Eres maestro guía de ${nombreGrado(g)}`, url: ruta(`${base}/asistencia`), tono: 'verde' });
      }
    });
  }
  if (u.rol === 'admin') {
    const n = obtener('pagos').filter((p) => p.estado === 'En revisión').length;
    if (n) lista.push({ icono: 'pagos', titulo: `${n} pagos por validar`, texto: 'Boletas reportadas por padres de familia', url: ruta(`${base}/pagos`), tono: 'ambar' });
  }
  return lista;
}

function detalleUsuario(u: Usuario) {
  if (u.rol === 'estudiante') { const e = porId('estudiantes', u.refId); return e ? nombreGrado(grado(e.gradoId)) : ''; }
  if (u.rol === 'padre') { const h = hijosDe(u.refId!).map((x) => x.nombres.split(' ')[0]); return h.length ? `Familia de ${h.join(' y ')}` : 'Padre de familia'; }
  return u.cargo || ROLES[u.rol].nombre;
}

// Insignias del menú y campana: se repintan cada vez que cambian los datos
function pintarIndicadores() {
  const u = usuarioActual();
  if (!u) return;
  const $ = (id: string) => document.getElementById(id);

  // Insignias del menú
  const poner = (id: string, n: number) => { const el = document.querySelector<HTMLElement>(`[data-insignia="${id}"]`); if (el) { el.hidden = n <= 0; el.textContent = n > 0 ? String(n) : ''; } };
  poner('mensajes', noLeidos(u));
  if (u.rol === 'estudiante') { const e = porId('estudiantes', u.refId); if (e) poner('tareas', tareasPorHacer(e).length); }
  if (u.rol === 'maestro') poner('tareas', entregasPorCalificar(u.refId!).length);
  if (u.rol === 'admin') poner('pagos', obtener('pagos').filter((p) => p.estado === 'En revisión').length);
  if (u.rol === 'padre') poner('pagos', hijosDe(u.refId!).reduce((s, h) => s + pagosDe(h.id).filter((p) => estadoPago(p) === 'Vencido').length, 0));

  // Notificaciones
  const notifs = notificacionesDe(u);
  const contador = $('notif-cuenta')!;
  contador.hidden = !notifs.length; contador.textContent = notifs.length ? String(notifs.length) : '';
  $('panel-notif')!.innerHTML = `
    <div class="notif-cabecera"><strong>Notificaciones</strong><span>${notifs.length ? `${notifs.length} nuevas` : ''}</span></div>
    ${notifs.length ? notifs.map((n) => `
      <a class="notif tono-${n.tono}" href="${n.url}">
        <span class="notif-icono">${icono(n.icono, 18)}</span>
        <span><strong>${escapar(n.titulo)}</strong><small>${escapar(n.texto.length > 80 ? n.texto.slice(0, 80) + '…' : n.texto)}</small>${n.fecha ? `<em>${haceTiempo(n.fecha)}</em>` : ''}</span>
      </a>`).join('') : `<p class="notif-vacio">🎉 Estás al día. No tienes notificaciones.</p>`}
    ${notifs.some((n) => n.icono === 'avisos') ? '<button type="button" class="notif-marcar" id="marcar-avisos">Marcar avisos como vistos</button>' : ''}`;
  $('marcar-avisos')?.addEventListener('click', () => {
    guardarItem('usuarios', { ...u, vistoAvisos: new Date().toISOString() });
  });

}

export function montarPortal() {
  const u = usuarioActual();
  if (!u) { cerrarSesion(); return; }
  const $ = (id: string) => document.getElementById(id);

  // Datos del usuario
  const av = avatar(u.nombre, u.color);
  $('lat-avatar')!.outerHTML = av.replace('class="avatar ', 'class="avatar md ');
  $('sup-avatar')!.outerHTML = av.replace('class="avatar ', 'class="avatar sm ');
  $('lat-nombre')!.textContent = u.nombre;
  $('lat-detalle')!.textContent = detalleUsuario(u);
  $('menu-cabecera')!.innerHTML = `<strong>${escapar(u.nombre)}</strong><span>@${escapar(u.usuario)} · ${ROLES[u.rol].nombre}</span>`;
  const sub = $('superior-sub');
  if (sub && !sub.textContent?.trim()) {
    const f = new Date().toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long' });
    sub.textContent = f.charAt(0).toUpperCase() + f.slice(1);
  }

  // Selector de hijo (padres)
  const selector = $('selector-hijo');
  if (selector && u.rol === 'padre') {
    const pintar = () => {
      const actual = hijoSeleccionado(u);
      selector.innerHTML = hijosDe(u.refId!).map((h) => `
        <button type="button" class="hijo ${h.id === actual?.id ? 'activo' : ''}" data-hijo="${h.id}" title="Ver a ${escapar(h.nombres)}">
          ${avatar(`${h.nombres} ${h.apellidos}`, porId('usuarios', `u-${h.id}`)?.color, 'xs')}<span>${escapar(h.nombres.split(' ')[0])}<small>${escapar(grado(h.gradoId)?.nombre ?? '')}</small></span>
        </button>`).join('');
    };
    pintar();
    selector.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-hijo]');
      if (!b) return;
      sessionStorage.setItem('ep_hijo', b.dataset.hijo!);
      pintar();
      document.dispatchEvent(new CustomEvent('ep:hijo'));
    });
  }

  pintarIndicadores();
  document.addEventListener('ep:cambio', pintarIndicadores);

  // Desplegables
  const desplegables = [['btn-campana', 'panel-notif'], ['btn-perfil', 'panel-perfil']];
  desplegables.forEach(([b, p]) => {
    $(b)!.addEventListener('click', (e) => {
      e.stopPropagation();
      desplegables.forEach(([, otro]) => { if (otro !== p) $(otro)!.hidden = true; });
      $(p)!.hidden = !$(p)!.hidden;
    });
  });
  document.addEventListener('click', (e) => {
    desplegables.forEach(([, p]) => { if (!$(p)!.contains(e.target as Node)) $(p)!.hidden = true; });
  });

  // Menú móvil
  const lateral = $('lateral')!; const fondo = $('fondo-movil')!;
  const alternar = () => { lateral.classList.toggle('abierto'); fondo.classList.toggle('visible'); };
  $('btn-menu')!.addEventListener('click', alternar);
  fondo.addEventListener('click', alternar);

  // Cerrar sesión
  const salir = async () => { if (await confirmar('¿Cerrar sesión?', 'Volverás a la pantalla de inicio de sesión.', 'Cerrar sesión', false)) cerrarSesion(); };
  $('btn-salir')!.addEventListener('click', salir);
  $('btn-salir-2')!.addEventListener('click', salir);

  document.body.classList.add('listo');
}

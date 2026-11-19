// ============================================================
//  UI: avisos (toasts), confirmaciones y ventanas modales
// ============================================================
import { icono } from './iconos';
import { escapar } from './formato';

export function aviso(mensaje: string, tipo: 'exito' | 'error' | 'info' = 'exito') {
  let caja = document.getElementById('toasts');
  if (!caja) { caja = document.createElement('div'); caja.id = 'toasts'; document.body.appendChild(caja); }
  const el = document.createElement('div');
  el.className = `toast toast-${tipo}`;
  el.innerHTML = `<span class="toast-icono">${icono(tipo === 'exito' ? 'check' : tipo === 'error' ? 'alerta' : 'info', 16)}</span><span></span>`;
  el.lastElementChild!.textContent = mensaje;
  caja.appendChild(el);
  setTimeout(() => el.classList.add('saliendo'), 3000);
  setTimeout(() => el.remove(), 3400);
}

interface OpcionesModal { titulo: string; cuerpo: string; pie?: string; ancho?: 'sm' | 'md' | 'lg'; alCerrar?: () => void; }

// Crea una ventana modal; se elimina sola al cerrarse
export function abrirModal(o: OpcionesModal) {
  const d = document.createElement('dialog');
  d.className = `modal modal-${o.ancho ?? 'md'}`;
  d.innerHTML = `
    <div class="modal-cabecera"><h3>${o.titulo}</h3><button type="button" class="btn-icono" data-cerrar aria-label="Cerrar">${icono('cerrar')}</button></div>
    <div class="modal-cuerpo">${o.cuerpo}</div>
    ${o.pie ? `<div class="modal-pie">${o.pie}</div>` : ''}`;
  document.body.appendChild(d);
  d.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('[data-cerrar]') || e.target === d) d.close();
  });
  d.addEventListener('close', () => { o.alCerrar?.(); d.remove(); });
  d.showModal();
  return d;
}

// Modal con formulario: alGuardar devuelve false para no cerrar
export function modalFormulario(o: { titulo: string; campos: string; textoGuardar?: string; ancho?: 'sm' | 'md' | 'lg'; alGuardar: (datos: Record<string, string>, form: HTMLFormElement) => boolean | void; alAbrir?: (form: HTMLFormElement) => void }) {
  const d = abrirModal({
    titulo: o.titulo, ancho: o.ancho,
    cuerpo: `<form class="form-modal" novalidate>${o.campos}<button type="submit" hidden></button></form>`,
    pie: `<button type="button" class="btn btn-secundario" data-cerrar>Cancelar</button><button type="button" class="btn btn-primario" data-guardar>${icono('check', 18)} ${o.textoGuardar ?? 'Guardar'}</button>`,
  });
  const form = d.querySelector('form')!;
  const guardar = () => {
    if (!form.reportValidity()) return;
    const datos = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    if (o.alGuardar(datos, form) !== false) d.close();
  };
  d.querySelector('[data-guardar]')!.addEventListener('click', guardar);
  form.addEventListener('submit', (e) => { e.preventDefault(); guardar(); });
  o.alAbrir?.(form);
  return d;
}

export function confirmar(titulo: string, mensaje: string, textoBoton = 'Eliminar', peligro = true): Promise<boolean> {
  return new Promise((resolver) => {
    let respuesta = false;
    const d = abrirModal({
      titulo: '', ancho: 'sm', alCerrar: () => resolver(respuesta),
      cuerpo: `<div class="confirmar"><span class="confirmar-icono ${peligro ? 'peligro' : ''}">${icono(peligro ? 'alerta' : 'info', 26)}</span><h3>${escapar(titulo)}</h3><p>${escapar(mensaje)}</p></div>`,
      pie: `<button type="button" class="btn btn-secundario" data-cerrar>Cancelar</button><button type="button" class="btn ${peligro ? 'btn-peligro' : 'btn-primario'}" data-si>${escapar(textoBoton)}</button>`,
    });
    d.querySelector('.modal-cabecera')!.classList.add('sin-titulo');
    d.querySelector('[data-si]')!.addEventListener('click', () => { respuesta = true; d.close(); });
  });
}

export const opciones = (lista: { valor: string; texto: string }[], seleccionado = '') =>
  lista.map((o) => `<option value="${escapar(o.valor)}" ${o.valor === seleccionado ? 'selected' : ''}>${escapar(o.texto)}</option>`).join('');

export const campo = (etiqueta: string, control: string, clase = '') => `<label class="campo ${clase}"><span>${etiqueta}</span>${control}</label>`;

// Descarga un texto como archivo
export function descargar(nombre: string, contenido: string, tipo = 'text/plain') {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const a = document.createElement('a');
  a.href = url; a.download = nombre; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function aCSV(filas: (string | number)[][]) {
  return '﻿' + filas.map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
}

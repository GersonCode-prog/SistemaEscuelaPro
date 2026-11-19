// ============================================================
//  PIEZAS VISUALES REUTILIZABLES (devuelven HTML)
// ============================================================
import { escapar, DIAS } from './formato';
import { icono } from './iconos';
import type { Asignacion } from './tipos';
import { PERIODOS, RECESO, curso, grado, nombreGrado, nivelNota, tituloMaestro, type FilaBoleta, fmtNota } from './escuela';
import { porId } from './datos';

export const iniciales = (nombre: string) =>
  nombre.split(/\s+/).filter((p) => p && p[0] === p[0].toUpperCase() && p.length > 2).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || nombre.slice(0, 1).toUpperCase();

const colorDeTexto = (t: string) => {
  const colores = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];
  let h = 0; for (const c of t) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return colores[h % colores.length];
};

export const avatar = (nombre: string, color?: string, clase = '') =>
  `<span class="avatar ${clase}" style="--c:${color || colorDeTexto(nombre)}" title="${escapar(nombre)}">${escapar(iniciales(nombre))}</span>`;

export const badge = (texto: string, tipo = 'neutral') => `<span class="badge ${tipo}">${escapar(texto)}</span>`;

export const stat = (o: { icono: string; etiqueta: string; valor: string; nota?: string; tono?: string }) => `
  <div class="card stat tono-${o.tono ?? 'rol'}">
    <span class="stat-icono">${o.icono}</span>
    <div><p class="stat-etiqueta">${o.etiqueta}</p><p class="stat-valor">${o.valor}</p>${o.nota ? `<p class="stat-nota">${o.nota}</p>` : ''}</div>
  </div>`;

export const anillo = (pct: number, color: string, centro: string, tam = 64) =>
  `<div class="anillo" style="--p:${Math.max(0, Math.min(100, pct))};--c:${color};--t:${tam}px"><span>${centro}</span></div>`;

export const barra = (pct: number, color = 'var(--rol)') =>
  `<div class="barra"><span style="width:${Math.max(0, Math.min(100, pct))}%;background:${color}"></span></div>`;

export const vacio = (emoji: string, titulo: string, texto = '') =>
  `<div class="vacio"><span class="vacio-emoji">${emoji}</span><p class="vacio-titulo">${titulo}</p>${texto ? `<p>${texto}</p>` : ''}</div>`;

export const tarjeta = (titulo: string, cuerpo: string, extra = '', clase = '') =>
  `<section class="card ${clase}"><div class="card-cabecera"><h2>${titulo}</h2>${extra}</div><div class="card-cuerpo">${cuerpo}</div></section>`;

export const chipCurso = (cursoId: string) => {
  const c = curso(cursoId);
  return c ? `<span class="chip-curso" style="--c:${c.color}"><span>${c.icono}</span>${escapar(c.corto)}</span>` : '';
};

export const notaHTML = (n: number | null) => {
  const nv = nivelNota(n);
  return `<span class="nota nota-${nv.clase}">${fmtNota(n)}</span>`;
};

// ---------- Gráficas ----------
export function graficaBarras(items: { etiqueta: string; valor: number; color?: string; texto?: string }[], max = 100) {
  return `<div class="g-barras">${items.map((i) => `
    <div class="g-col" title="${escapar(i.etiqueta)}: ${escapar(i.texto ?? String(Math.round(i.valor)))}">
      <span class="g-valor">${escapar(i.texto ?? String(Math.round(i.valor)))}</span>
      <div class="g-barra" style="height:${Math.max(2, (i.valor / (max || 1)) * 100)}%;background:${i.color ?? 'var(--rol)'}"></div>
      <span class="g-etiqueta">${escapar(i.etiqueta)}</span>
    </div>`).join('')}</div>`;
}

export function barrasH(items: { etiqueta: string; valor: number; max?: number; color?: string; texto?: string; icono?: string }[]) {
  const max = Math.max(...items.map((i) => i.max ?? i.valor), 1);
  return `<div class="g-barrash">${items.map((i) => `
    <div class="g-fila">
      <div class="g-fila-cab"><span>${i.icono ?? ''} ${escapar(i.etiqueta)}</span><strong>${escapar(i.texto ?? String(Math.round(i.valor)))}</strong></div>
      ${barra(((i.valor) / (i.max ?? max)) * 100, i.color)}
    </div>`).join('')}</div>`;
}

export function graficaLinea(series: { nombre: string; color: string; valores: (number | null)[]; punteada?: boolean }[], etiquetas: string[], min = 40, max = 100) {
  const W = 520, H = 200, px = 34, py = 18;
  const x = (i: number) => px + (i * (W - px * 2)) / Math.max(1, etiquetas.length - 1);
  const y = (v: number) => H - py - ((v - min) / (max - min)) * (H - py * 2);
  const lineas = [min, (min + max) / 2, max].map((v) => `<line x1="${px}" x2="${W - px}" y1="${y(v)}" y2="${y(v)}" class="g-guia"/><text x="${px - 8}" y="${y(v) + 4}" class="g-eje" text-anchor="end">${Math.round(v)}</text>`).join('');
  const trazos = series.map((s, si) => {
    const pts = s.valores.map((v, i) => (v === null ? null : [x(i), y(v)] as const)).filter(Boolean) as (readonly [number, number])[];
    if (!pts.length) return '';
    const camino = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');
    const area = si === 0 ? `<path d="${camino} L${pts[pts.length - 1][0]},${H - py} L${pts[0][0]},${H - py} Z" fill="${s.color}" opacity=".08"/>` : '';
    return `${area}<path d="${camino}" fill="none" stroke="${s.color}" stroke-width="3" stroke-linecap="round" ${s.punteada ? 'stroke-dasharray="6 6"' : ''}/>
      ${pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="#fff" stroke="${s.color}" stroke-width="3"><title>${escapar(s.nombre)}: ${s.valores.filter((v) => v !== null)[i]?.toFixed(1)}</title></circle>`).join('')}`;
  }).join('');
  return `<div class="g-linea"><svg viewBox="0 0 ${W} ${H + 20}" role="img">${lineas}${trazos}
    ${etiquetas.map((e, i) => `<text x="${x(i)}" y="${H + 10}" class="g-eje" text-anchor="middle">${escapar(e)}</text>`).join('')}</svg>
    <div class="leyenda">${series.map((s) => `<span><i style="background:${s.color}"></i>${escapar(s.nombre)}</span>`).join('')}</div></div>`;
}

export function dona(segmentos: { etiqueta: string; valor: number; color: string }[], centro: string, sub: string) {
  const total = segmentos.reduce((s, x) => s + x.valor, 0) || 1;
  let acc = 0;
  const partes = segmentos.map((s) => { const d = (acc / total) * 100; acc += s.valor; return `${s.color} ${d}% ${(acc / total) * 100}%`; });
  return `<div class="dona-caja"><div class="dona" style="background:conic-gradient(${partes.join(',')})"><div><strong>${centro}</strong><span>${sub}</span></div></div>
    <ul class="leyenda-lista">${segmentos.map((s) => `<li><i style="background:${s.color}"></i>${escapar(s.etiqueta)}<strong>${s.valor}</strong></li>`).join('')}</ul></div>`;
}

// ---------- Boleta ----------
export function tablaBoleta(filas: FilaBoleta[], general: number | null) {
  return `<div class="tabla-scroll"><table class="tabla boleta">
    <thead><tr><th>Curso</th>${[1, 2, 3, 4].map((u) => `<th class="centro">Unidad ${u}</th>`).join('')}<th class="centro">Promedio</th><th>Estado</th></tr></thead>
    <tbody>${filas.map((f) => {
      const nv = nivelNota(f.promedio);
      return `<tr>
        <td><div class="celda-curso"><span class="curso-icono" style="--c:${f.curso.color}">${f.curso.icono}</span><div><strong>${escapar(f.curso.nombre)}</strong><small>${escapar(tituloMaestro(f.maestro))}</small></div></div></td>
        ${f.unidades.map((n) => `<td class="centro">${n === null ? '<span class="pendiente" title="Pendiente de ingresar">—</span>' : notaHTML(n)}</td>`).join('')}
        <td class="centro"><strong class="prom" style="color:${nv.color}">${fmtNota(f.promedio, 1)}</strong></td>
        <td>${badge(nv.texto, nv.clase)}</td></tr>`;
    }).join('')}</tbody>
    <tfoot><tr><td><strong>Promedio general</strong></td><td colspan="4"></td><td class="centro"><strong class="prom" style="color:${nivelNota(general).color}">${fmtNota(general, 1)}</strong></td><td>${badge(nivelNota(general).texto, nivelNota(general).clase)}</td></tr></tfoot>
  </table></div>`;
}

// ---------- Horario ----------
export function tablaHorario(matriz: (Asignacion | null)[][], modo: 'grado' | 'maestro', resaltar: { d: number; p: number } | null, hoyDia: number) {
  const celda = (a: Asignacion | null, d: number, p: number) => {
    if (!a) return `<td class="h-libre">Libre</td>`;
    const c = curso(a.cursoId)!;
    const sub = modo === 'grado' ? tituloMaestro(porId('maestros', a.maestroId)) : `${nombreGrado(grado(a.gradoId))} · ${grado(a.gradoId)?.aula}`;
    const activa = resaltar && resaltar.d === d && resaltar.p === p;
    return `<td><div class="h-clase ${activa ? 'activa' : ''}" style="--c:${c.color}"><span class="h-icono">${c.icono}</span><strong>${escapar(c.corto)}</strong><small>${escapar(sub)}</small>${activa ? '<em>Ahora</em>' : ''}</div></td>`;
  };
  const filas: string[] = [];
  PERIODOS.forEach((per, p) => {
    filas.push(`<tr><th class="h-hora">${per.inicio}<small>${per.fin}</small></th>${[0, 1, 2, 3, 4].map((d) => celda(matriz[d][p], d, p)).join('')}</tr>`);
    if (p === RECESO.despuesDe) filas.push(`<tr class="h-receso"><th class="h-hora">${RECESO.inicio}<small>${RECESO.fin}</small></th><td colspan="5">☀️ Receso</td></tr>`);
  });
  return `<div class="tabla-scroll"><table class="horario">
    <thead><tr><th></th>${DIAS.map((d, i) => `<th class="${i === hoyDia ? 'hoy' : ''}">${d}${i === hoyDia ? ' <span>Hoy</span>' : ''}</th>`).join('')}</tr></thead>
    <tbody>${filas.join('')}</tbody></table></div>`;
}

export const botonIcono = (nombreIcono: string, titulo: string, datos: string, clase = '') =>
  `<button type="button" class="btn-icono ${clase}" title="${escapar(titulo)}" aria-label="${escapar(titulo)}" ${datos}>${icono(nombreIcono, 18)}</button>`;

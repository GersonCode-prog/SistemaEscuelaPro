// Agrega el "base" del sitio a una ruta interna: ruta('/login') -> '/SistemaEscuelaPro/login'
export const ruta = (camino: string) => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}${camino}`;
};

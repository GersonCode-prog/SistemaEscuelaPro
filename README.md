# 🎓 EscuelaPro — Sistema escolar con Astro

Sistema escolar completo con **5 portales** (Estudiante, Maestro, Padre de familia, Director y Administrador), cada uno con su propio inicio de sesión, menú y color. Funciona **sin base de datos**: usa datos ficticios que se guardan en el navegador.

🔗 **Demo en vivo:** https://gersoncode-prog.github.io/SistemaEscuelaPro/

---

## 🔑 Usuarios de prueba

En el inicio de sesión primero eliges tu perfil y luego escribes tu usuario. La contraseña de todos es **`12345`**.

| Portal | Usuario | Quién es |
| --- | --- | --- |
| 🎓 Estudiante | `estudiante` | Sofía Méndez García · 1ro Básico A |
| 👩‍🏫 Maestro | `maestro` | Prof. Carlos Ramírez · Matemáticas, Básico |
| 👨‍👩‍👧 Padre de familia | `padre` | Ana García de Méndez · mamá de Sofía y Diego |
| 🏫 Director | `director` | Fernando Estrada |
| ⚙️ Administrador | `admin` | Patricia Solís |

Los demás estudiantes, maestros y padres también tienen usuario (formato `nombre.apellido`) con la misma contraseña. Puedes verlos en **Administrador → Usuarios**.

---

## ✨ Qué hace cada portal

| Portal | Funciones |
| --- | --- |
| **Estudiante** | Promedio y posición en el grado, boleta por unidad (imprimible), entrega de tareas, horario con la clase en curso, asistencia en calendario, mensajes, avisos y calendario escolar. |
| **Maestro** | Sus clases, ingreso rápido de notas por unidad, asistencia en un clic, crear y calificar tareas, horario, mensajes con las familias y avisos para sus secciones. |
| **Padre de familia** | Resumen de cada hijo con alertas (cursos en riesgo, tareas sin entregar, pagos vencidos), notas, tareas, asistencia, horario, estado de cuenta, reporte de pagos y recibos. |
| **Director** | Panel con indicadores, gráficas por grado y curso, cuadro de honor, estudiantes en riesgo, morosidad, reportes descargables (CSV), fichas de estudiantes y avisos institucionales. |
| **Administrador** | Inscripción de estudiantes (crea sus usuarios y cuotas), maestros, familias, asignación de cursos, validación de pagos con recibo, usuarios y contraseñas, configuración del colegio y respaldos. |

Además hay un **sitio público del colegio** con los portales, eventos y avisos, y las notificaciones (🔔) de cada usuario.

### Recorrido sugerido

1. Entra como **padre**: Diego tiene Matemáticas en riesgo y una colegiatura vencida. Repórtala en **Pagos**.
2. Entra como **admin**: valida ese pago desde **Inicio** o **Pagos** y se genera el recibo.
3. Entra como **maestro**: ingresa las notas de la **Unidad 4** y toma la **asistencia** de hoy.
4. Entra como **estudiante**: entrega una tarea y responde el mensaje del profesor.
5. Entra como **director**: revisa los **reportes** y publica un aviso; aparecerá en el sitio del colegio.

---

## 🛠️ Cómo correrlo en tu computadora

Necesitas [Node.js](https://nodejs.org) 22.23 o más reciente.

```bash
npm install
npm run dev
```

Luego abre **http://localhost:4321/SistemaEscuelaPro/**

> En Windows, si PowerShell bloquea `npm`, usa `npm.cmd install` y `npm.cmd run dev`, o abre una ventana de CMD.

---

## 🗂️ Estructura del proyecto

```text
src/
├── pages/                 # Rutas del sitio
│   ├── index.astro        # Sitio público del colegio
│   ├── login.astro        # Inicio de sesión por perfil
│   ├── 404.astro          # Página no encontrada
│   └── estudiante/ maestro/ padre/ director/ admin/   # Una carpeta por portal
├── layouts/
│   ├── Portal.astro       # Menú lateral, barra superior y protección por rol
│   └── Publico.astro      # Plantilla del sitio y del login
├── paginas/               # Pantallas de cada portal (TypeScript)
├── lib/
│   ├── datos.ts           # "Base de datos" en localStorage
│   ├── semilla.ts         # Genera los datos ficticios
│   ├── escuela.ts         # Reglas: promedios, asistencia, horarios, pagos…
│   ├── sesion.ts          # Inicio de sesión y roles
│   ├── portal.ts          # Menú, insignias y notificaciones
│   └── ui.ts, vistas.ts   # Ventanas, avisos, gráficas y componentes
└── styles/global.css      # Sistema de diseño (cada rol tiene su color)
```

---

## 💾 Sobre los datos

- No hay servidor ni base de datos: todo se guarda en el **localStorage** del navegador, así que cada persona que abre la demo tiene su propia copia.
- Los datos se generan con fechas relativas al día de hoy, para que la demo siempre se vea actual.
- Para empezar de cero: **Administrador → Configuración → Restablecer datos**. Ahí también puedes descargar o restaurar un respaldo en JSON.
- ⚠️ **Las contraseñas se guardan sin cifrar en el navegador.** Es solo para demostración. Para usarlo de verdad se necesita un servidor con base de datos y contraseñas cifradas.

Todo el acceso a los datos está concentrado en `src/lib/datos.ts`, así que para conectarlo a una base de datos real ese es el archivo a cambiar por llamadas a una API.

---

## 🚀 Publicación

Cada `push` a la rama `main` compila y publica el sitio en GitHub Pages con GitHub Actions (`.github/workflows/deploy.yml`).
En el repositorio: **Settings → Pages → Source: GitHub Actions**.

---

Hecho con [Astro](https://astro.build) por [Gerson Batún](https://github.com/GersonCode-prog).

# 🚛 Smart Trash Routes

> Sistema web para gestionar y visualizar las rutas de camiones de basura en Buenaventura 🌍

Desarrollado con **Angular Standalone (Frontend)** y **NestJS (Backend)** bajo un enfoque **DevOps (CI/CD, Integración y Despliegues Continuos)**.

---

## 🧠 Contexto del Problema

En Buenaventura no existe claridad sobre los horarios ni recorridos de los camiones de basura. Esto provoca que muchas personas saquen las bolsas en cualquier momento, generando:

- 🗑️ Acumulación de residuos
- 😷 Malos olores
- 🚯 Desorden en las calles

---

## 🎯 Objetivo

Desarrollar un sistema que permita:

- 🧍‍♂️ Registrar y administrar **camiones y empleados (CRUD)**
- 🗺️ Visualizar **rutas en mapa (Leaflet/Google Maps)**
- 🛰️ Simular **recorridos y posiciones en tiempo real**
- 📢 Mejorar la **comunicación con los vecinos** sobre horarios de recolección

---

## 🛠️ Tecnologías

| Área              | Herramientas                                                                            |
| ----------------- | --------------------------------------------------------------------------------------- |
| **Frontend**      | Angular Standalone, TypeScript                                                          |
| **Backend**       | NestJS, TypeORM, pnpm                                                                   |
| **Base de Datos** | PostgreSQL + PostGIS                                                                    |
| **DevOps**        | GitHub Actions (CI/CD), Netlify / Vercel (staging), servidor institucional (producción) |
| **Gestión**       | GitHub Projects, Scrum                                                                  |

---

## 🧱 Estructura del Proyecto

```
smart-trash-routes/
├── front-end/     # Angular (npm)
├── back-end/      # NestJS (pnpm)
├── package.json   # Comandos raíz (para ejecutar ambos)
└── README.md
```

---

## 🚀 Instalación y Ejecución

### 🔧 1. Clonar el repositorio

```bash
git clone https://github.com/PradoV09/smart-trash-routes.git
cd smart-trash-routes
```

### 📦 2. Instalar dependencias

```bash
npm install
npm run install:all
```

Esto instala dependencias en **frontend (npm)** y **backend (pnpm)** automáticamente.

### ▶️ 3. Ejecutar en desarrollo

```bash
npm run dev
```

Esto iniciará **Angular** y **NestJS** en paralelo.

- Frontend: `http://localhost:4200`
- Backend: `http://localhost:3000`

### 🏗️ 4. Compilar ambos proyectos

```bash
npm run build:all
```

---

## ⚙️ Scripts Disponibles (desde la raíz)

| Script                | Descripción                             |
| --------------------- | --------------------------------------- |
| `npm run install:all` | Instala dependencias en ambos proyectos |
| `npm run dev`         | Levanta front y back en paralelo        |
| `npm run dev:front`   | Solo frontend                           |
| `npm run dev:back`    | Solo backend                            |
| `npm run build:all`   | Compila ambos proyectos                 |
| `npm run format`      | Formatea el código en ambos proyectos   |

---

## 📅 Metodología de Trabajo

Aplicamos **Scrum** con **sprints de 2 semanas**, usando GitHub Projects para la gestión.

### 🧩 Entregables por Sprint

1. 🧱 Estructura inicial + acuerdos del equipo
2. 🧠 Diseño del sistema + backlog
3. ⚙️ Base de Angular + CI configurado
4. 🚚 CRUD de camiones y empleados
5. 🗺️ Mapa y rutas (Leaflet)
6. 🛰️ Simulación en tiempo real
7. ✅ Pruebas E2E y despliegue final

---

## 👥 Equipo de Desarrollo

| Nombre                          | Rol          | GitHub                                                       |
| ------------------------------- | ------------ | -----------------------------------------------------------  |
| **Jonatan Stewar Cuero Moreno** | Scrum Master | [@JonatanCueroMoreno](https://github.com/JonatanCueroMoreno) |
| **Heiner Jair Godoy Zamora**    | Developer    | [@heiner-godoy](https://github.com/heiner-godoy)             |
| **Jose Luis Prado Valencia**    | Developer    | [@PradoV09](https://github.com/PradoV09)                     |

---

## 🧑‍💻 Requisitos Previos

- Node.js >= 18
- npm >= 9
- pnpm >= 8
- PostgreSQL con extensión PostGIS habilitada

---

## 🧪 CI/CD

Cada push al repositorio principal activa **GitHub Actions**, que ejecuta:

1. ✅ Lint + Tests
2. 🏗️ Build del front y back
3. 🚀 Deploy automático en entorno staging

---

## 📄 Licencia

**MIT License** – Proyecto académico de la **Universidad del Valle**.  
Uso libre con fines educativos.

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request para sugerencias y mejoras.

---

**Desarrollado con 💚 por el equipo de Smart Trash Routes**
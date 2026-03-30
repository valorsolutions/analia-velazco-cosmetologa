---
trigger: always_on
---

# Cosmetóloga Analía Velazco — Landing + Panel Admin

**Fecha:** 2026-03-28
**Cliente:** Analía Velazco — Cosmetóloga
**Stack:** HTML/CSS/JS vanilla + Cloudflare Pages + Workers + D1

---

## Contexto

Landing institucional para Analía Velazco, cosmetóloga con local en San Lorenzo 865, Rosario Centro. Atiende de lunes a sábado solo con turno previo. No tiene sistema de turnos online — el contacto es vía WhatsApp e Instagram. Lanza 3 promociones por mes que cambian periódicamente.

El local tiene dos profesionales: **Analía Velazco** (tratamientos faciales y corporales) y **Karina Ruiz Diaz** (servicios de rostro, manicuría y pedicuría), cada una con su propio número de WhatsApp.

El sitio incluye un panel admin protegido para que puedan actualizar servicios, precios y promociones sin depender del desarrollador.

---

## Datos estáticos

- **Dirección:** San Lorenzo 865, Rosario Centro
- **Instagram:** @cosmetologaanaliavelazco
- **Turnos Analía:** 341 387-3766
- **Turnos Karina:** 341 388-8285
- **Horario:** Lunes a sábado, solo con turno previo

---

## Estructura de la Landing (página única)

Scroll vertical, 7 secciones:

1. **Hero** — Nombre + tagline + dos botones "Turno con Analía" / "Turno con Karina" (WhatsApp)
2. **Promociones del mes** — 3 cards destacadas (título, descripción, precio promo vs. precio normal)
3. **Servicios** — Grid agrupado por categoría, con nombre, descripción y precio. Cada variante es un item separado.
4. **Sobre mí** — Foto de Analía + bio corta
5. **Ubicación** — San Lorenzo 865, Rosario + mapa embed Google Maps
6. **Contacto** — Botón WhatsApp Analía + Botón WhatsApp Karina + link Instagram + "Lunes a sábado, solo con turno previo"
7. **Footer** — Logo + redes sociales

### Estética
- Paleta: rosa palo + blanco + negro
- Tipografía: serif para títulos (consistente con branding de Instagram @cosmetologaanaliavelazco), sans-serif para cuerpo
- Minimalista, mucho espacio en blanco

---

## Base de Datos (D1)

### Tabla `services`

Cada variante de un servicio es una fila independiente.

| campo | tipo | descripción |
|-------|------|-------------|
| id | INTEGER PRIMARY KEY AUTOINCREMENT | |
| name | TEXT NOT NULL | ej: "Dermaplaning Clásico" |
| description | TEXT | descripción del servicio o variante |
| price | INTEGER NOT NULL | precio en pesos |
| price_label | TEXT | ej: "desde $35.000" para precios variables |
| category | TEXT NOT NULL | "facial" / "corporal" / "servicios" |
| active | INTEGER DEFAULT 1 | 1 = visible, 0 = oculto |
| sort_order | INTEGER DEFAULT 0 | orden de aparición dentro de la categoría |

### Tabla `promotions`

| campo | tipo | descripción |
|-------|------|-------------|
| id | INTEGER PRIMARY KEY AUTOINCREMENT | |
| title | TEXT NOT NULL | título de la promoción |
| description | TEXT | descripción de la promo |
| original_price | INTEGER | precio normal |
| promo_price | INTEGER NOT NULL | precio con descuento |
| active | INTEGER DEFAULT 1 | 1 = activa (máx. 3 simultáneas) |

---

## Catálogo inicial de servicios

### Tratamientos Faciales

**Higiene Facial Profesional**
- Limpieza Esencial — Limpieza facial con exfoliación + espátula ultrasónica + mascarilla según biotipo cutáneo — $35.000
- Limpieza Profunda — Extracción de puntos negros + espátula ultrasónica + punta de diamantes + alta frecuencia + ácido — $39.000
- Higiene Premium — Ídem Limpieza Profunda + terapia fotolumínica roja + electroporación — $45.000

**Peeling Renovador**
- Peeling Clásico — Peeling profesional estándar — $29.000
- Peeling con Ácido — Higiene Profunda + tratamiento con ácido — $39.000
- Peeling con Electroporación — Higiene Profunda + peeling + electroporación — $43.000
- Peeling con Retinoico — Higiene + mascarilla de retinoico para suavizar líneas, afinar poros y rejuvenecer — $47.000

**Radiofrecuencia — Tratamiento Tensor**
- Radiofrecuencia Base — Higiene Profunda + radiofrecuencia — $39.000
- Radiofrecuencia con Electroporador — Higiene + radiofrecuencia + electroporador — $43.000

**Ritual Piel de Porcelana**
- Ritual Piel de Porcelana — Radiofrecuencia tensora + cristales de vitamina C + ácido renovador. Piel firme, luminosa y uniforme desde la primera sesión — $45.000

**Dermaplaning (cada 25/28 días)**
- Dermaplaning Clásico — Dermaplaning con bisturí + activos específicos — $35.000
- Dermaplaning con Electroporación — Higiene Profunda + Dermaplaning + electroporación y/o ácido — $39.000
- Dermaplaning Completo — Dermaplaning + Peeling con ácidos + electroporación. Suavidad extrema, glow inmediato — $45.000

**Microneedling / Dermapen**
- Dermapen Base — Higiene Profunda + Dermapen — $39.000
- Dermapen con Peeling — Higiene Profunda + peeling + Dermapen — $45.000
- Meso Botox Cosmetológico — Microneedling + activos específicos + electroporación — $43.000
- Ritual Antiage Avanzado — Exosomas con efecto lifting y firmeza — $49.000

**Add-on**
- Terapia LED Roja — Fotobiomoduladora, optimiza recuperación cutánea y prolonga resultados — +$5.900

### Tratamientos Corporales

**Tratamientos Combinados** (abdomen, celulitis, piernas cansadas, flacidez)
- 1 sesión — $31.000
- Pack 3 sesiones — $80.000
- Pack 4 sesiones — $95.000

**Masajes**
- Reflexología — $15.000
- Masaje Relajante de Espalda — $25.000
- Masaje Relajante Cuerpo Completo — $39.000

**Bronceado**
- Bronceado Orgánico Made in EE.UU — $37.000

### Servicios (Karina Ruiz Diaz)

**Rostro**
- Perfilado de cejas — $25.000
- Perfilado y sombreado de cejas — $29.000
- Perfilado, sombreado y alisado de cejas — $35.000
- Lifting de pestañas — $33.000
- Makeup profesional en el local — $65.000

**Manicuría y Pedicuría**
- Esmaltado Tradicional Manos — $15.000
- Esmaltado Tradicional Pies — $17.000
- Esmaltado Semipermanente Manos — $21.000
- Esmaltado Semipermanente Pies — $23.000
- Promo Manos + Pies Semipermanente — $35.000
- Promo Manos + Pies Tradicional — $25.000
- Kapping + Semipermanente — $25.000
- Con diseño — +$3.000
- Retiro de Semipermanente — $9.000

---

## API (Cloudflare Workers)

### Endpoints públicos
- `GET /api/services` — devuelve todos los servicios activos, agrupados por categoría y ordenados por `sort_order`
- `GET /api/promotions` — devuelve las promociones activas (máx. 3)

### Endpoints admin (requieren JWT)
- `POST /api/auth/login` — valida credenciales, devuelve token JWT
- `POST /api/services` — crear servicio
- `PUT /api/services/:id` — editar servicio
- `DELETE /api/services/:id` — eliminar servicio
- `PATCH /api/services/:id/toggle` — activar/desactivar servicio
- `POST /api/promotions` — crear promoción
- `PUT /api/promotions/:id` — editar promoción
- `DELETE /api/promotions/:id` — eliminar promoción
- `PATCH /api/promotions/:id/toggle` — activar/desactivar promoción

### Autenticación
- 1 usuario fijo. Credenciales almacenadas como variables de entorno en Cloudflare (no en código).
- JWT con expiración de 24hs.
- Sin registro de usuarios ni recupero de contraseña.

---

## Panel Admin (`/admin`)

- Ruta protegida: redirige a `/admin/login` si no hay JWT válido
- Login: formulario usuario + contraseña
- Una vez autenticado: interfaz con dos tabs
  - **Servicios:** tabla con todos los servicios, filtro por categoría, botones editar / ocultar / eliminar, formulario para agregar nuevo
  - **Promociones:** tabla con promos, botones editar / desactivar / eliminar, formulario para agregar nueva (alerta visual si ya hay 3 activas)
- Estética: simple y funcional, no sigue el diseño de la landing

---

## Deploy

- Landing: Cloudflare Pages
- Worker: Cloudflare Workers
- DB: Cloudflare D1
- Comando deploy: `wrangler pages deploy public --project-name cosmetologa-analia-velazco --commit-dirty=true`

---

## Fuera de scope

- Sistema de turnos online
- Galería de fotos (iteración futura cuando Analía provea las imágenes)
- Múltiples usuarios admin
- Recupero de contraseña
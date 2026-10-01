# Especificación: desplegar la aplicación

> Estado: **aprobada**: decisiones del punto 7 tomadas el 2026-10-01.
> Igual que con el login (SDD): primero se revisa y se ajusta; después se implementa por fases, con un commit por fase, en una rama aparte (`feature/despliegue`).

## 1. Objetivo

Que la aplicación esté **en internet, con un enlace**, para ponerlo en el currículum y en el README: cualquiera puede abrirlo, crear una cuenta y probarla sin instalar nada.

Con un **coste de 0 €** y sin tarjeta de crédito.

## 2. Situación actual

- Todo funciona solo en local: MySQL de XAMPP, backend en `localhost:8080` y frontend en `localhost:4200`.
- Hay cosas escritas a mano para local que en internet no sirven:
  - La URL de la API (`http://localhost:8080/api`) está repetida en cada servicio de Angular y en el interceptor.
  - El CORS solo permite `http://localhost:4200`.
  - La conexión a la base de datos (`localhost:3306`, usuario `root` sin contraseña) está en `application.properties`.
- Ya está resuelto: la clave de los tokens se lee de `JWT_SECRET`, y sin ella la aplicación no arranca.

## 3. Dónde se aloja cada parte

```text
  Navegador
     │  https://gestor-tareas.vercel.app        (el nombre exacto se decide al crearlo)
     ▼
┌─────────────┐   https + JWT   ┌──────────────────┐   SSL   ┌────────────────┐
│  Frontend   │ ──────────────▶ │     Backend      │ ──────▶ │ Base de datos  │
│   Vercel    │                 │ Render (Docker)  │         │  Aiven MySQL   │
└─────────────┘                 └──────────────────┘         └────────────────┘
 archivos estáticos               Spring Boot                  MySQL gestionado
```

| Parte | Servicio | Plan gratuito | Por qué |
| --- | --- | --- | --- |
| Frontend | **Vercel** | Gratis para proyectos personales, HTTPS incluido | Angular compilado son solo archivos estáticos; se despliega solo con cada push a `master` |
| Backend | **Render** (con Docker) | 1 servicio web gratis, 750 h/mes | Admite Spring Boot con Docker y despliega solo desde GitHub |
| Base de datos | **Aiven for MySQL** | 1 GB de disco, 1 CPU, 1 GB de RAM, sin tarjeta y sin caducidad | Es **MySQL**, como en local: no hay que cambiar el código ni el driver |

### Limitaciones de los planes gratuitos (hay que asumirlas)

- **Render apaga el backend tras 15 minutos sin visitas.** La siguiente petición lo "despierta", y eso tarda **entre 30 y 60 segundos** con Spring Boot. Para un proyecto de portfolio es aceptable, pero el frontend tiene que **avisar** de que el servidor está arrancando, para que nadie piense que la app está rota.
- **Aiven gratis** es una sola máquina pequeña (máximo 76 conexiones) y sin garantía de disponibilidad: suficiente para una demo.
- Las condiciones de los planes gratuitos cambian a menudo: **se revisan el día que se creen las cuentas**.

## 4. Requisitos

### 4.1 Funcionales

- [ ] La app funciona en internet igual que en local: registro, login, tableros, tareas, modo oscuro y responsive.
- [ ] Todo va por **HTTPS** (frontend y backend).
- [ ] Recargar la página en cualquier ruta (por ejemplo `/boards/3`) no da error 404: el servidor del frontend tiene que devolver siempre la app de Angular.
- [ ] Si el backend está "dormido", al abrir la app sale un aviso del tipo *"Despertando el servidor, puede tardar hasta un minuto…"* en vez de un error.
- [ ] Cada `push` a `master` despliega solo la nueva versión (frontend y backend).
- [ ] El README tiene el **enlace a la demo**.

### 4.2 Seguridad en producción

- [ ] `JWT_SECRET` de producción **distinto** del de local, aleatorio, y solo en el panel de Render.
- [ ] La contraseña de la base de datos, solo en el panel de Render (nunca en GitHub).
- [ ] El CORS de producción solo permite el dominio exacto del frontend, no `*`.
- [ ] Los errores 500 **no** devuelven la traza de Java.
- [ ] No se muestran las consultas SQL en los logs de producción (`show-sql` desactivado).
- [ ] La conexión a la base de datos va cifrada (SSL), como exige Aiven.

### 4.3 Fuera de esta especificación

- Un dominio propio (por ejemplo `gestortareas.com`): se usan los subdominios gratuitos de Vercel y Render.
- Copias de seguridad y migraciones de base de datos con Flyway (de momento sigue `ddl-auto=update`).
- Limitar intentos de login (protección contra fuerza bruta).
- Pasar los datos de tu base de datos local a la de producción: la de producción empieza vacía.

## 5. Diseño técnico

### 5.1 Backend

**Configuración por variables de entorno.** El mismo código sirve para local y para producción; lo que cambia son las variables:

| Variable | En local | En Render |
| --- | --- | --- |
| `SPRING_DATASOURCE_URL` | (no hace falta: usa `localhost:3306`) | La URL de Aiven, con SSL |
| `SPRING_DATASOURCE_USERNAME` / `_PASSWORD` | (no hace falta) | Los de Aiven |
| `JWT_SECRET` | En `.env.properties` | Una clave nueva |
| `CORS_ORIGINS` | (no hace falta: `http://localhost:4200`) | `https://<tu-app>.vercel.app` |
| `PORT` | (no hace falta: 8080) | Lo pone Render |
| `SPRING_PROFILES_ACTIVE` | — | `prod` |

- Spring Boot ya lee `SPRING_DATASOURCE_*` de las variables de entorno sin tocar nada; el resto se añade a `application.properties` con un valor por defecto para local.
- **`application-prod.properties`** (perfil de producción): sin `show-sql`, sin traza en los errores y logs más discretos.
- **`CorsConfig`** lee los orígenes permitidos de `CORS_ORIGINS` en vez de tenerlos escritos.
- **Comprobación de salud:** Spring Boot Actuator con `/actuator/health` público, para que Render sepa si el backend está vivo.
- **`Dockerfile`** en dos etapas: la primera compila con Maven y la segunda solo lleva Java 17 y el `.jar` (imagen más pequeña). Con la memoria de la JVM ajustada a los 512 MB del plan gratuito de Render.

### 5.2 Frontend

- **`environment.ts` y `environment.prod.ts`** con la URL de la API. Los servicios y el interceptor dejan de tener `http://localhost:8080` escrito: lo leen de ahí. Al compilar para producción, Angular cambia uno por otro.
- **`vercel.json`** con una regla para que cualquier ruta devuelva `index.html` (si no, recargar en `/boards/3` daría 404).
- **Aviso de "servidor despertando":** si una petición tarda más de unos segundos, se muestra el aviso hasta que responde.

### 5.3 Qué hace cada uno

Hay pasos que **solo puedes hacer tú**, porque son tu cuenta y tus contraseñas. Yo te guío paso a paso:

| Paso | Quién |
| --- | --- |
| Preparar el código (fases 1 y 2) | Yo |
| Crear las cuentas en Aiven, Render y Vercel (se puede entrar con GitHub) | Tú |
| Crear la base de datos en Aiven y copiar sus datos de conexión | Tú, con mis indicaciones |
| Generar el `JWT_SECRET` de producción y poner las variables en Render | Tú, con mis indicaciones (te doy el comando) |
| Conectar Render y Vercel a tu repositorio de GitHub | Tú, con mis indicaciones |
| Comprobar que todo funciona en internet | Los dos |

## 6. Tareas (en orden, un commit por fase)

### Fase 1: backend preparado para producción

1. [ ] `application.properties`: puerto, CORS y datos de la base de datos leídos de variables de entorno, con valores por defecto para local.
2. [ ] `application-prod.properties`: sin `show-sql`, sin traza en los errores.
3. [ ] `CorsConfig` con los orígenes desde `CORS_ORIGINS`.
4. [ ] Actuator con `/actuator/health` público.
5. [ ] `Dockerfile` y `.dockerignore`. Probar que la imagen se construye y arranca.
6. [ ] Tests: el CORS configurable y que `/actuator/health` responde sin token.

### Fase 2: frontend preparado para producción

1. [ ] `environment.ts` y `environment.prod.ts`, y que los servicios y el interceptor usen la URL de ahí.
2. [ ] `vercel.json` con la regla para las rutas.
3. [ ] Aviso de "servidor despertando".
4. [ ] Tests de lo anterior.

### Fase 3: crear los servicios y desplegar

1. [ ] Aiven: crear el MySQL gratuito.
2. [ ] Render: crear el servicio web desde GitHub (con el `Dockerfile`) y poner las variables de entorno.
3. [ ] Vercel: crear el proyecto desde GitHub (carpeta `frontend`).
4. [ ] Poner la URL de Render en `environment.prod.ts` y la de Vercel en `CORS_ORIGINS`.

### Fase 4: comprobar y cerrar

1. [ ] Probar en internet: registro, login, crear y borrar, dos cuentas, recargar en una ruta, móvil.
2. [ ] Comprobar la seguridad: HTTPS, CORS solo desde Vercel, errores sin traza.
3. [ ] README con el enlace a la demo y una nota sobre el arranque lento del plan gratuito.
4. [ ] Pull Request a `master`.
5. [ ] Apuntes con lo aprendido.

### Fase 5: integración continua

1. [ ] GitHub Actions: compilar y pasar los tests del backend y del frontend en cada push y en cada Pull Request.
2. [ ] La marca de los tests en el README.

## 7. Decisiones

**Tomadas:** Aiven (MySQL), Vercel, plan gratuito con el aviso de "servidor despertando", y GitHub Actions como fase 5.

**Planteamiento original:**

1. **Base de datos:** ¿**Aiven (MySQL)**, sin cambiar nada del código, o **Neon (PostgreSQL)**, que obliga a cambiar el driver pero es muy popular? *(Recomendado: Aiven, para no tocar lo que ya funciona.)*
2. **Frontend:** ¿**Vercel** o **Netlify**? Son prácticamente iguales. *(Recomendado: Vercel.)*
3. **Arranque lento:** ¿aceptamos los 30-60 segundos del plan gratuito de Render con el aviso, o prefieres pagar el plan básico (unos 7 $/mes) para que no se duerma? *(Recomendado: gratis con aviso.)*
4. **Integración continua (opcional):** ¿añadimos **GitHub Actions** para que los tests se pasen solos en cada push y en cada Pull Request? Es poco trabajo y en GitHub queda una marca verde que da muy buena imagen. *(Recomendado: sí, como fase 5.)*

# Gestor de tareas

Un gestor de tareas estilo Trello: creas una cuenta, organizas tu trabajo en tableros y, dentro de cada tablero, mueves las tareas entre **Pendiente**, **En progreso** y **Completada**.

Es un proyecto personal para practicar una aplicación completa: una API REST con Spring Boot protegida con JWT y un frontend en Angular que la consume.

## Qué hace

- **Cuentas de usuario:** registro e inicio de sesión con email y contraseña. La sesión se mantiene al recargar y caduca a las 8 horas.
- **Cada persona ve solo lo suyo:** tus tableros y tus tareas no los puede ver ni tocar nadie más.
- **Tableros:** crear, abrir y borrar (al borrar un tablero se borran sus tareas).
- **Tareas en tres columnas** según su estado: crear, cambiar de estado, asignar a una persona y borrar.
- Ventana de confirmación propia antes de borrar, avisos cuando algo falla y **modo oscuro** que recuerda tu preferencia.
- **Responsive:** se adapta a móvil, tablet y ordenador.

## Seguridad

- Contraseñas cifradas con **BCrypt**; nunca salen en ninguna respuesta de la API.
- Autenticación sin sesiones en el servidor, con **tokens JWT** firmados (HS256) que caducan a las 8 horas.
- El login responde igual (mismo mensaje y mismo tiempo) si el email no existe o si la contraseña está mal, para no revelar qué emails tienen cuenta.
- Cada consulta comprueba que el tablero o la tarea sean del usuario; si no lo son, la API responde 404, como si no existieran.
- La clave que firma los tokens no está en el código: se lee de la variable de entorno `JWT_SECRET`.
- Validación de los datos en el frontend y, de nuevo, en el backend.

## Stack técnico

**Backend**

- Java 17 + Spring Boot 4
- Spring Security con OAuth2 Resource Server (validación de JWT)
- Spring Data JPA / Hibernate + MySQL
- Bean Validation, Lombok
- Tests con JUnit 5, MockMvc y H2 en memoria

**Frontend**

- Angular 19 (componentes standalone, signals)
- Tailwind CSS 4
- Tests con Jasmine + Karma

## Arquitectura

```text
Angular (localhost:4200)                      Spring Boot (localhost:8080)
┌──────────────────────────────┐             ┌───────────────────────────────────────┐
│ Pantallas (login, tableros…) │             │ Controller  →  Service  →  Repository │
│ Servicios HTTP               │  JSON+JWT   │   (DTOs)      (¿es tuyo?)    (JPA)    │
│ Interceptor: añade el token  │ ──────────▶ │ Spring Security comprueba el token     │
│ Guards: rutas con sesión     │             └───────────────────┬───────────────────┘
└──────────────────────────────┘                                 │
                                                              MySQL
```

El diseño del login se escribió antes de programarlo, en [docs/specs/login-jwt.md](docs/specs/login-jwt.md).

## Cómo ejecutarlo en local

Necesitas **Java 17**, **Node.js** y **MySQL** corriendo en `localhost:3306` con una base de datos llamada `gestor_tareas` (las tablas las crea Hibernate al arrancar).

**Backend** (desde la raíz del proyecto):

1. Crea tu archivo de secretos copiando el de ejemplo, y pon una clave aleatoria de al menos 32 caracteres en `JWT_SECRET` (dentro del ejemplo se explica cómo generarla). Este archivo está en el `.gitignore` y no se sube nunca.

   ```bash
   cp .env.properties.example .env.properties
   ```

   En producción, en vez del archivo se define la variable de entorno `JWT_SECRET`. Sin ella, la aplicación no arranca.

2. Arranca el backend:

   ```bash
   ./mvnw spring-boot:run
   ```

Arranca en `http://localhost:8080`. Revisa `src/main/resources/application.properties` si tu MySQL usa un usuario o contraseña distintos a `root` sin contraseña.

**Frontend** (desde la carpeta `frontend/`):

```bash
npm install
npm start
```

Arranca en `http://localhost:4200`. La primera vez, crea una cuenta desde la pantalla de registro.

## Tests

```bash
./mvnw test                                                    # backend (no necesita MySQL: usa H2 en memoria)
cd frontend && npx ng test --watch=false --browsers=ChromeHeadless   # frontend
```

Incluyen casos de seguridad: que sin token la API responde 401, que un usuario no puede ver ni modificar lo de otro, y que el frontend cierra la sesión cuando el token caduca.

## Endpoints de la API

Todas las rutas necesitan la cabecera `Authorization: Bearer <token>`, salvo el registro y el login.

| Método | Ruta | Qué hace |
| --- | --- | --- |
| POST | `/api/auth/register` | Crea una cuenta y devuelve `{ token, usuario }` (201) |
| POST | `/api/auth/login` | Inicia sesión y devuelve `{ token, usuario }` |
| GET | `/api/auth/me` | El usuario de la sesión |
| GET | `/api/boards` | Tus tableros |
| GET | `/api/boards/{id}` | Uno de tus tableros |
| POST | `/api/boards` | Crea un tablero (el dueño eres tú) |
| PUT | `/api/boards/{id}` | Edita uno de tus tableros |
| DELETE | `/api/boards/{id}` | Borra uno de tus tableros y sus tareas |
| GET | `/api/tasks?boardId={id}` | Tareas de uno de tus tableros |
| GET | `/api/tasks/{id}` | Una de tus tareas |
| POST | `/api/tasks` | Crea una tarea en uno de tus tableros |
| PUT | `/api/tasks/{id}` | Edita una de tus tareas (estado, persona asignada…) |
| DELETE | `/api/tasks/{id}` | Borra una de tus tareas |
| GET | `/api/users` | Personas a las que se puede asignar una tarea (solo id y nombre) |

Los errores devuelven JSON con `{ timestamp, status, message }` y, si los datos no son válidos (400), un campo `errores` que indica qué campo falla y por qué. Códigos: 400 datos no válidos, 401 sin sesión o credenciales incorrectas, 404 no existe o no es tuyo, 409 email ya registrado.

## Próximas mejoras

- Compartir un tablero con otras personas (ahora mismo puedes asignar una tarea a cualquiera, pero solo la ve el dueño del tablero).
- Desplegar la aplicación para poder probarla desde un enlace.
- Editar el nombre de un tablero y los datos de una tarea desde la interfaz.
- Capturas de pantalla en este README.

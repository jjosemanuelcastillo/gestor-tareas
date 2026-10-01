# Especificación: registro e inicio de sesión con JWT

> Estado: **aprobada**: decisiones del punto 6 tomadas el 2026-10-01.
> Esta especificación se escribe antes de programar (SDD). Primero se revisa y se ajusta; después se implementa tarea por tarea, con un commit por fase.

## 1. Objetivo

Que cada persona tenga su **cuenta**, entre con **email y contraseña**, y vea y gestione **solo sus tableros**. Hoy cualquiera que abra la web o llame a la API ve y borra todo.

## 2. Situación actual

- No hay ningún tipo de seguridad: todos los endpoints de `/api/**` están abiertos.
- `User` solo tiene `nombre` y `email`: son personas a las que se asignan tareas, no cuentas.
- `Board` ya tiene el campo `owner` (dueño), pero siempre vale `null`.
- Los controladores devuelven las entidades JPA tal cual (sin DTOs).

## 3. Requisitos

### 3.1 Registro

- Cualquiera puede crear una cuenta con **nombre, email y contraseña**.
- Criterios de aceptación:
  - [ ] El email tiene formato válido y **no puede estar repetido**. Si ya existe → error 409 *"Ya existe una cuenta con ese email"*.
  - [ ] La contraseña tiene **al menos 8 caracteres**.
  - [ ] Ningún campo puede estar vacío. Si falla algo → error 400 indicando **qué campo** y por qué.
  - [ ] La contraseña se guarda **cifrada con BCrypt**, nunca en texto plano.
  - [ ] Al registrarse, el usuario queda **con la sesión iniciada** (no tiene que volver a escribir sus datos).

### 3.2 Inicio de sesión

- Criterios de aceptación:
  - [ ] Con email y contraseña correctos, el backend devuelve un **token JWT** y los datos del usuario.
  - [ ] Si el email no existe **o** la contraseña es incorrecta → error 401 con el mismo mensaje en los dos casos: *"Email o contraseña incorrectos"*. Así no se puede averiguar qué emails están registrados.
  - [ ] El token **caduca a las 8 horas**. Después hay que volver a entrar.

### 3.3 Cerrar sesión

- [ ] Desde el menú de la cabecera. Borra el token del navegador y lleva a la pantalla de inicio de sesión.

### 3.4 Protección de la API

- [ ] Solo son públicos `POST /api/auth/register` y `POST /api/auth/login`.
- [ ] Cualquier otra petición a `/api/**` sin token válido → error **401**.
- [ ] Un usuario **solo ve sus tableros**: `GET /api/boards` devuelve solo los suyos.
- [ ] Al crear un tablero, su dueño es **el usuario que ha iniciado sesión**. El frontend no puede elegir otro dueño.
- [ ] Si alguien pide, modifica o borra un tablero **que no es suyo** → error **404** (como si no existiera, para no dar pistas).
- [ ] Lo mismo con las tareas: solo se pueden ver, crear, modificar y borrar tareas **de tableros propios**.
- [ ] La contraseña cifrada **nunca sale en ninguna respuesta** de la API (tampoco dentro de `owner` o `assignedUser`).

### 3.5 Frontend

- [ ] Pantallas nuevas: **Iniciar sesión** (`/login`) y **Crear cuenta** (`/registro`), con el mismo diseño Tailwind, modo oscuro y responsive.
- [ ] Sin sesión, cualquier otra ruta redirige a `/login`.
- [ ] Con sesión, `/login` y `/registro` redirigen a la lista de tableros.
- [ ] La sesión **se mantiene al recargar** la página.
- [ ] Si el token caduca mientras se usa la app (la API responde 401), se cierra la sesión y se va a `/login` con el aviso *"Tu sesión ha caducado"*.
- [ ] La cabecera muestra el **nombre** del usuario, y el menú tiene **Cerrar sesión**.
- [ ] Los formularios muestran los errores del backend (email repetido, contraseña corta…) junto a cada campo.

### 3.6 Fuera de esta especificación

- Recuperar la contraseña por email.
- Iniciar sesión con Google u otros.
- Compartir un tablero con otras personas (por ahora, cada tablero es de una sola persona).
- Roles (administrador, etc.).

## 4. Diseño técnico

### 4.1 Cómo funciona un JWT (resumen)

1. El usuario envía email y contraseña a `/api/auth/login`.
2. El backend comprueba la contraseña y genera un **token**: un texto firmado que dice *"este es el usuario 3 y caduca a tal hora"*.
3. El frontend guarda el token y lo envía en **cada petición**, en la cabecera `Authorization: Bearer <token>`.
4. El backend **comprueba la firma** del token. Si es válida y no ha caducado, sabe quién es sin preguntar a la base de datos ni guardar sesiones.

### 4.2 Backend

**Dependencias nuevas**

- Spring Security, para proteger los endpoints y cifrar con BCrypt.
- El *resource server* de Spring Security (OAuth2), que ya trae la lectura y validación de JWT. Así **no hay que programar a mano el filtro que lee el token**, que es donde más fallos de seguridad se cometen.

**Modelo**

- `User` gana el campo `password` (cifrada), marcado para que **nunca se convierta a JSON**.
- El `email` pasa a ser **único** en la base de datos.

**Endpoints nuevos**

| Método | Ruta | Cuerpo | Respuesta |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | `{ nombre, email, password }` | 201 + `{ token, usuario }` |
| POST | `/api/auth/login` | `{ email, password }` | 200 + `{ token, usuario }` |
| GET | `/api/auth/me` | — | 200 + `usuario` (el de la sesión) |

`usuario` = `{ id, nombre, email }`.

**Clases nuevas** (aproximado)

- `config/SecurityConfig`: qué rutas son públicas, BCrypt, CORS con la cabecera `Authorization`, respuestas 401 en JSON.
- `config/JwtConfig`: firma y validación del token con una clave secreta (HS256).
- `controller/AuthController` + `service/AuthService`: registro e inicio de sesión.
- `dto/RegisterRequest`, `dto/LoginRequest`, `dto/AuthResponse`, `dto/UserResponse`.
- `service/BoardService` y `service/TaskService`: aquí van las comprobaciones de "¿este tablero es tuyo?". Es el momento de crear la **capa de servicio** que estaba pendiente.

**Clave secreta**

- La clave que firma los tokens **no se sube a GitHub**. Se lee de la variable de entorno `JWT_SECRET`. Para desarrollo habrá un valor de ejemplo en `application.properties`, claramente marcado como "solo para desarrollo".

**Errores** (siguiendo el formato del `GlobalExceptionHandler` actual)

| Caso | Código |
| --- | --- |
| Datos no válidos (validación) | 400, con la lista de campos y mensajes |
| Sin token, token caducado o falso | 401 |
| Email o contraseña incorrectos | 401 |
| Email ya registrado | 409 |
| Tablero o tarea de otra persona | 404 |

### 4.3 Frontend

- `core/services/auth.service.ts`: `login()`, `registro()`, `logout()`, y un signal con el usuario actual. Guarda el token en `localStorage` para mantener la sesión al recargar.
- `core/interceptors/auth.interceptor.ts`: añade `Authorization: Bearer <token>` a todas las peticiones a la API. Si la respuesta es 401, cierra la sesión y lleva a `/login`.
- `core/guards/auth.guard.ts`: las rutas de la app solo con sesión. Y otro guard para que `/login` y `/registro` solo se vean **sin** sesión.
- `auth/login` y `auth/registro`: los componentes de las dos pantallas.
- Cabecera: nombre del usuario y "Cerrar sesión" en el menú.

**Sobre guardar el token en `localStorage`**: es lo habitual en proyectos así y lo más sencillo. Su punto débil es que, si alguien consiguiera ejecutar JavaScript en la página (un ataque XSS), podría leerlo. Angular escapa todo lo que se pinta, así que ese riesgo es bajo. La alternativa más segura (cookies `HttpOnly`) complica bastante el backend; queda anotada como posible mejora.

### 4.4 Datos que ya existen

Hoy hay 2 tableros sin dueño y 2 personas (jose y carmen) sin contraseña.

- Las personas existentes **no podrán iniciar sesión** porque no tienen contraseña.
- Los tableros sin dueño **no los verá nadie**.
- **Propuesta:** como es la base de datos de desarrollo, **vaciarla** al empezar esta fase y crear datos nuevos con cuentas de verdad. *(Pendiente de confirmar, ver punto 6.)*

## 5. Tareas (en orden, un commit por fase)

### Fase 1: backend, cuentas y tokens

1. [x] Añadir las dependencias de Spring Security y del *resource server*.
2. [x] `User`: campo `password` (sin salir en el JSON) y `email` único.
3. [x] DTOs de registro, login y respuesta, con validación (`@NotBlank`, `@Email`, `@Size`).
4. [x] `SecurityConfig` (incluye también la firma y validación de tokens; no hizo falta un `JwtConfig` aparte): rutas públicas, BCrypt, CORS, 401 en JSON.
5. [x] `AuthService` + `AuthController`: registro, login y `/me`.
6. [x] Errores 400 de validación y 409 de email repetido en el `GlobalExceptionHandler`.
7. [x] Tests: registro, email repetido, login correcto e incorrecto, petición sin token → 401.
8. [x] `/api/users` pasa a ser solo de lectura y devuelve solo `id` y `nombre` (las cuentas se crean en `/api/auth/register`).

### Fase 2: backend, cada uno lo suyo

1. [x] `BoardService`: el dueño se pone en el servidor; listar, ver, editar y borrar solo los propios (si no → 404).
2. [x] `TaskService`: lo mismo para las tareas, a través de su tablero.
3. [x] Los controladores pasan a usar los servicios.
4. [x] Tests: un usuario no puede ver ni tocar los tableros ni las tareas de otro.
5. [x] DTOs de entrada y salida para tableros y tareas, con validación (nombre y título obligatorios, estado solo `pendiente`, `en_progreso` o `completada`). Las respuestas no llevan el dueño ni el email de las personas.

### Fase 3: frontend, entrar y salir

1. [x] `AuthService`, interceptor y guards.
2. [x] Pantallas de inicio de sesión y registro (Tailwind, modo oscuro, responsive).
3. [x] Rutas protegidas y redirecciones.
4. [x] Cabecera con el nombre y "Cerrar sesión". Aviso de "sesión caducada".
5. [x] Tests de lo anterior.

### Fase 4: cierre

1. [ ] Probarlo todo de punta a punta con dos cuentas distintas.
2. [ ] Actualizar el `README` (cómo funciona el login, la variable `JWT_SECRET`) y el `CLAUDE.md`.
3. [ ] Añadir a los apuntes lo aprendido.

## 6. Decisiones

**Tomadas:**

1. **Datos actuales:** se vacía la base de datos de desarrollo.
2. **Duración del token:** 8 horas.
3. **Asignar tareas:** opción **a**. Se puede asignar a cualquier usuario registrado (solo se muestra el nombre). "Compartir tableros" queda como siguiente mejora.
4. **Ramas:** todo se hace en la rama `feature/login-jwt` y se une a `master` al terminar, para no dejar la app rota entre fases.

**Planteamiento original del punto 3** (para el registro):

3. **Asignar tareas a personas:** con cuentas, cada tablero es de una sola persona y nadie más lo ve. Si asigno una tarea a otro usuario, **esa persona no la verá**, porque no ve mi tablero. Opciones:
   - **a)** Dejar el desplegable como está (cualquier usuario registrado, mostrando solo el nombre) y dejar "compartir tableros" para más adelante. Es más sencillo, pero un poco incoherente.
   - **b)** Quitar por ahora el desplegable de persona y volver a ponerlo cuando se puedan compartir tableros.
   - *(Recomendado: **a**, y apuntar "compartir tableros" como siguiente mejora.)*

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Gestor de tareas estilo Trello con cuentas de usuario: cada `User` se registra e inicia sesión (JWT) y gestiona **solo sus** tableros (`Board`, con `owner`) y las tareas (`Task`) de esos tableros. Una tarea tiene estado y puede asignarse a cualquier usuario registrado. Es un monorepo con un backend REST en Spring Boot en la raíz y un frontend Angular 19 en `frontend/`. El diseño del login está en `docs/specs/login-jwt.md`.

El código, los nombres de campos y los mensajes están en español (`nombre`, `descripcion`, `titulo`, `estado`); hay que mantener esa convención. Los nombres de los tests (`it(...)`, métodos `@Test`) están en inglés.

## Comandos

**Backend** (desde la raíz). Requiere MySQL en `localhost:3306` con la base de datos `gestor_tareas` (usuario `root` sin contraseña; ver `src/main/resources/application.properties`) y la clave JWT en `.env.properties` (copiar `.env.properties.example`; está en el `.gitignore`) o en la variable de entorno `JWT_SECRET`. Sin ella la aplicación no arranca.

```bash
./mvnw spring-boot:run          # arranca en http://localhost:8080
./mvnw test                     # tests: usan H2 en memoria (src/test/resources), no necesitan MySQL
./mvnw test -Dtest=NombreDeLaClase#metodo   # un solo test
./mvnw package
```

En Windows se puede usar `mvnw.cmd` en lugar de `./mvnw`.

**Frontend** (desde `frontend/`):

```bash
npm install
npm start                       # ng serve → http://localhost:4200
npm run build
npx ng test --watch=false --browsers=ChromeHeadless                        # todos los tests, sin ventana
npx ng test --watch=false --browsers=ChromeHeadless --include=src/app/core/services/task.service.spec.ts   # un solo spec
```

`.claude/launch.json` define la configuración de preview `frontend` (`npm --prefix frontend start`, puerto 4200).

## Arquitectura

### Backend (`src/main/java/com/example/gestor_tareas/`)

- Capas: **controller → service → repository**. Los controladores sacan el id del usuario del token (`@AuthenticationPrincipal Jwt jwt` → `Long.valueOf(jwt.getSubject())`) y delegan en `BoardService`/`TaskService`, que hacen las comprobaciones de propiedad.
- Propiedad: un tablero es tuyo si `owner` eres tú (`BoardRepository.findByIdAndOwnerId`); una tarea, si su tablero es tuyo (`TaskRepository.findByIdAndBoardOwnerId`). Si no es tuyo → `ResourceNotFoundException` (404), nunca 403. El `owner` lo pone siempre el servidor. Al crear/editar una tarea se comprueba que el tablero de destino sea tuyo.
- DTOs en `dto/` (records): entrada con Bean Validation (`BoardRequest`, `TaskRequest`, `RegisterRequest`, `LoginRequest`; las referencias van como `IdRef { id }`) y salida sin datos sensibles (`BoardResponse` sin owner, `TaskResponse` con `assignedUser` como `PersonaResponse {id, nombre}`, `UserResponse`, `AuthResponse {token, usuario}`). Las entidades JPA no se serializan directamente; `User.password` lleva además `@JsonIgnore`.
- Seguridad (`config/SecurityConfig`): stateless, CSRF desactivado, solo `POST /api/auth/register` y `/api/auth/login` son públicos; el resto exige JWT (OAuth2 Resource Server con `NimbusJwtDecoder`, HS256, clave de `app.jwt.secret` = `${JWT_SECRET}`). `TokenService` firma los tokens (`sub` = id del usuario, caducidad `app.jwt.expiration` = 8h). Contraseñas con BCrypt. El 401 se devuelve en JSON desde un `AuthenticationEntryPoint`.
- CORS (`config/CorsConfig`): un `CorsConfigurationSource` en `/api/**` con los orígenes de `app.cors.allowed-origins` = `${CORS_ORIGINS:http://localhost:4200}` (lista separada por comas) y la cabecera `Authorization`.
- Actuator: solo `/actuator/health` está publicado (y es público), sin detalles.
- `AuthService`: email normalizado (trim + minúsculas), 409 si está repetido, y en el login el mismo mensaje y tiempo (compara contra un hash falso) si el email no existe.
- Errores (`exception/GlobalExceptionHandler`): JSON `{timestamp, status, message}`; 400 de validación añade `errores: {campo: mensaje}`; 401 credenciales, 404 no encontrado/no es tuyo, 409 email repetido.
- Entidades con Lombok. Relaciones `@ManyToOne` sin inversas: `Task.board`, `Task.assignedUser`, `Board.owner`. Borrar un tablero borra antes sus tareas (`TaskRepository.deleteByBoardId`, en una transacción).
- `Task.estado` es un `String` validado con `@Pattern` (`pendiente|en_progreso|completada`). Esquema gestionado por Hibernate (`ddl-auto=update`), sin migraciones.
- Tests: `@SpringBootTest` + `@AutoConfigureMockMvc` (paquete `org.springframework.boot.webmvc.test.autoconfigure` en Boot 4) contra H2; `AuthControllerTest`, `OwnershipTest` (dos usuarios) y `ProductionConfigTest` (CORS y actuator).
- `pom.xml`: Spring Boot 4.x (`spring-boot-starter-webmvc`, `spring-boot-starter-security-oauth2-resource-server`) con Java 17 y Lombok como annotation processor.

### Frontend (`frontend/src/app/`)

- Componentes standalone. `app.config.ts`: `provideRouter(routes, withComponentInputBinding())` y `provideHttpClient(withInterceptors([authInterceptor, servidorLentoInterceptor]))`.
- URL de la API: `environment.apiUrl` (`src/environments/environment.ts` para local; `environment.prod.ts`, con la URL de Render, lo sustituye en `ng build` mediante `fileReplacements`). No escribir URLs a mano en los servicios.
- Sesión: `core/services/auth.service.ts` guarda `token` y `usuario` en `localStorage`, expone `usuario` (signal) y `estaAutenticado()` (lee el `exp` del token). `core/interceptors/auth.interceptor.ts` añade `Authorization: Bearer` solo a las peticiones a `${environment.apiUrl}/` (no al login/registro) y, ante un 401, llama a `logout('caducada')`.
- `servidor-lento.interceptor.ts` + `ServidorService`: si una petición tarda más de 4 s, `app.component` muestra el aviso "Despertando el servidor…" (el plan gratuito de Render se duerme).
- Rutas: `login` y `registro` con `invitadoGuard`; `''` (`BoardListComponent`) y `boards/:id` (`BoardDetailComponent`) con `authGuard`, que redirige a `/login?volver=...` (el login solo vuelve a rutas internas). Los parámetros de ruta y query llegan como `input()` gracias a `withComponentInputBinding`.
- `core/models/` replica los DTOs del backend. `core/services/` tiene un servicio por recurso (`${environment.apiUrl}/...`). Nombres no uniformes: `BoardService` usa `createBoard/updateBoard/deleteBoard` y `TaskService` usa `create/update/delete`.
- `core/utils/error-api.ts` convierte los errores del backend en `{mensaje, campos}` para los formularios.
- `ConfirmService` + `shared/confirm-dialog` sustituyen a `confirm()`: el diálogo está una vez en `app.component.html` y `pedir()` devuelve `Promise<boolean>`.
- El PUT de tareas debe enviar la tarea completa (`{ ...task, campo }`), porque el backend sobrescribe todos los campos.
- Estado local con signals (`signal`, `computed`, `update`) y formularios con `FormsModule`/`ngModel`.
- Estilos: Tailwind CSS v4 mediante PostCSS (`@import "tailwindcss"` en `styles.css`, sin `tailwind.config`). El modo oscuro usa la clase `.dark` en `<html>` (`ThemeService`). Cada color lleva su variante `dark:`, y en móvil los campos usan `text-base` y las zonas táctiles miden 40 px o más.
- Tests: Jasmine + Karma con `HttpTestingController`. `core/testing/token-de-prueba.ts` fabrica tokens y sesiones de prueba. `tsconfig.json` referencia `tsconfig.app.json` y `tsconfig.spec.json` para que el editor reconozca Jasmine en los `.spec.ts`.

## Despliegue (ver `docs/specs/despliegue.md`)

- Frontend en Vercel (<https://gestor-tareas-nine-phi.vercel.app>, Root Directory `frontend`, `vercel.json` con rewrites a `index.html`). Backend en Render (<https://gestor-tareas-api-gp5g.onrender.com>) con el `Dockerfile` de la raíz. MySQL en Aiven. Ambos se despliegan solos con cada push a `master`.
- Producción se configura con variables de entorno en Render: `SPRING_DATASOURCE_*`, `JWT_SECRET`, `CORS_ORIGINS`, `SPRING_PROFILES_ACTIVE=prod` (`application-prod.properties`). Los secretos nunca van al repositorio.
- CI: `.github/workflows/tests.yml` (tests de backend y frontend, `ng build` y `docker build`) en cada push a `master`/`feature/**` y en cada PR.

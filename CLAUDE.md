# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Gestor de tareas estilo Trello: tableros (`Board`) con tareas (`Task`) que tienen un estado y un usuario asignado (`User`). Es un monorepo con un backend REST en Spring Boot en la raíz y un frontend Angular 19 en `frontend/`. No hay autenticación: los `User` son solo personas asignables, no cuentas.

El código, los nombres de campos y los mensajes están en español (`nombre`, `descripcion`, `titulo`, `estado`); hay que mantener esa convención.

## Comandos

**Backend** (desde la raíz; requiere MySQL en `localhost:3306` con la base de datos `gestor_tareas` creada, usuario `root` sin contraseña; ver `src/main/resources/application.properties`):

```bash
./mvnw spring-boot:run          # arranca en http://localhost:8080
./mvnw test                     # tests (solo existe el test de carga de contexto, que necesita MySQL)
./mvnw test -Dtest=NombreDeLaClase#metodo   # un solo test
./mvnw package
```

En Windows se puede usar `mvnw.cmd` en lugar de `./mvnw`.

**Frontend** (desde `frontend/`):

```bash
npm install
npm start                       # ng serve → http://localhost:4200
npm run build
npm test                        # Karma + Jasmine (abre Chrome)
npx ng test --include=src/app/core/services/task.service.spec.ts   # un solo spec
```

`.claude/launch.json` define la configuración de preview `frontend` (`npm --prefix frontend start`, puerto 4200).

## Arquitectura

### Backend (`src/main/java/com/example/gestor_tareas/`)

- Capas mínimas: **controller → repository**, sin capa de servicio ni DTOs. Los controladores inyectan el `JpaRepository` directamente y serializan/deserializan las entidades JPA tal cual.
- Entidades con Lombok (`@Getter @Setter @NoArgsConstructor`). Relaciones `@ManyToOne`: `Task.board`, `Task.assignedUser` y `Board.owner` → `User`. No hay relaciones inversas (`Board` no tiene lista de tareas); las tareas de un tablero se obtienen con `GET /api/tasks?boardId=` (`TaskRepository.findByBoardId`).
- `Task.estado` es un `String` libre; los valores esperados son `pendiente`, `en_progreso` y `completada`.
- Esquema gestionado por Hibernate (`ddl-auto=update`): no hay migraciones.
- Errores: los controladores lanzan `ResourceNotFoundException`, que `GlobalExceptionHandler` convierte en un 404 con cuerpo JSON `{timestamp, status, message}`. Si se añaden errores nuevos, conviene seguir ese patrón.
- CORS (`config/CorsConfig`) solo permite `http://localhost:4200` en `/api/**` con GET/POST/PUT/DELETE. Si se añade otro método u origen, hay que actualizarlo.
- `pom.xml` usa Spring Boot 4.x (starter `spring-boot-starter-webmvc`, no `-web`) con Java 17, y Lombok configurado como annotation processor en el `maven-compiler-plugin`.

### Frontend (`frontend/src/app/`)

- Componentes standalone, sin NgModules. `app.config.ts` registra `provideRouter(routes, withComponentInputBinding())` y `provideHttpClient()`.
- Rutas: `''` → `BoardListComponent`, `boards/:id` → `BoardDetailComponent`. Gracias a `withComponentInputBinding`, el parámetro `:id` llega como `input.required<string>()` y hay que convertirlo con `Number(...)`.
- `core/models/` contiene interfaces que replican las entidades JPA (mismos nombres de campo en español, `id?` opcional). Al cambiar una entidad del backend hay que actualizar su modelo.
- `core/services/` tiene un servicio por recurso, con `inject(HttpClient)` y la URL base `http://localhost:8080/api/...` escrita en cada servicio (no hay `environment`). Los nombres de los métodos no son uniformes: `BoardService` usa `createBoard/updateBoard/deleteBoard` y `TaskService` usa `create/update/delete`.
- Estado local con signals (`signal`, `update`) y formularios con `FormsModule`/`ngModel`.
- Estilos: Tailwind CSS v4 mediante PostCSS (`.postcssrc.json`, `@import "tailwindcss"` en `styles.css`). No existe `tailwind.config`. El modo oscuro usa la clase `.dark` en `<html>` (`@custom-variant dark`), que gestiona `ThemeService` con un signal + `effect` y persiste en `localStorage`.

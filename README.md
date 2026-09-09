# Gestor de tareas

Un gestor de tareas estilo Trello: creas tableros, dentro de cada tablero añades tareas, y a cada tarea le puedes asignar un estado y una persona responsable.

Es un proyecto personal para practicar un backend REST con Spring Boot y conectarlo a un frontend real en Angular, en vez de dejarlo solo en Postman.

## Qué hace

- Crear tableros (`Board`) y ver la lista de tareas que contiene cada uno.
- Crear, editar, borrar y cambiar el estado de una tarea dentro de un tablero (`pendiente`, `en_progreso`, `completada`).
- Asignar una tarea a un usuario (`User`) de una lista simple de personas.
- Modo oscuro con memoria (recuerda tu preferencia aunque cierres el navegador).

De momento no hay login ni cuentas de usuario reales — los `User` son solo personas a las que se les puede asignar una tarea, no cuentas con las que inicias sesión.

## Stack técnico

**Backend**
- Java 17 + Spring Boot
- Spring Data JPA / Hibernate
- MySQL
- Lombok

**Frontend**
- Angular 19 (componentes standalone)
- Tailwind CSS

## Cómo ejecutarlo en local

Necesitas tener MySQL corriendo en local, con una base de datos llamada `gestor_tareas` creada (las tablas las crea Hibernate solas al arrancar, no hace falta crear el esquema a mano).

**Backend** (desde la raíz del proyecto):

```bash
./mvnw spring-boot:run
```

Arranca en `http://localhost:8080`. Revisa `src/main/resources/application.properties` si tu MySQL usa un usuario o contraseña distintos a `root` sin contraseña.

**Frontend** (desde la carpeta `frontend/`):

```bash
npm install
ng serve
```

Arranca en `http://localhost:4200`.

## Endpoints de la API

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/api/boards` | Lista todos los tableros |
| GET | `/api/boards/{id}` | Un tablero por id (404 si no existe) |
| POST | `/api/boards` | Crea un tablero |
| PUT | `/api/boards/{id}` | Actualiza un tablero |
| DELETE | `/api/boards/{id}` | Borra un tablero |
| GET | `/api/tasks?boardId={id}` | Tareas de un tablero concreto |
| GET | `/api/tasks/{id}` | Una tarea por id (404 si no existe) |
| POST | `/api/tasks` | Crea una tarea |
| PUT | `/api/tasks/{id}` | Actualiza una tarea |
| DELETE | `/api/tasks/{id}` | Borra una tarea |
| GET | `/api/users` | Lista todos los usuarios |
| POST | `/api/users` | Crea un usuario |

Pedir un id que no existe devuelve `404` con un cuerpo JSON explicando el error, no un `200` vacío.

## Qué falta

- Autenticación real (login, permisos por usuario).
- Tests automatizados.
- Interfaz para gestionar usuarios desde la propia app (ahora mismo se gestionan directo en la base de datos).
- Capturas de pantalla aquí en el README cuando el frontend esté más avanzado.

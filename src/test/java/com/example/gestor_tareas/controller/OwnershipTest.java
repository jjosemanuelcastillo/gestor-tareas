package com.example.gestor_tareas.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.example.gestor_tareas.repository.BoardRepository;
import com.example.gestor_tareas.repository.TaskRepository;
import com.example.gestor_tareas.repository.UserRepository;
import com.jayway.jsonpath.JsonPath;

/** Fase 2: cada usuario solo ve y toca lo suyo. Ana tiene un tablero; Luis intenta meterse. */
@SpringBootTest
@AutoConfigureMockMvc
class OwnershipTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private BoardRepository boardRepository;

	@Autowired
	private TaskRepository taskRepository;

	private String tokenAna;
	private String tokenLuis;
	private Number idLuis;
	private Number tableroAna;
	private Number tareaAna;

	@BeforeEach
	void prepararDatos() throws Exception {
		taskRepository.deleteAll();
		boardRepository.deleteAll();
		userRepository.deleteAll();

		String ana = registrar("Ana", "ana@example.com");
		String luis = registrar("Luis", "luis@example.com");
		tokenAna = JsonPath.read(ana, "$.token");
		tokenLuis = JsonPath.read(luis, "$.token");
		idLuis = JsonPath.read(luis, "$.usuario.id");

		tableroAna = JsonPath.read(como(tokenAna, post("/api/boards"), """
				{"nombre": "Proyecto de Ana", "descripcion": "Privado"}
				""").andExpect(status().isOk()).andReturn().getResponse().getContentAsString(), "$.id");

		tareaAna = JsonPath.read(como(tokenAna, post("/api/tasks"), """
				{"titulo": "Tarea de Ana", "estado": "pendiente", "board": {"id": %s}}
				""".formatted(tableroAna)).andExpect(status().isOk()).andReturn().getResponse().getContentAsString(), "$.id");
	}

	private String registrar(String nombre, String email) throws Exception {
		return mockMvc.perform(post("/api/auth/register")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"nombre": "%s", "email": "%s", "password": "secreto123"}
						""".formatted(nombre, email)))
				.andReturn().getResponse().getContentAsString();
	}

	/** Hace una petición con el token de alguien (y un cuerpo JSON opcional). */
	private ResultActions como(String token, MockHttpServletRequestBuilder peticion, String json) throws Exception {
		peticion.header("Authorization", "Bearer " + token);
		if (json != null) {
			peticion.contentType(MediaType.APPLICATION_JSON).content(json);
		}
		return mockMvc.perform(peticion);
	}

	private ResultActions como(String token, MockHttpServletRequestBuilder peticion) throws Exception {
		return como(token, peticion, null);
	}

	// ---------- Tableros ----------

	@Test
	void eachUserOnlySeesTheirOwnBoards() throws Exception {
		como(tokenAna, get("/api/boards"))
				.andExpect(jsonPath("$", hasSize(1)))
				.andExpect(jsonPath("$[0].nombre").value("Proyecto de Ana"));

		como(tokenLuis, get("/api/boards"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$", hasSize(0)));
	}

	@Test
	void theOwnerIsSetByTheServerNotByTheRequest() throws Exception {
		// Luis intenta crear un tablero "a nombre de" Ana mandando un owner: se ignora
		como(tokenLuis, post("/api/boards"), """
				{"nombre": "Tablero de Luis", "owner": {"id": 999}}
				""").andExpect(status().isOk());

		como(tokenLuis, get("/api/boards")).andExpect(jsonPath("$[0].nombre").value("Tablero de Luis"));
		como(tokenAna, get("/api/boards")).andExpect(jsonPath("$", hasSize(1)));
	}

	@Test
	void someoneElsesBoardLooksLikeItDoesNotExist() throws Exception {
		como(tokenLuis, get("/api/boards/" + tableroAna)).andExpect(status().isNotFound());

		como(tokenLuis, put("/api/boards/" + tableroAna), """
				{"nombre": "Hackeado"}
				""").andExpect(status().isNotFound());

		como(tokenLuis, delete("/api/boards/" + tableroAna)).andExpect(status().isNotFound());

		// Y el tablero de Ana sigue igual
		como(tokenAna, get("/api/boards/" + tableroAna))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.nombre").value("Proyecto de Ana"));
	}

	@Test
	void theBoardResponseDoesNotIncludeTheOwner() throws Exception {
		como(tokenAna, get("/api/boards/" + tableroAna)).andExpect(jsonPath("$.owner").doesNotExist());
	}

	@Test
	void deletingYourBoardAlsoDeletesItsTasks() throws Exception {
		como(tokenAna, delete("/api/boards/" + tableroAna)).andExpect(status().isOk());

		assertThat(boardRepository.count()).isZero();
		assertThat(taskRepository.count()).isZero();
	}

	// ---------- Tareas ----------

	@Test
	void someoneElsesTasksAreHidden() throws Exception {
		como(tokenLuis, get("/api/tasks?boardId=" + tableroAna)).andExpect(status().isNotFound());
		como(tokenLuis, get("/api/tasks/" + tareaAna)).andExpect(status().isNotFound());
		como(tokenLuis, get("/api/tasks")).andExpect(jsonPath("$", hasSize(0)));

		como(tokenAna, get("/api/tasks?boardId=" + tableroAna)).andExpect(jsonPath("$", hasSize(1)));
	}

	@Test
	void youCannotCreateTasksInSomeoneElsesBoard() throws Exception {
		como(tokenLuis, post("/api/tasks"), """
				{"titulo": "Intrusa", "estado": "pendiente", "board": {"id": %s}}
				""".formatted(tableroAna)).andExpect(status().isNotFound());

		assertThat(taskRepository.count()).isEqualTo(1);
	}

	@Test
	void youCannotEditOrDeleteSomeoneElsesTask() throws Exception {
		como(tokenLuis, put("/api/tasks/" + tareaAna), """
				{"titulo": "Cambiada", "estado": "completada", "board": {"id": %s}}
				""".formatted(tableroAna)).andExpect(status().isNotFound());

		como(tokenLuis, delete("/api/tasks/" + tareaAna)).andExpect(status().isNotFound());

		como(tokenAna, get("/api/tasks/" + tareaAna))
				.andExpect(jsonPath("$.titulo").value("Tarea de Ana"))
				.andExpect(jsonPath("$.estado").value("pendiente"));
	}

	@Test
	void youCannotMoveYourTaskToSomeoneElsesBoard() throws Exception {
		String tableroLuis = como(tokenLuis, post("/api/boards"), """
				{"nombre": "Tablero de Luis"}
				""").andReturn().getResponse().getContentAsString();
		Number idTableroLuis = JsonPath.read(tableroLuis, "$.id");
		String tareaLuis = como(tokenLuis, post("/api/tasks"), """
				{"titulo": "Tarea de Luis", "estado": "pendiente", "board": {"id": %s}}
				""".formatted(idTableroLuis)).andReturn().getResponse().getContentAsString();
		Number idTareaLuis = JsonPath.read(tareaLuis, "$.id");

		como(tokenLuis, put("/api/tasks/" + idTareaLuis), """
				{"titulo": "Tarea de Luis", "estado": "pendiente", "board": {"id": %s}}
				""".formatted(tableroAna)).andExpect(status().isNotFound());
	}

	@Test
	void anyRegisteredPersonCanBeAssignedButOnlyTheNameIsShown() throws Exception {
		como(tokenAna, put("/api/tasks/" + tareaAna), """
				{"titulo": "Tarea de Ana", "estado": "en_progreso", "board": {"id": %s}, "assignedUser": {"id": %s}}
				""".formatted(tableroAna, idLuis))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.assignedUser.nombre").value("Luis"))
				.andExpect(jsonPath("$.assignedUser.email").doesNotExist())
				.andExpect(jsonPath("$.board.owner").doesNotExist());
	}

	// ---------- Validación ----------

	@Test
	void boardsAndTasksAreValidated() throws Exception {
		como(tokenAna, post("/api/boards"), """
				{"nombre": "   "}
				""")
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errores.nombre").value("El nombre del tablero es obligatorio"));

		como(tokenAna, post("/api/tasks"), """
				{"titulo": "Sin estado válido", "estado": "terminada", "board": {"id": %s}}
				""".formatted(tableroAna))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errores.estado").value("El estado tiene que ser pendiente, en_progreso o completada"));
	}
}

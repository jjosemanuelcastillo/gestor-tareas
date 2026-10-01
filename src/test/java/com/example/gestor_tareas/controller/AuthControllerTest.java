package com.example.gestor_tareas.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.emptyString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import com.example.gestor_tareas.model.User;
import com.example.gestor_tareas.repository.BoardRepository;
import com.example.gestor_tareas.repository.TaskRepository;
import com.example.gestor_tareas.repository.UserRepository;
import com.jayway.jsonpath.JsonPath;

/** Prueba la API de verdad (con H2 en memoria): registro, login y que lo demás pide token. */
@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private BoardRepository boardRepository;

	@Autowired
	private TaskRepository taskRepository;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@BeforeEach
	void limpiar() {
		taskRepository.deleteAll();
		boardRepository.deleteAll();
		userRepository.deleteAll();
	}

	private String registrar(String nombre, String email, String password) throws Exception {
		return mockMvc.perform(post("/api/auth/register")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"nombre": "%s", "email": "%s", "password": "%s"}
						""".formatted(nombre, email, password)))
				.andReturn().getResponse().getContentAsString();
	}

	private String token(String respuestaJson) {
		return JsonPath.read(respuestaJson, "$.token");
	}

	@Test
	void registerCreatesTheAccountAndReturnsAToken() throws Exception {
		mockMvc.perform(post("/api/auth/register")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"nombre": "Ana", "email": "ana@example.com", "password": "secreto123"}
						"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.token").value(not(emptyString())))
				.andExpect(jsonPath("$.usuario.nombre").value("Ana"))
				.andExpect(jsonPath("$.usuario.email").value("ana@example.com"))
				.andExpect(jsonPath("$.usuario.password").doesNotExist());
	}

	@Test
	void registerStoresThePasswordEncrypted() throws Exception {
		registrar("Ana", "ana@example.com", "secreto123");

		User ana = userRepository.findByEmail("ana@example.com").orElseThrow();
		assertThat(ana.getPassword()).isNotEqualTo("secreto123");
		assertThat(passwordEncoder.matches("secreto123", ana.getPassword())).isTrue();
	}

	@Test
	void registerRejectsARepeatedEmailIgnoringCase() throws Exception {
		registrar("Ana", "ana@example.com", "secreto123");

		mockMvc.perform(post("/api/auth/register")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"nombre": "Otra Ana", "email": "  ANA@example.com ", "password": "otraclave123"}
						"""))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.message").value("Ya existe una cuenta con ese email"));
	}

	@Test
	void registerRejectsInvalidDataSayingWhichField() throws Exception {
		mockMvc.perform(post("/api/auth/register")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"nombre": "", "email": "esto-no-es-un-email", "password": "corta"}
						"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errores.nombre").value("El nombre es obligatorio"))
				.andExpect(jsonPath("$.errores.email").value("El email no tiene un formato válido"))
				.andExpect(jsonPath("$.errores.password").value("La contraseña debe tener entre 8 y 72 caracteres"));
	}

	@Test
	void loginReturnsATokenThatWorksOnMe() throws Exception {
		registrar("Ana", "ana@example.com", "secreto123");

		String respuesta = mockMvc.perform(post("/api/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"email": "ana@example.com", "password": "secreto123"}
						"""))
				.andExpect(status().isOk())
				.andReturn().getResponse().getContentAsString();

		mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token(respuesta)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.nombre").value("Ana"));
	}

	@Test
	void loginGivesTheSameErrorForWrongPasswordAndUnknownEmail() throws Exception {
		registrar("Ana", "ana@example.com", "secreto123");

		mockMvc.perform(post("/api/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"email": "ana@example.com", "password": "contraseña-mala"}
						"""))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.message").value("Email o contraseña incorrectos"));

		mockMvc.perform(post("/api/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"email": "nadie@example.com", "password": "secreto123"}
						"""))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.message").value("Email o contraseña incorrectos"));
	}

	@Test
	void theRestOfTheApiNeedsAToken() throws Exception {
		mockMvc.perform(get("/api/boards"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.message").value("No has iniciado sesión o la sesión ha caducado"));

		mockMvc.perform(get("/api/boards").header("Authorization", "Bearer token-inventado"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void theApiWorksWithAValidToken() throws Exception {
		String token = token(registrar("Ana", "ana@example.com", "secreto123"));

		mockMvc.perform(get("/api/boards").header("Authorization", "Bearer " + token))
				.andExpect(status().isOk());
	}

	@Test
	void thePeopleListShowsOnlyTheName() throws Exception {
		String token = token(registrar("Ana", "ana@example.com", "secreto123"));

		mockMvc.perform(get("/api/users").header("Authorization", "Bearer " + token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].nombre").value("Ana"))
				.andExpect(jsonPath("$[0].email").doesNotExist())
				.andExpect(jsonPath("$[0].password").doesNotExist());
	}
}

package com.example.gestor_tareas.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

/** Lo que hace falta para desplegar: CORS configurable y la comprobación de salud. */
@SpringBootTest
@AutoConfigureMockMvc
class ProductionConfigTest {

	@Autowired
	private MockMvc mockMvc;

	/** La petición previa ("preflight") que hace el navegador antes de llamar a otra web. */
	private org.springframework.test.web.servlet.ResultActions preflightDesde(String origen) throws Exception {
		return mockMvc.perform(options("/api/boards")
				.header("Origin", origen)
				.header("Access-Control-Request-Method", "GET")
				.header("Access-Control-Request-Headers", "authorization"));
	}

	@Test
	void corsAllowsEveryConfiguredOrigin() throws Exception {
		// En los tests, app.cors.allowed-origins tiene dos orígenes separados por coma
		preflightDesde("http://localhost:4200")
				.andExpect(status().isOk())
				.andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:4200"));

		preflightDesde("https://gestor-tareas-demo.vercel.app")
				.andExpect(status().isOk())
				.andExpect(header().string("Access-Control-Allow-Origin", "https://gestor-tareas-demo.vercel.app"));
	}

	@Test
	void corsRejectsOtherWebsites() throws Exception {
		preflightDesde("https://web-de-un-atacante.com")
				.andExpect(status().isForbidden())
				.andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
	}

	@Test
	void healthCheckIsPublicAndShowsNoDetails() throws Exception {
		mockMvc.perform(get("/actuator/health"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("UP"))
				.andExpect(jsonPath("$.components").doesNotExist());
	}

	@Test
	void theOtherActuatorEndpointsAreNotPublished() throws Exception {
		// /actuator/env enseñaría la configuración (¡con claves!): no debe existir
		mockMvc.perform(get("/actuator/env")).andExpect(status().is4xxClientError());
		mockMvc.perform(get("/actuator/beans")).andExpect(status().is4xxClientError());
	}
}

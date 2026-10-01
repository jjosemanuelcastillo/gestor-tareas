package com.example.gestor_tareas.config;

import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Qué webs pueden llamar a la API desde el navegador. Con Spring Security, el CORS
 * se configura así (un CorsConfigurationSource) para que se aplique antes que la seguridad.
 * Los orígenes vienen de app.cors.allowed-origins (variable CORS_ORIGINS en producción).
 */
@Configuration
public class CorsConfig {

	@Bean
	public CorsConfigurationSource corsConfigurationSource(@Value("${app.cors.allowed-origins}") String origenes) {
		List<String> permitidos = Arrays.stream(origenes.split(","))
				.map(String::trim)
				.filter(origen -> !origen.isEmpty())
				.toList();

		CorsConfiguration config = new CorsConfiguration();
		config.setAllowedOrigins(permitidos);
		config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
		// Authorization: la cabecera donde el frontend manda el token
		config.setAllowedHeaders(List.of("Authorization", "Content-Type"));

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/api/**", config);
		return source;
	}
}

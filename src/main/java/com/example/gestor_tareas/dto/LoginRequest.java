package com.example.gestor_tareas.dto;

import jakarta.validation.constraints.NotBlank;

/** Lo que envía el frontend para iniciar sesión. */
public record LoginRequest(
		@NotBlank(message = "El email es obligatorio")
		String email,

		@NotBlank(message = "La contraseña es obligatoria")
		String password) {

	public LoginRequest {
		email = email == null ? null : email.trim();
	}
}

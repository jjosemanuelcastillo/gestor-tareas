package com.example.gestor_tareas.dto;

import com.example.gestor_tareas.model.User;

/** Datos del usuario que se pueden enseñar (nunca la contraseña). */
public record UserResponse(Long id, String nombre, String email) {

	public static UserResponse from(User user) {
		return new UserResponse(user.getId(), user.getNombre(), user.getEmail());
	}
}

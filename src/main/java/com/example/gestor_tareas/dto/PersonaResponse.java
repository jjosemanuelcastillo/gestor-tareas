package com.example.gestor_tareas.dto;

import com.example.gestor_tareas.model.User;

/** Una persona en la lista para asignar tareas: solo el nombre, sin el email de los demás. */
public record PersonaResponse(Long id, String nombre) {

	public static PersonaResponse from(User user) {
		return new PersonaResponse(user.getId(), user.getNombre());
	}
}

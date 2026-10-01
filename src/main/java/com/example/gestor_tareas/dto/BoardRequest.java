package com.example.gestor_tareas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Lo que envía el frontend para crear o editar un tablero. No lleva dueño: lo pone el servidor. */
public record BoardRequest(
		@NotBlank(message = "El nombre del tablero es obligatorio")
		@Size(max = 100, message = "El nombre no puede tener más de 100 caracteres")
		String nombre,

		@Size(max = 255, message = "La descripción no puede tener más de 255 caracteres")
		String descripcion) {

	public BoardRequest {
		nombre = nombre == null ? null : nombre.trim();
		descripcion = descripcion == null ? null : descripcion.trim();
	}
}

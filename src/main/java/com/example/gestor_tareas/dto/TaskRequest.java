package com.example.gestor_tareas.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Lo que envía el frontend para crear o editar una tarea. */
public record TaskRequest(
		@NotBlank(message = "El título de la tarea es obligatorio")
		@Size(max = 200, message = "El título no puede tener más de 200 caracteres")
		String titulo,

		@Size(max = 255, message = "La descripción no puede tener más de 255 caracteres")
		String descripcion,

		@NotBlank(message = "El estado es obligatorio")
		@Pattern(regexp = "pendiente|en_progreso|completada",
				message = "El estado tiene que ser pendiente, en_progreso o completada")
		String estado,

		@NotNull(message = "La tarea tiene que pertenecer a un tablero")
		@Valid
		IdRef board,

		@Valid
		IdRef assignedUser) {

	public TaskRequest {
		titulo = titulo == null ? null : titulo.trim();
		descripcion = descripcion == null ? null : descripcion.trim();
	}
}

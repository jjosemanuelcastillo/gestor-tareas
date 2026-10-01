package com.example.gestor_tareas.dto;

import com.example.gestor_tareas.model.Task;

/**
 * Una tarea tal como la ve el frontend. La persona asignada va como PersonaResponse
 * (solo id y nombre), así no salen los emails de los demás.
 */
public record TaskResponse(
		Long id,
		String titulo,
		String descripcion,
		String estado,
		BoardResponse board,
		PersonaResponse assignedUser) {

	public static TaskResponse from(Task task) {
		return new TaskResponse(
				task.getId(),
				task.getTitulo(),
				task.getDescripcion(),
				task.getEstado(),
				BoardResponse.from(task.getBoard()),
				task.getAssignedUser() == null ? null : PersonaResponse.from(task.getAssignedUser()));
	}
}

package com.example.gestor_tareas.dto;

import com.example.gestor_tareas.model.Board;

/** Un tablero tal como lo ve el frontend (sin el dueño: siempre es quien lo pide). */
public record BoardResponse(Long id, String nombre, String descripcion) {

	public static BoardResponse from(Board board) {
		return new BoardResponse(board.getId(), board.getNombre(), board.getDescripcion());
	}
}

package com.example.gestor_tareas.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.gestor_tareas.dto.BoardRequest;
import com.example.gestor_tareas.dto.BoardResponse;
import com.example.gestor_tareas.exception.ResourceNotFoundException;
import com.example.gestor_tareas.model.Board;
import com.example.gestor_tareas.model.User;
import com.example.gestor_tareas.repository.BoardRepository;
import com.example.gestor_tareas.repository.TaskRepository;
import com.example.gestor_tareas.repository.UserRepository;

/**
 * La lógica de los tableros. Todos los métodos reciben el id del usuario que ha iniciado sesión
 * y solo trabajan con SUS tableros.
 */
@Service
@Transactional
public class BoardService {

	private final BoardRepository boardRepository;
	private final TaskRepository taskRepository;
	private final UserRepository userRepository;

	public BoardService(BoardRepository boardRepository, TaskRepository taskRepository, UserRepository userRepository) {
		this.boardRepository = boardRepository;
		this.taskRepository = taskRepository;
		this.userRepository = userRepository;
	}

	@Transactional(readOnly = true)
	public List<BoardResponse> listar(Long userId) {
		return boardRepository.findByOwnerId(userId).stream().map(BoardResponse::from).toList();
	}

	@Transactional(readOnly = true)
	public BoardResponse obtener(Long id, Long userId) {
		return BoardResponse.from(buscarPropio(id, userId));
	}

	public BoardResponse crear(BoardRequest request, Long userId) {
		User owner = userRepository.findById(userId)
				.orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

		Board board = new Board();
		board.setNombre(request.nombre());
		board.setDescripcion(request.descripcion());
		board.setOwner(owner); // el dueño lo decide el servidor, nunca el frontend
		return BoardResponse.from(boardRepository.save(board));
	}

	public BoardResponse actualizar(Long id, BoardRequest request, Long userId) {
		Board board = buscarPropio(id, userId);
		board.setNombre(request.nombre());
		board.setDescripcion(request.descripcion());
		return BoardResponse.from(boardRepository.save(board));
	}

	// Las tareas apuntan a su tablero (board_id), así que se borran primero.
	// Al ser @Transactional, si algo falla no se borra nada.
	public void borrar(Long id, Long userId) {
		Board board = buscarPropio(id, userId);
		taskRepository.deleteByBoardId(board.getId());
		boardRepository.delete(board);
	}

	/**
	 * El tablero, solo si es del usuario. Si no existe o es de otra persona, el mismo 404:
	 * así nadie puede averiguar qué tableros existen probando ids.
	 */
	public Board buscarPropio(Long id, Long userId) {
		return boardRepository.findByIdAndOwnerId(id, userId)
				.orElseThrow(() -> new ResourceNotFoundException("Board no encontrado con id " + id));
	}
}

package com.example.gestor_tareas.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.gestor_tareas.dto.TaskRequest;
import com.example.gestor_tareas.dto.TaskResponse;
import com.example.gestor_tareas.exception.ResourceNotFoundException;
import com.example.gestor_tareas.model.Task;
import com.example.gestor_tareas.repository.TaskRepository;
import com.example.gestor_tareas.repository.UserRepository;

/**
 * La lógica de las tareas. Una tarea es "tuya" si está en uno de tus tableros,
 * así que todas las comprobaciones pasan por el tablero.
 */
@Service
@Transactional
public class TaskService {

	private final TaskRepository taskRepository;
	private final UserRepository userRepository;
	private final BoardService boardService;

	public TaskService(TaskRepository taskRepository, UserRepository userRepository, BoardService boardService) {
		this.taskRepository = taskRepository;
		this.userRepository = userRepository;
		this.boardService = boardService;
	}

	@Transactional(readOnly = true)
	public List<TaskResponse> listar(Long boardId, Long userId) {
		if (boardId != null) {
			boardService.buscarPropio(boardId, userId); // 404 si el tablero no es tuyo
			return taskRepository.findByBoardId(boardId).stream().map(TaskResponse::from).toList();
		}
		return taskRepository.findByBoardOwnerId(userId).stream().map(TaskResponse::from).toList();
	}

	@Transactional(readOnly = true)
	public TaskResponse obtener(Long id, Long userId) {
		return TaskResponse.from(buscarPropia(id, userId));
	}

	public TaskResponse crear(TaskRequest request, Long userId) {
		Task task = new Task();
		aplicar(task, request, userId);
		return TaskResponse.from(taskRepository.save(task));
	}

	public TaskResponse actualizar(Long id, TaskRequest request, Long userId) {
		Task task = buscarPropia(id, userId);
		aplicar(task, request, userId);
		return TaskResponse.from(taskRepository.save(task));
	}

	public void borrar(Long id, Long userId) {
		taskRepository.delete(buscarPropia(id, userId));
	}

	/** Copia los datos de la petición a la tarea, comprobando que el tablero sea tuyo. */
	private void aplicar(Task task, TaskRequest request, Long userId) {
		task.setTitulo(request.titulo());
		task.setDescripcion(request.descripcion());
		task.setEstado(request.estado());
		// Ni crear tareas en tableros ajenos, ni mover una tarea tuya a un tablero ajeno
		task.setBoard(boardService.buscarPropio(request.board().id(), userId));

		if (request.assignedUser() == null) {
			task.setAssignedUser(null);
		} else {
			Long personaId = request.assignedUser().id();
			task.setAssignedUser(userRepository.findById(personaId)
					.orElseThrow(() -> new ResourceNotFoundException("Persona no encontrada con id " + personaId)));
		}
	}

	private Task buscarPropia(Long id, Long userId) {
		return taskRepository.findByIdAndBoardOwnerId(id, userId)
				.orElseThrow(() -> new ResourceNotFoundException("Task no encontrada con id " + id));
	}
}

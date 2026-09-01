package com.example.gestor_tareas.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.example.gestor_tareas.exception.ResourceNotFoundException;
import com.example.gestor_tareas.model.Task;
import com.example.gestor_tareas.repository.TaskRepository;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

	@Autowired
	private TaskRepository taskRepository;

	@GetMapping
	public List<Task> getAllTasks(@RequestParam(required = false) Long boardId) {
		if (boardId != null) {
			return taskRepository.findByBoardId(boardId);
		}
		return taskRepository.findAll();
	}

	@GetMapping("/{id}")
	public Task getTaskById(@PathVariable Long id) {
		return taskRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Task no encontrada con id " + id));
	}

	@PostMapping()
	public Task createTask(@RequestBody Task task) {
		return taskRepository.save(task);
	}

	@PutMapping("/{id}")
	public Task updateTask(@PathVariable Long id, @RequestBody Task taskDetails) {
		Task task = taskRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Task no encontrada con id " + id));

		task.setTitulo(taskDetails.getTitulo());
		task.setDescripcion(taskDetails.getDescripcion());
		task.setEstado(taskDetails.getEstado());
		task.setBoard(taskDetails.getBoard());
		task.setAssignedUser(taskDetails.getAssignedUser());
		return taskRepository.save(task);
	}

	@DeleteMapping("/{id}")
	public void deleteTask(@PathVariable Long id) {
		if (!taskRepository.existsById(id)) {
			throw new ResourceNotFoundException("Task no encontrada con id " + id);
		}
		taskRepository.deleteById(id);
	}
}

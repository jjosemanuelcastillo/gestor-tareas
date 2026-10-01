package com.example.gestor_tareas.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import com.example.gestor_tareas.dto.TaskRequest;
import com.example.gestor_tareas.dto.TaskResponse;
import com.example.gestor_tareas.service.TaskService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

	@Autowired
	private TaskService taskService;

	@GetMapping
	public List<TaskResponse> getAllTasks(@RequestParam(required = false) Long boardId,
			@AuthenticationPrincipal Jwt jwt) {
		return taskService.listar(boardId, usuario(jwt));
	}

	@GetMapping("/{id}")
	public TaskResponse getTaskById(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
		return taskService.obtener(id, usuario(jwt));
	}

	@PostMapping()
	public TaskResponse createTask(@Valid @RequestBody TaskRequest request, @AuthenticationPrincipal Jwt jwt) {
		return taskService.crear(request, usuario(jwt));
	}

	@PutMapping("/{id}")
	public TaskResponse updateTask(@PathVariable Long id, @Valid @RequestBody TaskRequest request,
			@AuthenticationPrincipal Jwt jwt) {
		return taskService.actualizar(id, request, usuario(jwt));
	}

	@DeleteMapping("/{id}")
	public void deleteTask(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
		taskService.borrar(id, usuario(jwt));
	}

	/** El id del usuario que ha iniciado sesión: va en el "sub" del token. */
	private Long usuario(Jwt jwt) {
		return Long.valueOf(jwt.getSubject());
	}
}

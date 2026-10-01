package com.example.gestor_tareas.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import com.example.gestor_tareas.dto.BoardRequest;
import com.example.gestor_tareas.dto.BoardResponse;
import com.example.gestor_tareas.service.BoardService;

import jakarta.validation.Valid;

/**
 * El controlador solo recibe la petición y responde. La lógica (y las comprobaciones de
 * "¿este tablero es tuyo?") está en BoardService.
 */
@RestController
@RequestMapping("/api/boards")
public class BoardController {

	@Autowired
	private BoardService boardService;

	@GetMapping
	public List<BoardResponse> getAllBoards(@AuthenticationPrincipal Jwt jwt) {
		return boardService.listar(usuario(jwt));
	}

	@GetMapping("/{id}")
	public BoardResponse getBoardById(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
		return boardService.obtener(id, usuario(jwt));
	}

	@PostMapping()
	public BoardResponse createBoard(@Valid @RequestBody BoardRequest request, @AuthenticationPrincipal Jwt jwt) {
		return boardService.crear(request, usuario(jwt));
	}

	@PutMapping("/{id}")
	public BoardResponse updateBoard(@PathVariable Long id, @Valid @RequestBody BoardRequest request,
			@AuthenticationPrincipal Jwt jwt) {
		return boardService.actualizar(id, request, usuario(jwt));
	}

	@DeleteMapping("/{id}")
	public void deleteBoard(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
		boardService.borrar(id, usuario(jwt));
	}

	/** El id del usuario que ha iniciado sesión: va en el "sub" del token. */
	private Long usuario(Jwt jwt) {
		return Long.valueOf(jwt.getSubject());
	}
}

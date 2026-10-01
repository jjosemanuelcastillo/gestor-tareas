package com.example.gestor_tareas.exception;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(ResourceNotFoundException.class)
	public ResponseEntity<Map<String, Object>> handleNotFound(ResourceNotFoundException ex) {
		return respuesta(HttpStatus.NOT_FOUND, ex.getMessage());
	}

	@ExceptionHandler(EmailYaRegistradoException.class)
	public ResponseEntity<Map<String, Object>> handleEmailYaRegistrado(EmailYaRegistradoException ex) {
		return respuesta(HttpStatus.CONFLICT, ex.getMessage());
	}

	@ExceptionHandler(CredencialesIncorrectasException.class)
	public ResponseEntity<Map<String, Object>> handleCredencialesIncorrectas(CredencialesIncorrectasException ex) {
		return respuesta(HttpStatus.UNAUTHORIZED, ex.getMessage());
	}

	// Falla un @Valid: devuelve qué campo está mal y por qué, para enseñarlo junto a cada campo
	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<Map<String, Object>> handleValidacion(MethodArgumentNotValidException ex) {
		Map<String, String> errores = new LinkedHashMap<>();
		ex.getBindingResult().getFieldErrors()
				.forEach(error -> errores.putIfAbsent(error.getField(), error.getDefaultMessage()));

		ResponseEntity<Map<String, Object>> respuesta = respuesta(HttpStatus.BAD_REQUEST, "Hay datos no válidos");
		respuesta.getBody().put("errores", errores);
		return respuesta;
	}

	private ResponseEntity<Map<String, Object>> respuesta(HttpStatus status, String message) {
		Map<String, Object> body = new LinkedHashMap<>();
		body.put("timestamp", Instant.now().toString());
		body.put("status", status.value());
		body.put("message", message);
		return ResponseEntity.status(status).body(body);
	}
}

package com.example.gestor_tareas.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import com.example.gestor_tareas.dto.AuthResponse;
import com.example.gestor_tareas.dto.LoginRequest;
import com.example.gestor_tareas.dto.RegisterRequest;
import com.example.gestor_tareas.dto.UserResponse;
import com.example.gestor_tareas.service.AuthService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	@Autowired
	private AuthService authService;

	@PostMapping("/register")
	@ResponseStatus(HttpStatus.CREATED)
	public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
		return authService.registrar(request);
	}

	@PostMapping("/login")
	public AuthResponse login(@Valid @RequestBody LoginRequest request) {
		return authService.login(request);
	}

	// @AuthenticationPrincipal: Spring Security nos da el token ya comprobado
	@GetMapping("/me")
	public UserResponse me(@AuthenticationPrincipal Jwt jwt) {
		return authService.usuarioActual(Long.valueOf(jwt.getSubject()));
	}
}

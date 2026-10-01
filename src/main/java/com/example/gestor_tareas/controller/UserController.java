package com.example.gestor_tareas.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.example.gestor_tareas.dto.PersonaResponse;
import com.example.gestor_tareas.exception.ResourceNotFoundException;
import com.example.gestor_tareas.repository.UserRepository;

/**
 * Lista de personas para asignar tareas. Solo lectura: las cuentas se crean en /api/auth/register.
 * Devuelve solo id y nombre (ni el email de los demás ni la contraseña).
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

	@Autowired
	private UserRepository userRepository;

	@GetMapping
	public List<PersonaResponse> getAllUsers() {
		return userRepository.findAll().stream().map(PersonaResponse::from).toList();
	}

	@GetMapping("/{id}")
	public PersonaResponse getUserById(@PathVariable Long id) {
		return userRepository.findById(id)
				.map(PersonaResponse::from)
				.orElseThrow(() -> new ResourceNotFoundException("User no encontrado con id " + id));
	}
}

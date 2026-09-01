package com.example.gestor_tareas.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.example.gestor_tareas.exception.ResourceNotFoundException;
import com.example.gestor_tareas.model.User;
import com.example.gestor_tareas.repository.UserRepository;

@RestController
@RequestMapping("/api/users")
public class UserController {

	@Autowired
	private UserRepository userRepository;

	@GetMapping
	public List<User> getAllUsers() {
		return userRepository.findAll();
	}

	@GetMapping("/{id}")
	public User getUserById(@PathVariable Long id) {
		return userRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("User no encontrado con id " + id));
	}

	@PostMapping()
	public User createUser(@RequestBody User user) {
		return userRepository.save(user);
	}

	@PutMapping("/{id}")
	public User updateUser(@PathVariable Long id, @RequestBody User userDetails) {
		User user = userRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("User no encontrado con id " + id));

		user.setNombre(userDetails.getNombre());
		user.setEmail(userDetails.getEmail());
		return userRepository.save(user);
	}

	@DeleteMapping("/{id}")
	public void deleteUser(@PathVariable Long id) {
		if (!userRepository.existsById(id)) {
			throw new ResourceNotFoundException("User no encontrado con id " + id);
		}
		userRepository.deleteById(id);
	}
}

package com.example.gestor_tareas.service;

import java.util.Locale;
import java.util.Optional;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.gestor_tareas.dto.AuthResponse;
import com.example.gestor_tareas.dto.LoginRequest;
import com.example.gestor_tareas.dto.RegisterRequest;
import com.example.gestor_tareas.dto.UserResponse;
import com.example.gestor_tareas.exception.CredencialesIncorrectasException;
import com.example.gestor_tareas.exception.EmailYaRegistradoException;
import com.example.gestor_tareas.exception.ResourceNotFoundException;
import com.example.gestor_tareas.model.User;
import com.example.gestor_tareas.repository.UserRepository;

@Service
public class AuthService {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final TokenService tokenService;

	// Hash de una contraseña cualquiera. Se compara contra él cuando el email no existe,
	// para que el login tarde lo mismo exista o no el email y no se pueda adivinar por el tiempo.
	private final String hashFalso;

	public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, TokenService tokenService) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.tokenService = tokenService;
		this.hashFalso = passwordEncoder.encode("contraseña-que-no-es-de-nadie");
	}

	public AuthResponse registrar(RegisterRequest request) {
		String email = normalizar(request.email());
		if (userRepository.existsByEmail(email)) {
			throw new EmailYaRegistradoException();
		}

		User user = new User();
		user.setNombre(request.nombre().trim());
		user.setEmail(email);
		user.setPassword(passwordEncoder.encode(request.password()));

		User guardado;
		try {
			guardado = userRepository.save(user);
		} catch (DataIntegrityViolationException e) {
			// Dos registros con el mismo email a la vez: lo frena el UNIQUE de la base de datos
			throw new EmailYaRegistradoException();
		}
		return new AuthResponse(tokenService.generar(guardado), UserResponse.from(guardado));
	}

	public AuthResponse login(LoginRequest request) {
		Optional<User> user = userRepository.findByEmail(normalizar(request.email()));
		String hash = user.map(User::getPassword).orElse(hashFalso);

		boolean correcta = passwordEncoder.matches(request.password(), hash);
		if (user.isEmpty() || user.get().getPassword() == null || !correcta) {
			throw new CredencialesIncorrectasException();
		}
		return new AuthResponse(tokenService.generar(user.get()), UserResponse.from(user.get()));
	}

	public UserResponse usuarioActual(Long userId) {
		return userRepository.findById(userId)
				.map(UserResponse::from)
				.orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
	}

	/** "Ana@Correo.com " y "ana@correo.com" son el mismo email. */
	private String normalizar(String email) {
		return email.trim().toLowerCase(Locale.ROOT);
	}
}

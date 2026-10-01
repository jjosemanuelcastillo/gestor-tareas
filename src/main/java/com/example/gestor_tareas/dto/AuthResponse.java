package com.example.gestor_tareas.dto;

/** Respuesta de registro e inicio de sesión: el token y quién es el usuario. */
public record AuthResponse(String token, UserResponse usuario) {
}

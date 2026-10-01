package com.example.gestor_tareas.exception;

/**
 * El mismo mensaje tanto si el email no existe como si la contraseña está mal:
 * así nadie puede averiguar qué emails tienen cuenta.
 */
public class CredencialesIncorrectasException extends RuntimeException {

	public CredencialesIncorrectasException() {
		super("Email o contraseña incorrectos");
	}
}

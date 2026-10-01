package com.example.gestor_tareas.exception;

public class EmailYaRegistradoException extends RuntimeException {

	public EmailYaRegistradoException() {
		super("Ya existe una cuenta con ese email");
	}
}

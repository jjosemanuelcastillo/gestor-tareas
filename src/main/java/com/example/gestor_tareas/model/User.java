package com.example.gestor_tareas.model;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String nombre;

	@Column(unique = true)
	private String email;

	// Contraseña cifrada con BCrypt. @JsonIgnore: nunca sale en ninguna respuesta de la API
	@JsonIgnore
	private String password;
}

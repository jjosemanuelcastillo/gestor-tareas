package com.example.gestor_tareas.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.gestor_tareas.model.*;

public interface UserRepository extends JpaRepository<User, Long> {

	Optional<User> findByEmail(String email);

	boolean existsByEmail(String email);
}

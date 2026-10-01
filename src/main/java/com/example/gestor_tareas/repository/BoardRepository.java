package com.example.gestor_tareas.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.gestor_tareas.model.*;

public interface BoardRepository extends JpaRepository<Board, Long> {

	List<Board> findByOwnerId(Long ownerId);

	// El tablero solo si es de ese usuario: si es de otro, devuelve vacío
	Optional<Board> findByIdAndOwnerId(Long id, Long ownerId);
}

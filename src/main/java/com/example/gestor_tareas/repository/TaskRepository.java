package com.example.gestor_tareas.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.gestor_tareas.model.*;

public interface TaskRepository extends JpaRepository<Task, Long> {

	List<Task> findByBoardId(Long boardId);

	void deleteByBoardId(Long boardId);

	// "BoardOwnerId": Spring sigue el camino task.board.owner.id
	List<Task> findByBoardOwnerId(Long ownerId);

	Optional<Task> findByIdAndBoardOwnerId(Long id, Long ownerId);
}

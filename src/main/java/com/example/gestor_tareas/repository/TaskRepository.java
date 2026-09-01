package com.example.gestor_tareas.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.gestor_tareas.model.*;

public interface TaskRepository extends JpaRepository<Task, Long> {

	List<Task> findByBoardId(Long boardId);
}

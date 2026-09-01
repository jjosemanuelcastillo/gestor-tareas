package com.example.gestor_tareas.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.gestor_tareas.model.*;

public interface UserRepository extends JpaRepository<User, Long> {

}

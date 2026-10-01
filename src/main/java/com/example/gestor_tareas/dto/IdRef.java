package com.example.gestor_tareas.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Una referencia a otra cosa por su id: { "id": 3 }. El frontend puede mandar el objeto entero
 * (por ejemplo, el tablero con su nombre), pero aquí solo se usa el id; el resto se ignora.
 */
public record IdRef(@NotNull(message = "Falta el id") Long id) {
}

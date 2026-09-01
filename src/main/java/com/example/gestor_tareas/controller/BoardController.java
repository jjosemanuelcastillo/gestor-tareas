package com.example.gestor_tareas.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.example.gestor_tareas.exception.ResourceNotFoundException;
import com.example.gestor_tareas.model.Board;
import com.example.gestor_tareas.repository.BoardRepository;

@RestController
@RequestMapping("/api/boards")
public class BoardController {

	@Autowired
	private BoardRepository boardRepository;

	@GetMapping
	public List<Board> getAllBoards() {
		return boardRepository.findAll();
	}

	@GetMapping("/{id}")
	public Board getBoardById(@PathVariable Long id) {
		return boardRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Board no encontrado con id " + id));
	}

	@PostMapping()
	public Board createBoard(@RequestBody Board board) {
		return boardRepository.save(board);
	}

	@PutMapping("/{id}")
	public Board updateBoard(@PathVariable Long id, @RequestBody Board boardDetails) {
		Board board = boardRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Board no encontrado con id " + id));

		board.setNombre(boardDetails.getNombre());
		board.setDescripcion(boardDetails.getDescripcion());
		board.setOwner(boardDetails.getOwner());
		return boardRepository.save(board);
	}

	@DeleteMapping("/{id}")
	public void deleteBoard(@PathVariable Long id) {
		if (!boardRepository.existsById(id)) {
			throw new ResourceNotFoundException("Board no encontrado con id " + id);
		}
		boardRepository.deleteById(id);
	}
}

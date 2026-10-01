package com.example.gestor_tareas.service;

import java.time.Duration;
import java.time.Instant;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import com.example.gestor_tareas.model.User;

/** Crea los tokens JWT. Validarlos lo hace Spring Security (ver SecurityConfig). */
@Service
public class TokenService {

	private final JwtEncoder jwtEncoder;
	private final Duration duracion;

	public TokenService(JwtEncoder jwtEncoder, @Value("${app.jwt.expiration}") Duration duracion) {
		this.jwtEncoder = jwtEncoder;
		this.duracion = duracion;
	}

	public String generar(User user) {
		Instant ahora = Instant.now();
		JwtClaimsSet claims = JwtClaimsSet.builder()
				.issuer("gestor-tareas")
				.issuedAt(ahora)
				.expiresAt(ahora.plus(duracion))
				.subject(user.getId().toString()) // "sub": quién es el usuario
				.claim("nombre", user.getNombre())
				.build();
		JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
		return jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
	}
}

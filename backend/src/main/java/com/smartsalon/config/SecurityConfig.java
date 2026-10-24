// ./backend/src/main/java/com/smartsalon/config/SecurityConfig.java
package com.smartsalon.config;

import com.smartsalon.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;
import java.util.Optional;

@Configuration
@EnableMethodSecurity
@EnableJpaAuditing
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/v1/auth/**",
                                "/api/v1/webhooks/payos",
                                "/api/v1/webhooks/payos/simulate/**",
                                "/api/v1/public/**",
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/ws/**",
                                "/uploads/**"
                        ).permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/branches").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/services/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/products/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/stylists/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/customers/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/bookings/available-slots").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/bookings/stylists").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/bookings/code/**", "/api/v1/bookings/BK-*").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/bookings/*/payment-info").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/bookings/lookup").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/bookings").permitAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(allowedOrigins.split(",")));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuditorAware<String> auditorAware() {
        return () -> {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
                return Optional.of("SYSTEM");
            }
            return Optional.ofNullable(authentication.getName());
        };
    }
}
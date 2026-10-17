package com.smartsalon;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SmartSalonApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartSalonApplication.class, args);
    }
}

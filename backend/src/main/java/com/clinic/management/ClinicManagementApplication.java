package com.clinic.management;

import com.clinic.management.service.MinioService;
import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationContext;

import java.io.PrintStream;
import java.util.TimeZone;

@SpringBootApplication
public class ClinicManagementApplication {

    private final MinioService minioService;

    public ClinicManagementApplication(MinioService minioService) {
        this.minioService = minioService;
    }

    @PostConstruct
    public void init() {
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Dhaka"));
        // Ensure the MinIO bucket exists on every startup
        minioService.ensureBucketExists();
    }

    public static void main(String[] args) {
        // Force auto-flush on stdout/stderr so Docker captures all logs without buffering
        System.setOut(new PrintStream(System.out, true));
        System.setErr(new PrintStream(System.err, true));

        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Dhaka"));
        SpringApplication.run(ClinicManagementApplication.class, args);
    }
}

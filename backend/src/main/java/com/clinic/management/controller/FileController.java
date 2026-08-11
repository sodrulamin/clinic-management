package com.clinic.management.controller;

import com.clinic.management.service.MinioService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.InputStream;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
public class FileController {

    private final MinioService minioService;

    /**
     * Upload an image file (any authenticated user).
     * Returns the proxy URL that the browser should use to load the image.
     */
    @PostMapping("/api/v1/upload/image")
    public ResponseEntity<Map<String, String>> uploadImage(
            @RequestParam("file") MultipartFile file) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only image files are allowed"));
        }

        String objectName = minioService.uploadFile(file, "doctors");

        // Build a backend-relative proxy URL so it works on any domain (local or Cloudflare)
        String fileUrl = "/api/v1/files/" + objectName;

        log.info("Image uploaded successfully, proxy URL: {}", fileUrl);
        return ResponseEntity.ok(Map.of("url", fileUrl));
    }

    /**
     * Proxy endpoint: streams files from MinIO to the browser.
     * No authentication required — images must be viewable publicly.
     * Path variable captures the full object path including subdirectory, e.g. "doctors/uuid.jpg"
     */
    @GetMapping("/api/v1/files/{folder}/{filename}")
    public ResponseEntity<byte[]> serveFile(
            @PathVariable String folder,
            @PathVariable String filename) {

        String objectName = folder + "/" + filename;
        try (InputStream stream = minioService.downloadFile(objectName)) {
            byte[] content = stream.readAllBytes();

            // Determine content type from file extension
            MediaType mediaType = detectMediaType(filename);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000, immutable")
                    .contentType(mediaType)
                    .body(content);
        } catch (Exception e) {
            log.error("Failed to serve file {}: {}", objectName, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    private MediaType detectMediaType(String filename) {
        String lower = filename.toLowerCase();
        if (lower.endsWith(".png"))  return MediaType.IMAGE_PNG;
        if (lower.endsWith(".gif"))  return MediaType.IMAGE_GIF;
        if (lower.endsWith(".webp")) return MediaType.parseMediaType("image/webp");
        return MediaType.IMAGE_JPEG; // default for .jpg, .jpeg, and unknowns
    }
}

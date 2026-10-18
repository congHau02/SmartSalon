package com.smartsalon.pos.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartsalon.exception.AppException;
import com.smartsalon.exception.ErrorCode;
import com.smartsalon.pos.dto.MediaUploadResponse;
import com.smartsalon.pos.service.MediaStorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
public class HybridMediaStorageServiceImpl implements MediaStorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
    );

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    private final String cloudName;
    private final String apiKey;
    private final String apiSecret;
    private final String localUploadDir;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    @Autowired
    public HybridMediaStorageServiceImpl(
            @Value("${app.cloudinary.cloud-name:}") String cloudName,
            @Value("${app.cloudinary.api-key:}") String apiKey,
            @Value("${app.cloudinary.api-secret:}") String apiSecret,
            @Value("${app.upload.local-dir:uploads/visual-logs}") String localUploadDir) {
        this(cloudName, apiKey, apiSecret, localUploadDir, new ObjectMapper().findAndRegisterModules(), new RestTemplate());
    }

    public HybridMediaStorageServiceImpl(
            String cloudName,
            String apiKey,
            String apiSecret,
            String localUploadDir,
            ObjectMapper objectMapper,
            RestTemplate restTemplate) {
        this.cloudName = cloudName;
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.localUploadDir = localUploadDir;
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper().findAndRegisterModules();
        this.restTemplate = restTemplate != null ? restTemplate : new RestTemplate();
    }

    @Override
    public MediaUploadResponse uploadVisualLogImage(MultipartFile file) {
        validateFile(file);

        if (isCloudinaryConfigured()) {
            try {
                return uploadToCloudinary(file);
            } catch (Exception e) {
                log.error("Cloudinary upload failed: {}", e.getMessage(), e);
                throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION, "Lỗi tải ảnh lên Cloudinary: " + e.getMessage());
            }
        }

        return uploadToLocalStorage(file);
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.EMPTY_FILE);
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new AppException(ErrorCode.INVALID_MEDIA_TYPE);
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new AppException(ErrorCode.VALIDATION_ERROR);
        }
    }

    private boolean isCloudinaryConfigured() {
        return StringUtils.hasText(cloudName) &&
               StringUtils.hasText(apiKey) &&
               StringUtils.hasText(apiSecret);
    }

    private MediaUploadResponse uploadToCloudinary(MultipartFile file) throws IOException {
        long timestamp = System.currentTimeMillis() / 1000L;
        String folder = "smartsalon/visual-logs";

        // Signature: SHA-1 of folder=...&timestamp=... + apiSecret
        String stringToSign = "folder=" + folder + "&timestamp=" + timestamp + apiSecret;
        String signature = sha1Hex(stringToSign);

        String uploadUrl = String.format("https://api.cloudinary.com/v1_1/%s/image/upload", cloudName);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("api_key", apiKey);
        body.add("timestamp", String.valueOf(timestamp));
        body.add("folder", folder);
        body.add("signature", signature);

        ByteArrayResource fileAsResource = new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload.jpg";
            }
        };
        body.add("file", fileAsResource);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(uploadUrl, requestEntity, String.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            JsonNode root = objectMapper.readTree(response.getBody());
            String secureUrl = root.path("secure_url").asText();
            if (StringUtils.hasText(secureUrl)) {
                return MediaUploadResponse.builder()
                        .url(secureUrl)
                        .fileName(root.path("public_id").asText())
                        .originalName(file.getOriginalFilename())
                        .size(file.getSize())
                        .contentType(file.getContentType())
                        .build();
            }
        }

        throw new IOException("Cloudinary did not return a valid secure_url");
    }

    private MediaUploadResponse uploadToLocalStorage(MultipartFile file) {
        try {
            Path targetDir = Paths.get(localUploadDir).toAbsolutePath().normalize();
            if (!Files.exists(targetDir)) {
                Files.createDirectories(targetDir);
            }

            String originalName = file.getOriginalFilename();
            String cleanOriginalName = originalName != null ? StringUtils.cleanPath(originalName) : "image.jpg";
            String extension = "";
            int dotIdx = cleanOriginalName.lastIndexOf('.');
            if (dotIdx >= 0) {
                extension = cleanOriginalName.substring(dotIdx);
            }

            String fileName = UUID.randomUUID() + extension;
            Path destination = targetDir.resolve(fileName);
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

            String url = "/uploads/visual-logs/" + fileName;

            return MediaUploadResponse.builder()
                    .url(url)
                    .fileName(fileName)
                    .originalName(cleanOriginalName)
                    .size(file.getSize())
                    .contentType(file.getContentType())
                    .build();
        } catch (IOException e) {
            log.error("Failed to store image in local storage: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    private String sha1Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            throw new RuntimeException("SHA-1 algorithm not available", e);
        }
    }
}

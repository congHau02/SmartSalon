package com.smartsalon.pos.service;

import com.smartsalon.pos.dto.MediaUploadResponse;
import org.springframework.web.multipart.MultipartFile;

public interface MediaStorageService {

    MediaUploadResponse uploadVisualLogImage(MultipartFile file);
}

package com.smartsalon.notification.service;

import com.smartsalon.notification.dto.NotificationMessage;

public interface NotificationSender {
    void send(NotificationMessage message);
}

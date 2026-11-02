package com.smartsalon.notification;

import com.smartsalon.notification.dto.NotificationMessage;
import com.smartsalon.notification.service.NotificationSender;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

public class RecordingNotificationSender implements NotificationSender {

    private final List<NotificationMessage> sentMessages = new CopyOnWriteArrayList<>();
    private volatile boolean throwException = false;

    @Override
    public void send(NotificationMessage message) {
        if (throwException) {
            throw new RuntimeException("Simulated SMTP delivery failure");
        }
        sentMessages.add(message);
    }

    public List<NotificationMessage> getSentMessages() {
        return sentMessages;
    }

    public void clear() {
        sentMessages.clear();
        throwException = false;
    }

    public void setThrowException(boolean throwException) {
        this.throwException = throwException;
    }
}

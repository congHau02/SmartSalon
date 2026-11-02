ALTER TABLE bookings
    ADD COLUMN reminder_sent_at DATETIME NULL AFTER customer_email;

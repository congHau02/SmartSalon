-- V10: Add customer_email to bookings for email notification delivery
ALTER TABLE bookings ADD COLUMN customer_email VARCHAR(255) NULL;

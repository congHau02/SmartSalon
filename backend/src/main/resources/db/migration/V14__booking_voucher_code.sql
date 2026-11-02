-- V14: Add voucher_code to bookings
ALTER TABLE bookings ADD COLUMN voucher_code VARCHAR(50) NULL;

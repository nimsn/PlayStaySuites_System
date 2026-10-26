INSERT INTO roles (role_id, role_name, description) VALUES 
(115, 'Admin', 'System Administrator'),
(116, 'Staff', 'Front Desk / Operations Staff'),
(117, 'Student', 'Regular Student User');

INSERT INTO users (role_id, student_id_number, first_name, last_name, email, password_hash, phone_number) VALUES
(117, "206-217", "Jhanyle ", "Sablada ", "jhanyle@email.com", "jhanyle123", "09171234001"),
(117, "206-218", "Ruel ", "Velasco ", "ruel@email.com", "ruel123", "09171234002"),
(115, "205-211", "Niño ", "Suson ", "nino@email.com", "nino123", "09171234003"),
(116, "206-220", "Brenalyn ", "Tuangco ", "brenalyn@email.com", "brenalyn123", "09171234004"),
(116, "207-201", "Irene ", "Sarinse ", "irene@email.com", "irene123", "09171234005");

INSERT INTO staff (user_id, position, shift_schedule) VALUES
(9, "Front Desk ", "Morning Shift"),
(10, "Server ", "Graveyard Shift");

INSERT INTO room_types (type_name, base_rate, max_capacity, description) VALUES 
('Study Pod', 50.00, 5, 'Quiet individual or group study space'),
('KTV Room', 148.00, 10, 'Soundproof entertainment & singing room'),
('Rest Capsule', 75.00, 1, 'Napping pod for resting between classes'),
('Standard Room',250.00, 2, 'Twin Bed with AC, Wi-Fi'),
('Deluxe Room', 550.00, 5, 'Standard Bed with AC, Wi-Fi, TV, Private CR'),
('VIP Room', 850.00, 10, 'Queen-sized Bed with AC, Wi-Fi, TV, Private CR, Shower');

INSERT INTO rooms (room_type_id, room_number, current_status, floor_level) VALUES 
(1, 'Dreamable', 'Available', 2),
(2, 'Vibable', 'Available', 2),
(3, 'Sleepable', 'Available', 1),
(4, 'Stayable', 'Available', 1),
(5, 'Escapable', 'Available', 1),
(6, 'Cozyable', 'Available', 1);

INSERT INTO amenities (amenity_id, amenity_name, price, description) VALUES
(204, 'Arcade', 300.00, 'Arcade game access'),
(205, 'Pool Access', 150.00, 'Access to the swimming pool'),
(206, 'Additional Towels', 30.00, 'Extra clean towels'),
(207, 'Additional Pillows', 25.00, 'Extra pillows'),
(208, 'Additional Blankets', 40.00, 'Extra blankets'),
(209, 'Additional Chairs', 20.00, 'Extra chairs for group use'),
(210, 'Toiletries', 50.00, 'Personal hygiene supplies');

INSERT INTO room_amenities (room_id, amenity_id) VALUES
(2, 204),
(6, 204),
(5, 205),
(4, 206),
(4, 207),
(1, 208),
(1, 209),
(5, 210);

INSERT INTO services (service_name, unit_price, category) VALUES 
('Colored Printing (per page)', 5.00, 'Academic'),
('Snack Bundle (Chips + Drink)', 75.00, 'Refreshments'),
('Extra Microphone Rental', 50.00, 'Equipment');

INSERT INTO promos (promo_code, discount_percentage, validity) VALUES
('WKDYS', 33.00, '33% discount on KTV bookings during weekdays, excluding Friday, from 1 PM to 9 PM'),
('PLSR', 100.00, 'Free pool access with a minimum spend of PHP 1,500'),
('ARCD', 50.00, '50% discount on arcade access with a minimum spend of PHP 1,500');

INSERT INTO bookings (booking_id, user_id, room_id, staff_id, check_in_time, check_out_time, total_amount, booking_status) VALUES
(501, 6, 1, 3, '2026-10-20 08:00:00', '2026-10-20 10:00:00', 100.00, 'Completed'),
(502, 7, 2, 3, '2026-10-26 08:00:00', '2026-10-26 10:00:00', 296.00, 'Active'),
(503, 6, 3, 4, '2026-10-27 12:00:00', '2026-10-27 13:00:00', 75.00, 'Reserved'),
(504, 8, 6, 3, '2026-10-22 18:00:00', '2026-10-22 21:00:00', 2550.00, 'Completed'),
(505, 7, 4, 4, '2026-10-28 09:00:00', '2026-10-28 11:00:00', 500.00, 'Reserved'),
(506, 6, 5, 3, '2026-10-24 14:00:00', '2026-10-24 16:00:00', 1100.00, 'Cancelled');

INSERT INTO booking_services (booking_id, service_id, quantity, subtotal) VALUES 
(501, 1, 10, 50.00),
(502, 2, 2, 150.00),
(502, 3, 1, 50.00),
(504, 2, 3, 225.00),
(505, 1, 20, 100.00);

INSERT INTO invoices (booking_id, issued_at, total_due, invoice_status) VALUES
(501, '2026-10-20 10:00:00', 150.00, 'Paid'),
(502, '2026-10-26 08:00:00', 496.00, 'Unpaid'),
(503, '2026-10-27 12:00:00', 75.00, 'Unpaid'),
(504, '2026-10-22 21:00:00', 2775.00, 'Paid'),
(505, '2026-10-28 09:00:00', 600.00, 'Unpaid');

INSERT INTO payments (payment_id, invoice_id, payment_method, amount_paid, paid_at) VALUES
(2294, 1, 'GCash', 150.00, '2026-10-20 10:05:00'),
(2152, 4, 'Cash', 2000.00, '2026-10-22 20:30:00'),
(2878, 4, 'GCash', 775.00, '2026-10-22 20:45:00');

INSERT INTO room_status_logs (room_id, staff_id, previous_status, new_status, changed_at, remarks) VALUES 
(1, 3, 'Occupied', 'Available', '2026-10-20 10:00:00', 'Booking completed; room cleaned'),
(2, 3, 'Available', 'Occupied', '2026-10-26 08:00:00', 'Customer checked in'),
(5, 4, 'Occupied', 'Cleaning', '2026-10-24 16:00:00', 'Room requires cleaning after use'),
(6, 3, 'Available', 'Occupied', '2026-10-22 18:00:00', 'Customer checked in for VIP room'),
(6, 3, 'Occupied', 'Available', '2026-10-22 21:00:00', 'Customer checked out; room prepared');
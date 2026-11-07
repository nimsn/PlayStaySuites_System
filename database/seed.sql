INSERT INTO roles (role_id, role_name, description) VALUES 
(115, 'Admin', 'System Administrator'),
(116, 'Staff', 'Front Desk / Operations Staff'),
(117, 'Student', 'Regular Student User');

INSERT INTO users (user_id, role_id, id_number, first_name, last_name, email, password_hash, phone_number) VALUES
(117223, 117, "206-217", "Jhanyle ", "Sablada ", "jhanyle@email.com", "jhanyle123", "09171234001"),
(117254, 117, "206-218", "Ruel ", "Velasco ", "ruel@email.com", "ruel123", "09171234002"),
(115870, 115, "205-211", "Niño ", "Suson ", "nino@email.com", "nino123", "09171234003"),
(116826, 116, "207-220", "Brenalyn ", "Tuangco ", "brenalyn@email.com", "brenalyn123", "09171234004"),
(116089, 116, "207-201", "Irene ", "Sarinse ", "irene@email.com", "irene123", "09171234005"),
(116885, 116, "207-210", "Celine", "Carey", "celine@email.com", "celine123", "09171234006");

INSERT INTO staff (staff_id, user_id, position, shift_schedule) VALUES
(045, 116826, "Front Desk ", "Morning Shift"),
(048, 116089, "Front Desk ", "Afternoon Shift"),
(042, 116885, "Front Desk ", "Graveyard Shift");

INSERT INTO room_types (room_type_id, type_name, base_rate_per_hour, max_capacity, description) VALUES 
(4420, 'Study Pod', 50.00, 5, 'Quiet individual or group study space'),
(4450, 'KTV Room', 148.00, 10, 'Soundproof entertainment & singing room'),
(4479, 'Rest Capsule', 75.00, 1, 'Napping pod for resting between classes'),
(4409, 'Standard Room',250.00, 2, 'Twin Bed with AC, Wi-Fi'),
(4477, 'Deluxe Room', 550.00, 5, 'Standard Bed with AC, Wi-Fi, TV, Private CR'),
(4423, 'VIP Room', 850.00, 10, 'Queen-sized Bed with AC, Wi-Fi, TV, Private CR, Shower');

INSERT INTO rooms (room_id, room_type_id, room_number, current_status, floor_level) VALUES 
(1, 4420, 'Dreamable', 'Available', 2),
(2, 4450, 'Vibable', 'Available', 2),
(3, 4479, 'Sleepable', 'Available', 1),
(4, 4409, 'Stayable', 'Available', 1),
(5, 4477, 'Escapable', 'Available', 1),
(6, 4423, 'Cozyable', 'Available', 1);

INSERT INTO amenities (amenity_id, amenity_name, price, description) VALUES
(204, 'Arcade', 300.00, 'Arcade game access'),
(205, 'Pool Access', 150.00, 'Access to the swimming pool'),
(206, 'Additional Towels', 30.00, 'Extra clean towels'),
(207, 'Additional Pillows', 25.00, 'Extra pillows'),
(208, 'Additional Blankets', 40.00, 'Extra blankets'),
(209, 'Additional Chairs', 20.00, 'Extra chairs for group use'),
(210, 'Toiletries', 50.00, 'Personal hygiene supplies');

INSERT INTO room_amenities (room_amenity_id, room_id, amenity_id) VALUES
(107, 5, 208),
(108, 4, 206);

INSERT INTO services (service_id, service_name, unit_price, category) VALUES 
(23, 'Colored Printing (per page)', 5.00, 'Academic'),
(24, 'Snack Bundle (Chips + Drink)', 75.00, 'Refreshments'),
(25, 'Extra Microphone Rental', 50.00, 'Equipment');

INSERT INTO promos (promo_id, promo_code, discount_percentage, description, valid_from, valid_until) VALUES
(1, 'WKDYS', 33.00, '33% discount on KTV bookings during weekdays, excluding Friday, from 1 PM to 9 PM',NULL ,NULL),
(2, 'PLSR', 100.00, 'Free pool access with a minimum spend of PHP 1,500',NULL ,NULL),
(3, 'ARCD', 50.00, '50% discount on arcade access with a minimum spend of PHP 1,500', NULL, NULL);

INSERT INTO bookings (booking_id, user_id, room_id, staff_id, check_in_time, check_out_time, total_amount, promo_id, discount_amount, booking_status) VALUES
(501, 117223, 3, 045, '2026-10-20 08:00:00', '2026-10-20 10:00:00', 100.00, NULL, NULL, 'Completed'),
(502, 117254, 1, 045, '2026-10-26 08:00:00', '2026-10-26 10:00:00', 296.00, NULL, NULL, 'Active'),
(503, 117223, 2, 048, '2026-10-27 12:00:00', '2026-10-27 13:00:00', 75.00, NULL, NULL, 'Reserved'),
(504, 117254, 6, 048, '2026-10-22 18:00:00', '2026-10-22 21:00:00', 2550.00, NULL, NULL, 'Completed'),
(505, 117254, 4, 045, '2026-10-28 09:00:00', '2026-10-28 11:00:00', 500.00, NULL, NULL, 'Reserved'),
(506, 117223, 5, 048, '2026-10-24 14:00:00', '2026-10-24 16:00:00', 1100.00, NULL, NULL, 'Cancelled');

INSERT INTO booking_services (booking_service_id, booking_id, service_id, quantity, subtotal) VALUES 
(8890, 501, 24, 5, 375.00),
(8891, 504, 25, 3, 150.00);

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
(1, 045, 'Occupied', 'Available', '2026-10-20 10:00:00', 'Booking completed; room cleaned'),
(2, 045, 'Available', 'Occupied', '2026-10-26 08:00:00', 'Customer checked in'),
(5, 048, 'Occupied', 'Cleaning', '2026-10-24 16:00:00', 'Room requires cleaning after use'),
(6, 048, 'Available', 'Occupied', '2026-10-22 18:00:00', 'Customer checked in for VIP room'),
(6, 042, 'Occupied', 'Available', '2026-10-22 21:00:00', 'Customer checked out; room prepared');

SELECT
   b.booking_id,
   CONCAT(u.first_name, ' ', u.last_name) AS student_name,
   rt.type_name AS room_type,
   r.room_number,
   s.position AS assigned_staff,
   b.check_in_time,
   b.check_out_time,
   b.total_amount,
   b.booking_status
   FROM bookings b
   JOIN users u ON b.user_id = u.user_id
   JOIN rooms r ON b.room_id = r.room_id
   JOIN room_types rt ON r.room_type_id = rt.room_type_id
   LEFT JOIN staff s ON b.staff_id = s.staff_id
   ORDER BY b.booking_id;
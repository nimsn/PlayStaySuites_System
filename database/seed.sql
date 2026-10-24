INSERT INTO roles (role_name, description) VALUES 
('Admin', 'System Administrator'),
('Staff', 'Front Desk / Operations Staff'),
('Student', 'Regular Student User');

INSERT INTO room_types (type_name, base_rate_per_hour, max_capacity, description) VALUES 
('Study Pod', 50.00, 4, 'Quiet individual or group study space'),
('KTV Room', 200.00, 10, 'Soundproof entertainment & singing room'),
('Rest Capsule', 80.00, 1, 'Napping pod for resting between classes');

INSERT INTO rooms (room_type_id, room_number, current_status, floor_level) VALUES 
(1, 'SP-101', 'Available', 2),
(2, 'KTV-201', 'Available', 3),
(3, 'RC-301', 'Available', 4);

INSERT INTO services (service_name, unit_price, category) VALUES 
('Colored Printing (per page)', 5.00, 'Academic'),
('Snack Bundle (Chips + Drink)', 75.00, 'Refreshments'),
('Extra Microphone Rental', 50.00, 'Equipment');
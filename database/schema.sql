CREATE DATABASE IF NOT EXISTS final_system;
USE final_system;

CREATE TABLE roles (
    role_id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE users (
    user_id INT  PRIMARY KEY AUTO_INCREMENT,
    role_id INT NOT NULL,
    student_id_number VARCHAR(255) UNIQUE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE
);

CREATE TABLE staff (
    staff_id INT  PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    position VARCHAR(255) NOT NULL,
    shift_schedule VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE room_types (
    room_type_id INT  PRIMARY KEY AUTO_INCREMENT,
    type_name VARCHAR(255) NOT NULL,
    base_rate_per_hour DECIMAL(10,2) NOT NULL,
    max_capacity INT NOT NULL,
    description TEXT
);

CREATE TABLE rooms (
    room_id INT  PRIMARY KEY AUTO_INCREMENT,
    room_type_id INT NOT NULL,
    room_number VARCHAR(20) NOT NULL UNIQUE,
    current_status ENUM('Available', 'Occupied', 'Maintenance', 'Cleaning') DEFAULT 'Available',
    floor_level INT NOT NULL,
    FOREIGN KEY (room_type_id) REFERENCES room_types(room_type_id) ON DELETE CASCADE
);

CREATE TABLE amenities (
    amenity_id INT  PRIMARY KEY AUTO_INCREMENT,
    amenity_name VARCHAR(255) NOT NULL,
    description TEXT
);

CREATE TABLE room_amenities (
    room_amenity_id INT  PRIMARY KEY AUTO_INCREMENT,
    room_id INT NOT NULL,
    amenity_id INT NOT NULL,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE,
    FOREIGN KEY (amenity_id) REFERENCES amenities(amenity_id) ON DELETE CASCADE
);

CREATE TABLE services (
    service_id INT  PRIMARY KEY AUTO_INCREMENT,
    service_name VARCHAR(255) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    category VARCHAR(255)
);

CREATE TABLE promos (
    promo_id INT  PRIMARY KEY AUTO_INCREMENT,
    promo_code VARCHAR(50) NOT NULL UNIQUE,
    discount_percentage DECIMAL(5,2) NOT NULL,
    valid_from DATETIME,
    valid_until DATETIME
);

CREATE TABLE bookings (
    booking_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    room_id INT NOT NULL,
    staff_id INT,
    check_in_time DATETIME NOT NULL,
    check_out_time DATETIME,
    total_amount DECIMAL(10,2) NOT NULL,
    booking_status ENUM('Reserved', 'Active', 'Completed', 'Cancelled') DEFAULT 'Reserved',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES staff(staff_id) ON DELETE SET NULL
);

CREATE TABLE booking_services (
    booking_service_id INT  PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    service_id INT NOT NULL,
    quantity INT DEFAULT 1,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE
);

CREATE TABLE invoices (
    invoice_id INT  PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_due DECIMAL(10,2) NOT NULL,
    invoice_status ENUM('Unpaid', 'Paid', 'Refunded') DEFAULT 'Unpaid',
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
);

CREATE TABLE payments (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_id INT NOT NULL,
    payment_method ENUM('Cash', 'GCash', 'Credit Card') NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE CASCADE
);

CREATE TABLE room_status_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    room_id INT NOT NULL,
    staff_id INT,
    previous_status VARCHAR(255),
    new_status VARCHAR(255),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    remarks TEXT,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES staff(staff_id) ON DELETE SET NULL
);

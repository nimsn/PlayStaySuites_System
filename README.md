# Database Management Systems 1 & Systems Integration and Architecture

### **OVERVIEW**
* **Course:** Database Management Systems 1 & Systems Integration and Architecture
* **Assessment Type:** Final Project
* **System Title:** PlayStaySuites System
* **Functionality:** Multi-purpose space check-in and room rental management (StudyPods, KTV Rooms, Rest Capsules, and Standard Rooms) with add-on services and itemized billing.
* **Unique Feature:** Automated Room Booking & Conflict Engine with Status Workflows (see [Unique Feature](#unique-feature))

---

### **OWNERSHIP MATRIX**

| Member | GitHub Username | Tables | Endpoints/Screens | Join Report & Join Type | Feature Role |
|-----|-----|-----|-----|-----|-----|
|**Sablada, Jhanyle**|*@jhanyle567*|`roles` `users` `staff`|`users.html`|**LEFT JOIN**|**User & Staff Access**|
|**Velasco, Ruel**|*@rueljr123*|`room_types` `rooms` `amenities`|`rooms.html` `amenities.html`|**INNER JOIN**|**Master Data & Rooms**|
|**Suson, Niño**|*@nimsn*|`room_amenities` `services` `bookings`|`bookings.html` `services.html`|**INNER JOIN**|**Transaction & Rules**|
|**Tuangco, Brenalyn**|*@brenalyn092*|`promos` `booking_services` `room_status_logs`|`checkin_logs.html` `promos.html`|**RIGHT JOIN**|**Workflow & Audit**|
|**Sarinse, Irene**|*@Irene5143*|`invoices` `payments`|`invoices.html`|**FULL OUTER JOIN**|**Billing, Payments, & Reports**|

The database has **14 tables**, and every one is used by the code: 3 + 3 + 3 + 3 + 2 as listed above.

**Complete resource per member** (GET, POST, PUT and DELETE, or an audited soft-delete):

| Member | Resource | GET | POST | PUT / PATCH | DELETE |
|-----|-----|-----|-----|-----|-----|
| Sablada | `users` | `/api/users` | `/api/users` | `PUT /api/users/:id` | `/api/users/:id` (refused if the user has bookings) |
| Velasco | `rooms` | `/api/rooms` | `/api/rooms` | `PUT /api/rooms/:id`, `PATCH /api/rooms/:id/status` | `/api/rooms/:id` (refused if the room has bookings) |
| Suson | `services` | `/api/services`, `/api/services/:id` | `/api/services` | `PUT /api/services/:id` | `/api/services/:id` (refused if already billed) |
| Suson | `bookings` | `/api/bookings` | `/api/bookings` | `PATCH /api/bookings/:id/status` | `DELETE /api/bookings/:id` = **audited soft-delete (cancel)** |
| Tuangco | `promos` | `/api/promos` | `/api/promos` | `PUT /api/promos/:id` | `/api/promos/:id` |
| Sarinse | `invoices` | `/api/invoices`, `/api/invoices/:id` | `/api/invoices` | `PUT /api/invoices/:id` (recalculate) | `DELETE /api/invoices/:id` = **audited soft-delete (void)** |

**Audited soft-deletes**
* **Cancel a booking** (`DELETE /api/bookings/:id`, or `PATCH .../status` with `Cancelled`): the booking row is kept with status `Cancelled`. The cancellation is written to `room_status_logs` (who, when, why, from the logged-in user's token), and any unpaid invoice of that booking is voided. It is refused if the invoice already has payments.
* **Void an invoice** (`DELETE /api/invoices/:id`): the row is kept with status `Void` and stores `voided_by`, `voided_at` and `void_reason`. It is refused if the invoice already has payments (refund instead).

---

### **UNIQUE FEATURE**

**Automated Room Booking & Conflict Engine with Status Workflows**

| Owner | What they own |
|-----|-----|
| **Suson, Niño** (Transaction & Rules) | The booking engine: overlap/conflict detection, hourly pricing, promo rules, the booking status workflow, and the cancel rules. Files: `BookingModel.js`, `bookingController.js`, `bookingRoutes.js`, `bookings.html`. |
| **Tuangco, Brenalyn** (Workflow & Audit) | The automation and audit side: room status changes, the `room_status_logs` audit trail written by every transition, and the promo records the rules read. Files: `LogModel.js`, `logController.js`, `logRoutes.js`, `PromoModel.js`, `checkin_logs.html`, `promos.html`. |

**Why it counts as a major feature**
* **It spans many tables in one atomic transaction.** Creating or changing a booking reads and writes `rooms`, `room_types`, `users`, `promos`, `bookings`, `room_status_logs` and `invoices`. If any step fails, everything is rolled back.
* **It prevents double booking.** The room row is locked (`SELECT ... FOR UPDATE`) and the engine rejects any new booking whose time overlaps a Reserved or Active booking for the same room, so two requests at the same moment cannot both succeed.
* **It is a rules engine, not just CRUD.** The price is calculated on the server (hours rounded up x room-type rate). Promo codes are checked for validity dates and for their own rules (for example `WKDYS` only applies to KTV rooms, Monday to Thursday, 1 PM to 9 PM).
* **It enforces a status workflow.** `Reserved -> Active -> Completed`, and `Reserved -> Cancelled`. Any other move is refused with `409`.
* **It automates the room and keeps an audit trail.** Check-in sets the room to `Occupied`, check-out sets it to `Cleaning`, and cancellation is logged. Each change writes a `room_status_logs` row in the same transaction.
* **It reaches into billing.** Cancelling a booking voids its unpaid invoice, and is blocked once money has been paid.

---

### **SETUP**

1. `npm install`
2. Copy `.env.example` to `.env` and fill in `DB_PASSWORD` and `JWT_SECRET`.
3. Import `database/schema.sql`, then `database/seed.sql` into MySQL.
   *Already have the database from an older schema?* Run `database/migration_complete_resources.sql` once instead (adds invoice void columns, drops the unused `booking_amenities` table).
4. Hash the seed passwords once: `node backend/scripts/migrateLegacyPasswords.js`
5. Start the server: `node backend/server.js`, then open http://localhost:9000

Seed logins (after step 4): `nino@email.com` / `nino123` (Admin), `irene@email.com` / `irene123` (Staff), `ruel@email.com` / `ruel123` (Student).
On startup the server checks the database and prints a warning if a migration is missing.

---

### **API ENDPOINTS**

All endpoints are under `/api` and return JSON. Except for login and register, every request needs the header `Authorization: Bearer <token>`.
Errors use `{ "message": "..." }` with `400` (invalid input), `401` (not logged in), `403` (wrong role), `404` (not found) or `409` (rule conflict).

**Users & Staff** (Sablada)

| Method | Path | Who | Purpose |
|-----|-----|-----|-----|
| POST | `/users/login` | public | Log in, returns a JWT |
| POST | `/users/register` | public | Register a Student account |
| GET | `/users` | Admin | All users with role and staff details (**LEFT JOIN**) |
| GET | `/users/roles` | Admin | Roles for the dropdown |
| GET | `/users/customers` | Admin, Staff | Student id and name only |
| GET | `/users/reports/inactive` | Admin | **LEFT JOIN report:** users with no bookings |
| POST | `/users` | Admin | Create a user (and a staff record if a position is given) |
| PUT | `/users/:id` | Admin | Update a user |
| DELETE | `/users/:id` | Admin | Delete a user (refused if they have bookings) |

**Rooms & Amenities** (Velasco)

| Method | Path | Who | Purpose |
|-----|-----|-----|-----|
| GET | `/rooms` | any logged-in user | Rooms with type, rate, capacity, amenities |
| GET | `/rooms/types` | any logged-in user | Room types |
| GET | `/rooms/reports/details` | Admin, Staff | **INNER JOIN report:** rooms with their type |
| POST | `/rooms` | Admin, Staff | Add a room |
| PUT | `/rooms/:id` | Admin, Staff | Update a room and its amenities |
| PATCH | `/rooms/:id/status` | Admin, Staff | Change status (logged) |
| DELETE | `/rooms/:id` | Admin, Staff | Delete a room (refused if it has bookings) |
| GET, POST | `/amenities` | Admin, Staff | List / create amenities |
| PUT, DELETE | `/amenities/:id` | Admin, Staff | Update / delete an amenity |

**Bookings & Services** (Suson)

| Method | Path | Who | Purpose |
|-----|-----|-----|-----|
| GET | `/bookings` | any logged-in user | All bookings (a Student only sees their own) |
| POST | `/bookings` | any logged-in user | Create a booking (conflict check, price, promo) |
| PATCH | `/bookings/:id/status` | Admin, Staff | Check in, check out, or cancel (audited) |
| DELETE | `/bookings/:id` | Admin, Staff | **Cancel (audited soft-delete).** Optional body `{ "reason": "..." }` |
| GET | `/bookings/reports/active` | Admin, Staff | **INNER JOIN report:** guests checked in now |
| GET | `/bookings/:id/services` | Admin, Staff | Services on a booking (`booking_services` + `services`) |
| POST | `/bookings/:id/services` | Admin, Staff | Add a service `{ service_id, quantity }` (price calculated on the server) |
| DELETE | `/bookings/:id/services/:lineId` | Admin, Staff | Remove one service line |
| GET | `/services`, `/services/:id` | Admin, Staff | Service catalog |
| POST | `/services` | Admin, Staff | Create a service |
| PUT | `/services/:id` | Admin, Staff | Update a service |
| DELETE | `/services/:id` | Admin, Staff | Delete a service (refused if already billed) |

**Promotions & Audit** (Tuangco)

| Method | Path | Who | Purpose |
|-----|-----|-----|-----|
| GET | `/promos` | Admin, Staff | All promotions |
| GET | `/promos/active` | Admin, Staff | Promotions valid right now |
| POST | `/promos` | Admin, Staff | Create a promotion |
| PUT | `/promos/:id` | Admin, Staff | Update a promotion |
| DELETE | `/promos/:id` | Admin, Staff | Delete a promotion (refused if used by a booking) |
| POST | `/logs` | Admin, Staff | Change a room status and record it |
| GET | `/logs`, `/logs/audit-report` | Admin, Staff | **RIGHT JOIN report:** every room with its status history |

**Billing** (Sarinse)

| Method | Path | Who | Purpose |
|-----|-----|-----|-----|
| GET | `/invoices` | Admin, Staff | Invoices with customer, room and amount paid |
| GET | `/invoices/eligible-bookings` | Admin, Staff | Bookings that can still be invoiced |
| GET | `/invoices/:id` | Admin, Staff | One invoice with its payments and services |
| POST | `/invoices` | Admin, Staff | Generate an invoice `{ booking_id }` (total calculated on the server) |
| PUT | `/invoices/:id` | Admin, Staff | Recalculate an unpaid invoice from its booking and services |
| DELETE | `/invoices/:id` | Admin, Staff | **Void (audited soft-delete).** Optional body `{ "reason": "..." }` |
| POST | `/payments` | Admin, Staff | Record a payment `{ invoice_id, amount_paid, payment_method }` |
| GET | `/reports/reconciliation` | Admin, Staff | **FULL OUTER JOIN report:** invoices and payments together |

---

### **JOIN REPORTS (demo)**

Open **Reports** in the navigation bar (`reports.html`). It has one tab per report, and shows the join type, the tables joined, and a spinner while the query runs. Rows with no match (the point of LEFT, RIGHT and FULL joins) are highlighted. The *Inactive users* report is Admin-only.

| Report tab | Endpoint | Join | Owner |
|-----|-----|-----|-----|
| Inactive users | `GET /api/users/reports/inactive` | LEFT JOIN | Sablada |
| Room details | `GET /api/rooms/reports/details` | INNER JOIN | Velasco |
| Active bookings | `GET /api/bookings/reports/active` | INNER JOIN | Suson |
| Room audit trail | `GET /api/logs/audit-report` | RIGHT JOIN | Tuangco |
| Invoice reconciliation | `GET /api/reports/reconciliation` | FULL OUTER JOIN | Sarinse |

---

### **PROJECT STRUCTURE**

```text
PlayStaySuites_System/
├──── .env                                      # Environment configuration keys
├──── .gitignore                                # node_modules, .env
├──── README.md                                 # Roster, Ownership Matrix, API list & Setup instructions
├──── database/
|       ├──── schema.sql                        # Table creation commands (14 tables)
|       ├──── seed.sql                          # Sample data
|       └──── migration_complete_resources.sql  # One-time upgrade for an existing database
├──── backend/                                  # Node.js MVC REST API
|       ├──── server.js                         # App entry point
|       ├──── config/db.js                      # Database connection setup
|       ├──── middleware/authMiddleware.js      # JWT login + role checks
|       ├──── controllers/                      # Request handling
|       |       ├──── userController.js         # Member 1
|       |       ├──── roomController.js         # Member 2
|       |       ├──── amenityController.js      # Member 2
|       |       ├──── bookingController.js      # Member 3
|       |       ├──── bookingServiceController.js # Member 3 (add-ons on a booking)
|       |       ├──── serviceController.js      # Member 3
|       |       ├──── promoController.js        # Member 4
|       |       ├──── logController.js          # Member 4
|       |       └──── billingController.js      # Member 5
|       ├──── models/                           # Business logic and SQL
|       |       ├──── UserModel.js              # Member 1
|       |       ├──── RoomModel.js              # Member 2
|       |       ├──── AmenityModel.js           # Member 2
|       |       ├──── BookingModel.js           # Member 3
|       |       ├──── BookingServiceModel.js    # Member 3
|       |       ├──── ServiceModel.js           # Member 3
|       |       ├──── PromoModel.js             # Member 4
|       |       ├──── LogModel.js               # Member 4
|       |       └──── BillingModel.js           # Member 5
|       ├──── routes/                           # Endpoint route definitions
|       |       ├──── userRoutes.js             # Member 1
|       |       ├──── roomRoutes.js             # Member 2
|       |       ├──── amenityRoutes.js          # Member 2
|       |       ├──── bookingRoutes.js          # Member 3
|       |       ├──── serviceRoutes.js          # Member 3
|       |       ├──── promoRoutes.js            # Member 4
|       |       ├──── logRoutes.js              # Member 4
|       |       └──── billingRoutes.js          # Member 5
|       └──── scripts/migrateLegacyPasswords.js # Hashes the plain-text seed passwords once
└──── frontend/                                 # Client application (loading, error and empty states in app.js)
        ├──── app.js                            # Shared API helper, nav, and the table/form engine (initCrud)
        ├──── style.css
        ├──── login.html
        ├──── index.html                        # Dashboard
        ├──── users.html                        # Member 1
        ├──── rooms.html                        # Member 2
        ├──── amenities.html                    # Member 2
        ├──── bookings.html                     # Member 3
        ├──── services.html                     # Member 3
        ├──── promos.html                       # Member 4
        ├──── checkin_logs.html                 # Member 4
        ├──── invoices.html                     # Member 5
        └──── reports.html                      # The five join reports
```

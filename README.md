# Database Management Systems 1 & Systems Integration and Architecture

### **OVERVIEW**
* **Course:** Database Management Systems 1 & Systems Integration and Architecture
* **Assessment Type:** Final Project
* **System Title:** PlayStaySuites System
* **Functionality:** Multi-purpose space check-in and room rental management (StudyPods, KTV Rooms, Rest Capsules, and Standard Rooms) with add-on services and itemized billing.
* **Unique Feature:** Automated Room Booking & Conflict Engine with Status Workflows
* **Tech Stack:** Node.js + Express (REST API, MVC), MySQL, plain HTML/CSS/JavaScript frontend, JWT authentication
* **Repository:** https://github.com/nimsn/PlayStaySuites_System

---

### **GROUP ROSTER**

| # | Member | GitHub Username | Feature Role |
|---|-----|-----|-----|
|1|**Sablada, Jhanyle**|[*@jhanyle567*](https://github.com/jhanyle567)|User & Staff Access|
|2|**Velasco, Ruel**|[*@rueljr123*](https://github.com/rueljr123)|Master Data & Rooms|
|3|**Suson, Niño**|[*@nimsn*](https://github.com/nimsn)|Transaction & Rules|
|4|**Tuangco, Brenalyn**|[*@brenalyn092*](https://github.com/brenalyn092)|Workflow & Audit|
|5|**Sarinse, Irene**|[*@Irene5143*](https://github.com/Irene5143)|Billing, Payments, & Reports|

---

### **OWNERSHIP MATRIX**

|  Member | GitHub Username | Tables | Endpoints/Screens | Join Report & Join Type | Feature Role |
|-----|-----|-----|-----|-----|-----|
|**Sablada, Jhanyle**|*@jhanyle567*|`roles` `users` `staff`|`users.html`<br>`/api/users`|**LEFT JOIN**<br>Users with no bookings<br>`GET /api/users/reports/inactive`|**User & Staff Access**|
|**Velasco, Ruel**|*@rueljr123*|`room_types` `rooms` `amenities`|`rooms.html` `amenities.html`<br>`/api/rooms` `/api/amenities`|**INNER JOIN**<br>Room details with room type<br>`GET /api/rooms/reports/details`|**Master Data & Rooms**|
|**Suson, Niño**|*@nimsn*|`room_amenities` `services` `bookings`|`bookings.html`<br>`/api/bookings`|**INNER JOIN**<br>Active bookings with customer and room<br>`GET /api/bookings/reports/active`|**Transaction & Rules**|
|**Tuangco, Brenalyn**|*@brenalyn092*|`promos` `booking_services` `room_status_logs`|`checkin_logs.html` `promos.html`<br>`/api/logs` `/api/promos`|**RIGHT JOIN**<br>Audit log showing every room, even with no status changes<br>`GET /api/logs/audit-report`|**Workflow & Audit**|
|**Sarinse, Irene**|*@Irene5143*|`invoices` `payments`|`invoices.html`<br>`/api/invoices` `/api/payments`|**FULL OUTER JOIN** (`LEFT JOIN` + `RIGHT JOIN` combined with `UNION`)<br>Invoice and payment reconciliation<br>`GET /api/reports/reconciliation`|**Billing, Payments, & Reports**|

> Shared files (`login.html`, `index.html`, `app.js`, `style.css`, `authMiddleware.js`, `db.js`, `server.js`, and the SQL files in `database/`) are maintained by the whole group.

---

### **HOW TO RUN THE PROJECT**

#### **1. Prerequisites**
* [Node.js](https://nodejs.org/) **18 or newer** (required by Express 5)
* [MySQL](https://dev.mysql.com/downloads/) 8.x, or a compatible server such as the MySQL/MariaDB bundled with XAMPP
* Git (only needed if you clone the repository)

#### **2. Get the code and install dependencies**
```bash
git clone https://github.com/nimsn/PlayStaySuites_System.git
cd PlayStaySuites_System
npm install
```

#### **3. Configure the environment**
Copy the template to a new `.env` file (`cp .env.example .env` on macOS/Linux/Git Bash, or `copy .env.example .env` on Windows Command Prompt), then edit it:

```env
PORT=9000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=final_system
JWT_SECRET=a-long-random-string
```

* `DB_NAME` must stay `final_system`, because `schema.sql` creates and uses that database.
* `JWT_SECRET` is **required**. The server refuses to start without it. To generate one:
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```
* `.env` is listed in `.gitignore` and must not be committed.

#### **4. Create and seed the database**
From the **project root**, open the MySQL client and run the SQL files in this order:

```bash
mysql -u root -p
```
```sql
SOURCE database/schema.sql;
SOURCE database/seed.sql;

-- The Rooms page needs this table, which is not yet part of schema.sql.
CREATE TABLE IF NOT EXISTS room_amenities (
    room_amenity_id INT PRIMARY KEY AUTO_INCREMENT,
    room_id INT NOT NULL,
    amenity_id INT NOT NULL,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE,
    FOREIGN KEY (amenity_id) REFERENCES amenities(amenity_id) ON DELETE CASCADE,
    UNIQUE KEY uq_room_amenity (room_id, amenity_id)
);

EXIT;
```

Prefer a GUI? In MySQL Workbench or phpMyAdmin, run `schema.sql`, then `seed.sql`, then the `CREATE TABLE room_amenities` statement above, with the `final_system` database selected.

To start over from scratch, run `DROP DATABASE final_system;` in the MySQL client and repeat this step. The SQL files are not safe to run twice on the same database.

#### **5. Hash the demo passwords (one time)**
`seed.sql` stores plain-text demo passwords, but the login checks scrypt hashes. Convert them once, from the project root:

```bash
node backend/scripts/migrateLegacyPasswords.js
```

It prints how many accounts it migrated. It is safe to run again, since accounts that are already hashed are skipped. Until this step is done, the seeded accounts cannot log in.

#### **6. Start the server**
```bash
node backend/server.js
```

You should see `Server running on http://localhost:9000` followed by `Database check OK`. The Express server also serves the frontend, so there is nothing else to start.

#### **7. Open the app**
Go to **http://localhost:9000** (use the `PORT` from your `.env` if you changed it) and log in with one of the demo accounts. New students can also register from the **Create Account** tab on the login page.

| Role | Email | Password |
|-----|-----|-----|
|Admin|`nino@email.com`|`nino123`|
|Staff|`brenalyn@email.com`|`brenalyn123`|
|Student|`jhanyle@email.com`|`jhanyle123`|

*These are demo accounts from `seed.sql`. Do not reuse these passwords anywhere real.*

**What each role can open**

| Role | Pages |
|-----|-----|
|Admin|Everything, including **Users & Staff**|
|Staff|Home, Rooms, Amenities, Promotions, Bookings, Check-in Logs, Invoices|
|Student|Home, Rooms, Bookings|

#### **Troubleshooting**

| Symptom | Fix |
|-----|-----|
|`JWT_SECRET is missing` and the server exits|Add `JWT_SECRET` to `.env` (step 3).|
|`Could not read the database (ECONNREFUSED ...)`|Start MySQL and check `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` in `.env`.|
|Startup warning about missing columns or tables|Re-check step 4: the schema, the seed, and the `room_amenities` table.|
|`Invalid email or password` for a demo account|Run the password migration (step 5).|
|Rooms page shows an error or no rooms|The `room_amenities` table is missing (step 4).|
|Port already in use|Change `PORT` in `.env` and open that port instead.|

---

### **PROJECT STRUCTURE**

*"Member N" refers to the numbers in the Group Roster.*

```text
PlayStaySuites_System/
├──── .env                                      # Your local settings (git-ignored; create from .env.example)
├──── .env.example                              # Template for the environment configuration keys
├──── .gitignore                                # node_modules/ and .env
├──── package.json                              # Project metadata and dependencies
├──── README.md                                 # Roster, Ownership Matrix, & How to Run
├──── database/
|       ├──── schema.sql                        # Table creation commands
|       └──── seed.sql                          # Sample data
├──── backend/                                  # Node.js MVC REST API
|       ├──── server.js                         # App entry point (also serves the frontend)
|       ├──── config/
|       |       └──── db.js                     # Database Connection Setup
|       ├──── middleware/
|       |       └──── authMiddleware.js         # JWT login check and role-based access
|       ├──── scripts/
|       |       └──── migrateLegacyPasswords.js # One-time hashing of the seed passwords
|       ├──── controllers/                      # Request handling and responses
|       |       ├──── userController.js         # Member 1
|       |       ├──── roomController.js         # Member 2
|       |       ├──── amenityController.js      # Member 2
|       |       ├──── bookingController.js      # Member 3
|       |       ├──── logController.js          # Member 4
|       |       ├──── promoController.js        # Member 4
|       |       └──── billingController.js      # Member 5
|       ├──── models/                           # SQL Queries, Business Rules, and Validation
|       |       ├──── UserModel.js              # Member 1
|       |       ├──── RoomModel.js              # Member 2
|       |       ├──── AmenityModel.js           # Member 2
|       |       ├──── BookingModel.js           # Member 3
|       |       ├──── LogModel.js               # Member 4
|       |       ├──── PromoModel.js             # Member 4
|       |       └──── BillingModel.js           # Member 5
|       └──── routes/                           # Endpoint Route Definition
|               ├──── userRoutes.js             # Member 1
|               ├──── roomRoutes.js             # Member 2
|               ├──── amenityRoutes.js          # Member 2
|               ├──── bookingRoutes.js          # Member 3
|               ├──── logRoutes.js              # Member 4
|               ├──── promoRoutes.js            # Member 4
|               └──── billingRoutes.js          # Member 5
└──── frontend/                                 # Client Application
        ├──── login.html                        # Login and student registration (Shared)
        ├──── index.html                        # Role-based home dashboard (Shared)
        ├──── app.js                            # Shared helpers: auth, API calls, navigation (Shared)
        ├──── style.css                         # Shared styles (Shared)
        ├──── users.html                        # Member 1
        ├──── rooms.html                        # Member 2
        ├──── amenities.html                    # Member 2
        ├──── bookings.html                     # Member 3
        ├──── checkin_logs.html                 # Member 4
        ├──── promos.html                       # Member 4
        └──── invoices.html                     # Member 5
```
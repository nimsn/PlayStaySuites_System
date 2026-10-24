# Database Management Systems 1 & Systems Integration and Architecture 

### **OVERVIEW**
* **Course:** Database Maanagement Systems 1 & Systems Integration and Architecture 
* **Assessment Type:** Final Project
* **System Title:** PlayStaySuites System
* **Functionality:** Multi-purpose space check-in and room rental management(StudyPods, KTV Rooms, Rest Capsules, and Standard Rooms) with add-on services and itemized billing.
* **Unique Feature:** Automated Room Booking & Conflict Engine with Status Workflows

---

### **OWNERSHIP MATRIX**

|  Member | GitHub Username | Tables | Endpoints/Screens | Join Report & Join Type | Feature Role |
|-----|-----|-----|-----|-----|-----|
|**Sablada, Jhanyle**|*@jhanyle567*|`roles` `users` `staff`|`users.html`|**LEFT JOIN**|**User & Staff Access**|
|**Velasco, Ruel**|*@rueljr123*|`room_types` `rooms` `ammenities`|`rooms.html`|**INNER JOIN**|**Master Data & Rooms**|
|**Suson, Niño**|*@nimsn*|`room_amenities` `services` `bookings`|`bookings.html`|**INNER JOIN**| **Transaction & Rules** |
|**Tuangco, Brenalyn**|*@brenalyn092*|`promos` `booking_services` `room_status_logs`|`checkin_logs.html`|**RIGHT JOIN**|**Workflow & Audit**|
|**Sarinse, Irene**|*@Irene5143*|`invoices` `payments`|`invoices.html`|**FULL OUTER JOIN**|**Billing, Payments, & Reports**|

---

### **PROJECT STRUCTURE**

```text
PlayStaySuites_System/
├──── .env                                      # Environment configuration keys                    
├──── .gitignore                                # node_modules
├──── README.md                                 # Roster, Ownership Matrix, & Setup instruction
├──── database/ 
|       ├──── schema.sql                        # Table creation commands    
|       ├──── seed.sql                          # Sample data
├──── backend/                                  # Node.js MVC REST API
|       ├──── server.js                         # App entry point
|       ├──── config/
|       |       └──── db.js                     # Database Connection Setup
|       ├──── controllers/                      # Database Queries and Logic
|       |       ├──── userController.js         # Member 1
|       |       ├──── roomController.js         # Member 2
|       |       ├──── bookingController.js      # Member 3
|       |       ├──── logController.js          # Member 4
|       |       └──── billingController.js      # Member 5
|       ├──── models/                           # Business Logic and Request Validation
|       |       ├──── UserModel.js              # Member 1
|       |       ├──── RoomModel.js              # Member 2
|       |       ├──── BookingModel.js           # Member 3
|       |       ├──── LogModel.js               # Member 4
|       |       └──── BillingModel.js           # Member 5
|       └──── routes/                           # Endpoint Route Definition
|               ├──── userRoutes.js             # Member 1
|               ├──── roomRoutes.js             # Member 2
|               ├──── bookingRoutes.js          # Member 3
|               ├──── logRoutes.js              # Member 4
|               └──── billingRoutes.js          # Member 4
└──── frontend/                                 # Client Application
        ├──── users.html                        # Member 1
        ├──── rooms.html                        # Member 2
        ├──── bookings.html                     # Member 3
        ├──── checkin_logs.html                 # Member 4
        └──── invoices.html                     # Member 4
```
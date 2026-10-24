const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(espress.json());
app.use(express.static('../frontend'));

app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/rooms', require('./routes/roomRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/logs', require('./routes/logRoutes'));
app.use('/api/billing', require('./routes/billingRoutes'));

const PORT = process.env.PORT;
app.listen(PORT, ()=> console.log(`Server running on https://localhost:${PORT}`));
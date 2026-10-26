const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('../frontend'));

app.use('/api/bookings', require('./routes/bookingRoutes'));

const PORT = process.env.PORT;
app.listen(PORT, ()=> console.log(`Server running on https://localhost:${PORT}`));
const express = require('express');

const app = express();
const cors = require('cors');
const loginRouter = require('../routes/login');
const dashboardRouter = require('../routes/dashboard');
const settingsRouter = require('../routes/settings');
const teachersRouter = require('../routes/teachers');
const schoolsRouter = require('../routes/schools');
const schoolDistrictsRouter = require('../routes/schoolDistricts');

app.listen(5000, () => {
  console.log('Server has started on port 5000');
});

app.use(cors());
app.use(express.json()); // this gives us req.body

// Database Schema
// https://docs.google.com/document/d/11OQiiVDpT07Rk-jz0VY7yVKsAjqZC_97wewZR32cw6w/edit

app.use('/dashboard', dashboardRouter);
app.use('/login', loginRouter);
app.use('/settings', settingsRouter);
app.use('/teachers', teachersRouter);
app.use('/schools', schoolsRouter);
app.use('/schoolDistricts', schoolDistrictsRouter);

// school district
// schools

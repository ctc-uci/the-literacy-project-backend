const express = require('express');

const app = express();
const cors = require('cors');

app.listen(5000, () => {
  console.log('Server has started on port 5000');
});

app.use(cors());
app.use(express.json()); // this gives us req.body

// Database Schema
// https://docs.google.com/document/d/11OQiiVDpT07Rk-jz0VY7yVKsAjqZC_97wewZR32cw6w/edit

//  post
app.post('/login/reset-password', async (req, res) => {
  try {
    const { pwd } = req.body;
    console.log(pwd);
    res.json(pwd);
    // const replacePwd = pool
  } catch (err) {
    console.log(err.message);
  }
});

app.post('/login/teacher-start/:invite-id', async (req, res) => {
  try {
    console.log(req.params);
    // const {id} = req.params.invite-id;
  } catch (err) {
    console.log(err.message);
  }

  res.json('Sucessfully setup teach account');
});

app.post('/schools/create', async (req, res) => {
  try {
    console.log(req.params);
    // const { username } = req.body.username;
    // console.log(id);
  } catch (err) {
    console.error(err.message);
  }
  res.json('School created');
});
// app.get('/dashboard')

app.get('/schools', async (req, res) => {
  try {
    console.log('hello');
    // const { school_id } = req.body.school_id
  } catch (err) {
    console.error(err.message);
  }
  res.json('This is the school page');
});

// put

// delete
app.delete('/teachers/remove-teacher', async (req, res) => {
  try {
    console.log(req.body);
  } catch (err) {
    console.log(err.message);
  }

  res.json('Successfully removed teacher');
});

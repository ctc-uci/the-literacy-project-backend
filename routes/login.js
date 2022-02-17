const { Router } = require('express');
const pool = require('../server/db');

const router = Router();

// Get

/*
router.get('', async (req, res) => {

});
*/

// post
// This works
router.post('/reset-password', async (req, res) => {
  try {
    // INSERT INTO tlp_user(username) VALUES ('hello');
    const userInfo = req.body; // input all required fields of tlp_user table
    console.log(userInfo);
    const newUser = await pool.query(
      'INSERT INTO tlp_user (email, position, first_name, last_name, phone_number, active) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',
      [
        userInfo.email,
        userInfo.position,
        userInfo.first_name,
        userInfo.last_name,
        userInfo.phone_number,
        userInfo.active,
      ],
    );
    res.json(newUser.rows[0]);
  } catch (err) {
    console.log(err.message);
  }
});

router.get('/:id', async (req, res) => {
  try {
    console.log(req.params);
    // const {id} = req.params.invite-id;
  } catch (err) {
    console.log(err.message);
  }

  res.json('Sucessfully setup teach account');
});
module.exports = router;

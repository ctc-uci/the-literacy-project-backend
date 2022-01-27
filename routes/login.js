const { Router } = require('express');
const pool = require('../server/db');

const router = Router();

// Get

/*
router.get('', async (req, res) => {

});
*/

// post
router.post('/reset-password', async (req, res) => {
  try {
    // INSERT INTO tlp_user(username) VALUES ('hello');
    const userInfo = req.body; // input all required fields of tlp_user table
    console.log(userInfo);
    const newUser = await pool.query(
      'INSERT INTO tlp_user (username, password, position) VALUES($1,$2,$3) RETURNING *',
      [userInfo.username, userInfo.password, userInfo.position],
    );
    res.json(newUser.rows[0]);
  } catch (err) {
    console.log(err.message);
  }
});

router.post('/teacher-start/:invite-id', async (req, res) => {
  try {
    console.log(req.params);
    // const {id} = req.params.invite-id;
  } catch (err) {
    console.log(err.message);
  }

  res.json('Sucessfully setup teach account');
});
module.exports = router;

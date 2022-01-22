const { Router } = require('express');

const router = Router();

//  post
router.post('/reset-password', async (req, res) => {
  try {
    const { pwd } = req.body;
    console.log(pwd);
    res.json(pwd);
    // const replacePwd = pool
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

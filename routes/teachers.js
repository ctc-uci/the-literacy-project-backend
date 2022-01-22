const { Router } = require('express');

const router = Router();

router.delete('/remove-teacher', async (req, res) => {
  try {
    console.log(req.body);
  } catch (err) {
    console.log(err.message);
  }

  res.json('Successfully removed teacher');
});

module.exports = router;

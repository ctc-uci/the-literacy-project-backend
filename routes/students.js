const { Router } = require('express');
const pool = require('../server/db');

const router = Router();

router.get('', async (req, res) => {
  try {
    const allStudents = await pool.query('SELECT * FROM student');
    res.json(allStudents.rows);
  } catch (err) {
    console.error(err.message);
  }
});

// '/create'
// router.get('/create', async (req, res) => {
//   try {
//   } catch (err) {
//     console.error(err.message);
//   }
// });

// '/export-data'
// router.post('/export-data', async (req, res) => {});

// PUT

// router.put('/edit', async(req,res) => {
//     try{
//         //not sure if this should be parameterized for student_id
//         const newGroups= req.body.student_groups;
//         const newTeacher = req.body.home_teacher;

//     }catch(err){
//         console.error(err.message);
//     }
// });

// '/:student-id/' ...

module.exports = router;

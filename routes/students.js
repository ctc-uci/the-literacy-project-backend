const { Router } = require('express');
const pool = require('../server/db');

const router = Router();

// get a student by id
// router.get('/:studentId', async (req, res) => {
//   try {
//     const { studentId } = req.params;
//     isNumeric(areaId, 'Area Id must be a Number');
//     const area = await pool.query(`SELECT * FROM area WHERE area_id = $1;`, [areaId]);
//     res.status(200).send(area.rows[0]);
//   } catch (err) {
//     res.status(400).send(err.message);
//   }
// });

// get all students
router.get('/', async (req, res) => {
  try {
    const allStudents = await pool.query('SELECT * FROM student');
    res.status(200).send(allStudents.rows);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// create a student
router.post('/', async (req, res) => {
  try {
    const student = req.body;
    // console.log(student);
    const newStudent = await pool.query(
      'INSERT INTO student (first_name, last_name, contact, site_id, student_group) VALUES ($1, $2, $3, $4, $5) RETURNING student_id',
      [
        student.first_name,
        student.last_name,
        student.contact,
        student.site_id,
        student.student_group,
      ],
    );
    res.json(newStudent.rows[0]);
    res.status(200).send();
  } catch (err) {
    console.error(err.message);
  }
});
// update a student
// router.put('/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { first_name } = req.body;
//     const { last_name } = req.body;
//     const { contact } = req.body;
//     const { site_id } = req.body;
//     const { student_group } = req.body;
//     const updatestudent = await pool.query(
//       'UPDATE student SET first_name = $1, last_name = $2, contact = $3, site_id = $4, student_group = $5, WHERE student_id = $6',
//       [first_name, last_name, contact, site_id, student_group, id],
//     );
//     res.json('Student was successfully updated.');
//   } catch (err) {
//     console.error(err.message);
//   }
// });

// delete a student

// router.post('/update-scores/:id', async(req, res) => {
//   try {
//     const student = req.body;
//     console.log(student);
//     const studentScores = await pool.query(
//       'INSERT INTO student (pretest_r, posttest_r, pretest_a, posttest_a) VALUES ($1, $2, $3, $4) RETURNING * ',
//       [student.pretest_r, student.posttest_r, student.pretest_a, student.posttest_a],
//     );
//     res.json("Student's scores was successfully updated.")
//   } catch (err) {
//     console.error(err.message);
//   }
// });

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

const { Router } = require('express');
const { pool, db } = require('../server/db');
const {
  isNumeric,
  keysToCamel,
  getStudentsBySiteQuery,
  isArray,
  getStudentsByAreaQuery,
} = require('./utils');

const router = Router();

const studentsQuery = (conditions = '') =>
  `SELECT student.*, site.site_id, site.site_name, area.area_id, area.area_name, area.area_state,
    student_group.name AS student_group_name, student_group.year, student_group.cycle
  FROM student
    LEFT JOIN student_group on student_group.group_id = student.student_group_id
    LEFT JOIN site on site.site_id = student_group.site_id
    LEFT JOIN area on area.area_id = site.area_id
  ${conditions};`;

// get a student by id
router.get('/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    isNumeric(studentId, 'Student Id must be a Number');
    const conditions = 'WHERE student.student_id = $1';
    const student = await pool.query(studentsQuery(conditions), [studentId]);
    if (student.rows.length === 0) {
      res.status(404).send(`Student with id=${studentId} not found`);
    }
    res.status(200).send(keysToCamel(student.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// get all students
router.get('/', async (req, res) => {
  try {
    const allStudents = await pool.query(studentsQuery());
    res.status(200).json(keysToCamel(allStudents.rows));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// get all students for a given student group
router.get('/student-group/:studentGroupId', async (req, res) => {
  try {
    const { studentGroupId } = req.params;
    isNumeric(studentGroupId, 'Student Group Id must be a Number');
    const students = await pool.query(
      `SELECT student.*
      FROM student
      WHERE student.student_group_id = $1;`,
      [studentGroupId],
    );
    res.status(200).json(keysToCamel(students.rows));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// get all students for a given site
router.get('/site/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    isNumeric(siteId, 'Site Id must be a Number');
    const students = await pool.query(getStudentsBySiteQuery, [siteId]);
    res.status(200).json(keysToCamel(students.rows));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// get all students not in a given site
router.get('/other-sites/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    isNumeric(siteId, 'Site Id must be a Number');
    const students = await pool.query(
      `SELECT student.*, student_group.*
      FROM student
        INNER JOIN (SELECT s.group_id, s.site_id, s.year, s.cycle
              FROM student_group AS s) AS student_group
              ON student_group.group_id = student.student_group_id
        INNER JOIN (SELECT site.site_id, site.area_id
              FROM site) AS site
              ON site.site_id = student_group.site_id
      WHERE site.site_id != $1;`,
      [siteId],
    );
    res.status(200).json(keysToCamel(students.rows));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// get all students not taught by a given master teacher
router.get('/other-teachers/:masterTeacherId', async (req, res) => {
  try {
    const { masterTeacherId } = req.params;
    isNumeric(masterTeacherId, 'Master Teacher Id must be a Number');
    const students = await pool.query(
      `SELECT student.*, student_group.*
      FROM student
        INNER JOIN (SELECT s.group_id, s.site_id, s.year, s.cycle, s.master_teacher_id
              FROM student_group AS s) AS student_group
              ON student_group.group_id = student.student_group_id AND student_group.master_teacher_id != $1
        INNER JOIN (SELECT site.site_id, site.area_id
              FROM site) AS site
              ON site.site_id = student_group.site_id;`,
      [masterTeacherId],
    );
    res.status(200).json(keysToCamel(students.rows));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// get all students for a given area
router.get('/area/:areaId', async (req, res) => {
  try {
    const { areaId } = req.params;
    isNumeric(areaId, 'Area Id must be a Number');
    const students = await pool.query(getStudentsByAreaQuery, [areaId]);
    res.status(200).json(keysToCamel(students.rows));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// get all students demographic percentages based on filters
router.get('/people/filter', async (req, res) => {
  try {
    const requestQuery = req.query;
    // console.log(req);
    // console.log(requestQuery);
    const conditionsNullCheck = {
      states: '',
      areas: '',
      sites: '',
      years: '',
    };
    if (!requestQuery.states) requestQuery.states = [];
    if (!requestQuery.areas) requestQuery.areas = [];
    if (!requestQuery.grades) requestQuery.grades = [];
    if (!requestQuery.sites) requestQuery.sites = [];
    if (!requestQuery.years) requestQuery.years = [];

    // Get all state conditions
    const conditionsStates = `(${requestQuery.states
      .filter((state) => {
        return state !== 'N/A';
      })
      .map((state) => {
        return `'${state}'`;
      })
      .join(', ')})`;
    if (requestQuery.states.includes('N/A')) {
      conditionsNullCheck.states = 'area.area_state IS NULL';
    }

    // Get all grades conditions
    const conditionsGrades = `(${requestQuery.grades
      .map((grade) => {
        return `${grade}`;
      })
      .join(', ')})`;

    const conditionsAreas = `(${requestQuery.areas
      .filter((areas) => {
        return areas !== 'No assigned area';
      })
      .map((areas) => {
        return `'${areas}'`;
      })
      .join(', ')})`;
    if (requestQuery.areas.includes('No assigned area')) {
      conditionsNullCheck.areas = 'area.area_name IS NULL';
    }

    // Get all site conditions
    const conditionsSites = `(${requestQuery.sites
      .filter((site) => {
        return site !== 'No assigned site';
      })
      .map((site) => {
        return `'${site.split("'").join("''")}'`;
      })
      .join(', ')})`;
    if (requestQuery.sites.includes('No assigned site')) {
      conditionsNullCheck.sites = 'site.site_name IS NULL';
    }

    // Get all cycle conditions
    const conditionsYears = `(${requestQuery.years
      .filter((year) => {
        return year !== 'N/A';
      })
      .map((year) => {
        return `${year}`;
      })
      .join(', ')})`;
    if (requestQuery.years.includes('N/A')) {
      conditionsNullCheck.years = 'student_group.year IS NULL';
    }

    let students = [];
    if (
      conditionsStates !== '()' &&
      conditionsAreas !== '()' &&
      conditionsGrades !== '()' &&
      conditionsSites !== '()' &&
      conditionsYears !== '()'
    ) {
      const q = studentsQuery(
        `WHERE (${[
          `(area.area_state IN ${conditionsStates}${
            conditionsNullCheck.states !== '' ? ` OR ${conditionsNullCheck.states})` : ')'
          }`,
          `(area.area_name IN ${conditionsAreas}${
            conditionsNullCheck.areas !== '' ? ` OR ${conditionsNullCheck.areas})` : ')'
          }`,
          `(student.grade IN ${conditionsGrades})`,
          `(site.site_name IN ${conditionsSites}${
            conditionsNullCheck.sites !== '' ? ` OR ${conditionsNullCheck.sites})` : ')'
          }`,
          `(student_group.year IN ${conditionsYears}${
            conditionsNullCheck.years !== '' ? ` OR ${conditionsNullCheck.years})` : ')'
          }`,
        ].join(' AND ')})`,
      );
      students = await pool.query(q);
    } else {
      // This is based on the current filter in the /people route --> if any of the filters are not set --> no data will display
      students = { rows: [] };
    }

    // Get percentages for the grade of filtered students
    const gradePercentage = [1, 2, 3, 4, 5, 6].map((grade) => {
      if (students.rows.length === 0) {
        return 0.0;
      }
      return (
        students.rows.filter((student) => {
          return student.grade === grade;
        }).length / students.rows.length
      );
    });

    // Get percentages for the ethnicity of filtered students
    const ethnicityPercentage = [
      'white',
      'black',
      'asian',
      'latinx',
      'american indian or alaska native',
      'non-specified',
    ].map((ethnicity) => {
      if (students.rows.length === 0) {
        return 0.0;
      }
      return (
        students.rows.filter((student) => {
          if (ethnicity === 'non-specified') {
            return student.ethnicity.length === 0 || student.ethnicity.includes(ethnicity);
          }
          return student.ethnicity.includes(ethnicity);
        }).length / students.rows.length
      );
    });

    // Get percentages for the gender of filtered students
    const genderPercentage = ['male', 'female', 'non-specified'].map((gender) => {
      if (students.rows.length === 0) {
        return 0.0;
      }
      return (
        students.rows.filter((student) => {
          return student.gender === gender;
        }).length / students.rows.length
      );
    });

    // Response object
    const response = {
      Grade: gradePercentage,
      Ethnicity: ethnicityPercentage,
      Gender: genderPercentage,
    };

    res.status(200).json(keysToCamel(response));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// create a student
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, grade, gender, homeTeacher, studentGroupId, ethnicity } = req.body;
    isNumeric(grade, 'Grade must be a Number');
    if (studentGroupId) {
      isNumeric(studentGroupId, 'Student Group Id must be a Number');
    }
    const student = await db.query(
      `INSERT INTO student (
        first_name, last_name, gender, grade,
        ${homeTeacher ? 'home_teacher, ' : ''}
        ${studentGroupId ? 'student_group_id, ' : ''}
        ethnicity)
      VALUES ($(firstName), $(lastName), $(gender), $(grade),
        ${homeTeacher ? '$(homeTeacher), ' : ''}
        ${studentGroupId ? '$(studentGroupId), ' : ''}
        $(ethnicity)::ethnicities[])
      RETURNING *;`,
      { firstName, lastName, gender, grade, homeTeacher, studentGroupId, ethnicity },
    );
    const conditions = 'WHERE student.student_id = $1';
    const newStudent = await pool.query(studentsQuery(conditions), [student[0].student_id]);
    res.status(200).send(keysToCamel(newStudent.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// update the student_group_id field for every given student_id
router.put('/update-bulk', async (req, res) => {
  try {
    const { studentIds, studentGroupId } = req.body;
    if (!isArray(studentIds)) {
      throw new Error('studentIds must be an Array');
    }
    for (let i = 0; i < studentIds.length; i += 1) {
      isNumeric(studentIds[i], 'studentIds must contain Numbers');
    }
    if (studentGroupId) {
      isNumeric(studentGroupId, 'Student Group Id must be a Number');
    }
    const student = await db.query(
      `UPDATE student
      SET student_group_id = $(studentGroupId)
      WHERE student_id = ANY ($(studentIds))
      RETURNING *;`,
      {
        studentIds,
        studentGroupId,
      },
    );
    res.status(200).send(keysToCamel(student));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// update a student's general info
router.put('/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    isNumeric(studentId, 'Student Id must be a Number');
    const { firstName, lastName, gender, grade, homeTeacher, studentGroupId, ethnicity } = req.body;
    isNumeric(grade, 'Grade must be a Number');
    if (studentGroupId) {
      isNumeric(studentGroupId, 'Student Group Id must be a Number');
    }
    await db.query(
      `UPDATE student
      SET
        first_name = $(firstName),
        last_name = $(lastName),
        gender = $(gender),
        grade = $(grade),
        home_teacher = $(homeTeacher),
        ${studentGroupId ? 'student_group_id = $(studentGroupId), ' : ''}
        ethnicity = $(ethnicity)::ethnicities[]
      WHERE student_id = $(studentId)
      RETURNING *;`,
      { firstName, lastName, gender, grade, homeTeacher, studentGroupId, ethnicity, studentId },
    );
    const conditions = 'WHERE student.student_id = $1';
    const updatedStudent = await pool.query(studentsQuery(conditions), [studentId]);
    res.status(200).send(keysToCamel(updatedStudent.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// update scores for a specific student
router.put('/update-scores/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    isNumeric(studentId, 'Student Id must be a Number');
    const {
      pretestR,
      pretestRNotes,
      posttestR,
      posttestRNotes,
      pretestA,
      pretestANotes,
      posttestA,
      posttestANotes,
    } = req.body;
    const student = await db.query(
      `UPDATE student
      SET student_id = $(studentId)
          ${pretestR ? ', pretest_r = $(pretestR)' : ''}
          ${pretestRNotes ? ', pretest_r_notes = $(pretestRNotes)' : ''}
          ${posttestR ? ', posttest_r = $(posttestR)' : ''}
          ${posttestRNotes ? ', posttest_r_notes = $(posttestRNotes)' : ''}
          ${pretestA ? ', pretest_a = $(pretestA)' : ''}
          ${pretestANotes ? ', pretest_a_notes = $(pretestANotes)' : ''}
          ${posttestA ? ', posttest_a = $(posttestA)' : ''}
          ${posttestANotes ? ', posttest_a_notes = $(posttestANotes)' : ''}
      WHERE student_id = $(studentId)
      RETURNING *;`,
      {
        studentId,
        pretestR,
        pretestRNotes,
        posttestR,
        posttestRNotes,
        pretestA,
        pretestANotes,
        posttestA,
        posttestANotes,
      },
    );
    res.status(200).send(keysToCamel(student[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// delete a student
router.delete('/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    isNumeric(studentId, 'Student Id must be a Number');
    const deletedStudent = await pool.query(
      `DELETE FROM student WHERE student_id = $1 RETURNING *;`,
      [studentId],
    );
    res.status(200).send(keysToCamel(deletedStudent.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

module.exports = router;

const { Router } = require('express');
const { pool, db } = require('../server/db');

const router = Router();

// still need to  fix duplicate insertions
router.post('', async (req, res) => {
  try {
    const teacherInfo = req.body;

    await db.query(
      `INSERT INTO general_user
        (first_name, last_name, phone_number, email, title)
      VALUES
        ($1, $2, $3, $4, $5)`,
      [
        teacherInfo.firstName,
        teacherInfo.lastName,
        teacherInfo.phoneNumber,
        teacherInfo.email,
        teacherInfo.title,
      ],
    );
    // need to fix table / need some sort of duplicate check? bcuz returning multiple rows (same email)
    const generalUserInfo = await pool.query('SELECT * from general_user WHERE email = $1', [
      teacherInfo.email,
    ]); // This query is needed to fetch the user id for updating the tlp_user table
    // console.log(generalUserInfo.rows);
    const newTLPUser = await db.query(
      `INSERT INTO tlp_user
        (user_id, firebase_id, position, active)
      VALUES
        ($1, $2, $3, $4)
      RETURNING *`,
      [
        generalUserInfo.rows[generalUserInfo.rows.length - 1].user_id,
        0, // replace with actual firebase id; unfortunately this dummy value means only one user will be able to be made for now
        'master teacher',
        'pending', // by default, master teachers will be initialized as pending since they need to activate their email
      ],
    );

    // insert new row into MTSR table for each site in json
    teacherInfo.sites.forEach((site) => {
      pool.query(
        `INSERT INTO master_teacher_site_relation
          (user_id, site_id)
        VALUES
          ($1, $2)
        RETURNING *`,
        [newTLPUser[0].user_id, site],
      );
      console.log('Inserted into MT table');
    });
    res.json(generalUserInfo.rows[generalUserInfo.rows.length - 1]); // one res.json for function? not sure how or if I should return for MT table insertion(s)
  } catch (err) {
    console.error(err.message);
  }
});

router.get('', async (req, res) => {
  try {
    const allTeachers = await pool.query(
      `SELECT
        general_user.first_name, general_user.last_name, general_user.phone_number, general_user.email,
        tlp_user.active,
        master_teacher_site_relation.sites
      FROM master_teacher_site_relation
        INNER JOIN tlp_user ON tlp_user.user_id=master_teacher_site_relation.user_id
        INNER JOIN general_user
          ON general_user.user_id=tlp_user.user_id`,
    );
    // INNER JOIN tlp_userON tlp_user.firebase_id=master_teacher_site_relation.firebase_id
    // ^commented this out bc master teacher table doesn't have firebase_id currently
    /* Resulting table rows will have:
    - First name
    - Last name
    - Phone number (string)
    - Email
    - Active status (enum val)
    - Sites (array)
    ASSUMING the master teacher is properly initialized in tables general_user, tlp_user, and master_teacher */

    res.json(allTeachers.rows);
  } catch (err) {
    console.error(err.message);
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const allTeachers = await pool.query(
      `SELECT
        general_user.first_name, general_user.last_name, general_user.phone_number, general_user.email,
        tlp_user.active,
        master_teacher.sites
      FROM master_teacher
        INNER JOIN tlp_user ON tlp_user.firebase_id=master_teacher.firebase_id
        INNER JOIN general_user ON general_user.user_id=tlp_user.user_id
      WHERE
        general_user.user_id=$1`,
      [id],
    );
    /* Resulting table rows will have:
    - First name
    - Last name
    - Phone number (string)
    - Email
    - Active status (enum val)
    - Sites (array)
    ASSUMING the master teacher is properly initialized in tables general_user, tlp_user, and master_teacher */

    res.json(allTeachers.rows);
  } catch (err) {
    console.error(err.message);
  }
});

router.get('/:site', async (req, res) => {
  const { site } = req.params;
  try {
    const allTeachers = await pool.query(
      `SELECT
        general_user.first_name, general_user.last_name, general_user.phone_number, general_user.email,
        tlp_user.active,
        master_teacher.sites
      FROM master_teacher
        INNER JOIN tlp_user
          ON tlp_user.firebase_id=master_teacher.firebase_id
        INNER JOIN general_user
          ON general_user.user_id=tlp_user.user_id
      WHERE
        sites @> ARRAY[$1]::int[]
      `,
      [site],
    );
    /* Resulting table rows will have:
    - First name
    - Last name
    - Phone number (string)
    - Email
    - Active status (enum val)
    - Sites (array)
    ASSUMING the master teacher is properly initialized in tables general_user, tlp_user, and master_teacher */
    res.json(allTeachers.rows);
  } catch (err) {
    console.error(err.message);
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, phoneNumber, email, active, sites } = req.body;
  console.log(req.body);
  try {
    // Updating relevant values in general_user table
    await pool.query(
      `UPDATE
        general_user
      SET
        first_name = $1, last_name = $2, phone_number = $3, email = $4
      WHERE
        user_id = $5`,
      [firstName, lastName, phoneNumber, email, id],
    );
    // Updating relevant values in tlp_user table
    await pool.query('UPDATE tlp_user SET active = $1 WHERE user_id = $2', [active, id]);
    // Getting the firebase id of the teacher through the corresponding row object
    const teacherRow = await pool.query('SELECT * from tlp_user WHERE user_id = $1', [id]);
    // Updating relevant values in master_teacher table using the firebase_id
    await pool.query('UPDATE master_teacher SET sites = $1 WHERE firebase_id = $2', [
      sites,
      teacherRow.rows[0].firebase_id,
    ]);
    // Status 200 = request OK
    res.status(200);
    // res.send('This request actually succeeded!');
  } catch (err) {
    console.error(err.message);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM general_user WHERE user_id = $1', [id]);
    res.status(200).send('Successfully removed teacher: ', id);
  } catch (err) {
    console.log(err.message);
  }
});

module.exports = router;

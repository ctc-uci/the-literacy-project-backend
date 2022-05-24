const { Router } = require('express');
const { pool, db } = require('../server/db');
const {
  isNumeric,
  isZipCode,
  keysToCamel,
  isPhoneNumber,
  isBoolean,
  getStudentsBySiteQuery,
} = require('./utils');

const router = Router();

const getSites = (allSites) =>
  `SELECT site.site_id, site.site_name,
  site.address_street, site.address_apt, site.address_city, area.area_state AS address_state,site.address_zip,
  site.area_id, site.notes, site.active, area.area_name, years_and_cycles,
  to_json((SELECT s FROM (SELECT primary_contact_first_name AS "firstName",
						  primary_contact_last_name AS "lastName",
						  primary_contact_title AS "title",
						  primary_contact_email AS "email",
						  primary_contact_phone AS "phone") AS s)) as "primaryContactInfo",
  to_json((SELECT s FROM (SELECT second_contact_first_name AS "firstName",
						  second_contact_last_name AS "lastName",
						  second_contact_title AS "title",
						  second_contact_email AS "email",
						  second_contact_phone AS "phone") AS s)) as "secondContactInfo"
  FROM site
  LEFT JOIN
    (SELECT site.site_id, array_agg(json_build_object('year', sg.year, 'cycle', sg.cycle)) as years_and_cycles
    FROM student_group AS sg
      INNER JOIN
        (SELECT site.site_id, site.area_id FROM site)
      AS site ON site.site_id=sg.site_id
      GROUP BY site.site_id)
    AS sg ON sg.site_id=site.site_id
  LEFT JOIN area on area.area_id = site.area_id
  ${allSites ? '' : 'WHERE site.site_id = $1'}`;

const noMT = () =>
  `SELECT * FROM site
    WHERE site_id NOT IN
    (SELECT site_id FROM master_teacher_site_relation)`;

// get sites without master teacher
router.get('/no-master-teacher', async (req, res) => {
  try {
    const s = await pool.query(noMT());
    res.status(200).send(keysToCamel(s.rows));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// get a site by id
router.get('/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    isNumeric(siteId, 'Site Id must be a Number');
    const site = await pool.query(getSites(false), [siteId]);
    res.status(200).send(keysToCamel(site.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// get all sites
router.get('/', async (req, res) => {
  try {
    const sites = await pool.query(getSites(true));
    res
      .status(200)
      .json(
        keysToCamel(
          sites.rows.map((s) =>
            s.secondContactInfo.firstName ? s : { ...s, secondContactInfo: null },
          ),
        ),
      );
  } catch (err) {
    res.status(400).send(err.message);
  }
});

router.get('/area/:year/:cycle', async (req, res) => {
  try {
    const { year, cycle } = req.params;
    console.log(year, cycle);
    // missing FROM-clause entry for table "student_group"
    isNumeric(year, 'year must be a Number');
    const sites = await pool.query(`${getSites(true)} WHERE student_group.year = $1`, [year]);
    res
      .status(200)
      .json(
        keysToCamel(
          sites.rows.map((s) =>
            s.secondContactInfo.firstName ? s : { ...s, secondContactInfo: null },
          ),
        ),
      );
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// get all sites in an area
router.get('/area/:areaId', async (req, res) => {
  try {
    const { areaId } = req.params;
    isNumeric(areaId, 'Area Id must be a Number');
    const sites = await pool.query(`${getSites(true)} WHERE site.area_id = $1`, [areaId]);
    res
      .status(200)
      .json(
        keysToCamel(
          sites.rows.map((s) =>
            s.secondContactInfo.firstName ? s : { ...s, secondContactInfo: null },
          ),
        ),
      );
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// create a site
router.post('/', async (req, res) => {
  try {
    const {
      siteName,
      addressStreet,
      addressCity,
      addressApt,
      addressZip,
      areaId,
      primaryContactInfo,
      secondContactInfo,
      active,
      notes,
    } = req.body;

    isZipCode(addressZip, 'Zip code is invalid');
    isNumeric(areaId, 'Area Id must be a Number');
    isPhoneNumber(primaryContactInfo.phone, 'Invalid Primary Phone Number');
    isBoolean(active, 'Active is not a boolean');
    if (secondContactInfo && secondContactInfo.phone) {
      isPhoneNumber(secondContactInfo.phone, 'Invalid Second Phone Number');
    }

    const newSite = await db.query(
      `INSERT INTO site (
        site_name, address_street, address_apt, address_city,
        address_zip, area_id, primary_contact_first_name, primary_contact_last_name,
        primary_contact_title, primary_contact_email, primary_contact_phone
        ${secondContactInfo && secondContactInfo.firstName ? ', second_contact_first_name' : ''}
        ${secondContactInfo && secondContactInfo.lastName ? ', second_contact_last_name' : ''}
        ${secondContactInfo && secondContactInfo.title ? ', second_contact_title' : ''}
        ${secondContactInfo && secondContactInfo.email ? ', second_contact_email' : ''}
        ${secondContactInfo && secondContactInfo.phone ? ', second_contact_phone' : ''},
        active
        ${notes ? ', notes' : ''})
      VALUES (
        $(siteName), $(addressStreet), $(addressApt), $(addressCity),
        $(addressZip), $(areaId), $(primaryContactInfo.firstName), $(primaryContactInfo.lastName),
        $(primaryContactInfo.title), $(primaryContactInfo.email), $(primaryContactInfo.phone)
        ${
          secondContactInfo && secondContactInfo.firstName ? ', $(secondContactInfo.firstName)' : ''
        }
        ${secondContactInfo && secondContactInfo.lastName ? ', $(secondContactInfo.lastName)' : ''}
        ${secondContactInfo && secondContactInfo.title ? ', $(secondContactInfo.title)' : ''}
        ${secondContactInfo && secondContactInfo.email ? ', $(secondContactInfo.email)' : ''}
        ${secondContactInfo && secondContactInfo.phone ? ', $(secondContactInfo.phone)' : ''},
        $(active)
        ${notes ? ', $(notes)' : ''})
      RETURNING *`,
      {
        siteName,
        addressStreet,
        addressApt,
        addressCity,
        addressZip,
        areaId,
        primaryContactInfo,
        secondContactInfo,
        active,
        notes,
      },
    );

    const site = await pool.query(getSites(false), [newSite[0].site_id]);
    res
      .status(200)
      .send(
        keysToCamel(
          [site.rows[0]].map((s) =>
            s.secondContactInfo.firstName ? s : { ...s, secondContactInfo: null },
          ),
        ),
      );
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// update a site
router.put('/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    isNumeric(siteId, 'Site Id must be a Number');
    const {
      siteName,
      addressStreet,
      addressApt,
      addressCity,
      addressZip,
      areaId,
      primaryContactInfo,
      secondContactInfo,
      active,
      notes,
    } = req.body;
    if (addressZip) {
      isZipCode(addressZip, 'Zip code is invalid');
    }
    if (areaId) {
      isNumeric(areaId, 'Area Id must be a Number');
    }
    if (active !== undefined) {
      isBoolean(active, 'Active is not a boolean');
    }
    if (primaryContactInfo && primaryContactInfo.phone) {
      isPhoneNumber(primaryContactInfo.phone, 'Invalid Second Phone Number');
    }
    if (secondContactInfo && secondContactInfo.phone) {
      isPhoneNumber(secondContactInfo.phone, 'Invalid Second Phone Number');
    }
    await db.query(
      `UPDATE site
      SET site_id = $(siteId)
      ${siteName ? ', site_name = $(siteName)' : ''}
      ${addressStreet ? ', address_street = $(addressStreet)' : ''}
      ${addressApt ? ', address_apt = $(addressApt)' : ''}
      ${addressCity ? ', address_city = $(addressCity)' : ''}
      ${addressZip ? ', address_zip = $(addressZip)' : ''}
      ${areaId ? ', area_id = $(areaId)' : ''}
      ${
        primaryContactInfo && primaryContactInfo.firstName
          ? ', primary_contact_first_name = $(primaryContactInfo.firstName)'
          : ''
      }
      ${
        primaryContactInfo && primaryContactInfo.lastName
          ? ', primary_contact_last_name = $(primaryContactInfo.lastName)'
          : ''
      }
      ${
        primaryContactInfo && primaryContactInfo.title
          ? ', primary_contact_title = $(primaryContactInfo.title)'
          : ''
      }
      ${
        primaryContactInfo && primaryContactInfo.email
          ? ', primary_contact_email = $(primaryContactInfo.email)'
          : ''
      }
      ${
        primaryContactInfo && primaryContactInfo.phone
          ? ', primary_contact_phone = $(primaryContactInfo.phone)'
          : ''
      }
      ${
        secondContactInfo && secondContactInfo.firstName
          ? ', second_contact_first_name = $(secondContactInfo.firstName)'
          : ''
      }
      ${
        secondContactInfo && secondContactInfo.lastName
          ? ', second_contact_last_name = $(secondContactInfo.lastName)'
          : ''
      }
      ${
        secondContactInfo && secondContactInfo.title
          ? ', second_contact_title = $(secondContactInfo.title)'
          : ''
      }
      ${
        secondContactInfo && secondContactInfo.email
          ? ', second_contact_email = $(secondContactInfo.email)'
          : ''
      }
      ${
        secondContactInfo && secondContactInfo.phone
          ? ', second_contact_phone = $(secondContactInfo.phone)'
          : ''
      }
      ${active != null ? `, active = '$(active)'` : ''}
      ${notes ? ', notes = $(notes)' : ''}
      WHERE site_id = $(siteId)
      RETURNING *;`,
      {
        siteId,
        siteName,
        addressStreet,
        addressApt,
        addressCity,
        addressZip,
        areaId,
        primaryContactInfo,
        secondContactInfo,
        active,
        notes,
      },
    );
    const site = await pool.query(getSites(false), [siteId]);
    res.status(200).send(keysToCamel(site.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// delete site (also deletes students within that site)
// does not delete area or master teacher
router.delete('/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    isNumeric(siteId, 'Site Id must be a Number');
    const studentsToDelete = await pool.query(getStudentsBySiteQuery, [siteId]).then((result) => {
      return result;
    });

    // must delete students before sites
    // deleting sites first would delete student groups (By cascade) and students sg would be null but students wont be deleted
    studentsToDelete.rows.forEach(async (student) => {
      isNumeric(student.student_id, 'Student Id must be a Number');
      await pool.query(`DELETE FROM student WHERE student_id = $1 RETURNING *;`, [
        student.student_id,
      ]);
    });

    const site = await pool.query('DELETE FROM site WHERE site_id = $1 RETURNING *', [siteId]);

    res.status(200).send(keysToCamel(site.rows[0]));
  } catch (err) {
    res.status(400).send(err.message);
  }
});

module.exports = router;

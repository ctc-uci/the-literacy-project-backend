DROP TYPE pos CASCADE;
DROP TYPE cycles CASCADE;
DROP TYPE user_status CASCADE;
DROP TYPE ethnicities;
DROP TYPE weekday;
DROP TYPE genders CASCADE;
CREATE TYPE pos AS ENUM('admin', 'master teacher');
CREATE TYPE cycles AS ENUM('1', '2', '3', '4');
CREATE TYPE user_status AS ENUM('active', 'inactive', 'pending');
CREATE TYPE ethnicities AS ENUM('white', 'black', 'asian', 'latinx', 'american indian or alaska native', 'non-specified');
CREATE TYPE weekday AS ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');
CREATE TYPE genders AS ENUM('male', 'female', 'non-specified');
CREATE TYPE states AS ENUM('Alabama','Alaska', 'Arizona', 'Arkansas', 'California','Colorado', 'Connecticut', 'Delaware', 'District of Columbia'
'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine',
'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia'
'Washington', 'West Virginia', 'Wisconsin', 'Wyoming');

DROP TABLE tlp_user CASCADE;
CREATE TABLE tlp_user (
  user_id SERIAL PRIMARY KEY,
  firebase_id VARCHAR(128) UNIQUE NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(15),
  email VARCHAR(255) UNIQUE NOT NULL,
  position pos NOT NULL,
  active user_status NOT NULL,
  notes text
);

DROP TABLE invites CASCADE;
CREATE TABLE invites (
  invite_id VARCHAR(255) PRIMARY KEY NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  position pos NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(15) NOT NULL,
  expire_time timestamp without time zone NOT NULL,
  valid_invite boolean NOT NULL,
  notes text
);

DROP TABLE master_teacher_site_relation CASCADE;
CREATE TABLE master_teacher_site_relation (
  user_id INT REFERENCES tlp_user(user_id) ON DELETE CASCADE NOT NULL,
  site_id INT REFERENCES site(site_id) UNIQUE ON DELETE CASCADE NOT NULL,
  UNIQUE (user_id, site_id)
);

DROP TABLE area CASCADE;
CREATE TABLE area (
  area_id SERIAL PRIMARY KEY,
  area_name VARCHAR(255) UNIQUE NOT NULL,
  active BOOLEAN NOT NULL,
  area_state states NOT NULL
);

DROP TABLE site CASCADE;
CREATE TABLE site (
  site_id SERIAL PRIMARY KEY,
  site_name VARCHAR(255) UNIQUE NOT NULL,
  address_street VARCHAR(255) NOT NULL,
  address_apt VARCHAR(255),
  address_city VARCHAR(255) NOT NULL,
  address_zip VARCHAR(5) NOT NULL,
  area_id INT REFERENCES area(area_id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL,
  notes VARCHAR(255),
  primary_contact_first_name VARCHAR(255) NOT NULL,
  primary_contact_last_name VARCHAR(255) NOT NULL,
  primary_contact_title VARCHAR(255),
  primary_contact_email VARCHAR(255) NOT NULL,
  primary_contact_phone VARCHAR(15) NOT NULL,
  second_contact_first_name VARCHAR(255),
  second_contact_last_name VARCHAR(255),
  second_contact_title VARCHAR(255),
  second_contact_email VARCHAR(255),
  second_contact_phone VARCHAR(15)
);

DROP TABLE student_group CASCADE;
CREATE TABLE student_group (
  group_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  year INT NOT NULL,
  cycle cycles NOT NULL,
  master_teacher_id INT REFERENCES tlp_user(user_id) ON DELETE SET NULL,
  site_id INT REFERENCES site(site_id) ON DELETE CASCADE,
  meeting_day weekday NOT NULL,
  meeting_time TIME NOT NULL
);

DROP TABLE student CASCADE;
CREATE TABLE student (
  student_id SERIAL PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  gender genders NOT NULL;
  grade INT NOT NULL,
  home_teacher VARCHAR(255),
  student_group_id INT REFERENCES student_group(group_id) ON DELETE SET NULL,
  ethnicity ethnicities[] NOT NULL,
  pretest_r INT[],
  posttest_r INT[],
  pretest_a INT[],
  posttest_a INT[],
  pretest_r_notes VARCHAR(255)[],
  posttest_r_notes VARCHAR(255)[],
  pretest_a_notes VARCHAR(255)[],
  posttest_a_notes VARCHAR(255)[]
);

CREATE OR REPLACE FUNCTION updateStudentGroupMT()
	RETURNS TRIGGER
	LANGUAGE PLPGSQL
	AS
$$
BEGIN
  if  (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') then
		UPDATE student_group
		SET master_teacher_id = new.user_id
		WHERE student_group.site_id = new.site_id;
		RETURN NEW;
	end if;
	if  (TG_OP = 'DELETE') then
		UPDATE student_group
		SET master_teacher_id = null
		WHERE student_group.site_id = old.site_id;
		RETURN NEW;
	end if;
END;
$$

DROP TRIGGER IF EXISTS updateStudentGroupMTTrigger ON master_teacher_site_relation;
CREATE TRIGGER updateStudentGroupMTTrigger
	AFTER INSERT OR UPDATE OR DELETE
	ON master_teacher_site_relation
	FOR EACH ROW
	EXECUTE PROCEDURE updateStudentGroupMT();


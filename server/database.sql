DROP TYPE pos CASCADE;
DROP TYPE season CASCADE;
DROP TYPE user_status CASCADE;
CREATE TYPE pos AS ENUM('admin', 'master teacher');
CREATE TYPE cycles AS ENUM('1', '2', '3', '4');
CREATE TYPE user_status AS ENUM('active', 'inactive', 'pending');
CREATE TYPE ethnicities AS ENUM('white', 'black', 'asian', 'latinx', 'american indian or alaska native');
CREATE TYPE weekday AS ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');

DROP TABLE general_user CASCADE;
CREATE TABLE general_user (
  user_id SERIAL PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(15) NOT NULL,
  email VARCHAR(255) NOT NULL,
  title VARCHAR(255)
);

DROP TABLE tlp_user CASCADE;
CREATE TABLE tlp_user (
  user_id INT PRIMARY KEY REFERENCES general_user(user_id) ON DELETE CASCADE NOT NULL,
  firebase_id VARCHAR(128) UNIQUE NOT NULL,
  position pos NOT NULL,
  active user_status NOT NULL
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
  valid_invite boolean NOT NULL
);

DROP TABLE master_teacher_site_relation CASCADE;
CREATE TABLE master_teacher_site_relation (
  user_id INT REFERENCES tlp_user(user_id) ON DELETE CASCADE NOT NULL,
  site_id INT REFERENCES site(site_id) ON DELETE CASCADE NOT NULL,
  UNIQUE (user_id, site_id)
);

DROP TABLE area CASCADE;
CREATE TABLE area (
  area_id SERIAL PRIMARY KEY,
  area_name VARCHAR(255) UNIQUE NOT NULL,
  active BOOLEAN NOT NULL
);

DROP TABLE site CASCADE;
CREATE TABLE site (
  site_id SERIAL PRIMARY KEY,
  site_name VARCHAR(255) NOT NULL,
  address_street VARCHAR(255) NOT NULL,
  address_city VARCHAR(255) NOT NULL,
  address_zip VARCHAR(5) NOT NULL,
  area_id INT REFERENCES area(area_id) ON DELETE SET NULL NOT NULL,
  primary_contact_id INT REFERENCES general_user(user_id) NOT NULL,
  second_contact_id INT REFERENCES general_user(user_id),
  active BOOLEAN NOT NULL,
  notes VARCHAR(255)
);

DROP TABLE student_group CASCADE;
CREATE TABLE student_group (
  group_id SERIAL PRIMARY KEY,
  year INT NOT NULL,
  cycle cycles NOT NULL,
  master_teacher_id INT REFERENCES master_teacher(user_id) ON DELETE NO ACTION NOT NULL,
  site_id INT REFERENCES site(site_id) ON DELETE NO ACTION NOT NULL,
  meeting_day weekday NOT NULL,
  meeting_time TIME NOT NULL
);

DROP TABLE student CASCADE;
CREATE TABLE student (
  student_id SERIAL PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  contact_id INT REFERENCES general_user(user_id) ON DELETE NO ACTION NOT NULL,
  student_group_id INT REFERENCES student_group(group_id) ON DELETE NO ACTION NOT NULL,
  ethnicity ethnicities[],
  pretest_r INT[],
  posttest_r INT[],
  pretest_a INT[],
  posttest_a INT[]
);

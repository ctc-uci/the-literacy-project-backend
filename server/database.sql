CREATE DATABASE tlp;

CREATE TYPE pos AS ENUM('admin', 'master teacher');
CREATE TYPE season AS ENUM('winter', 'spring', 'summer', 'fall');
CREATE TYPE user_status AS ENUM('active', 'inactive', 'pending');

CREATE TABLE tlp_user (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  position pos NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(15) NOT NULL,
  active user_status NOT NULL
);


/*CREATE TABLE administrator (
  admin_id SERIAL PRIMARY KEY,
  CONSTRAINT id FOREIGN KEY (admin_id) REFERENCES tlp_user(user_id)
);*/

CREATE TABLE master_teacher (
  teacher_id SERIAL PRIMARY KEY REFERENCES tlp_user(user_id),
  area INT REFERENCES area(area_id) NOT NULL,
  sites INT[]
);


CREATE TABLE site (
    site_id SERIAL PRIMARY KEY,
    site_name VARCHAR(255) NOT NULL,
    address_street VARCHAR(255) NOT NULL,
    address_city VARCHAR(255) NOT NULL,
    address_zip VARCHAR(5) NOT NULL,
    area_id INT REFERENCES area(area_id) NOT NULL,
    p_first_name VARCHAR(255) NOT NULL,
    p_last_name VARCHAR(255) NOT NULL,
    p_title VARCHAR(255) NOT NULL,
    p_num VARCHAR(255),
    p_phone_num VARCHAR(15) NOT NULL,
    p_email VARCHAR(255) NOT NULL,
    s_first_name VARCHAR(255),
    s_last_name VARCHAR(255),
    s_title VARCHAR(255),
    s_num VARCHAR(255),
    s_phone_num VARCHAR(15),
    s_email VARCHAR(255) NOT NULL,
    notes VARCHAR(255)
);

CREATE TABLE area (
  area_id SERIAL PRIMARY KEY,
  area_name VARCHAR(255) NOT NULL,
  active BOOLEAN NOT NULL
);

CREATE TABLE student (
    student_id SERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    site_id INT REFERENCES site(site_id) NOT NULL,
    home_teacher VARCHAR(255) NOT NULL,
    student_group INT[],
    pretest_r INT[] NOT NULL,
    posttest_r INT[] NOT NULL,
    pretest_a INT[] NOT NULL,
    posttetst_a INT[] NOT NULL
);

CREATE TABLE student_group (
  group_id SERIAL PRIMARY KEY,
  year INT NOT NULL,
  cycle season NOT NULL,
  master_teacher INT REFERENCES master_teacher(teacher_id) NOT NULL,
  students INT[] NOT NULL,
  site_id INT REFERENCES site(site_id) NOT NULL,
  meeting_time DATE NOT NULL
);

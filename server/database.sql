CREATE DATABASE tlp;

CREATE TYPE pos AS ENUM('admin', 'master teacher');
CREATE TYPE season AS ENUM('winter', 'spring', 'summer', 'fall');

CREATE TABLE tlp_user (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  position pos,
  firstname VARCHAR(255),
  lastname VARCHAR(255),
  active BOOLEAN
);


CREATE TABLE administrator (
  admin_id SERIAL PRIMARY KEY,
  CONSTRAINT id FOREIGN KEY (admin_id) REFERENCES tlp_user(user_id)
);

CREATE TABLE master_teacher (
  master_id SERIAL PRIMARY KEY,
  CONSTRAINT id FOREIGN KEY (master_id) REFERENCES tlp_user(user_id)
);


CREATE TABLE site (
    site_id SERIAL PRIMARY KEY,
    site_name VARCHAR(255),
    address_street VARCHAR(255),
    address_city VARCHAR(255),
    address_zip VARCHAR(5),
    area_id INT,
    CONSTRAINT area_id FOREIGN KEY(area_id)
      REFERENCES site_area(area_id)
);

CREATE TABLE area (
  area_id SERIAL PRIMARY KEY,
  area_name VARCHAR(255),
  active BOOLEAN
);

CREATE TABLE student (
    student_id SERIAL PRIMARY KEY,
    site_id INT,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    CONSTRAINT site_id FOREIGN KEY(site_id)
      REFERENCES site(site_id),
    home_teacher VARCHAR(255),
    student_group INT[],
    CONSTRAINT student_group FOREIGN KEY(group_id)
      REFERENCES student_group(area_id)
    pretest_r INT[],
    posttest_r INT[],
    pretest_a INT[],
    posttetst_a INT[]
);

CREATE TABLE student_group (
  group_id SERIAL PRIMARY KEY,
  year INT,
  cycle season,
  master_teacher INT,
  CONSTRAINT master_teacher FOREIGN KEY(master_id)
    REFERENCES master_teacher(master_id),
  students INT[],
  site_id INT,
  CONSTRAINT site_id FOREIGN KEY(site_id)
    REFERENCES site(site_id),
  meeting_time DATE
);

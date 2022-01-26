CREATE DATABASE tlp;

CREATE TYPE pos AS ENUM('admin', 'master teacher');
CREATE TYPE season AS ENUM('winter', 'spring', 'summer', 'fall');

CREATE TABLE user(
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  position pos
);

CREATE TABLE administrator (
  admin_id SERIAL PRIMARY KEY
);

CREATE TABLE master_teacher (
  master_id SERIAL PRIMARY KEY
);


CREATE TABLE school (
    school_id SERIAL PRIMARY KEY,
    school_name VARCHAR(255),
    CONSTRAINT district_id
        FOREIGN KEY(district_id)
            REFERENCES school_district(district_id)
);

CREATE TABLE school_district (
  district_id SERIAL PRIMARY KEY
)

CREATE TABLE student (
    student_id SERIAL PRIMARY KEY,
    CONSTRAINT school_id
        FOREIGN KEY(school_id)
            REFERENCES school(school_id),
    home teacher VARCHAR(255),
    student_groups INT[],
    Pre-Test Reading Attitudes INT,
    Post-Test Reading Attitudes INT,
    Pre-Test Assessment Scores INT,
    Post-Test Assessment Scores INT,
);

CREATE TABLE student_group (
  group_id SERIAL,
  year INT,
  PRIMARY KEY (group_id, yr),
  CONSTRAINT master_id
      FOREIGN KEY(master_id)
          REFERENCES master_teacher(master_id),
  cycle season,
  students INT[],
  CONSTRAINT school_id
      FOREIGN KEY(school_id)
          REFERENCES school(school_id),
  meeting_time DATE
);

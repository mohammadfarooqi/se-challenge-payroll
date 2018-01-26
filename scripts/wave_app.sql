--DROP DATABASE IF EXISTS wave_app;
--CREATE DATABASE wave_app;

--\c wave_app;

--psql -h localhost -U <user_name> -p 5432 -f ./scripts/wave_app.sql postgres

DROP TABLE IF EXISTS employee_timecard;

CREATE TABLE IF NOT EXISTS employee_timecard (
  ID SERIAL PRIMARY KEY,
  date_worked DATE NOT NULL,
  hours_worked DECIMAL NOT NULL,
  employee_id INTEGER NOT NULL,
  job_group VARCHAR NOT NULL CONSTRAINT job_group_types CHECK (job_group IN ('A', 'B')),
  report_id INTEGER NOT NULL
);

--INSERT INTO employee_timecard (date_worked, hours_worked, employee_id, job_group, report_id)
--  VALUES (to_date('4/11/2016', 'MM-DD-YYYY'), 7.5, 11, 'A', 224),
--         (to_date('4/17/2016', 'MM-DD-YYYY'), 3, 12, 'B', 224);
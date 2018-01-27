-- Since the complexity of the data coming in is simple, therefore I decided to store 
-- all values in one table. If there were more info given, I would probaly have seperate
-- tables for employee which would contain name, address respective info on employee. 
-- I would also have a seperate table for job groups which would have the rate that is
-- associated to that group, so in future if that is changed we do not have to make
-- any additional changes and the math would simply work.


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
  job_group CHAR(1) NOT NULL CONSTRAINT job_group_types CHECK (job_group IN ('A', 'B')),
  report_id INTEGER NOT NULL
);

--INSERT INTO employee_timecard (date_worked, hours_worked, employee_id, job_group, report_id)
--  VALUES (to_date('4/11/2016', 'MM-DD-YYYY'), 7.5, 11, 'A', 224),
--         (to_date('4/17/2016', 'MM-DD-YYYY'), 3, 12, 'B', 224);
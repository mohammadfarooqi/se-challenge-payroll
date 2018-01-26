require('dotenv').config({ silent: true });

const fs = require('fs');
const csvjson = require('csvjson');
const path = require('path');
const promise = require('bluebird');
promise.config({longStackTraces: true});

const options = {
  // Initialization Options
  promiseLib: promise
};

const pgp = require('pg-promise')(options);
const connectionObj = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER ||'postgres',
  password: process.env.DB_PASS
};
const db = pgp(connectionObj);

function deleteFile(filepath) {
  fs.unlink(path.join(__dirname, '../' + filepath), (err) => {
    if (err) {
      console.log('Error deleting file', JSON.stringify(err));
    }

    console.log('Deleted file => ', filepath);
  });
}

function csvToJSON(filepath) {
  return new Promise((res, rej) => {
    const data = fs.readFileSync(path.join(__dirname, '../' + filepath), { encoding : 'utf8' });
    const options = {
      delimiter : ',', // optional
      quote     : '"' // optional
    };
    
    res(csvjson.toObject(data, options));
  });
}

function checkReportIdExists(report_id) {
  return new Promise(async (res, rej) => {
    try {
      report_id = parseInt(report_id);
      const result = await db.any('select * from employee_timecard where report_id = $1', report_id);
      
      if (result.length === 0) {
        res(false);
      } else {
        res(true);
      }
    } catch (err) {
      console.log('Error occured in checkReportIdExists: ', JSON.stringify(err));
      rej('Error occured in checkReportIdExists');
    }
  });
}

function insertCSVToDB(csvJSON) {
  return new Promise(async (res, rej) => {
    const report_id = parseInt(csvJSON.pop()['hours worked']);
    console.log('insertCSVToDB - adding values to table for report_id = ', report_id);
    
    let queries = 'insert into "employee_timecard" ("date_worked","hours_worked","employee_id","job_group","report_id") values ';
    
    csvJSON.map(item => {
      queries += "(to_date('" + item['date'] + "', 'DD-MM-YYYY'), " + parseFloat(item['hours worked']) + ", " + 
      parseInt(item['employee id']) + ", '" + item['job group'] + "', " + report_id + "),";
      
      // return {
        //   date_worked: to_date(item['date'], 'DD-MM-YYYY'),
        //   hours_worked: parseFloat(item['hours worked']),
        //   employee_id: parseInt(item['employee id']),
        //   job_group: item['job group'],
        //   report_id
        // };
      });
      
      // remove last comma from queries
      if (queries[queries.length - 1] === ',') {
        queries = queries.slice(0, -1);
      }

      queries += ';';
      
      //const queries = pgp.helpers.insert(csvJSON, ['date_worked', 'hours_worked', 'employee_id', 'job_group', 'report_id'], 'employee_timecard');
      console.log(queries);

    try {  
      const result = await db.any(queries);
      res(result);
    } catch (err) {
      console.log('Error occured in checkReportIdExists: ', JSON.stringify(err));
      rej('Error occured in checkReportIdExists' + JSON.stringify(err));
    }
  });
}

module.exports = {
  deleteFile,
  csvToJSON,
  checkReportIdExists,
  insertCSVToDB
}
require('dotenv').config({ silent: true });

const fs = require('fs');
const csvjson = require('csvjson');
const path = require('path');
const promise = require('bluebird');

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
   
    /* 
      for importing headers from different source you can use headers property in options 
      var options = {
        headers : "sr,name,age,gender"
      };
    */
   
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

module.exports = {
  deleteFile,
  csvToJSON,
  checkReportIdExists
}
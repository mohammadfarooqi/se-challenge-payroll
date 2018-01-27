require('dotenv').config({ silent: true });

const fs = require('fs');
const csvjson = require('csvjson');
const path = require('path');
const moment = require('moment');
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

function getAllEmployeeTimecardOrderByEmpIdDate() {
  return new Promise(async (res, rej) => {
    const query = 'select employee_id, to_char(date_worked, \'DD-MM-YYYY\') as "date_worked", job_group, hours_worked from employee_timecard ' +
                  'order by employee_id, date_worked';

    try {
      const query_result = await db.any(query);
      res(query_result);
    } catch (err) {
      console.log('Error in getAllEmployeeTimecardOrderByEmpIdDate func', JSON.stringify(err));
      rej('Error in getAllEmployeeTimecardOrderByEmpIdDate func ' + JSON.stringify(err))
    }
  });
}

function calculateAmountPaid(data) {
  const job_group_hourly = {
    'A': 20,
    'B': 30
  }

  return data.map(item => {
    return {
      employee_id: item.employee_id,
      date_worked: item.date_worked,
      amount_paid: job_group_hourly[item.job_group] * item.hours_worked
    }
  });
}

function groupByPayPeriod(data) {
  const result_array = [];
  
  const periods_group_by_emp = {};

  for (let i = 0; i < data.length; i++) {
    if (!periods_group_by_emp.hasOwnProperty(data[i].employee_id)) {
      periods_group_by_emp[data[i].employee_id] = [];
    }

    periods_group_by_emp[data[i].employee_id].push({ date_worked: data[i].date_worked, amount_paid: data[i].amount_paid });
  }

  // console.log(periods_group_by_emp);

  Object.keys(periods_group_by_emp).forEach(key => {
    // console.log(key);          // the name of the current key.
    // console.log(periods_group_by_emp[key]);   // the value of the current key.
    
    periods_group_by_emp[key] = sortDatesArray(periods_group_by_emp[key]);

    let sum = 0;
    let month_first_period_start = moment(moment(periods_group_by_emp[key][0].date_worked, 'DD-MM-YYYY')).startOf('month'); // 1
    let month_first_period_end = moment(month_first_period_start, 'DD-MM-YYYY').add('14', 'days'); // 15
    let month_second_period_start = moment(month_first_period_start, 'DD-MM-YYYY').add('15', 'days'); //16
    let month_second_period_end = moment(moment(periods_group_by_emp[key][0].date_worked, 'DD-MM-YYYY')).endOf('month'); // last day of month

    // console.log('month_first_period_start', month_first_period_start.toString());
    // console.log('month_first_period_end', month_first_period_end.toString());
    // console.log('month_second_period_start', month_second_period_start.toString());
    // console.log('month_second_period_end', month_second_period_end.toString());

    for (let i = 0; i < periods_group_by_emp[key].length; i++) {
      if (!moment(periods_group_by_emp[key][i].date_worked, 'DD-MM-YYYY').isBetween(month_first_period_start, month_second_period_end, null, '[]')) {
        // recalculate start/end for first/second halfs
        month_first_period_start = moment(moment(periods_group_by_emp[key][i].date_worked, 'DD-MM-YYYY')).startOf('month'); // 1
        month_first_period_end = moment(month_first_period_start, 'DD-MM-YYYY').add('14', 'days'); // 15
        month_second_period_start = moment(month_first_period_start, 'DD-MM-YYYY').add('15', 'days'); //16
        month_second_period_end = moment(moment(periods_group_by_emp[key][i].date_worked, 'DD-MM-YYYY')).endOf('month'); // last day of month
      }
      
      // if (moment(periods_group_by_emp[key][i].date_worked, 'DD-MM-YYYY').isBefore(month_first_period_end) || 
      //     moment(periods_group_by_emp[key][i].date_worked, 'DD-MM-YYYY').isSame(month_first_period_end)) {
      if (moment(periods_group_by_emp[key][i].date_worked, 'DD-MM-YYYY').isBetween(month_first_period_start, month_first_period_end, null, '[]')) {
        sum += periods_group_by_emp[key][i].amount_paid;
        
        // check if next value exits and is not in same start period
        if ((periods_group_by_emp[key][i + 1] && moment(periods_group_by_emp[key][i + 1].date_worked, 'DD-MM-YYYY').isAfter(month_first_period_end))  || !periods_group_by_emp[key][i + 1]) {
          // add sum to result array
          result_array.push({
            employee_id: key,
            pay_period: month_first_period_start.format('DD-MM-YYYY') + ' - ' + month_first_period_end.format('DD-MM-YYYY'),
            amount_paid: sum
          });

          // reset sum
          sum = 0;
        }
      } else if (moment(periods_group_by_emp[key][i].date_worked, 'DD-MM-YYYY').isBetween(month_second_period_start, month_second_period_end, null, '[]')) {
        sum += periods_group_by_emp[key][i].amount_paid;
        
        // check if next value exits and is not in same start period
        if ((periods_group_by_emp[key][i + 1] && moment(periods_group_by_emp[key][i + 1].date_worked, 'DD-MM-YYYY').isAfter(month_second_period_end)) || !periods_group_by_emp[key][i + 1]) {
          // add sum to result array
          result_array.push({
            employee_id: key,
            pay_period: month_second_period_start.format('DD-MM-YYYY') + ' - ' + month_second_period_end.format('DD-MM-YYYY'),
            amount_paid: sum
          });

          // reset sum
          sum = 0;
        }
      }
    }
  });

  console.log(periods_group_by_emp);

  return result_array;
}

function sortDatesArray(arr) {
  return arr.sort((a, b) => {
    return moment(a.date_worked, 'DD-MM-YYYY').format('X')-moment(b.date_worked, 'DD-MM-YYYY').format('X');
  });
}

module.exports = {
  deleteFile,
  csvToJSON,
  checkReportIdExists,
  insertCSVToDB,
  getAllEmployeeTimecardOrderByEmpIdDate,
  calculateAmountPaid,
  groupByPayPeriod
}
require('dotenv').config({ silent: true });

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const multer = require('multer');
const helper = require('./app/helper');

// directory for the uploads
const UPLOAD_DIR = './uploads/';

//define the type of upload multer would be doing and pass in its destination, single file with the name file
const upload = multer({ dest: UPLOAD_DIR }).single('file');

//allow cross origin requests
app.use((req, res, next) => { 
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// setup logger
app.use(morgan('dev'));

// configure app to use bodyParser() this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// routes for api
const router = express.Router();

// test route to make sure everything is working http://localhost:8080/api
router.get('/', (req, res) => {
  res.json({ message: 'Test Hello World Route!' });   
});

// file upload function route
router.post('/upload', (req, res, next) => {
  let path = '';
  upload(req, res, async (err) => {
    if (err) {
      // An error occurred when uploading
      console.log(err);
      return res.status(422).json({ message: 'Error: Unable to upload file.' });
    }

    // path of uploaded file, ie. uploads\ecad757bcfaec530978c32a81aa393ed
    path = req.file.path;

    let csvJSON;

    try {
      // read csv file and conver to JSON obj 
      csvJSON = await helper.csvToJSON(path);
    } catch (err) {
      console.log('Error in CSVJSON func', JSON.stringify(err));
    }

    // check if last obj in array contains report id and report number
    // note that report id comes under date column in csv and report id (the number)
    // comes under hours worked column in csv
    if (csvJSON.length > 0 && csvJSON[csvJSON.length - 1] && csvJSON[csvJSON.length - 1].date === 'report id' && csvJSON[csvJSON.length - 1]['hours worked']) {
      try {
        // check and see if report id we have in uploaded file exists in db (returns true/false)
        const result = await helper.checkReportIdExists(csvJSON[csvJSON.length - 1]['hours worked']);
        // console.log(result);

        // if report id does exist in db then send a 409
        if (result) {
          // delete file 
          helper.deleteFile(path);
        
          return res.status(409).json({ message: 'Error: report id in uploaded CSV already exists.' });
        }
      } catch (err) {
        console.log('Error in returning checkReportIdExists: ', JSON.stringify(err));
      }
    }

    try {
      // at this point, its a new report, insert rows to database
      const insert_result = await helper.insertCSVToDB(csvJSON);
      console.log('insert result = ', insert_result);

      // delete file 
      helper.deleteFile(path);
    } catch (err) {
      console.log('Error in insertCSVToDB func', JSON.stringify(err));
    }

    // return res.send('Upload Completed for ' + path); 
    return res.json({ message: 'Upload Completed for ' + path, csvJSON });
  });     
});

// register routes... routes prefixed /api
app.use('/api', router);

// default catch-all route that sends back a error message in JSON format.
router.get('*', (req, res) => res.status(404).json({
  message: 'Error - Not found'
}));

// start server
app.listen(PORT);
console.log('App running on port ' + PORT);

require('dotenv').config({ silent: true });

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const multer = require('multer');

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

require('./app/routes')(router, upload);

// register routes... routes prefixed /api
app.use('/api', router);

// default catch-all route that sends back a error message in JSON format.
router.get('*', (req, res) => res.status(404).json({
  message: 'Error - Not found'
}));

// start server
app.listen(PORT);
console.log('App running on port ' + PORT);

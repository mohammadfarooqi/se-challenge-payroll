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
app.use(function(req, res, next) { 
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

var PORT = process.env.PORT || 3000;

// routes for api
var router = express.Router();

// test route to make sure everything is working http://localhost:8080/api
router.get('/', function(req, res) {
  res.json({ message: 'Test Hello World Route!' });   
});

// file upload function route
router.post('/upload', function (req, res, next) {
  let path = '';
  upload(req, res, function (err) {
     if (err) {
       // An error occurred when uploading
       console.log(err);
       return res.status(422).send('an Error occured');
     }

     path = req.file.path;
     return res.send('Upload Completed for ' + path); 
  });     
});

// register routes... routes prefixed /api
app.use('/api', router);

// default catch-all route that sends back a error message in JSON format.
router.get('*', (req, res) => res.status(404).send({
  message: 'Error - Not found'
}));

// start server
app.listen(PORT);
console.log('App running on port ' + PORT);

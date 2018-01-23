var express = require('express');
var app = express();
var bodyParser = require('body-parser');
const morgan = require('morgan');

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
  res.json({ message: 'Hello World!' });   
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

'use strict';

// require statements (importing packages)
let express = require('express');
const cors = require('cors');

// initializations
let app = express();
app.use(cors());


require('dotenv').config();

const PORT = process.env.PORT;

// routes - endpoints
app.get("/location", handleLocation);

// handler functions
function handleLocation(req,res) {
    let searchQuery = req.query.city;
    let locationObject = getLocationData(searchQuery);
    res.status(200).send(locationObject);

    // let locationData =  require("./data/location.json");

    // // get values from object
    // let longitude = locationData[0].lon;
    // let latitude = locationData[0].lon;
}

// handle data for functions
function getLocationData(searchQuery) {
    // get the data array from json
    let locationData =  require("./data/location.json");
    // get values from object
    let longitude = locationData[0].lon;
    let latitude = locationData[0].lat;
    let displayName = locationData[0].display_name;
    // creat data object
    let responseObject = new CityLocation(searchQuery, displayName, latitude, longitude);
    return responseObject;
}
// constructor
function CityLocation (searchQuery, displayName, lat, lon) {
    this.search_query = searchQuery;
    this.displayName = displayName;
    this.formatted_query = lat;
    this.longitude= lon;
}


app.listen(PORT, ()=> {
    console.log(`The server is listening ${PORT}`);
});


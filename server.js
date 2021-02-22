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
app.get("/weather", handleWeather);
app.get("*", handleError);

// handler functions
function handleLocation(req,res) {
    try{
        let searchQuery = req.query.city;
        let locationObject = getLocationData(searchQuery);
        res.status(200).send(locationObject);
    }
    catch(error){
        res.app(500).send("Sorry the page doesn't exist ..."  + error)
    }

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
// -----------------------------
// -----------------------------
// -----------------------------
// -----------------------------


//handle functions
function handleWeather(req,res) {
    try {
        let weatherObject = getWeatherData();
        res.status(200).send(weatherObject);
    } catch (error){
        res.status(500).send("Sorry the page doesn't exist ..." + error)
    }
}

// handle data for functions
function getWeatherData() {
    let weatherData = require("./data/weather.json");
    let castArray = [];
    let casting = weatherData.data;

    for (let i = 0; i < casting.length; i++) {
        let newDateTime = new Date(casting[i].valid_date).toString();
        let stringDate = newDateTime.split(" ").splice(0,4).join(" ");
        let obj = new DataWeather(casting[i].weather.description, stringDate);
        castArray.push(obj);
    }
    return castArray;
}

function DataWeather(casting, timing) {
    this.forecast = casting;
    this.time = timing;

}
function handleError(req,res) {
    res.status(404).send("Sorry the page doesn't exist ... 404");    
}


app.listen(PORT, ()=> {
    console.log(`The server is listening ${PORT}`);
});

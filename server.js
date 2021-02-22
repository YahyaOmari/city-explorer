'use strict';

// require statements (importing packages)
let express = require('express');
const cors = require('cors');
let superagent = require('superagent');
const { get } = require('superagent');

// initializations and configuration
let app = express();
app.use(cors());


require('dotenv').config();

const PORT = process.env.PORT;

// routes - endpoints
app.get("/location", handleLocation);
// app.get("/weather", handleWeather);

// handler functions
function handleLocation(req,res) {

    try{
        let searchQuery = req.query.city;
        let locationObject = getLocationData(searchQuery, res);
        // res.status(200).send(locationObject);
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
function getLocationData(searchQuery, res) {
    // get the data array from json
    let query = {
        // key: 'pk.684e0dec99b3bb211943c83a3fe68756',
        key:process.env.GEOCODE_API_KEY,
        q : searchQuery,
        limit: 1,
        format: 'json'
    };

    let url = `https://eu1.locationiq.com/v1/search.php`;
    superagent.get(url).query(query).then(data => {
        try{
            let longitude = data.body[0].lon;
            let latitude = data.body[0].lat;
            let displayName = data.body[0].display_name;
            let responseObject = new CityLocation(searchQuery, displayName, latitude, longitude);        
            res.status(200).send(responseObject);
        } catch(error){
            res.status(500).send(error);
        }
    }).catch(error => {
        res.status(500).send("There was an error getting from API... " + error);
    });

    // let locationData =  require("./data/location.json");


    // // get values from object
    // let longitude = locationData[0].lon;
    // let latitude = locationData[0].lat;
    // let displayName = locationData[0].display_name;
    // let responseObject = new CityLocation(searchQuery, displayName, latitude, longitude);
    // return responseObject;
}
// constructor
function CityLocation (searchQuery, displayName, lat, lon) {
    this.search_query = searchQuery;
    this.formatted_query = displayName;
    this.latitude = lat;
    this.longitude= lon;
}
// --------------------------------------------------------------------
// --------------------------------------------------------------------
// -----------------------------WEATHER--------------------------------
// --------------------------------------------------------------------
// --------------------------------------------------------------------


// routes - endpoints
app.get("/weather", handleWeather);
//handle functions
function handleWeather(req,res) {

    let latit = req.query.latitude;
    let logit = req.query.longitude;
    let weatherObject = getWeatherData(res,latit, logit);
    // res.status(200).send(weatherObject);
}

// handle data for functions
function getWeatherData(res,latit, logit) {

        try{
            let weatherQuery = {
                lat: latit ,
                lon: logit ,
                key: process.env.WEATHER_API_KEY
            }
            let weatherUrl = 'https://api.weatherbit.io/v2.0/forecast/daily';
            // let weatherData = require("./data/weather.json");
        
        
            superagent.get(weatherUrl).query(weatherQuery).then(data =>{
                let castArray = [];
                let casting = data.body.data;
                // console.log(casting);
                
            for (let i = 0; i < casting.length; i++) {
                let newDateTime = new Date(casting[i].valid_date).toString();
                let stringDate = newDateTime.split(" ").splice(0,4).join(" ");

                let obj = new DataWeather(casting[i].weather.description, stringDate);
                castArray.push(obj);
            }
            // console.log(castArray);
            res.status(200).send(castArray);
        }).catch(error=>{
            res.status(500).send(error);
        })
    } catch(error){
        res.status(500).send("There was an error getting from API... " + error);
    }

}

function DataWeather(casting, timing) {
    this.forecast = casting;
    this.time = timing;

}
function handleError(req,res) {
    res.status(404).send("Sorry the page doesn't exist ... 404");    
}


// routes - endpoints -- error 404
// app.get("*", handleError);

app.listen(PORT, ()=> {
    console.log(`The server is listening ${PORT}`);
});

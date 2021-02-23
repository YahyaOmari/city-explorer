'use strict';

// require statements (importing packages)
let express = require('express');
const cors = require('cors');
let superagent = require('superagent');
// const { get } = require('superagent');
const pg = require('pg');

// initializations and configuration
let app = express();
app.use(cors());
require('dotenv').config();
const client = new pg.Client(process.env.DATABASE_URL);
// const client = new pg.Client({ 
//     connectionString: process.env.DATABASE_URL,   
//     ssl: { rejectUnauthorized: false } 
// });

const PORT = process.env.PORT;


// routes - endpoints
app.get("/location", handleLocation);

// handler functions
function handleLocation(req,res) {

    try{
        let searchQuery = req.query.city;
        getLocationData(searchQuery, res);
        // res.status(200).send(locationObject);
    }
    catch(error){
        res.app(500).send("Sorry the page doesn't exist ... handleLocation ..."  + error)
    }
}
// handle data for functions
function getLocationData(searchQuery, res) {
    // get the data array from json
    let query = {
        key:process.env.GEOCODE_API_KEY,
        q : searchQuery,
        limit: 1,
        format: 'json'
    };
    let url = `https://eu1.locationiq.com/v1/search.php`;

    superagent.get(url).query(query).then(data => {
        // try{
            let longitude = data.body[0].lon;
            let latitude = data.body[0].lat;
            let displayName = data.body[0].display_name;
            let responseObject = new CityLocation(searchQuery, displayName, latitude, longitude);        
            res.status(200).send(responseObject);


            let dbQuery = `INSERT INTO city (city_name, lon, lat) VALUES ($1, $2, $3) RETURNING*`;
            let safeValues = [searchQuery, longitude, latitude];

            client.query(dbQuery,safeValues).then(data=>{
              console.log('Data is connected and gave me this data ..  ',data.rows);
            }).catch(error=>{
              console.log('An error to connect '+ error);
            });
        // } catch(error){
        //     res.status(500).send(error);
        // }

        res.status(200).send('The latitude value is ' + latitude + ' and the longitude is '+longitude);
        
    }).catch(error => {
        res.status(500).send("There was an error getting from API...catch  for superagent ... " + error);
    });

    // let locationData =  require("./data/location.json");
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
    res.status(404).send("Sorry the page doesn't exist ... handleError ... 404");    
}
// --------------------------------------------------------------------
// --------------------------------------------------------------------
// -----------------------------PARK-----------------------------------
// --------------------------------------------------------------------
// -------------------------------------------------------------------- 

// routes - endpoints
app.get('/parks', handlePark);

//handle functions
function handlePark(req, res) {
    console.log('amman')
    console.log(req.query,'query');
    let searchQuery = req.query.search_query;
    getParkData(searchQuery).then(data =>{
        return res.status(200).send(data);
    });
}

// handle data for functions
function getParkData(name){
    const parkQuery = {
      'api_key':process.env.PARKS_API_KEY,
      'q':name
    }
    let parkUrl = 'https://developer.nps.gov/api/v1/parks';
    return superagent.get(parkUrl).query(parkQuery).then(data =>{
      let parkArray = data.body.data.map(element => {
        return new DataPark(element.fullName, Object.values(element.addresses[0]).join(' '),element.entranceFees.cost,element.description,element.url);
      });
      return parkArray;
    }).catch(error =>{
        return error;
    })
}
  

function DataPark(name, address, fee, description, url) {
    this.name = name;
    this.address = address;
    this.fee = fee;
    this.description = description;
    this.url = url;
}

client.connect(). then(()=>{
    app.listen(PORT, ()=> {
        console.log(`The server is listening ${PORT}`);
    });
}).catch(error=>{
    console.log(`There is an error to connect to the DB${error}`);
})
// routes - endpoints -- error 404
app.get("*", handleError);

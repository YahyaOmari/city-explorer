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
// const client = new pg.Client(process.env.DATABASE_URL);

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });


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

    let checkExist = 'SELECT * FROM city WHERE city_name =$1';
    let values = [searchQuery];
    // psql -d <database-name> -f <path/to/filename>

    client.query(checkExist, values).then(data=> {
        if(data.rowCount !== 0){
            console.log(data.rows[0].city_name,
                data.rows[0].display_name,

                 data.rows[0].lat, 
                 data.rows[0].lon + "This is the output from  constructor ");
            let locationObject = new CityLocation(data.rows[0].city_name,
                data.rows[0].display_name,

                 data.rows[0].lat, 
                 data.rows[0].lon
                 );
                 res.status(200).send(locationObject);
        } else {
            
            // get the data array from json
            let query = {
                key:process.env.GEOCODE_API_KEY,
                q : searchQuery,
                limit: 1,
                format: 'json'
            };
            let url = `https://eu1.locationiq.com/v1/search.php`;
        
            return superagent.get(url).query(query).then(data => {
                // try{
                    let longitude = data.body[0].lon;
                    let latitude = data.body[0].lat;
                    let displayName = data.body[0].display_name;
                    console.log(displayName + "This is the displayname");
                    let responseObject = new CityLocation(searchQuery, displayName, latitude, longitude);        
                    res.status(200).send(responseObject);
                    // console.log("Before the dbQuery");

                    let dbQuery = `INSERT INTO city (city_name, lon, lat) VALUES ($1, $2, $3) RETURNING *`;
                    let safeValues = [searchQuery, longitude, latitude];
                    // console.log("After the dbQuery");

                    client.query(dbQuery,safeValues).then(data=>{
                    // console.log("After Client Query");
                      console.log('Data is connected and gave me this data ..  ',data.rows);
                    }).catch(error=>{
                      console.log('An error to connect '+ error);
                    });
        
                res.status(200).send('The latitude value is ' + latitude + ' and the longitude is '+longitude);
                
            }).catch(error => {
                res.status(500).send("There was an error getting from API...catch  for superagent ... " + error);
            });
        }
    });
}
    // let locationData =  require("./data/location.json");

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
    // console.log('amman')
    // console.log(req.query,'query');
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
// --------------------------------------------------------------------
// --------------------------------------------------------------------
// -----------------------------MOVIE----------------------------------
// --------------------------------------------------------------------
// -------------------------------------------------------------------- 
// Movie routes
app.get("/movies", handleMovie);

function handleMovie(req, res) {
    let searchQuery = req.query.search_query;

    getMovieData(searchQuery, res);
}
function getMovieData(searchQuery, res) {

    let movieQuery={
      api_key: process.env.MOVIE_API_KEY,
      query: searchQuery,
    }
    
    let movieUrl = `https://api.themoviedb.org/3/search/movie`;
    superagent.get(movieUrl).query(movieQuery).then(data => {
      try {
        let movieArray = data.body.results;
        let movieObject = [];

        movieArray.map(movieValue => {
          let imageDisplay = 'https://image.tmdb.org/t/p/w500' + movieValue.poster_path ;
          let responseObject = new Movie(movieValue.title, movieValue.overview, movieValue.vote_average, movieValue.vote_count, imageDisplay, movieValue.popularity, movieValue.release_date);
          movieObject.push(responseObject);
        })
        res.status(200).send(movieObject);
  
      } catch {
        console.log('Everything is good in superagent... ' + error);
      }
    }).catch(error=> {
        console.log('Something went wrong with  superagent ... ' + error);
    })
}

function Movie(title, overview, avgVotes, totalVotes, image, popularity, released) {
    this.title = title;
    this.overview = overview;
    this.average_votes =  avgVotes;
    this.total_votes = totalVotes;
    this.image_url = image;
    this.popularity = popularity;
    this.released_on = released;
}


// --------------------------------------------------------------------
// --------------------------------------------------------------------
// -----------------------------Yelp-----------------------------------
// --------------------------------------------------------------------
// -------------------------------------------------------------------- 

// Yelp routes
app.get("/yelp", handleYelp);

function handleYelp(req, res) {
  // Accessing the data from the yelp API
  getYelpData(req, res);
}

function getYelpData(req,res) {
  // Using data from API
  let y = req.query.page;
  let x = 0 + y * 5;
  let yelpQuery = {
    term: "restaurants",
    location: req.query.search_query,
    limit: 5,
    offset: x
}

  let key={Authorization : `Bearer ${process.env.YELP_API_KEY}`}

  let yelpUrl = `https://api.yelp.com/v3/businesses/search`

  superagent.get(yelpUrl).set(key).query(yelpQuery).then(Data => {
    try {
      let yelpArray = Data.body.businesses;
      let arrayOfObject = [];

      yelpArray.map(valueYelp => {

        let responseObject = new DataYelp(valueYelp.name, valueYelp.image_url, valueYelp.price, valueYelp.rating, valueYelp.url);
        arrayOfObject.push(responseObject);
      })
      res.status(200).send(arrayOfObject);
    } catch {
        console.log('Everything is good in superagent... ' + error);
      }
    }).catch(error=> {
        console.log('Something went wrong with  superagent ... ' + error);
    })
}

function DataYelp(name, image_url, price, rating, url) {
  this.name = name;
  this.image_url = image_url;
  this.price = price;
  this.rating = rating;
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

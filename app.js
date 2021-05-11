//jshint esversion: 6

const express = require('express');
const app = express();
const axios = require('axios');
const path = require('path');
const md5 = require('md5');
const { response } = require('express');
const keys = require('./config');
const { exit } = require('process');
const firebase = require('firebase');
firebase.initializeApp(keys.firebase_config);
const database = firebase.database();
app.use(express.urlencoded({extended: true}));
app.use(express.json())
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));



app.get('/', function(req, res){
        res.render('index');
})

app.get('/index', function(req, res){
    res.redirect('/');
})

// get dates of today and first day of month
var date = new Date();
var dd = date.getDate();
var mm = date.getMonth(); 
var yyyy = date.getFullYear();
if(dd<10) 
{
    dd='0'+dd;
} 

if(mm<10) 
{
    mm='0'+mm;
} 
var firstDay = yyyy+'-'+mm+'-'+'01'; // of the month 
var toDay = yyyy+'-'+mm+'-'+dd;

//signup checks if username exists, if yes -> display error, else register the user successfully and take them to homepage
app.get('/signup', function(req, res){
    res.render('signup');
    app.post('/complete-signup', function(req1, res1){
        database.ref().child("usernames").orderByChild("username").equalTo(req1.body.username).once("value",snapshot => {
        if (snapshot.exists()){
                res1.render('error', {error: "That Username Already Exists! Please Try A Different One."});            
            }
        else{
            var user_obj={
                "username": req1.body.username,
                "email": req1.body.email,
                "password": md5(req1.body.p1)
            };
            var user_name = {"username": req1.body.username};
            axios.post(keys.firebase+'user/.json', user_obj)
            .then(function(){
                axios.post(keys.firebase+'usernames/.json', user_name)
                .then(function(){
                    res1.redirect('/');
                })
                .catch(function(){});
            })      
            .catch(function(error){
                console.log(error);
                })
            }
        });
        
    });
})

//User upon being signed in will have their username stored in a global variable, simulating session creation.
var current_user = "";
app.get('/signin', function(req, res){
    res.render('signin', {error:null});
    app.post('/complete-signin', function(req1, res1){
        database.ref().child("user").orderByChild("username").limitToFirst(1).equalTo(req1.body.username).once("value",snapshot => {
            if (!snapshot.exists()){
                    res1.render('signin', {error: "Username not found!"});            
                }
            else{
                const userData = snapshot.val();
                Objkey = Object.keys(userData)
                if(md5(req1.body.p1) == userData[Objkey].password){
                    current_user = userData[Objkey].username;
                    res1.render('error', {error: "Sign In Success!"})
                }
            }
        })
    })
})


//code for individual sports pages below

//basketball
//gameID has been made global to allow it to be accessed across functions, as it is obtained in sport and used in comment
var gameID = "";
app.get('/basketball', function(req,res){
    let d = new Date();
        let p = new Date();
        let t = new Date();
        p.setDate(p.getDate() - 1);
        t.setDate(t.getDate() + 1);
        d = d.toISOString().slice(0,10);p = p.toISOString().slice(0,10);t = t.toISOString().slice(0,10);
        axios.get('https://www.balldontlie.io/api/v1/games?seasons[]=2020&&start_date='+p+'&&end_date='+d)
        .then(function(response){
            axios.get("https://newsapi.org/v2/everything?q=NBA&apiKey="+keys.news)
            .then(function(response2){
                res.render('basketball', {data: response. data, news: response2.data.articles})
                app.post('/gameComments', function(req1, res1){
                gameID = req1.body.gameID.trim();
                res1.redirect('basketball/comments/' + req1.body.gameID.trim());
            })
        })        
    })
})


// soccer main page, lists competitions
var competitionsId;
app.get('/soccer',function(req,res){
    var options = {
        method: 'GET',
        url: 'http://api.football-data.org/v2/competitions/',
        headers: {
          'X-Auth-Token': '5a89a42fee7e466d8063f7cc9534055c'
        }
      };
      
      axios.request(options).then(function (response) {
          
        //   var socData = JSON.stringify(response.data);
          res.render('soccer', {data: response.data});
          app.post('/matches', function(socReq1, socRes1){
            competitionsId = socReq1.body.competitionsId.trim();
            socRes1.redirect('soccer/matches/' + socReq1.body.competitionsId.trim());
        })

      }).catch(function (error) {
          console.error(error);
      });
})



//page for matches of a particular soccer tourney
app.get('/soccer/matches/:id',function(req,res){
    var options = {
        method: 'GET',
        url: 'http://api.football-data.org/v2/competitions/'+competitionsId+'/matches',
        headers: {
          'X-Auth-Token': '5a89a42fee7e466d8063f7cc9534055c'
        }

    };
    axios.request(options).then(function (response) {
        console.log(response.data);
        res.render('matches',{data: response.data});
    

    }).catch(function (error) {
        console.error(error);
    });

})
    
//page for recent soccer matches
app.get('/soccer/matches/',function(req,res){

    console.log(firstDay);
    console.log(toDay);
    var options = {
        method: 'GET',
        url: 'http://api.football-data.org/v2/matches?dateFrom='+firstDay+'&dateTo='+toDay,
        headers: {
          'X-Auth-Token': '5a89a42fee7e466d8063f7cc9534055c'
        }
    };
    

    axios.request(options).then(function (response) {
        console.log(response.data);
        res.render('matches',{data: response.data});
    

    }).catch(function (error) {
        console.error(error);
    });

})


//hockey
app.get('/hockey',function(req,res){

    if(dd>2) {
        dd = dd - '02';
        var twoDaysAgo = yyyy+'-'+mm+'-'+dd;
    }else {
        var twoDaysAgo = yyyy+'-'+mm+'-'+dd;
    }
    var options = {
        method: 'GET',
        url: 'https://statsapi.web.nhl.com/api/v1/schedule' +'?startDate='+twoDaysAgo+'&endDate='+toDay,
    }
    axios.request(options).then(function (response) {
        console.log(response.data);
        res.render('hockey',{data: response.data});
    

    }).catch(function (error) {
        console.error(error);
    });
})
app.get('/:sport/comments/:id', function(req, res){
    var sport = req.params.sport
    var size = 0;
    axios.get(keys.firebase + sport+'/.json')
    .then(function(response){
        res.render('comments', {data: response.data, id: gameID});
    })   
    .catch(function(error){
    	console.log(error);
	})
		
    
    app.post('/comment', function(req, res){
        var username = "Anonymous"
        var obj = {
            "parentID": gameID,
            "content": req.body.userComment,
            "username": username
        }
        
        axios.post(keys.firebase+sport+'/.json', obj)
        .then(function(){
            res.redirect(sport+'/comments/'+gameID)
        })      
        .catch(function(){
    	console.log("error");
		}) 
        
    })
})

app.listen(3000);

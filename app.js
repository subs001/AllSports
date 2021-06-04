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
var current_user = "";


app.get('/', function(req, res){
        res.render('index');
})

app.get('/index', function(req, res){
    res.redirect('/');
})
//help
app.get('/help', function(req, res){
    res.render('help');
})
//profile
app.get('/profile', function(req, res){
    database.ref().child("user-comments/"+current_user).once("value",snapshot => {
                res.render('profile', {comments: snapshot.val(), user: current_user})       
                app.get('/logout', function(req1, res1){
                    current_user = "";
                    res1.redirect('/')
                })    
    })
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
                //res1.status(204).send();
                res1.render('error', {error: "That Username Already Exists! Please Try A Different One."});            
            }
        else{
            var user_obj={
                "username": req1.body.username,
                "email": req1.body.email,
                "password": md5(req1.body.p1),
                "subscribed": {
                    "basketball": true,
                    "soccer": true,
                    "football": true
                }
            };
            var user_name = {"username": req1.body.username};
            axios.post(keys.firebase+'user/.json', user_obj)
            .then(function(){
                axios.post(keys.firebase+'usernames/.json', user_name)
                .then(function(){
                    // axios.put(keys.firebase+'user-comments/'+req1.body.username+'.json', )
                    // .then(function(){
                         res1.redirect('/');
                    // })
                    // .catch(function(error){console.log(error);})
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
                    res1.redirect('profile');   
                }
                else{
                    res1.render('signin', {error: "Password is Incorrect!"})
                }
            }
        })
    })
})
//basketball
//gameID has been made global to allow it to be accessed across functions, as it is obtained in sport and used in comment
var gameID = "";
var gameDetails = "";
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
                gameDetails = req1.body.gameDetail;
                res1.redirect('basketball/comments/' + req1.body.gameID.trim());
            })
        })        
    })
})

//soccer
// soccer competitions page
var competitionsId;
app.get('/soccer/soccerCompetitions',function(req,res){
    var options = {
        method: 'GET',
        url: 'http://api.football-data.org/v2/competitions/',
        headers: {
          'X-Auth-Token': '5a89a42fee7e466d8063f7cc9534055c'
        }
      };
      
      axios.request(options).then(function (response) {
          
        //   var socData = JSON.stringify(response.data);
          res.render('soccerCOMP', {data: response.data});
          app.post('/soccer', function(socReq1, socRes1){
            competitionsId = socReq1.body.competitionsId.trim();
            socRes1.redirect('soccer' + socReq1.body.competitionsId.trim());
        })

      }).catch(function (error) {
          console.error(error);
      });
})



//page for matches of a particular soccer tourney(get id from clicking on comp page)
app.get('/soccer/:id',function(req,res){
    var options = {
        method: 'GET',
        url: 'http://api.football-data.org/v2/competitions/'+competitionsId+'/matches',
        headers: {
          'X-Auth-Token': '5a89a42fee7e466d8063f7cc9534055c'
        }
    };
    axios.request(options).then(function (response) {
        console.log(response.data);
        res.render('soccer',{data: response.data});
        

    }).catch(function (error) {
        console.error(error);
    });

})
    
//MAIN page for recent soccer matches
app.get('/soccer/',function(req,res){

    
    console.log(firstDay);
    console.log(toDay);
    var options = {
        method: 'GET',
        url: 'http://api.football-data.org/v2/matches?dateFrom='+firstDay+'&dateTo='+toDay,
        headers: {
          'X-Auth-Token': '5a89a42fee7e466d8063f7cc9534055c'
        }
    };
    axios.request(options).then(function(response){
        axios.get("https://newsapi.org/v2/everything?q=Soccer&sortBy=relevancy&apiKey="+keys.news).then(function(response2){
            console.log(response2.data);
            res.render('soccer', {data: response.data, news: response2.data.articles});
            
            app.post('/gameComments', function(req1, res1){
                console.log(req1.body.gameID);
                gameID = req1.body.gameID.trim();
                gameDetail = req1.body.gameDetail;
                res1.redirect('soccer/comments/' + req1.body.gameID);
            })

            }).catch(function (error) {
                console.error(error);
                });
    });

})

//hockey
app.get('/hockey',function(req,res){

    if(dd>2) {
        dd = dd - '01';
        var twoDaysAgo = yyyy+'-'+mm+'-'+dd;
    }else {
        var twoDaysAgo = yyyy+'-'+mm+'-'+dd;
    }
    var options = {
        method: 'GET',
        url: 'https://statsapi.web.nhl.com/api/v1/schedule' +'?startDate='+twoDaysAgo+'&endDate='+toDay,
    }
    axios.request(options).then(function(response){
        axios.get("https://newsapi.org/v2/everything?q=NHL&sortBy=relevancy&apiKey="+keys.news).then(function(response2){
            console.log(response2.data);
            res.render('hockey', {data: response.data, news: response2.data.articles});
            
            app.post('/gameComments', function(req1, res1){
                gameID = req1.body.gameID.trim();
                gameDetail = req1.body.gameDetail;
                res1.redirect('hockey/comments/' + req1.body.gameID.trim());
            })

            }).catch(function (error) {
                console.error(error);
                });
    });
});
// comments
app.get('/:sport/comments/:id', function(req, res){
    var sport = req.params.sport
    var size = 0;
    var gameTeams = gameDetails.split('-');
    console.log(gameID);
    console.log(gameTeams);
    axios.get(keys.firebase + sport+'/.json')
    .then(function(response){
        res.render('comments', {data: response.data, id: gameID, gameTeams: gameTeams});
    })   
    .catch(function(error){
    	console.log(error);
	})
		
    
    app.post('/comment', function(req, res){
        (current_user=="")?username="Anonymous":username=current_user;
        current_comment = req.body.userComment;
        var obj = {
            "parentID": gameID,
            "content": current_comment,
            "username": username
        }
        var datetime = new Date();
        datetime = datetime.toISOString().slice(0,10);
        axios.post(keys.firebase+sport+'/.json', obj)
        .then(function(){
            if(current_user!=""){
                axios.put(keys.firebase+'user-comments/'+current_user+'/'+current_comment+'/.json', [datetime])
                .then(function(){
                    res.status(204).send();
                })
                .catch(function(error){console.log(error);})
            }
            else{
                res.status(204).send();
            }
        })      
        .catch(function(){
    	console.log("error");
		}) 
        
    })
})

app.listen(3000);

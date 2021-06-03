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

app.get('/help', function(req, res){
    res.render('help');
})

app.get('/profile', function(req, res){
    res.render('profile');
})

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
        (current_user=="")?username="Anonymous":username=current_user;
        var obj = {
            "parentID": gameID,
            "content": req.body.userComment,
            "username": username
        }
        
        axios.post(keys.firebase+sport+'/.json', obj)
        .then(function(){
            res.status(204).send();
        })      
        .catch(function(){
    	console.log("error");
		}) 
        
    })
})

app.listen(3000);

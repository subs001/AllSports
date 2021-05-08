//jshint esversion: 6
const express = require('express');
const app = express();
const axios = require('axios');
const path = require('path');
const md5 = require('md5');
const { response } = require('express');
const bodyParser = require('body-parser');
const keys = require('./config');
const { exit } = require('process');
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
  }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));



app.get('/', function(req, res){
        res.render('index');
})

app.get('/index', function(req, res){
    res.redirect('/');
})

app.get('/signup', function(req, res){
    res.render('signup');
    app.post('/complete-signup', function(req1, res1){
        var user_obj={
            "username": req1.body.username,
            "email": req1.body.email,
            "password": md5(req1.body.p1)
        };
        axios.post(keys.firebase+'user/.json', user_obj)
        .then(function(){
            res1.redirect('/');
        })      
        .catch(function(error){
    	console.log(error);
		})

    });
})

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

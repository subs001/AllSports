//jshint esversion: 6
const express = require('express');
const app = express();
const axios = require('axios');
const path = require('path');
const { response } = require('express');
const bodyParser = require('body-parser');
const keys = require('./config');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));



app.get('/', function(req, res){
    
    axios.get('https://stats.nba.com/stats/boxscore')
    .then(function(response){
        console.log(response);
        res.render('index')
    })
    
   
})

app.get('/index', function(req, res){
    res.redirect('/');
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
        res.render('basketball', {data: response.data});
        app.post('/gameComments', function(req1, res1){
            gameID = req1.body.gameID.trim();
           res1.redirect('basketball/comments/' + req1.body.gameID.trim());
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
        
    })
})

app.listen(3000);

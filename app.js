//jshint esversion: 6
const express = require('express');
const app = express();
const axios = require('axios');
const path = require('path');
const { response } = require('express');
const bodyParser = require('body-parser');
const keys = require('./config');
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
// basketball
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



//page for matches of a particular copmetition
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

app.listen(4000);

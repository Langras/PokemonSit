
var PythonShell = require('python-shell');
var express = require('express');
var app = express();
var configs = [];
var bodyParser = require('body-parser')
var fs = require('fs');
var jsonfile = require('jsonfile');
var bots = [];
var io = require('socket.io').listen(app.listen(3000));
var socket;

var running_bots = {};

app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({     
  extended: true
}));
app.use('/map',express.static(__dirname + '/web'));
app.use('/',express.static(__dirname + '/view'));


console.log("# Pokemon Sit v0.1 \n");
console.log("# App running at localhost:3000");
jsonfile.readFile(__dirname+'/ps-config.json',function(err,data){
console.log("# Loaded PokemonSit config");
bots = data;
console.log("# Found "+bots.length+" bots");
loadConfigs();


});


function loadConfigs(){
for( var i = 0; i < bots.length; i++ )
{
  var config_name = './config-'+bots[i]+'.json';
  configs[bots[i]] = require(config_name);
  console.log("# Found bot config for user "+bots[i]);
}
updateMapUsers();
}


// Dashboard
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/view/index.html');
});

app.post('/startbot/:name',function (req, res){
  var bot_name = req.params.name;
  var config_name = "config-"+bot_name+".json";
  running_bots[bot_name] = new PythonShell('pokecli.py',{args:["-cf",config_name]});
  console.log("# Started bot "+bot_name);
  running_bots[bot_name].on('message', function (log_message) {
    socket.emit('log-message',{bot:bot_name,message:log_message});
  });
  if(socket)
    socket.emit('bot-status', {status:"running", bot: bot_name });

  running_bots[bot_name].end(function (err) {
    console.log(err);
    if(err){
      socket.emit('bot-status', { status:"crashed",bot: bot_name });
      running_bots[bot_name] = undefined;
    }else{
      socket.emit('bot-status', { status:"off",bot: bot_name });
    }
  });
});

io.sockets.on('connection', function (local_socket) {
    socket = local_socket;
    for(var i = 0;i < bots.length; i++)
    { 
      if(running_bots[bots[i]]!=undefined)
        socket.emit('bot-status', { status:"RUNNING",bot: bots[i] }); 
    }
});

app.post('/stopbot/:name',function (req, res){
  var bot_name = req.params.name;
  socket.emit('bot-status', { status:"off",bot: bot_name });
  if(running_bots[bot_name]){
    running_bots[bot_name].childProcess.kill('SIGINT');
  }
  console.log("# Stoped bot "+bot_name); 

});

app.get("/getconfig/:name",function (req,res){
  var bot_name = req.params.name;
  delete require.cache[require.resolve("./config-"+bot_name+".json")];
  var l_config = require("./config-"+bot_name+".json");

  res.send(l_config);
});

app.get("/getbots",function (req,res){
  res.send(bots);
});

app.post("/deletebot/:name",function (req,res){
  var bot_name = req.params.name;
  bots.splice(bots.indexOf(bot_name),1);
  fs.unlink(__dirname+"/config-"+bot_name+".json");
  jsonfile.writeFileSync(__dirname+'/ps-config.json',bots);
  console.log("# Deleted bot "+bot_name);
});

function updateMapUsers(){
  var text = 'var users = '+JSON.stringify(bots)+';\n\
var userZoom = true;\n\
var userFollow = true;\n\
var imageExt = ".png";\n\
var gMapsAPIKey = "'+configs[bots[0]].gmapkey+'";'
fs.writeFile(__dirname+"/web/userdata.js", text, function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("# Map users saved");
    }); 
}

app.post("/config/:name",function (req, res){
  var bot_name = req.params.name;

  //If we creating new bot
  if(bots.indexOf(bot_name) < 0)
  {
    bots.push(bot_name);
    jsonfile.writeFileSync(__dirname+'/ps-config.json',bots);
    console.log("# Creating new bot "+bot_name);
    updateMapUsers();
  }
    var config_l = req.body;
    var text ="{";
    config_l.initial_transfer = 0;
    var config_keys = Object.keys(config_l);
    for(var i =0 ; i<config_keys.length; i++)
    {
      text += "\n    \"" + config_keys[i] + "\": ";
      if(!isNaN(parseFloat(config_l[config_keys[i]])) && parseFloat(config_l[config_keys[i]])<100){
        text +=config_l[config_keys[i]];
      }else{
        text +="\""+config_l[config_keys[i]]+"\"";
      }
      if(i != config_keys.length-1)
        text += ",";
    }
    text += "\n}";
      
    fs.writeFile(__dirname+"/config-"+bot_name+".json", text, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("# Bot config file for "+bot_name+" was saved");
        updateMapUsers();
    }); 
}); 
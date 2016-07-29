
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
var pokemonArray = require('./web/pokemondata.json');
var logs = [];

var running_bots = {};

app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({     
  extended: true
}));
app.use('/map',express.static(__dirname + '/web'));
app.use('/',express.static(__dirname + '/view'));


console.log("# Pokemon Sit v0.1 \n");
console.log("# App running at localhost:3000");
loadPSConfig();

function loadPSConfig(){
  jsonfile.readFile(__dirname+'/config/ps-config.json',function(err,data){
    console.log("# Loaded PokemonSit config");
    bots = data;
    console.log("# Found "+bots.length+" bots");
    loadConfigs();
  });
}

function loadConfigs(){
  for( var i = 0; i < bots.length; i++ )
  {
    var config_name = './config/config-'+bots[i]+'.json';
    configs[bots[i]] = require(config_name);
    console.log("# Found bot config for user "+bots[i]);
  }
}


// Dashboard
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/view/index.html');
});

app.post('/startbot/:name',function (req, res){
  console.log("# Got signal to start bot");
  var bot_name = req.params.name;
  var config_name = "config/config-"+bot_name+".json";
  if(running_bots[bot_name])
  {
    return;
  }
  running_bots[bot_name] = new PythonShell('pokecli.py',{args:["-cf",config_name]});
  console.log("# Started bot "+bot_name);
  running_bots[bot_name].on('message', function (log_message) {
            var out ={};
            var message = log_message;
            out.bot = bot_name;
            out.message = message;
            out.color = "#000080";
            out.date = new Date();
            if(message.search("Configuration initialized")>-1)
            {
                out.message = "Loaded configuration";
                out.color = "#008000";
            }
            else if(message.search("Starting")>-1)
            {
                out.message = "Starting bot";
                out.color = "#008000";
            }
            else if(message.search("Walking")>-1)
            {
                out.message = "Walking...";
            }
            else if(message.search("Need to move closer to Pokestop")>-1)
            {
                out.message = "Walking to Pokestop";
            }
            else if(message.search("Spinning")>-1)
            {
                out.message = "Spinning pokestop";
                out.color = "#008000";
            }
            else if(message.search("[+]")>-1)
            {
                out.message = message.substring(message.search("[+]")+2);
                out.color = "#008000";
            }
            else if(message.search("Captured")>-1 && message.search("IV")>-1)
            {
                var pokemon_name = message.substring(message.search("Captured")).split(" ")[1].slice(0,-1);
                var pokemon_object = pokemonArray.find(function(pokemon){return pokemon.Name == pokemon_name});
                out.message = "<img src='map/image/pokemon/"+pokemon_object.Number+".png' height='50' /><span class='message-captured'>Captrured pokemon "+pokemon_name+"!</span>";
                out.color = "#008000";
            }
            else if(message.search("Inventory is full")>-1)
            {
                out.message = "Inventory is full, switching to catch mode";
                out.color = "#008080";
            }
            else{
                return;
            }
            logs.push(out);
    socket.emit('log-message',out);
  });
  if(socket)
    socket.emit('bot-status', {status:"running", bot: bot_name });

  running_bots[bot_name].end(function (err) {
    if (err) console.log(err);
    socket.emit('log-message',{bot:bot_name,message:"Bot stopped",color: "#80000",date: new Date()});
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
    for(var i = 0; i < logs.length; i++)
    {
        socket.emit('log-message',logs[i]);
    }
});

app.post('/stopbot/:name',function (req, res){
  var bot_name = req.params.name;
  console.log("# Got signal to stop bot");
  socket.emit('bot-status', { status:"off",bot: bot_name });
  if(running_bots[bot_name]){
    running_bots[bot_name].childProcess.kill('SIGINT');
    running_bots[bot_name] = undefined;
  }
  console.log("# Stoped bot "+bot_name); 

});

app.get("/getconfig/:name",function (req,res){
  var bot_name = req.params.name;
  delete require.cache[require.resolve("./config/config-"+bot_name+".json")];
  var l_config = require("./config/config-"+bot_name+".json");

  res.send(l_config);
});

app.get("/getbots",function (req,res){
  res.send(bots);
});

app.post("/deletebot/:name",function (req,res){
  var bot_name = req.params.name;
  bots.splice(bots.indexOf(bot_name),1);
  fs.unlink(__dirname+"/config/config-"+bot_name+".json");
  jsonfile.writeFileSync(__dirname+'/config/ps-config.json',bots);
  console.log("# Deleted bot "+bot_name);
  updateMapUsers();
});

function updateMapUsers(){
  loadConfigs();
  var text = 'var users = '+JSON.stringify(bots)+';\n\
var userZoom = true;\n\
var userFollow = true;\n\
var imageExt = ".png";\n\
var gMapsAPIKey = "'+configs[bots[0]].gmapkey +'";\n'
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
    jsonfile.writeFileSync(__dirname+'/config/ps-config.json',bots);
    console.log("# Creating new bot "+bot_name);
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
      
    fs.writeFile(__dirname+"/config/config-"+bot_name+".json", text, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("# Bot config file for "+bot_name+" was saved");
        updateMapUsers();
    }); 
}); 

var socket;
var bots = {};
var app;
var itemsArray = {
  '0': 'Unknown',
  '1': 'Pokeball',
  '2': 'Greatball',
  '3': 'Ultraball',
  '4': 'Masterball',
  '101': 'Potion',
  '102': 'Super Potion',
  '103': 'Hyper Potion',
  '104': 'Max Potion',
  '201': 'Revive',
  '202': 'Max Revive',
  '301': 'Lucky Egg',
  '401': 'Incense',
  '402': 'Spicy Incense',
  '403': 'Cool Incense',
  '404': 'Floral Incense',
  '501': 'Troy Disk',
  '602': 'X Attack',
  '603': 'X Defense',
  '604': 'X Miracle',
  '701': 'Razz Berry',
  '702': 'Bluk Berry',
  '703': 'Nanab Berry',
  '704': 'Wepar Berry',
  '705': 'Pinap Berry',
  '801': 'Special Camera',
  '901': 'Incubator ∞',
  '902': 'Incubator',
  '1001': 'Pokemon Storage Upgrade',
  '1002': 'Item Storage Upgrade'
};
var pokemonArray = [];

$(document).ready(function(){
    //Start the app
    app.init();
});

app = 
{
    updateView: function() {
        $(".bot-list").html("");
        $.each(bots, function(index, bot) {
            $(".bot-list").append('<li class="bot-item collection-item" data-bot-name="'+bot.name+'">\
            <div><span class="bot-status">'+bot.status+'</span><a href="#modal-info" class="info-bot modal-trigger">'+bot.name+'</a>\
            <a href="#!" class="red-text delete-bot secondary-content"><i class="material-icons">close</i></a>\
            <a href="#!" class="start-bot secondary-content"><i class="material-icons">play_arrow</i></a>\
            <a href="#!" class="stop-bot secondary-content"><i class="material-icons">stop</i></a>\
            <a class="config-bot secondary-content modal-trigger" href="#modal-config"><i class="material-icons">settings</i></a>\
            </div></li>');
        });
        $('.modal-trigger').leanModal();
    },
    init: function() {
        var gthis = this;
        

        socket = io.connect('http://localhost:3000', {
        'reconnection': true,
        'reconnectionDelay': 500,
        'reconnectionAttempts': 10
        });

        loadJSON('map/pokemondata.json', function(data) {
            pokemonArray = data;
        }, function(){});

        socket.on('bot-status', function (data){
            bots[data.bot].setStatus(data.status);
        });

        socket.on('log-message', function (data){
            bots[data.bot].logs.push(data);
            app.fillLogs();
        });
        this.initBots();
        this.initListeners();

    },
    initBots: function() {
        $.get("/getbots",function(bdata){
            var data = bdata;
            data.forEach(function(element) {
            if(bots[element] != undefined)
             return;
            bots[element] = {
                setStatus: function(status) {
                    console.log(status);
                    this.status = status;
                    app.updateView();
                },
                name: element,
                status: "off",
                logs: []
            };
        }, this);
        console.log("Updated "+data);
        app.initLogs();
        app.updateView();
        });
        
    },
    initListeners: function(){
        var gthis = this;
        $("body").on('click',".start-bot",function(){
            var bot_name = $(this).closest('.bot-item').attr("data-bot-name");
            bots[bot_name].setStatus("Starting");
            console.log("Starting bot "+bot_name);
            $.post( "/startbot/"+ bot_name);
        });

        $("body").on('click',".info-bot",function(){
            var bot_name = $(this).closest('.bot-item').attr("data-bot-name");
            addInventory(bot_name);
            
        });

        $("body").on('click',".stop-bot",function(){
            var bot_name = $(this).closest('.bot-item').attr("data-bot-name");
            bots[bot_name].setStatus("Stopping");
            console.log("Sending signal to stop bot!");
            $.post( "/stopbot/"+ bot_name);
        });

        $("body").on('click',".delete-bot",function(){
            var bot_name = $(this).closest('.bot-item').attr("data-bot-name");
            console.log("WARNING: Deleting bot "+bot_name);
            $.post( "/deletebot/"+bot_name);
            delete bots[bot_name];
            gthis.initBots(); 
        });

        $('body').on('click',".info-close",function(){
            $('#modal-info').closeModal();
        });

        $("body").on('click',".config-bot",function(){
            var bot_name = $(this).closest('.bot-item').attr("data-bot-name");
            $('#modal-config .modal-content').html('<h4>Settings</h4>\
              Service (ptc or google)\
              <input id="service" type="text">\
              Username\
              <input id="username" autocomplete="off" type="text">\
              Password\
              <input id="password" autocomplete="off" type="password">\
              Location\
              <input id="location" type="text">\
              Google Maps API key\
              <input type="text" id="gapi">');
            $.get( "/getconfig/"+bot_name,function(data){
                gthis.fillSettingsForm(data);
            });
        });

        $("body").on('click',".button-save",function() {
            var config = {
            "auth_service": $('#service').val(),
            "username": $('#username').val(),
            "password": $('#password').val(),
            "location": $('#location').val(),
            "gmapkey": $('#gapi').val(),
            "max_steps": 10,
            "mode": "all",
            "walk": 4,
            initial_transfer: 0,
            "location_cache": true,
            "distance_unit": "km",
            "item_filter": "101,102,103,104"
            };
            console.log(config);
            $.post("/config/"+$('#username').val(),config,function(){},"json");
            app.initBots();
            
        });
        $("body").on('click',".button-create",function(){
            var config = {
            "auth_service": $('#service').val(),
            "username": $('#username').val(),
            "password": $('#password').val(),
            "location": $('#location').val(),
            "gmapkey": $('#gapi').val(),
            "max_steps": 10,
            "mode": "all",
            "walk": 4,
            "initial_transfer": 0,
            "location_cache": true,
            "distance_unit": "km",
            "item_filter": "101,102,103,104"
            };
            console.log(config);
            $.post("/config/"+$('#username').val(),config,function(){},"json");
            app.initBots();
        });
    },
    fillSettingsForm: function(data) {
        $('#username').attr("value",data.username);
        $('#service').attr("value",data.auth_service);
        $('#password').attr("value",data.password);
        $('#location').attr("value",data.location);
        $('#gapi').attr("value",data.gmapkey);
    },
    initLogs: function() {
        $("#logs .tabs").html("");
        $(".logs-tabs").html("");
        $.each(bots,function(index,bot){
            var bot_name_id = index.replace(/[^A-Za-z0-9]/g, "");
            $("#logs .tabs").append('<li class="tab col s3"><a href="#'+bot_name_id+'">'+index+'</a></li>');
            $(".logs-tabs").append('<div id="'+bot_name_id+'" class="log-text col s12">Empty</div>')
        });
        $('ul.tabs').tabs();
        app.fillLogs();
    },
    fillLogs: function() {
        $.each(bots,function(index,bot){
            var bot_name_id = index.replace(/[^A-Za-z0-9]/g, "");
            $(".logs-tabs #"+bot_name_id).html("");
            for(var i = 1; i < bot.logs.length; i++)
            {
                var item = bot.logs[i];
                var currentDate = new Date(item.date);
                var time = ('0' + currentDate.getHours()).slice(-2) + ':' + ('0' + (currentDate.getMinutes())).slice(-2);
                $(".logs-tabs #"+bot_name_id).append("<div style='color:"+item.color+"'><span class='log-date'>"+time+"</span>"+item.message+"</div>");   
            }
            
        });
    }
};

function loadJSON(path, success, error) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState === XMLHttpRequest.DONE) {
      if (xhr.status === 200) {
        if (success)
          success(JSON.parse(xhr.responseText.replace(/\bNaN\b/g, 'null')));
      } else {
        if (error)
        error(xhr);
      }
    }
  };
xhr.open('GET', path, true);
xhr.send();
}
function addInventory(bot_name) {
  $.each(bots, function(index, bot) {
      loadJSON('map/inventory-' + index + '.json', function(data){
        bot.bagCandy = filter(data, 'pokemon_family');
        bot.bagItems = filter(data, 'item');
        bot.bagPokemon = filter(data, 'pokemon_data');
        bot.pokedex = filter(data, 'pokedex_entry');
        bot.stats = filter(data, 'player_stats');
      });
  });
  setTimeout(function(){fillInventory(bot_name)},500);
}
function fillInventory(bot_name){
            var current_user_stats = bots[bot_name].stats[0].inventory_item_data.player_stats;
            var text = '<div class="col s12">\
      <ul class="tabs">\
        <li class="tab col s3"><a class="active" href="#info">Info</a></li>\
        <li class="tab col s3"><a href="#items">Items</a></li>\
        <li class="tab col s3"><a href="#pokemon">Pokemon</a></li>\
        <li class="tab col s3"><a href="#pokedex">Pokedex</a></li>\
      </ul>\
    </div>\
    <div class="modal-content">\
        <div class="row">\
    <div id="info" class="col s12">\
    <h5>' +
              bot_name +
              '</h5><br>Level: ' +
              current_user_stats.level +
              '<br>Exp: ' +
              current_user_stats.experience +
              '<br>Exp to Lvl ' +
              ( parseInt(current_user_stats.level, 10) + 1 ) +
              ': ' +
              (parseInt(current_user_stats.next_level_xp, 10) - current_user_stats.experience) +
              '<br>Pokemon Encountered: ' +
              (current_user_stats.pokemons_encountered || 0) +
              '<br>Pokeballs Thrown: ' +
              (current_user_stats.pokeballs_thrown || 0) +
              '<br>Pokemon Caught: ' +
              (current_user_stats.pokemons_captured || 0) +
              '<br>Small Ratata Caught: ' +
              (current_user_stats.small_rattata_caught || 0) +
              '<br>Pokemon Evolved: ' +
              (current_user_stats.evolutions || 0) +
              '<br>Eggs Hatched: ' +
              (current_user_stats.eggs_hatched || 0) +
              '<br>Unique Pokedex Entries: ' +
              (current_user_stats.unique_pokedex_entries || 0) +
              '<br>PokeStops Visited: ' +
              (current_user_stats.poke_stop_visits || 0) +
              '<br>Kilometers Walked: ' +
              (parseFloat(current_user_stats.km_walked).toFixed(2) || 0) +
              '\
    </div>\
    ';
  //items 
  var current_user_bag_items = bots[bot_name].bagItems;
  text += '<div id="items" class="col s12"><div class="row items">';
    for (i = 0; i < current_user_bag_items.length; i++) {
      text += '<div class="col s12 m4 l3 center" style="float: left"><img src="map/image/items/' +
              current_user_bag_items[i].inventory_item_data.item.item_id +
              '.png" class="item_img"><br><b>' +
              itemsArray[current_user_bag_items[i].inventory_item_data.item.item_id] +
              '</b><br>Count: ' +
              (current_user_bag_items[i].inventory_item_data.item.count || 0) +
              '</div>';
    }
  text += '</div></div>';
  //pokemon
  pkmnTotal = bots[bot_name].bagPokemon.length;
    
    text += '<div id="pokemon" class="col s12"><div class="row items">';
    bots[bot_name].bagPokemon.sort(function(a, b){return b.inventory_item_data.pokemon_data.cp - a.inventory_item_data.pokemon_data.cp;});
    for (i = 0; i < bots[bot_name].bagPokemon.length; i++) {
      var current_pokemon_data = bots[bot_name].bagPokemon[i].inventory_item_data.pokemon_data;
      if (current_pokemon_data.is_egg) {
        continue;
      } else {
        pkmnNum = current_pokemon_data.pokemon_id;
        pkmnImage = pad_with_zeroes(current_pokemon_data.pokemon_id, 3) + '.png';
        pkmnName = pokemonArray[pkmnNum-1].Name;
        pkmnCP = "CP "+current_pokemon_data.cp;
        pkmnIVA = current_pokemon_data.individual_attack || 0;
        pkmnIVD = current_pokemon_data.individual_defense || 0;
        pkmnIVS = current_pokemon_data.individual_stamina || 0;
        pkmnIV = ((pkmnIVA + pkmnIVD + pkmnIVS) / 45.0).toFixed(2);
      }
      text += '<div class="col s12 m4 l3 center" style="float: left;"><img src="map/image/pokemon/' + pkmnImage + '" class="png_img"><br><b>' + pkmnName +
      '</b><br>' + pkmnCP + '<br>IV '+pkmnIV+'</div>';
    }
    text += '</div></div>';

  //pokedex
  var sortedPokedex = [];
  for (i = 0; i < bots[bot_name].pokedex.length; i++) {
    pkmID = bots[bot_name].pokedex[i].inventory_item_data.pokedex_entry.pokedex_entry_number;
    pkmnName = pokemonArray[pkmID-1].Name;
    pkmEnc = bots[bot_name].pokedex[i].inventory_item_data.pokedex_entry.times_encountered;
    pkmCap = bots[bot_name].pokedex[i].inventory_item_data.pokedex_entry.times_captured;
    sortedPokedex.push({
      "name": pkmnName,
      "id": pkmID,
      "cap": (pkmEnc || 0),
      "enc": (pkmCap || 0)
    });
  }
  text += '<div id="pokedex" class="col s12">';
  for (var i = 0; i < sortedPokedex.length; i++) {
    pkmnNum = sortedPokedex[i].id;
    pkmnImage = pad_with_zeroes(pkmnNum, 3) +'.png';
    pkmnName = pokemonArray[pkmnNum-1].Name;
    pkmnName = pokemonArray[pkmnNum-1].Name;
    pkmnEnc = sortedPokedex[i].enc
    pkmnCap = sortedPokedex[i].cap
    text += '<div class="col s12 m6 l3 center"><img src="map/image/pokemon/' +
            pkmnImage +
            '" class="png_img"><br><b> ' +
            pad_with_zeroes(pkmnNum, 3) +
            ' ' +
            pkmnName +
            '</b><br>Times Seen: ' +
            pkmnEnc + 
            '<br>Times Caught: ' +
            pkmnCap +
            '<br>Candy: ' +
            pkmnCap +
            '</div>';
  }
  text += '</div>';
  //pokedex
  text += '</div></div>\
        <div class="modal-footer">\
            <a href="#!" class="info-close modal-action modal-close waves-effect waves-green btn-flat">Close</a>\
        </div>';
            $('#modal-info').html(text);
            $('ul.tabs').tabs();
}
function filter(arr, search) {
  var filtered = [];
  for(i=0; i < arr.length; i++) {
    if(arr[i].inventory_item_data[search] != undefined) {
      filtered.push(arr[i]);
    }
  }
  return filtered;
}
function pad_with_zeroes(number, length) {
  var my_string = '' + number;
  while (my_string.length < length) {
      my_string = '0' + my_string;
  }
  return my_string;
}
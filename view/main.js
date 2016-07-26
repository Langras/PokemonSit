
var socket;
var bots = {};
var app;

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
            <div><span class="bot-status">'+bot.status+'</span>'+bot.name+'\
            <a href="#!" class="red-text delete-bot secondary-content"><i class="material-icons">close</i>Delete</a>\
            <a href="#!" class="start-bot secondary-content"><i class="material-icons">play_arrow</i>Start bot</a>\
            <a href="#!" class="stop-bot secondary-content"><i class="material-icons">stop</i>Stop bot</a>\
            <a class="config-bot secondary-content modal-trigger" href="#modal-config"><i class="material-icons">settings</i>Config</a>\
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

        socket.on('bot-status', function (data){
            bots[data.bot].setStatus(data.status);
        });

        socket.on('log-message', function (data){
            bots[data.bot].logs.push(data.message);
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
        app.updateView();
        });
        
    },
    initListeners: function(){
        var gthis = this;
        $("body").on('click',".start-bot",function(){
            var bot_name = $(this).closest('.bot-item').attr("data-bot-name");
            bots[bot_name].setStatus("Starting");
            $.post( "/startbot/"+ bot_name);
        });

        $("body").on('click',".stop-bot",function(){
            var bot_name = $(this).closest('.bot-item').attr("data-bot-name");
            bots[bot_name].setStatus("Stopping");
            $.post( "/stopbot/"+ bot_name);
        });

        $("body").on('click',".delete-bot",function(){
            
            var bot_name = $(this).closest('.bot-item').attr("data-bot-name");
            console.log("WARNING: Deleting bot "+bot_name);
            $.post( "/deletebot/"+bot_name);
            delete bots[bot_name];
            gthis.initBots();
            
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
    }
};
![screenshot](http://i.imgur.com/dATFEyr.png)
# PokemonSit
I wanna be the very best,  
But I don't wanna go  

The fork of the fork of the ... Pokemon Go Bot.  
Easy to use bot with web interface.

### Installation Mac/Linux locally
```
$ git clone https://github.com/sniok/PokemonSit  
$ cd PokemonSit 
$ pip install -r requirements.txt
$ npm install
$ node index.js
```
or
### Deploy on heroku
 - Fork this repo
 - Go to [Heroku website](https://dashboard.heroku.com/)
 - Create new app
 - Go to Deploy and connect your GitHub account
 - Connect your fork
 - Under Settings tab make sure you have nodejs and python Buildpacks
 - Under Resources enable Dyno
 - Deploy app


## Features
 * Pretty web interface
 * Search Fort (Spin Pokestop)
 * Catch Pokemon
 * Release low cp pokemon
 * Walking as you
 * Limit the step to farm specific area for pokestops
 * Use the ball you have to catch, don't if you don't have
 * Rudimentary IV Functionality filter
 * Auto switch mode(Full of item then catch, no ball useable then farm)
 * Ignore certain pokemon filter
 * Use superior ball types when necessary
 * When out of normal pokeballs, use the next type of ball unless there are less than 10 of that type, in which case switch to farm mode

### Requirements (click each one for install guide)

- [Python 2.7.x](http://docs.python-guide.org/en/latest/starting/installation/)
- [pip](https://pip.pypa.io/en/stable/installing/)
- [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [protobuf 3](https://github.com/google/protobuf) (OS Dependent, see below)
- Node JS
- Npm
### Protobuf 3 installation

- OS X:  `brew update && brew install --devel protobuf`
- Windows: Download protobuf 3.0: [here](https://github.com/google/protobuf/releases/download/v3.0.0-beta-4/protoc-3.0.0-beta-4-win32.zip) and unzip `bin/protoc.exe` into a folder in your PATH.
- Linux: `apt-get install python-protobuf`

### Google Maps API key

1. Navigate to this [page](https://console.developers.google.com/flows/enableapi?apiid=maps_backend,geocoding_backend,directions_backend,distance_matrix_backend,elevation_backend,places_backend&keyType=CLIENT_SIDE&reusekey=true)
2. Select 'Create a project' in the dropdown menu.
3. Wait an eternity.
4. Click 'Create' on the next page (optionally, fill out the info)
5. Copy the API key that appears.
6. Paste it when creating bot

## FAQ

### What's IV ?
Here's the [introduction](http://bulbapedia.bulbagarden.net/wiki/Individual_values)

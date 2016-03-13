# lobby-controller

[![Build Status](https://travis-ci.org/HoboDermo/lobby.svg?branch=master)](https://travis-ci.org/HoboDermo/lobby)

> A simple lobby system to create and manage lobbies of users


## Install

```sh
$ npm install --save lobby
```


## Usage

```js

var lobbyController = require('lobby-controller')();

lobbyController.addLobbyType({type: 'lobby type', minUsers: 2, maxUsers: 4});

var lobby1 = lobbyController.join('lobby type', {id: 1, name: 'user'});

var lobby2 = lobbyController.get(lobby1.id);

var lobbies = lobbyController.getAll();

lobby1 === lobby2
//=> true

lobby1 === lobbies[0]
//=> true
```


## License

MIT © Diarmuid Delaney
const config = require("./src/config.js").Config;
const util = require("./src/util");
const packet = require("./src/enum.js").Packet;
const channel = require("./src/enum.js").Channels;
const roomlog = require("./src/enum.js").Room;
const GM = require("./src/GameVersions.js").GameVersions;
const cronjob = require("cron").CronJob;
const DB = require("./src/DB.js").DB;
const express = require("express");
const fs = require("fs-extra");
const _ = require("lodash");
const request = require("request");
const cronimp = require("./src/cron.js");
const app = express();
const https = require("https");
const http = require("http");
const msgpack = require("socket.io-msgpack-parser");

//var options = {
//    key: fs.readFileSync('./Keys/private.key'),
//    cert: fs.readFileSync('./Keys/certificate.crt'),
//};

const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  wsEngine: config.WsEngine,
  perMessageDeflate: { threshold: 32768, serverNoContextTakeover: false },
  parser: msgpack
});
const port = process.env.PORT || config.Port;
const democracy = require("democracy");
const dem = new democracy({
  source: `0.0.0.0:${port}`,
  peers: config.DemocracyPeerServers
});

var Settings = {},
  ServerData = {},
  ServerSettings = {},
  Areas = {},
  Rooms = [], //used
  Roomproperty = {}, //used
  Players = {}, //used
  Messagelog = [], //used
  Bans = {}, //used
  Mute = {},
  playerinterestarea = {},
  InMemoryDatabase = {},
  MapData = {};

app.get("/bans", (req, res) => {
  res.json(Bans);
});

app.get("/logs", (req, res) => {
  res.json(Messagelog);
});
app.get("/server", (req, res) => {
  res.json(config);
});
//When a api is called on the game server it writes into the game servers database
app.get("/testdb", (req, res) => {
  DB.Writefile(fs, "Test", "thisiseominput");
});
//Read a database file that was written into
app.get("/testgetdeb", (req, res) => {
  DB.Readfile(fs, "Test");
});

app.get("/rooms", (req, res) => {
  res.json(io.sockets.adapter.rooms);
  //res.json(Roomproperty);
});

app.get("/players", (req, res) => {
  var Online = util.Objsize(Players);
  res.format({
    html: function () {
      res.send("<p>" + Online + "</p>");
    }
  });
});

app.get("/playersjson", (req, res) => {
  res.json(Players);
});

app.get("/roomprop", (req, res) => {
  var test = Roomproperty;
  for (const property in test) {
    console.log(`${property}: ${JSON.stringify(test)}`);
    //data.push(test)
  }
  //console.log(test);
  res.json(test);
});

app.get("/logs", (req, res) => {
  res.json(Messagelog);
});

app.get("/mute", (req, res) => {
  res.json(Rooms);
});

io.on("connection", (socket) => {
  var isOnline = false;
  var roomName;
  socket.shortID = util.GenerateID(4, "qwertyuiopasdfghjklzxcvbnm1234567890");
  socket.emit(packet.GiveUserShortid, socket.shortID);

  socket.on("joindefault", function (data) {
    if (Rooms.length < 1) {
      // No rooms, make one
      console.log("Debug info: Client connected but No rooms Exist");
      roomName = config.Rname + "0";
      Rooms.push(roomName);
    } else {
      console.log("Debug info: Rooms exists");

      var isRoomFound = false;
      for (var i = 0; i < Rooms.length; i++) {
        var clientsInRoom = io.sockets.adapter.rooms[Rooms[i]];
        var numClients = clientsInRoom
          ? Object.keys(clientsInRoom.sockets).length
          : 0;

        if (numClients < config.MaxClientsPerRoom) {
          console.log("Debug info: Room is not full so push clients into it");

          console.log();
          isRoomFound = true;
          roomName = config.Rname + i;
          break;
        }
      }

      // No empty room was found, create one
      if (!isRoomFound) {
        console.log("Debuf info: No empty rooms existed create a new one");
        var roomNumber = Rooms.length;
        roomName = config.Rname + roomNumber;
        io.in(Rooms[Rooms.length - 1]).emit(packet.isroomfull, "");
        Rooms.push(roomName);
      }
    }
    socket.join(roomName, () => {
      io.in(roomName).emit(packet.joinedroom, socket.shortID);
    });

    util.Createroom(Roomproperty, roomName);
    util.Createplayer(Players, socket.shortID, "Default", roomName, [], [], {});
  });

  socket.on(packet.bancheck, function (data) {
    console.log(Bans);
    if (data in Bans) {
      socket.emit(packet.ban);
    }
  });

  //----------UNUSED----------//
  dem.on(channel.global, function (msg) {
    socket.broadcast.emit(msg);
  });

  socket.on(packet.global, function (data) {
    socket.broadcast.emit(data);
    dem.publish(channel.global, data);
  });
  //----------END UNUSED----------//

  socket.on(packet.photon, function (data) {
    var splits = data.toString().split(["|"]);
    var serversidetype = splits[0];
    var eventype = splits[1];
    var message = splits[2];
    var room = Players[socket.shortID]["Room"];
    var ID = Players[socket.shortID]["Id"];
    switch (serversidetype) {
      default:
        break;
      case packet.self:
        socket.emit(eventype, message);
        break;
      case packet.othersinroom:
        socket.to(room).emit(eventype, message);
        break;
      case packet.allinroom:
        if (Roomproperty[room]["Mutes"].includes(ID)) {
          socket.emit("Mute", "You are muted");
        } else {
          io.in(room).emit(eventype, message);
        }
        break;
      case packet.allclients:
        io.emit(eventype, message);
    }
  });

  socket.on(packet.roomlog, function (data) {
    var splits = data.toString().split(["|"]);
    var room = Players[socket.shortID]["Room"];
    var ID = Players[socket.shortID]["Id"];
    var logtype = splits[0];
    var logkey = splits[1];
    var subkey = splits[2];
    var logdata = splits[3];
    switch (logtype) {
      default:
        break;

      case roomlog.SyncObject:
        var valid = logdata.charAt(logdata.length - 1);
        if (valid === "d") {
          _.unset(Roomproperty[room].Roomlog, `SyncObj.${logkey}`);
        } else {
          _.set(
            Roomproperty[room].Roomlog,
            `SyncObj.${logkey}.${subkey}`,
            logdata
          );
        }

        break;
      case roomlog.SyncMap:
        var mapsyncdata = splits[1];
        Roomproperty[room].Roomlog.SyncMap = mapsyncdata;
        break;
      case roomlog.CheckIfSyncExists:
        var Check = _.get(Roomproperty[room].Roomlog, `SyncObj.${logkey}`);
        if (Check === undefined) {
          socket.emit(packet.roomlog, ID + "|" + roomlog.undefinedsync);
        } else {
          //socket.emit(packet.roomlog,Check)
        }
        break;
      case roomlog.DoFulLSync:
        var fulldata = _.get(Roomproperty[room].Roomlog, "SyncObj");
        //socket.emit(roomlog.DoFulLSync,fulldata);
        io.in(room).emit(roomlog.DoFulLSync, fulldata);
        break;

      case roomlog.RoomLogKey:
        socket.emit(
          packet.getroomlogprop,
          JSON.stringify(Roomproperty[room]["Roomlog"][logkey]) + "|" + subkey
        );
        break;

      case roomlog.SetKey:
        break;
    }
  });
  //Mutes or Unmutes a user from the room they are in
  socket.on(packet.roommute, function (data) {
    var splits = data.toString().split(["|"]);
    var room = Players[socket.shortID]["Room"];
    if (splits[1] === packet.mute) {
      Roomproperty[room]["Mutes"].push(splits[0]);
    }
    if (splits[1] === packet.unmute) {
      Roomproperty[room]["Mutes"].pop(splits[0]);
    }
  });
  //set coustom propertys for the player
  socket.on(packet.setcoustom_player_property, function (data) {
    var splits = data.toString().split(["|"]);
    util.SetPlayerValue(_, Players, socket, splits);
  });
  //get coustom propertys from the player
  socket.on(packet.getcoustom_player_property, function (data) {
    var splits = data.toString().split(["|"]);
    io.to(socket.id).emit(
      packet.getcoustom_player_property,
      util.AccessPlayerValue(_, Players, socket, splits)
    );
  });

  //set coustom propertys in the room
  socket.on(packet.setcoustom_room_propertys, function (data) {
    var splits = data.toString().split(["|"]);
    util.SetRoomValue(_, Roomproperty, Players, socket, splits);
  });

  //Get coustom propertys from the room
  socket.on(packet.getcoustom_room_propertys, function (data) {
    var splits = data.toString().split(["|"]);
    io.to(socket.id).emit(
      packet.getcoustom_room_propertys,
      util.AccessRoomValue(_, Roomproperty, Players, socket, splits)
    );
  });
  //leave the current room the user is in
  socket.on(packet.leaveroom, function (data) {
    socket.leave(Players[socket.shortID].Room);
  });
  //checks the games version against the servers version,if the version is not uptodate send the user to a screen that will take them to the latest game
  socket.on("rgv", function (data) {
    var splits = data.toString().split(["|"]);
    if (_.has(GM, splits[0])) {
      if (GM[splits[0]].version !== splits[1]) {
        socket.emit("gvo", "gvo");
      } else {
        socket.emit("gbl", GM[splits[0]]["Banneddomain"]);
      }
    }
  });

  //Player joined a coustom room
  socket.on(packet.joinroom, function (data) {
    if (Rooms.length < 1) {
      // No rooms, make one
      console.log("Debug info: Client connected but No rooms Exist");
      Rooms.push(data);
    } else {
      console.log("Debug info: Rooms exists");

      var isRoomFound = false;
      for (var i = 0; i < Rooms.length; i++) {
        var clientsInRoom = io.sockets.adapter.rooms[Rooms[i]];
        var numClients = clientsInRoom
          ? Object.keys(clientsInRoom.sockets).length
          : 0;

        if (numClients < config.MaxClientsPerCoustomRoom) {
          console.log("Debug info: Room is not full so push clients into it");

          console.log();
          isRoomFound = true;
          roomName = config.Rname + i;
          break;
        }
      }

      // No empty room was found, create one
      if (!isRoomFound) {
        console.log("Debuf info: No empty rooms existed create a new one");
        var roomNumber = Rooms.length;
        roomName = data;
        io.in(Rooms[Rooms.length - 1]).emit(packet.isroomfull, "");
        Rooms.push(data);
      }
    }
    socket.join(data, () => {
      io.in(data).emit(packet.joinedroom, socket.shortID);
    });

    util.Createroom(Roomproperty, data);
    util.Createplayer(Players, socket.shortID, "Default", data, [], [], {});
    Rooms.push(data);
  });

  socket.on("disconnect", function (data) {
    util.idsCreated.pop(socket.shortID);
    delete Players[socket.shortID];
    io.sockets.to(roomName).emit(packet.disconnect, socket.shortID);
  });
});

var Cleanrooms = new cronjob(
  "*/5 * * * * *",
  function () {
    for (var i = 0; i < Rooms.length; i++) {
      if (Rooms[i] in io.sockets.adapter.rooms) {
      } else {
        delete Roomproperty[Rooms[i]];
        Rooms.pop(i);
      }
      // dlvs(Roomproperty[Rooms[i]],"Roomlog.SyncObj" + splitss[0],splitss[1])
    }
  },
  null,
  true,
  "America/New_York"
);
var SaveRooms = new cronjob(
  "*/90 * * * * *",
  function () {
    for (var i = 0; i < Roomproperty.length; i++) {
      if (Roomproperty[i]["Persistant"] === true) {
        //Save persistant rooms to
      }
    }
  },
  null,
  true,
  "America/New_York"
);
SaveRooms.start();
Cleanrooms.start();

/* PRODUCTION
http.createServer(function (req, res) {
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    res.end();
}).listen(80);
*/
server.listen(port, function () {
  console.log("Server Started[Photon God Slayer]");
});

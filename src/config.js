var exports = (module.exports = {});

exports.Config = {
  Server: "Web Roleplaying Game Multiplayer",
  Rname: "WRPGM",
  Version: "0.0.1",
  MaxClientsPerRoom:50,
  MaxClientsPerCoustomRoom:100,
  Port: 3000, //parseInt(process.argv[2], 10)
  WsEngine: "uwss",
  DemocracyPeerServers: ["0.0.0.0:3000", "0.0.0.0:3001"]
};

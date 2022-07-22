 var exports = (module.exports = {});

exports.Packet = {
  Server: "Erigato Server ",
  GiveUserShortid: "gsid",
  UserDisconnect: "userdisconnect",
  global: "global",
  ban: "ban",
  bancheck: "bancheck",
  disconnect: "dc",
  setcoustom_player_property: "spp",
  getcoustom_player_property: "gpp",
  setcoustom_room_propertys: "srp",
  getcoustom_room_propertys: "gcp",
  photon: "p",
  leaveroom: "lr",
  joinroom: "jr",  
  allinroom: "r",
  othersinroom: "o",
  allclients: "a",
  self:"s",
  roommute:"rm",
  mute:"M",
  unmute:"N",
  joinedroom:"jer",
  isroomfull:"irm",
  roomlog:"rl",
  getroomlogprop:"rlg"
};

exports.Channels = {
  global: "global"
};

exports.Room={
  SyncObject:"SO",//objs will typically have a ID,X,Y position
  SyncMap:"SM",// Maps will typically have a Blob c2 tilemap string,
  undefinedsync:"us",
  definedsync:"ds",
  CheckIfSyncExists:"cse",
  DoFulLSync:"dfs",
  RoomLogKey:"gk",
  SetKey:"st"
  
}

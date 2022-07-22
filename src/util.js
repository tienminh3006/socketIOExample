var exports = (module.exports = {});
exports.idsCreated = ["test"];

exports.Count = function() {
  array_elements = ["foo", "ff"];

  array_elements.sort();

  var current = null;
  var cnt = 0;
  for (var i = 0; i < array_elements.length; i++) {
    if (array_elements[i] != current) {
      if (cnt > 0) {
        console.log(
          current + " comes --> " + cnt + " times" + " Total count" + i
        );
      }
      current = array_elements[i];
      cnt = 1;
    } else {
      cnt++;
    }
  }
  if (cnt > 0) {
    console.log(current + " comes --> " + cnt + " times");
  }
};

exports.GenerateID = function(charCount, allowedCharacters) {
  var charsAllowed = allowedCharacters.split("");

  var id = "";
  for (var i = 0; i < charCount; i++) {
    id += charsAllowed[Math.floor(Math.random() * charsAllowed.length)];
  }

  if (exports.idsCreated.includes(id)) {
    return exports.GenerateID(charCount, allowedCharacters);
  }
  exports.idsCreated[exports.idsCreated.length + 1] = id;
  return id;
};

exports.getRandomInt = function(max) {
  return Math.floor(Math.random() * Math.floor(max));
};

exports.getRandomIntInRange = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
exports.Logdata = function(data,type) {
  const event = new Date();
  const options = {hour:'numeric',minute:'numeric',second:'numeric' };
  var newdata=event.toLocaleDateString("en-US",options)
  type["push"]( newdata.replace(/ /g, '')+ "|" + data + "|");
};

exports.CleanLogdata = function(data,type) {
  type["push"](data);
};


exports.Objsize = function(obj) {
  var size = 0,
    key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) size++;
  }
  return size;
};

exports.Splitdata = function(text) {
  var splits = text.toString().split(["|"]);
  console.log(splits.length);
};

exports.Createroom=function(roomobj,roomname){
  roomobj[roomname] = {Bans:[],Mutes:[],Coustomproperty:{},Roomlog:{SyncObj:{},SyncMap:[]},Region:{},Persistant:false,PlayerAmount:0}
}

exports.AddtoRoomLog=function(roomobj,roomname,data){
  const search = '^';
  const replaceWith = '';
  if(data.includes("^")){
     roomobj[roomname].Roomlog+="|"+data.split(search).join(replaceWith);
    console.log("data valid")
  }
 
}

exports.Createplayer=function(Array,socket,Username,Roomname,Subchannels,Pubchannels,Coustomproperty){
      Array[socket] = {
      Id:socket,
      Username:Username,
      Room:Roomname,
      Subchannels:Subchannels,
      Pubchannels:Pubchannels,
      Coustomproperty:{}
    };
}


exports.AccessRoomValue=function(obj,Roompropertys,Playerss,sockets,splitss){
  return obj.get(Roompropertys[Playerss[sockets.shortID].Room],"Coustomproperty."+splitss[0],splitss[1]);
}

exports.AccessPlayerValue=function(obj,Playerss,sockets,splitss){
    return obj.get(Playerss[sockets.shortID],"Coustomproperty."+splitss[0],splitss[1]);
  
}

exports.SetRoomValue=function(obj,Roompropertys,Playerss,socketss,splitss){
  return obj.set(Roompropertys[Playerss[socketss.shortID].Room],"Coustomproperty."+splitss[0],splitss[1]);
  
}

exports.SetPlayerValue=function(obj,Playerss,socketss,splitss){
  return obj.set(Playerss[socketss.shortID],"Coustomproperty."+splitss[0],splitss[1]);
}


exports.hasOwnNestedProperty = function(baa,propertyPath){
    if(!propertyPath)
        return false;

    var properties = propertyPath.split('.');
    var obj = baa;

    for (var i = 0; i < properties.length; i++) {
        var prop = properties[i];

        if(!obj || !obj.hasOwnProperty(prop)){
            return false;
        } else {
            obj = obj[prop];
        }
    }

    return true;
};

var exports=(module.exports={})

exports.DB={}
exports.DB.Writefile=function(fsobj,Filename,InputData){
    var Serialize=JSON.stringify(InputData)
    fsobj.writeFile(Filename+".txt",Serialize,function(err){
    if(err) throw err
    console.log(Filename+" Succesfully written into")
  })
}

exports.DB.Readfile=function(fsobj,Filename){
    fsobj.readFile(Filename+".txt",'utf-8', function(err, data) {
    console.log("Reading "+Filename)
    if(err) throw err
    exports.DB[Filename]={data}
    console.log(exports.DB[Filename])
  });
}

exports.DB.makeFolder=function(fsobj,dir){
  if (!fsobj.existsSync(dir)){
    fsobj.mkdirSync(dir);
}
}
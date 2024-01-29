require("./config/congif.js")
const jwt=require("jsonwebtoken");
const bodyParser=require("body-parser");
const path=require("path");
const multer=require("multer");
const cors=require("cors");
const express=require("express");
var ipaddress = process.env.OPENSHIFT_NODEJS_IP || "localhost";
var port = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 8081;
//init();
const app=express();

//const urlencodedParser=bodyParser.urlencoded({extended:false});
//app.use(cookieParser());
//app.use(express.static("pages",options));
//app.use(express.static("public",options));
// app.use(cors());
const corsOptions ={
  origin:'http://localhost:3000',
  methods:["GET","POST","PUT","PATCH","DELETE"], 
  credentials:true,            //access-control-allow-credentials:true
  optionSuccessStatus:200,
}

app.use(cors(corsOptions)) // Use this after the variable declaration
// app.use(multer({dest:path.join(__dirname,"public/update/temp/")}).any());
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

const fs = require('fs');
var existingservices="";
fs.readdirSync("./controllers").forEach(file => {
  existingservices+=","+file.split(".")[0];
});
if(existingservices!==""){existingservices=existingservices.substring(1);}
// var servicenames=process.env.SERVICENAMES;//Production
var servicenames=process.env.SERVICENAMES||existingservices;//Development
if(typeof(servicenames)!=="string") {console.log("Please provide ENV SERVICENAMES");return;}
servicenames=servicenames.split(",");
existingservices=existingservices.split(",");
var flag=false;
var apis=[],apistemp=[];
servicenames.forEach(e => {
  if(existingservices.indexOf(e)!==-1){
    var controller = require('./controllers/'+e+'.js');
    controller.stack.forEach(e1=> {
      try{
        var tempvalues=Object.values(e1.route.methods);
        apis.push({path:e1.route.path,methods:Object.keys(e1.route.methods).filter((e,index)=>tempvalues[index]),servicename:e,port:port});
      } catch(e){}
    
    })
    app.use(controller);
    flag=true;
  }
});

if(!flag) {console.log("Please provide ENV SERVICENAMES");return;}
// console.log(apis);
fetcher("http://localhost:8080/registerapis",apis);
//=========Home Page/Web App Redirect
app.get("/",function(req,res){
  res.status(200).end("Server is Working...");
})

//=========NotFound
app.get("*",function(req,res){
  res.status(404).end(JSON.stringify({msg:"Not Found"}));
  return;
}).post("*",function(req,res){
  res.status(404).end(JSON.stringify({msg:"Not Found"}));
  return;
}).put("*",function(req,res){
  res.status(404).end(JSON.stringify({msg:"Not Found"}));
  return;
}).delete("*",function(req,res){
  res.status(404).end(JSON.stringify({msg:"Not Found"}));
  return;
}).patch("*",function(req,res){
  res.status(404).end(JSON.stringify({msg:"Not Found"}));
  return;
})
app.listen(port,function(){
  console.log("Server running on port "+port);
})
// console.log(app.route);
/*
app._router.stack.forEach(e => {
  // console.log(e.route.path)  ;
  try{
    console.log(JSON.stringify(e.route.methods));
    console.log(JSON.stringify(e.route.path));  
  } catch(e){}

})
*/
// console.log(apis);

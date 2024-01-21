//const https=require("https");
const { MongoClient,ObjectId,ISODate} = require("mongodb");
const { createClient }=require('redis');
const jwt=require("jsonwebtoken");
const express=require("express");
const bodyParser=require("body-parser");
const path=require("path");
const multer=require("multer");
const cors=require("cors");
const fs = require("fs");
const jwtkey="passenger@FLIGHT";
//const uri ="mongodb+srv://<user>:<password>@<cluster-url>?retryWrites=true&writeConcern=majority";

var ipaddress = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
var port = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 8080;
const urlMongo="mongodb://"+ipaddress+":27017/";
const urlRedis="redis://"+ipaddress+":6379";
var clientMongo = new MongoClient(urlMongo);
var ms={"ms1":"http://localhost:8081","ms2":"http://localhost:8082"};
async function fetcher(url,body=null,method="post") {
  try{
    var params={
      method: method,mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
          "Content-Type": "application/json",
          // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: "follow", // manual, *follow, error
      referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    };
    // if(localStorage.getItem("token")!==null){
    //     params["credentials"]= "include";
    //     params["headers"]["Authorization"]="Bearer "+localStorage.getItem("token");
    // }
    if(!(body===null||["get","delete"].indexOf(method.toLowerCase())!=-1)){
        params={...params,...{body:JSON.stringify(body)}}
    } else if(body===null&&["get","delete"].indexOf(method.toLowerCase())==-1){
        params.method="get";
    }
    var f=await fetch(url, params).then(async(res1)=>{
      var res=await res1.json();
      if(res.value!==undefined){
        //SUCCESS LOG
      } else {
        //ERROR LOG
      }
      if(res.msg!==undefined){
        //MSG FOR LOG
      }
    }).catch((e)=>{
      //ERROR LOG
    });  
  } catch(e){
    //ERROR LOG
  }
}

async function dbRedis(operation,key,value) {
  var clientRedis = new createClient({url: urlRedis});
//.on('error', err => 
  try {
    await clientRedis.connect();
    var doc1=null;
    if(operation=="set"){
      await clientRedis.set(key, value);
    } else if(operation=="get"){
      doc1= await clientRedis.get(key);
    } else if(operation=="del"){
      doc1= await clientRedis.del(key);
    }
    return await doc1;
  } catch(ex){
    return ex;
  } finally {
    await clientRedis.disconnect();
  }
}

async function db(collection,operation,query={},options={},update={},db="flight") {
  try {
    await clientMongo.connect();
    const dbo = clientMongo.db(db);
    var doc1=null;
    if(operation=="findOne"){
      doc1=await dbo.collection(collection).findOne(query,options);
    } else if(operation=="find"){
      doc1=await dbo.collection(collection).find(query,options).toArray();
    } else if(operation=="update"){
      doc1=await dbo.collection(collection).updateOne(query,{$set:update});
    } else if(operation=="updateMany"){
      doc1=await dbo.collection(collection).updateMany(query,{$set:update});
    } else if(operation=="insert"){
      doc1=await dbo.collection(collection).insertOne(query);
    } else if(operation=="insertMany"){
      doc1=await dbo.collection(collection).insertMany(query);
    } else if(operation=="remove"){
      doc1=await dbo.collection(collection).remove(query);
    } else if(operation=="drop"){
      doc1=await dbo.collection(collection).drop();
    }
    return await doc1;
    
  } catch(ex){
      return ex;
  } finally {
    await clientMongo.close();
  }
}
function init(){
  try{
    var d=new Date();
    db("flightstaffs","findOne",{role:"admin"}).then(async(res)=>{
      if(res!==null) return;
      var d=new Date();
      await db("terminals","drop").then((e)=>{}).catch((e)=>{});
      await db("flights","drop").then((e)=>{}).catch((e)=>{});
      await db("flightstaffs","drop").then((e)=>{}).catch((e)=>{});
      await db("passengers","drop").then((e)=>{}).catch((e)=>{});
      await db("trips","drop").then((e)=>{}).catch((e)=>{});
      await db("users","drop").then((e)=>{}).catch((e)=>{});

      await db("terminals","insertMany",
      [
        {iata:"IXR",airport:"Birsa Munda International Airport", city:"Ranchi",terminal:"T1",create_time:d,modify_time:d,status:1},
        {iata:"IXR",airport:"Birsa Munda International Airport", city:"Ranchi",terminal:"T2",create_time:d,modify_time:d,status:1},
        {iata:"CCU",airport:"Netaji Subhash Chandra Bose International Airport", city:"Kolkata",terminal:"T1",create_time:d,modify_time:d,status:1},
        {iata:"DEL",airport:"Indira Gandhi International Airport", city:"New Delhi",terminal:"T1",create_time:d,modify_time:d,status:1},
        {iata:"DEL",airport:"Indira Gandhi International Airport", city:"New Delhi",terminal:"T2",create_time:d,modify_time:d,status:1},
        {iata:"DEL",airport:"Indira Gandhi International Airport", city:"New Delhi",terminal:"T3",create_time:d,modify_time:d,status:1},
      ]
      ).then((e)=>{
        console.log("Airports Ready");
      }).catch((e)=>{
        console.error("Error: (Airports) ",e)
      });
      await db("flights","insertMany",
      [
        {number:"1E",type:"A320",create_time:d,modify_time:d,status:1},
        {number:"2E",type:"A320",create_time:d,modify_time:d,status:1},
        {number:"3E",type:"A320",create_time:d,modify_time:d,status:1},
      ]
      ).then((e)=>{
        console.log("Flights Ready");
      }).catch((e)=>{
        console.error("Error: (Flights) ",e)
      });
      await db("flightstaffs","insertMany",
      [
        {userid:"flightdesk1@domain.com",password:"unmr@123",name:"Flight Desk 1",email:"flightdesk1@domain.com",gender:"Male",employee_id:"fd1",terminals:["IXR"],create_time:d,modify_time:d,role:["flightdesk"],status:1},
        {userid:"flightdesk2@domain.com",password:"unmr@123",name:"Flight Desk 2",email:"flightdesk2@domain.com",gender:"Female",employee_id:"fd2",terminals:["CCU"],create_time:d,modify_time:d,role:["flightdesk"],status:1},
        {userid:"flightdesk3@domain.com",password:"unmr@123",name:"Flight Desk 3",email:"flightdesk3@domain.com",gender:"Female",employee_id:"fd3",terminals:["DEL"],create_time:d,modify_time:d,role:["flightdesk"],status:1},
        
        {userid:"staff01@domain.com",password:"unmr@123",name:"Staff 01",email:"staff01@domain.com",gender:"Male",employee_id:"staff01",terminals:["IXR"],create_time:d,modify_time:d,role:["staff"],status:1},
        {userid:"staff11@domain.com",password:"unmr@123",name:"Staff 11",email:"staff11@domain.com",gender:"Female",employee_id:"staff11",terminals:["IXR"],create_time:d,modify_time:d,role:["staff"],status:1},
        {userid:"staff02@domain.com",password:"unmr@123",name:"Staff 02",email:"staff02@domain.com",gender:"Male",employee_id:"staff02",terminals:["CCU"],create_time:d,modify_time:d,role:["staff"],status:1},
        {userid:"staff12@domain.com",password:"unmr@123",name:"Staff 12",email:"staff12@domain.com",gender:"Female",employee_id:"staff12",terminals:["CCU"],create_time:d,modify_time:d,role:["staff"],status:1},
        {userid:"staff03@domain.com",password:"unmr@123",name:"Staff 03",email:"staff03@domain.com",gender:"Male",employee_id:"staff03",terminals:["DEL"],create_time:d,modify_time:d,role:["staff"],status:1},
        {userid:"staff13@domain.com",password:"unmr@123",name:"Staff 13",email:"staff13@domain.com",gender:"Female",employee_id:"staff13",terminals:["DEL"],create_time:d,modify_time:d,role:["staff"],status:1},

        {userid:"fa1@domain.com",password:"unmr@123",name:"Flight Attendant 1",email:"fa1@domain.com",gender:"Male",employee_id:"fa1",create_time:d,modify_time:d,role:["flight_attendant"],status:1},
        {userid:"fa2@domain.com",password:"unmr@123",name:"Flight Attendant 2",email:"fa1@domain.com",gender:"Female",employee_id:"fa2",create_time:d,modify_time:d,role:["flight_attendant"],status:1},
        {userid:"fa3@domain.com",password:"unmr@123",name:"Flight Attendant 3",email:"fa3@domain.com",gender:"Male",employee_id:"fa3",create_time:d,modify_time:d,role:["flight_attendant"],status:1},
        {userid:"fa4@domain.com",password:"unmr@123",name:"Flight Attendant 4",email:"fa4@domain.com",gender:"Female",employee_id:"fa4",create_time:d,modify_time:d,role:["flight_attendant"],status:1},

        {userid:"pilot1@domain.com",password:"unmr@123",name:"Pilot 1",email:"pilot1@domain.com",gender:"Male",employee_id:"pilot1",create_time:d,modify_time:d,role:["pilot"],status:1},
        {userid:"pilot2@domain.com",password:"unmr@123",name:"Pilot 2",email:"pilot2@domain.com",gender:"Female",employee_id:"pilot2",create_time:d,modify_time:d,role:["pilot"],status:1},

        {userid:"copilot1@domain.com",password:"unmr@123",name:"Co Pilot 2",email:"copilot1@domain.com",gender:"Female",employee_id:"copilot1",create_time:d,modify_time:d,role:["co-pilot"],status:1},
        {userid:"copilot2@domain.com",password:"unmr@123",name:"Co Pilot 3",email:"copilot2@domain.com",gender:"Male",employee_id:"copilot2",create_time:d,modify_time:d,role:["co-pilot"],status:1},

        {userid:"admin1@domain.com",password:"unmr@123",name:"Admin 1",email:"admin1@domain.com",gender:"Male",employee_id:"admin1",create_time:d,modify_time:d,role:["admin"],status:1},

        // {userid:"admin1@domain.com",password:"unmr@123",name:"Admin 1",email:"admin1@domain.com",gender:"Male",employee_id:"admin1",create_time:d,modify_time:d,role:["admin"],status:1},
      ]
      ).then((e)=>{
        console.log("FlightStaffs Ready");
      }).catch((e)=>{
        console.error("Error: (FlightStaffs) ",e)
      });
    }).catch((e)=>{
      console.error("Error: ",e)
    });
  } catch (e){
    console.error("Error: ",e)
  }
}
init();
const authentication=async (req,res,next)=> {
  var res1=res,req1=req;
  var token=req.headers["authorization"];
  if(token!==undefined){
      try{
        if(token.indexOf("Bearer ")!==0)throw "Token not found";
        token=token.split(' ')[1];
        req.jwtpayload=jwt.verify(token,jwtkey);
        //
        await dbRedis("get",token).then((e)=>{
          res.on("finish", function() {
            //
          });
          if(req.path=="/api/trips"&&req.jwtpayload.role.indexOf("admin")==-1&&["post","put","patch","delete"].indexOf(req.method.toLowerCase())!==-1){
            res1.status(401).end(JSON.stringify({msg:"Unauthorized Access1!"}));
            return;
          }
          if(req.path=="/api/all"&&req.jwtpayload.role.indexOf("admin")==-1){
            res1.status(401).end(JSON.stringify({msg:"Unauthorized Access2!"}));
            return;
          }
          if(req.path=="/api/trips"&&["co-pilot","pilot","flight_attendant","admin"].indexOf(req.jwtpayload.role[0])==-1&&["get"].indexOf(req.method.toLowerCase())!==-1){
            res1.status(401).end(JSON.stringify({msg:"Unauthorized Access3!"}));
            return;
          }
          
        });
        if(req.path=="/api/logout/"){
          await dbRedis("del",token).then((e)=>{
            res1.status(200).end(JSON.stringify({value:[]}));
            return
          });
        }
        await next();
      } catch(ex){
        res1.status(401).end(JSON.stringify({msg:"Unauthorized Access4!"}));
      }
  } else {
    res1.status(401).end(JSON.stringify({msg:"Unauthorized Access5!"}));
  }
}
const tokengenerate= (payload)=>{
  const token=jwt.sign(payload,jwtkey),d=new Date();
  const expire={exp:(new Date(d.getTime() + 900000))};
  const value={token:token,expire:expire,payload,create_time:d,modify_time:d,status:1};
  dbRedis("set",token,JSON.stringify(value));
  db("sessions","insert",value);
  // 
  return token;
}
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
//=========Home Page/Web App Redirect
app.get("/",function(req,res){
  res.status(200).end("Server is Working...");

})
//=========Get passenger Detail + Track Report
app.post("/api/login",async function(req,res){
  var res1=res,req1=req;
  var password=req1.body.password.trim().toLowerCase();
  try{
    if(req.body.userid.trim().toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)===null){
      res1.status(403).end(JSON.stringify({msg:"Invalid Email ID!"}));
      return;
    } else if (req.body.password.trim().toLowerCase().match(/^[\w\d_@#$!]{8,20}$/)===null){
      res1.status(403).end(JSON.stringify({msg:"Invalid Password!"}));
      return;
    }
    await db("flightstaffs","findOne",{userid: req.body.userid.trim().toLowerCase(),status:1}).then((res)=>{
      if(res!==null){
        try{
          if(res.password==password){
            var payload={userid:res.userid,email:res.email,name:res.name,gender:res.gender,role:res.role,status:1};
            if(res.terminals!==null&&res.terminals!==undefined){payload={...payload,...{terminals:res.terminals}}};
            res1.status(200).end(JSON.stringify({token:tokengenerate({...payload,...{_id:res._id}}),value:payload}));
          } else {
            res1.status(401).end(JSON.stringify({msg:"Incorrect Password!"}));
          }  
        } catch(e){
          res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
        }
        return;
      }
    }).catch((e)=>{
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
    });
    await db("users","findOne",{userid: req.body.userid.trim().toLowerCase(),status:1}).then((res)=>{
      if(res===null){
        // function generatePassword(length=8) {
        //   charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_@",
        //   retVal = "";
        //   for (var i = 0, n = charset.length; i < length; ++i) {
        //       retVal += charset.charAt(Math.floor(Math.random() * n));
        //   }
        //   return retVal;
        // }
        var d=new Date();
        //var password=generatePassword().trim().toLowerCase();
        
        db("users","insert",{userid:req1.body.userid.trim().toLowerCase(),password:password,email:req1.body.userid.trim().toLowerCase(),create_time:d,modify_time:d,role:["user"],status:1}).then((res)=>{
          try{
            var payload={userid:req1.body.userid.trim().toLowerCase(),email:req1.body.userid.trim().toLowerCase(),role:["user"],status:1};
            res1.status(200).end(JSON.stringify({token:tokengenerate({...payload,...{_id:res.insertedId.valueOf()}}),value:payload,msg:"New Account Created Successfully."}));
          } catch(e){
            res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
          }
        }).catch((e)=>{
          res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
        });
      } else {
        try{
          if(res.password==password){
            var payload={userid:res.userid,email:res.email,name:res.name,gender:res.gender,role:res.role,status:1};
            res1.status(200).end(JSON.stringify({token:tokengenerate({...payload,...{_id:res._id}}),value:payload}));
          } else {
            res1.status(401).end(JSON.stringify({msg:"Incorrect Password!"}));
          }  
        } catch(e){
          
          res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
        }
      }
    }).catch((e)=>{
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
    });    

  } catch(e){
    res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
  }
  return;
})
//=========Logout
app.get("/api/logout",authentication,function(req,res){
  var res1=res,req1=req;
  try{
    res1.status(200).end(JSON.stringify({value:[]}));
  } catch(e){
    res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
  }  
  return;
})
//=========Refresh
app.get("/api/refresh",authentication,function(req,res){
  var res1=res,req1=req;
  try{
    res1.status(200).end(JSON.stringify({value:[]}));
  } catch(e){
    res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
  }
  return;
})
//=========Verify PNR
app.get("/api/pnr/:id",authentication,function(req,res){
  var res1=res,req1=req;
  try{
    //if(["staff"].indexOf(req.jwtpayload.role[0])==-1){res1.status(401).end(JSON.stringify({msg:"Unauthorized Access!"}));return;}
    db("passengers","findOne",{pnr:req.params.id,status:1},{password:0}).then((res)=>{
      if(res===null){res1.status(503).end(JSON.stringify({msg:"Invalid PNR"}));return;}
      if((req.jwtpayload.terminals.indexOf(res.from.iata)!==-1)||(req.jwtpayload.terminals.indexOf(res.to.iata)!==-1)){
        res1.status(200).end(JSON.stringify({value:res}));
      } else {
        res1.status(401).end(JSON.stringify({msg:"Unauthorized Access!"}));return;
      }
    }).catch((e)=>{
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
    }); 
  } catch(e){
    res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
  }
  return;
})
//=========GetAll passenger
app.get("/api/trips/:id/passengers",authentication,async function(req,res){
  var res1=res,req1=req;
  try{
    await db("trips","findOne",{_id:new ObjectId(req.params.id),"crew.userid":req.jwtpayload.userid,status:1},{projection:{_id:1}}).then((res)=>{
      if(res===null){res1.status(401).end(JSON.stringify({msg:"Unauthorized Access!"}));return;}
    }).catch((e)=>{
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
    });
    
    await db("passengers","find",{trip_id:new ObjectId(req.params.id),status:1},{sort:{_id:-1}}).then((res)=>{
      res1.status(200).end(JSON.stringify({value:res}));
    }).catch((e)=>{
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
    }); 
  } catch(e){
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
  }
  return;
})
//=========GetAll passenger
app.get("/api/passengers",authentication,async function(req,res){
  var res1=res,req1=req;
  try{
    var userid=req.jwtpayload.userid;
    await db("passengers","find",{$or:[{auth:req.jwtpayload.userid},{receiver_guardian_email:userid},{sender_guardian_email:userid},{crew:userid},{staff:userid},{flightdesk:userid}],status:1},{sort:{_id:-1}}).then((res)=>{
      res1.status(200).end(JSON.stringify({value:res}));
    }).catch((e)=>{
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
    }); 
  } catch(e){
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
  }
  return;
})
const ticketNumberGenerator = () => {
  const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const randomLetter = Math.floor(Math.random() * letters.length);
  const numbers = Math.floor(Math.random() * 100000);
  return letters[randomLetter].toUpperCase() + String(numbers).padStart(5, '0');
};

//=========Regiter passenger for Tracking
app.post("/api/passengers",authentication,async function(req,res){
  var res1=res,req1=req;
  try{
    var {modify_time,trip,from,to,departure,status,create_time, ...query } =req.body;
    var d=new Date();
    query={...query,...{create_time:d,modify_time:d,status:1}};

    await db("trips","findOne",{_id:new ObjectId(trip),status:1},{projection:{departure:1,arrival:1,from:1,to:1,flight:1}}).then((res)=>{
      if(res===null){res1.status(403).end(JSON.stringify({msg:"Invalid Flight"}));return;}
      res.trip_id=res._id;
      delete res._id;
      query={...query,...res};
    }).catch((e)=>{
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
    });
    
    query["pnr"]=ticketNumberGenerator();
    query["auth"]=[req.jwtpayload.userid];
    query["auth_email"]=req.jwtpayload.email;
    await db("passengers","insert",query).then((e)=>{
      res1.status(200).end(JSON.stringify({value:[],msg:"Booked Successfully."}));
    }).catch((e)=>{
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
    });
  } catch(e){
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
  }
  return;
})
//=========Get Trips by ID
app.get("/api/trips/:id",authentication,function(req,res){
  var res1=res,req1=req;
  try{
    db("trips","findOne",{_id:new ObjectId(req.params.id),status:1}).then((res)=>{
      res1.status(200).end(JSON.stringify({value:res}));
    }).catch((e)=>{
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
    }); 
  } catch(e){
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
  }
  return;
})

//=========Get passenger Detail by ID
app.get("/api/passengers/:id",authentication,function(req,res){
  var res1=res,req1=req;
  try{
    db("passengers","findOne",{_id:new ObjectId(req.params.id),status:1}).then((res)=>{
      res1.status(200).end(JSON.stringify({value:res}));
    }).catch((e)=>{
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
    }); 
  } catch(e){
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
  }
  return;
})
//=========Update passenger Detail
app.patch("/api/passengers/:id",authentication,function(req,res){
    var res1=res,req1=req;
      try{
      var {modify_time,status,create_time,_id,status, ...query } =req.body;
      var d=new Date();
      query={...query,...{modify_time:d}};

      db("passengers","update",{_id:new ObjectId(req.params.id),status:1},null,query).then((res)=>{
        res1.status(200).end(JSON.stringify({value:[]}));
      }).catch((e)=>{
        res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
      });
    } catch(e){
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
    }
    return;
})
//=========GetAll terminal
app.get("/api/terminals",authentication,function(req,res){
  var res1=res,req1=req;
  try{
    db("terminals","find",{status:1},{projection:{city:1,iata:1,airport:1,_id:0}}).then((res)=>{
      res1.status(200).end(JSON.stringify({value:[...new Map(res.map(item =>[item["iata"], item])).values()]}));
    }).catch((e)=>{
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
    }); 
  } catch(e){
    res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
  }
  return;
})
//=========searchflights
app.post("/api/searchflights",authentication,function(req,res){
  var res1=res,req1=req;
  try{
    var {departure,from,to, ...query } =req.body;
    db("trips","find",{$and:[{departure:{$gte:(new Date(departure))}},{departure:{$lt:(new Date((new Date(departure)).setDate((new Date(departure)).getDate() + 1)))}}],"from.iata":from,"to.iata":to,status:1},{projection:{crew:0},sort:{departure:-1}}).then((res)=>{
      res1.status(200).end(JSON.stringify({value:res}));
    }).catch((e)=>{
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
    }); 
  } catch(e){
    res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
  }
  return;
})
//=========GetAll trips
app.get("/api/trips",authentication,function(req,res){
  var res1=res,req1=req;
  try{
    db("trips","find",{$or:[{auth:req.jwtpayload.userid},{"crew.userid":req.jwtpayload.userid}],status:1},{sort:{_id:-1}}).then((res)=>{
      res1.status(200).end(JSON.stringify({value:res}));
    }).catch((e)=>{
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
    }); 
  } catch(e){
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
  }
  return;
})
//=========Set trips for admin
app.post("/api/trips",authentication,async function(req,res){
  var res1=res,req1=req;
  try{
    var d=req.body;
    var data={};
    await db("flights","findOne",{_id:new ObjectId(d.flight),status:1},{projection:{_id:1,number:1,type:1}}).then((res)=>{
      if(res===null){res1.status(403).end(JSON.stringify({msg:"Invalid Flight"}));return;}
      data["flight"]=res;
    }).catch((e)=>{
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
    });
    await db("terminals","findOne",{_id:new ObjectId(d.from),status:1},{projection:{_id:1,iata:1,airport:1,city:1,terminal:1}}).then((res)=>{
      if(res===null){res1.status(403).end(JSON.stringify({msg:"Invalid From (Airport Terminal)"}));return;}
      data["from"]=res;
    }).catch((e)=>{
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
    });
    await db("terminals","findOne",{_id:new ObjectId(d.to),status:1},{projection:{_id:1,iata:1,airport:1,city:1,terminal:1}}).then((res)=>{
      if(res===null){res1.status(403).end(JSON.stringify({msg:"Invalid To (Airport Terminal)"}));return;}
      data["to"]=res;
    }).catch((e)=>{
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
    });
    await db("flightstaffs","find",{_id:{ $in: d.crew.map(e=>new ObjectId(e))},status:1},{projection:{_id:1,name:1,userid:1,email:1,role:1}}).then((res)=>{
      if(res.length==0){res1.status(403).end(JSON.stringify({msg:"Invalid Crew Members"}));return;}
      data["crew"]=res;
    }).catch((e)=>{
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
    });
    try{
      data["departure"]=(new Date(d.departure));
    } catch(e){res1.status(403).end(JSON.stringify({msg:"Invalid Departure Date & Time"}));return;}
    try{
      data["arrival"]=(new Date(d.arrival));
    } catch(e){res1.status(403).end(JSON.stringify({msg:"Invalid Arrival Date & Time"}));return;}
    
    data["note"]=d.note;
    var d=new Date();
    data={...data,...{create_time:d,modify_time:d,auth:[req.jwtpayload.userid],status:1}};
    await db("trips","insert",data).then((res)=>{
      res1.status(200).end(JSON.stringify({value:[],msg:"New Trip Created Successfully."}));
    }).catch((e)=>{
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
    });
  } catch(e){
    res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
  }
  return;
})
//=========Get All for admin
app.get("/api/all",authentication,async function(req,res){
  var res1=res,req1=req;
  try{
    var data={};
    await db("flights","find",{status:1}).then((res)=>{
      data["flights"]=res;
    }).catch((e)=>{
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
    });
    await db("terminals","find",{status:1}).then((res)=>{
      data["terminals"]=res;
    }).catch((e)=>{
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
    });
    await db("flightstaffs","find",{status:1,role:"pilot"}).then((res)=>{
      data["pilots"]=res;
    }).catch((e)=>{
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
    });
    await db("flightstaffs","find",{status:1,role:"co-pilot"}).then((res)=>{
      data["co-pilots"]=res;
    }).catch((e)=>{
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
    });
    await db("flightstaffs","find",{status:1,role:"flight_attendant"}).then((res)=>{
      data["flight_attendants"]=res;
      res1.status(200).end(JSON.stringify({value:data}));
    }).catch((e)=>{
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
    });
  } catch(e){
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
  }
  return;
})

//=========Get Report passengers
app.get("/api/passengers/:id/status",authentication,async function (req,res){
  var res1=res,req1=req;
  try{
    var status=[];
    if(["user","flightdesk"].indexOf(req.jwtpayload.role[0])==-1){res1.status(401).end(JSON.stringify({msg:"Unauthorized Access!"}));return;}
    var query={};
    if(req.params.id.length==6){
      query={pnr:req.params.id.toUpperCase(),status:1};
    } else {
      query={_id:new ObjectId(req.params.id),status:1};
    }
    var _res="";
    await db("passengers","findOne",query,{_id:1,"to._id":1,"from._id":1,"trip._id":1}).then((res)=>{
      if(res===null){res1.status(403).end(JSON.stringify({msg:"Invalid Passenger!"}));return;}
      _res=res;req.params.id=res._id;
    }).catch((e)=>{res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;});
    if(["flightdesk"].indexOf(req.jwtpayload.role[0])!==-1){
      if(!((req.jwtpayload.terminals.indexOf(_res.from.iata)!==-1)||(req.jwtpayload.terminals.indexOf(_res.to.iata)!==-1))){
        res1.status(401).end(JSON.stringify({msg:"Unauthorized Access!"}));return;
      }
    } else if(["user"].indexOf(req.jwtpayload.role[0])!==-1){
      var userid=req.jwtpayload.userid;
      await db("passengers","findOne",{_id:new ObjectId(req.params.id),$or:[{auth:req.jwtpayload.userid},{receiver_guardian_email:userid},{sender_guardian_email:userid},{flightdesk:userid}],status:1}).then((res)=>{
        if(res===null){res1.status(401).end(JSON.stringify({msg:"Unauthorized Access!"}));return;}
      }).catch((e)=>{res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;});
    }

    await db("passengerstatus","find",{passenger_id:new ObjectId(req.params.id),status:1},{projection:{name:1,note:1,create_time:1,status:1,_id:0}}).then((res)=>{
      res1.status(200).end(JSON.stringify({value:[...res,...status.filter((e) => res.map((e)=>e.name).indexOf(e.name)==-1)]}));
    }).catch((e)=>{
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
    });
  } catch(e){
    
    res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
  }
  return;
})


//=========Get Task passenger
app.get("/api/passengers/:id/updatestatus",authentication,async function (req,res){
  var res1=res,req1=req;
  try{
    if(["staff","flight_attendant"].indexOf(req.jwtpayload.role[0])==-1){res1.status(401).end(JSON.stringify({msg:"Unauthorized Access!"}));return;}
    var status=[];
    var query={};
    if(req.params.id.length==6){
      query={pnr:req.params.id.toUpperCase(),status:1};
    } else {
      query={_id:new ObjectId(req.params.id),status:1};
    }
    var _res="";
    await db("passengers","findOne",query,{_id:1,"to._id":1,"from._id":1,"trip._id":1}).then((res)=>{
      if(res===null){res1.status(403).end(JSON.stringify({msg:"Invalid Passenger!"}));return;}
      _res=res;req.params.id=res._id;
    }).catch((e)=>{res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;});
    
    if(["flight_attendant"].indexOf(req.jwtpayload.role[0])!==-1){
      await db("trips","findOne",{_id:_res.trip_id,"crew.userid":req.jwtpayload.userid,status:1},{_id:1}).then((res)=>{
        if(res===null){res1.status(401).end(JSON.stringify({msg:"Unauthorized Access!"}));return;}
        if(req.jwtpayload.role[0]==="flight_attendant"){
          status=[{name:"Accept",status:false},{name:"On seat (Seat Number #)",status:false},{name:"Meal Given",status:false},{name:"Halt station (if any)",status:false},{name:"Handover to staff",status:false}];
        }
      }).catch((e)=>{res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;});
    } else if(["staff"].indexOf(req.jwtpayload.role[0])!==-1){
      if(req.jwtpayload.terminals.indexOf(_res.from.iata)!==-1){
        if(req.jwtpayload.role[0]==="staff"){
          status=[{name:"Accept",status:false},{name:"Checkin",status:false},{name:"Baggage Submission",status:false},{name:"Boarding Pass Given",status:false},{name:"SHA Done",status:false},{name:"Boarding Gate Checkin",status:false},{name:"Boarded Bus",status:false},{name:"Disembark from Bus",status:false},{name:"On Ramp",status:false},{name:"Others",status:false},{name:"Handover to other staff",status:false},{name:"Release",status:false}];
        }
      } else if(req.jwtpayload.terminals.indexOf(_res.to.iata)!==-1){
        if(req.jwtpayload.role[0]==="staff"){
          status=[{name:"Accept",status:false},{name:"Boarded Bus",status:false},{name:"Disembark from Bus",status:false},{name:"At Baggage Belt",status:false},{name:"Baggage Collected (Belt Number #)",status:false},{name:"Proceed Toward Arrival",status:false},{name:"Others",status:false},{name:"Handover to other staff",status:false},{name:"Release",status:false}];
        }
      } else {
        res1.status(401).end(JSON.stringify({msg:"Unauthorized Access!"}));return;
      }
    }

    await db("passengerstatus","find",{passenger_id:new ObjectId(req.params.id),auth:req.jwtpayload.userid,status:1},{projection:{name:1,note:1,create_time:1,status:1,_id:0}}).then((res)=>{
      res1.status(200).end(JSON.stringify({value:[...res,...status.filter((e) => res.map((e)=>e.name).indexOf(e.name)==-1)]}));
    }).catch((e)=>{
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
    });
  } catch(e){
    
    res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
  }
  return;
})

//=========Task Done on passengers
app.post("/api/passengers/:id/updatestatus",authentication,async function(req,res){
  var res1=res,req1=req;
  try{
    var {name,note, ...t } =req.body;
    if(name==undefined||name==null){
      res1.status(403).end(JSON.stringify({msg:"Invalid Input!"}));return;
    } else {
      name=name;
      note=(note==undefined||note==null)?"":note;
    }
    if(["staff","flight_attendant"].indexOf(req.jwtpayload.role[0])==-1){res1.status(401).end(JSON.stringify({msg:"Unauthorized Access!"}));return;}
    var status=[];
    var query={};
    var specialfare=false;
    if(req.params.id.length==6){
      query={pnr:req.params.id.toUpperCase(),status:1};
    } else {
      query={_id:new ObjectId(req.params.id),status:1};
    }
    var _res="";
    await db("passengers","findOne",query,{_id:1,"to._id":1,"from._id":1,"trip._id":1,specialfare:1}).then((res)=>{
      if(res===null){res1.status(403).end(JSON.stringify({msg:"Invalid Passenger!"}));return;}
      _res=res;specialfare=res.specialfare;
    }).catch((e)=>{res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;});
    
    if(["flight_attendant"].indexOf(req.jwtpayload.role[0])!==-1){
      await db("trips","findOne",{_id:_res.trip_id,"crew.userid":req.jwtpayload.userid,status:1},{_id:1}).then((res)=>{
        if(res===null){res1.status(401).end(JSON.stringify({msg:"Unauthorized Access!"}));return;}
        if(req.jwtpayload.role[0]==="flight_attendant"){
          status=[{name:"Accept",status:false},{name:"On seat (Seat Number #)",status:false},{name:"Meal Given",status:false},{name:"Halt station (if any)",status:false},{name:"Handover to staff",status:false}];  
        }
      }).catch((e)=>{res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;});
    } else if(["staff"].indexOf(req.jwtpayload.role[0])!==-1){
      if(req.jwtpayload.terminals.indexOf(_res.from.iata)!==-1){
        if(req.jwtpayload.role[0]==="staff"){
          status=[{name:"Accept",status:false},{name:"Checkin",status:false},{name:"Baggage Submission",status:false},{name:"Boarding Pass Given",status:false},{name:"SHA Done",status:false},{name:"Boarding Gate Checkin",status:false},{name:"Boarded Bus",status:false},{name:"Disembark from Bus",status:false},{name:"On Ramp",status:false},{name:"Others",status:false},{name:"Handover to other staff",status:false},{name:"Release",status:false}];
        }
      } else if(req.jwtpayload.terminals.indexOf(_res.to.iata)!==-1){
        if(req.jwtpayload.role[0]==="staff"){
          status=[{name:"Accept",status:false},{name:"Boarded Bus",status:false},{name:"Disembark from Bus",status:false},{name:"At Baggage Belt",status:false},{name:"Baggage Collected (Belt Number #)",status:false},{name:"Proceed Toward Arrival",status:false},{name:"Others",status:false},{name:"Handover to other staff",status:false},{name:"Release",status:false}];
        }
      } else {
        res1.status(401).end(JSON.stringify({msg:"Unauthorized Access!"}));return;
      }
    }
    if(status.filter((e)=>(e.name==name)).length==0){res1.status(403).end(JSON.stringify({value:[],msg:"Invalid Input!"}));return;}
    var query={};
    var d=new Date();
    await db("passengerstatus","find",{passenger_id:new ObjectId(_res._id),auth:req.jwtpayload.userid,status:1},{projection:{name:1,note:1,create_time:1,status:1,_id:0}}).then((res)=>{
      status=status.filter((e) => res.map((e)=>e.name).indexOf(e.name)==-1);
      if(status.filter((e)=>(!e.status&&e.name==name)).length!==1){res1.status(403).end(JSON.stringify({value:[],msg:"Already Done!"}));return;};
    }).catch((e)=>{
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
    });
    query={passenger_id:new ObjectId(_res._id),name:name,note:note,flight_staff:req.jwtpayload,create_time:d,modify_time:d,auth:[req.jwtpayload.userid],status:1};
    await db("passengerstatus","insert",query).then((res)=>{
    }).catch((e)=>{
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
    });
    if(specialfare=='Unaccompanied Minor'){
      await fetcher(ms["ms2"]+"/ms/passengers/notifications",{ids:_res._id,name:name,note:note,flight_staff:req.jwtpayload});
    }
    res1.status(200).end(JSON.stringify({value:{name:name,status:1,note:note,create_time:d}}));
  } catch(e){
    res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
  }
  return;
})


//=========Get Report trips
app.get("/api/trips/:id/status",authentication,async function (req,res){
  var res1=res,req1=req;
  try{
    var status=[];
    if(["co-pilot","admin"].indexOf(req.jwtpayload.role[0])==-1){res1.status(401).end(JSON.stringify({msg:"Unauthorized Access!"}));return;}
    
    await db("trips","findOne",{_id:new ObjectId(req.params.id),$or:[{auth:req.jwtpayload.userid},{"crew.userid":req.jwtpayload.userid}],status:1}).then((res)=>{
      if(res===null){res1.status(401).end(JSON.stringify({msg:"Unauthorized Access!"}));return;}
      if(req.jwtpayload.role[0]==="pilot"){
        status=[{name:"OUT",status:false},{name:"OFF",status:false},{name:"ON",status:false},{name:"IN",status:false}];          
      }
    }).catch((e)=>{res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;});

    await db("planestatus","find",{trip_id:new ObjectId(req.params.id),status:1},{projection:{name:1,note:1,create_time:1,status:1,_id:0}}).then((res)=>{
      res1.status(200).end(JSON.stringify({value:[...res,...status.filter((e) => res.map((e)=>e.name).indexOf(e.name)==-1)]}));
    }).catch((e)=>{
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
    });
  } catch(e){
    
    res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
  }
  return;
})

//=========Get Task trips
app.get("/api/trips/:id/updatestatus",authentication,async function (req,res){
  var res1=res,req1=req;
  try{
    if(["pilot"].indexOf(req.jwtpayload.role[0])==-1){res1.status(401).end(JSON.stringify({msg:"Unauthorized Access!"}));return;}

    var status=[];    
    await db("trips","findOne",{_id:new ObjectId(req.params.id),$or:[{auth:req.jwtpayload.userid},{"crew.userid":req.jwtpayload.userid}],status:1}).then((res)=>{
      if(res===null){res1.status(401).end(JSON.stringify({msg:"Unauthorized Access!"}));return;}
      if(req.jwtpayload.role[0]==="pilot"){
        status=[{name:"OUT",status:false},{name:"OFF",status:false},{name:"ON",status:false},{name:"IN",status:false}];
      }
    }).catch((e)=>{res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;});
    
    await db("planestatus","find",{trip_id:new ObjectId(req.params.id),auth:req.jwtpayload.userid,status:1},{projection:{name:1,note:1,create_time:1,status:1,_id:0}}).then((res)=>{
      res1.status(200).end(JSON.stringify({value:[...res,...status.filter((e) => res.map((e)=>e.name).indexOf(e.name)==-1)]}));
    }).catch((e)=>{
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
    });
  } catch(e){
    
    res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
  }
  return;
})

//=========Task Done on Trip
app.post("/api/trips/:id/updatestatus",authentication,async function(req,res){
  var res1=res,req1=req;
  try{
    var {name,note, ...t } =req.body;
    if(name==undefined||name==null){
      res1.status(403).end(JSON.stringify({msg:"Invalid Input!"}));return;
    } else {
      note=(note==undefined||note==null)?"":note;
    }
    var status=[{name:"OUT",status:false},{name:"OFF",status:false},{name:"ON",status:false},{name:"IN",status:false}];
    if(status.filter((e)=>(e.name==name)).length==0){res1.status(403).end(JSON.stringify({value:[],msg:"Invalid Input!"}));return;}

    if(["pilot"].indexOf(req.jwtpayload.role[0])==-1){res1.status(401).end(JSON.stringify({msg:"Unauthorized Access!"}));return;}

    await db("trips","findOne",{_id:new ObjectId(req.params.id),$or:[{auth:req.jwtpayload.userid},{"crew.userid":req.jwtpayload.userid}],status:1},{projection:{_id:1}}).then((res)=>{
      if(res===null){res1.status(401).end(JSON.stringify({msg:"Unauthorized Access!"}));return;}
    }).catch((e)=>{res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;});
    
    var d=new Date();
    var query={};
    await db("planestatus","find",{trip_id:new ObjectId(req.params.id),auth:req.jwtpayload.userid,status:1},{projection:{name:1,note:1,create_time:1,status:1,_id:0}}).then((res)=>{
      status=status.filter((e) => res.map((e)=>e.name).indexOf(e.name)==-1);
      if(status.filter((e)=>(!e.status&&e.name==name)).length!==1){res1.status(403).end(JSON.stringify({value:[],msg:"Already Done!"}));return;};
    }).catch((e)=>{
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
    });

    query={trip_id:new ObjectId(req.params.id),name:name,note:note,flight_staff:req.jwtpayload,create_time:d,modify_time:d,auth:[req.jwtpayload.userid],status:1};
    await db("planestatus","insert",query).then((res)=>{
    }).catch((e)=>{
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
    });
    await fetcher(ms["ms1"]+"/ms/trips/"+req.params.id+"/updatestatus",{name:name,note:note,flight_staff:req.jwtpayload});
    res1.status(200).end(JSON.stringify({value:{name:name,status:1,note:note,create_time:d}}));
  } catch(e){
    res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
  }
  return;
})

//=========NotFound
app.get("*",function(req,res){
  res.status(404).end(res.path);
  return;
})
app.post("*",function(req,res){
  res.status(404).end(res.path);
  return;
})
app.put("*",function(req,res){
  res.status(404).end(res.path);
  return;
})
app.delete("*",function(req,res){
  res.status(404).end(res.path);
  return;
})
app.patch("*",function(req,res){
  res.status(404).end(res.path);
  return;
})
app.listen(port,ipaddress,function(){
  console.log("Server running on port "+port);
})

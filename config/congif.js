const { createClient }=require('redis');
const jwt=require("jsonwebtoken");
const jwtkey="passenger@FLIGHT";
const urlMongo="mongodb://localhost:27017/";
const urlRedis="redis://localhost:6379";
const MongoClient = require("mongodb").MongoClient;
global.ObjectId=require("mongodb").ObjectId;

var clientMongo = new MongoClient(urlMongo);

global.fetcher=async(url,body=null,method="GET")=>{
  try{
    var params={
      method: method,//method
      mode: "cors", // no-cors, *cors, same-origin
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
    
    if(body!==null){
        if(method=="GET"){params.method="POST";}
        params={...params,...{body:JSON.stringify(body)}}
    }
    
    var f=await fetch(url, params);
    var res=await f.json();
    if(res.value!==undefined){
      //SUCCESS LOG
    } else {
      //ERROR LOG
    }
    if(res.msg!==undefined){
      //MSG FOR LOG
    } 
  } catch(e){
    //ERROR LOG
  }
}
global.dbRedis=async(operation,key,value)=>{
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
global.db=async (collection,operation,query={},options={},update={},db="flight")=>{
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
global.init=()=>{
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
global.authentication=async(req,res,next)=> {
  var res1=res,req1=req;
  var token=req.headers["authorization"];
  if(token!==undefined){
      try{
        if(token.indexOf("Bearer ")!==0)throw "Token not found";
        token=token.split(' ')[1];
        req.jwtpayload=jwt.verify(token,jwtkey);
        
        await dbRedis("get",token).then((e)=>{
          res.on("finish", function() {
            //
          });
          if(req.path=="/api/trips"&&req.jwtpayload.role.indexOf("admin")==-1&&["post","put","patch","delete"].indexOf(req.method.toLowerCase())!==-1){
            res1.status(401).end(JSON.stringify({msg:"Unauthorized Access!"}));
            return;
          }
          if(req.path=="/api/all"&&req.jwtpayload.role.indexOf("admin")==-1){
            res1.status(401).end(JSON.stringify({msg:"Unauthorized Access!"}));
            return;
          }
          if(req.path=="/api/trips"&&["co-pilot","pilot","flight_attendant","admin"].indexOf(req.jwtpayload.role[0])==-1&&["get"].indexOf(req.method.toLowerCase())!==-1){
            res1.status(401).end(JSON.stringify({msg:"Unauthorized Access!"}));
            return;
          }
          
        });
        if(req.path=="/api/logout/"){
          await dbRedis("del",token).then((e)=>{
            next();
            return;
          });
        }
        await next();
      } catch(ex){
        res1.status(401).end(JSON.stringify({msg:"Unauthorized Access!"}));
      }
  } else {
    res1.status(401).end(JSON.stringify({msg:"Unauthorized Access!"}));
  }
}
global.tokengenerate= async(payload)=>{
  const token=jwt.sign(payload,jwtkey),d=new Date();
  const expire={exp:(new Date(d.getTime() + 900000))};
  const value={token:token,expire:expire,payload,create_time:d,modify_time:d,status:1};
  dbRedis("set",token,JSON.stringify(value));
  db("sessions","insert",value);
  // 
  return token;
}
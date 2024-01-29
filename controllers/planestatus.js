require("../config/congif.js");
const router=require("express").Router();
// const service=require("../services/users.js");
//=========Get Report trips
router.get("/api/trips/:id/status",authentication,async function (req,res){
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
router.get("/api/trips/:id/updatestatus",authentication,async function (req,res){
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
router.post("/api/trips/:id/updatestatus",authentication,async function(req,res){
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
    await fetcher((process.env.APIGATEWAY||"http://localhost:8080")+"/ms/trips/"+req.params.id+"/updatestatus",{name:name,note:note,flight_staff:req.jwtpayload});
    res1.status(200).end(JSON.stringify({value:{name:name,status:1,note:note,create_time:d}}));
  } catch(e){
    res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
  }
  return;
})

module.exports = router;
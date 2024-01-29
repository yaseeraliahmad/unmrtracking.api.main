require("../config/congif.js");
const router=require("express").Router();
// const service=require("../services/users.js");

//=========GetAll trips
router.get("/api/trips",authentication,function(req,res){
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
router.post("/api/trips",authentication,async function(req,res){
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
//=========Get Trips by ID
router.get("/api/trips/:id",authentication,function(req,res){
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


module.exports = router;
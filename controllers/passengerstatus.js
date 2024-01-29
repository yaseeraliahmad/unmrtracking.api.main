require("../config/congif.js");
const router=require("express").Router();
// const service=require("../services/users.js");
//=========Get Report passengers
router.get("/api/passengers/:id/status",authentication,async function (req,res){
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
      }).catch((e)=>{console.log(e);res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;});
    }

    await db("passengerstatus","find",{passenger_id:new ObjectId(req.params.id),status:1},{projection:{name:1,note:1,create_time:1,status:1,_id:0}}).then((res)=>{
      res1.status(200).end(JSON.stringify({value:[...res,...status.filter((e) => res.map((e)=>e.name).indexOf(e.name)==-1)]}));
    }).catch((e)=>{
      console.log(e);
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
    });
  } catch(e){
    console.log(e);
    res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
  }
  return;
})

//=========Get Task passenger
router.get("/api/passengers/:id/updatestatus",authentication,async function (req,res){
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
router.post("/api/passengers/:id/updatestatus",authentication,async function(req,res){
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
      await fetcher((process.env.APIGATEWAY||"http://localhost:8080")+"/ms/passengers/notifications",{ids:_res._id,name:name,note:note,flight_staff:req.jwtpayload});
    }
    res1.status(200).end(JSON.stringify({value:{name:name,status:1,note:note,create_time:d}}));
  } catch(e){
    res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
  }
  return;
})


//=========Task Done on trips updatestatus
router.post("/ms/trips/:id/updatestatus",authentication,async function(req,res){
  var res1=res,req1=req;
  try{
    var {name,note,flight_staff, ...t } =req.body;
    if(name==undefined||name==null){
      res1.status(403).end(JSON.stringify({msg:"Invalid Input!"}));return;
    } else {
      note=(note==undefined||note==null)?"":note;
    }
    var status=[{name:"OUT",status:false},{name:"OFF",status:false},{name:"ON",status:false},{name:"IN",status:false}];
    if(status.filter((e)=>(e.name==name)).length==0){res1.status(403).end(JSON.stringify({value:[],msg:"Invalid Input!"}));return;}

    //SECURITY CHECK
    //if(/Condition for Verfy/){res1.status(401).end(JSON.stringify({msg:"Unauthorized Access!"}));return;}
    await db("trips","findOne",{_id:new ObjectId(req.params.id),"crew.userid":flight_staff.userid,status:1},{projection:{_id:1}}).then((res)=>{
      if(res===null){res1.status(403).end(JSON.stringify({msg:"Invalid Trip ID!"}));return;}
    }).catch((e)=>{res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;});

    var ids=[];
    await db("passengers","find",{trip_id:new ObjectId(req.params.id),specialfare:'Unaccompanied Minor',status:1},{projection:{_id:1}}).then(async(res)=>{      

      if(res.length===0){res1.status(403).end(JSON.stringify({msg:"Invalid Trip IDs!"}));return;}
      ids=res.map((e) => e._id);
    }).catch((e)=>{res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;});

    await db("passengerstatus","find",{passenger_id:{$in:ids},auth:flight_staff.userid,status:1},{projection:{name:1,note:1,create_time:1,status:1,_id:0}}).then(async(res)=>{
      status=status.filter((e) => res.map((e)=>e.name).indexOf(e.name)==-1);
      if(status.filter((e)=>(!e.status&&e.name==name)).length!==1){res1.status(403).end(JSON.stringify({value:[],msg:"Already Done!"}));return;};
    }).catch((e)=>{
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
    });

    var d=new Date();
    var query=[];
    ids.forEach((id)=>query.push({passenger_id:id,name:name,note:note,flight_staff:flight_staff,create_time:d,modify_time:d,auth:[flight_staff.userid],status:1}));
    
    await db("passengerstatus","insertMany",query).then(async(res)=>{
    }).catch((e)=>{res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;});

    if(ids.length>0){
      await fetcher((process.env.APIGATEWAY||"http://localhost:8080")+"/ms/passengers/notifications",{ids:ids,name:name,note:note,flight_staff:flight_staff});
    }
    res1.status(200).end(JSON.stringify({value:[]}));
  } catch(e){
    res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
  }
  return;
})


module.exports = router;
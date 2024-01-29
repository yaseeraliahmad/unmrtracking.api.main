require("../config/congif.js");
const router=require("express").Router();
// const service=require("../services/users.js");
//=========Verify PNR
router.get("/api/pnr/:id",authentication,function(req,res){
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
router.get("/api/trips/:id/passengers",authentication,async function(req,res){
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
router.get("/api/passengers",authentication,async function(req,res){
  var res1=res,req1=req;
  try{
    var userid=req.jwtpayload.userid;
    await db("passengers","find",{$or:[{auth:req.jwtpayload.userid},{receiver_guardian_email:userid},{sender_guardian_email:userid},{crew:userid},{staff:userid},{flightdesk:userid}],status:1},{sort:{_id:-1}}).then((res)=>{
      res1.status(200).end(JSON.stringify({value:res}));
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
const ticketNumberGenerator = () => {
  const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const randomLetter = Math.floor(Math.random() * letters.length);
  const numbers = Math.floor(Math.random() * 100000);
  return letters[randomLetter].toUpperCase() + String(numbers).padStart(5, '0');
};

//=========Regiter passenger - Booking
router.post("/api/passengers",authentication,async function(req,res){
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
//=========Get passenger Detail by ID
router.get("/api/passengers/:id",authentication,function(req,res){
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
router.patch("/api/passengers/:id",authentication,function(req,res){
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

module.exports = router;
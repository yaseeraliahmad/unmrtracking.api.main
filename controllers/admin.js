require("../config/congif.js");
const router=require("express").Router();
// const service=require("../services/users.js");

//=========Get All for admin
router.get("/api/all",authentication,async function(req,res){
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



module.exports = router;
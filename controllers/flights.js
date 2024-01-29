require("../config/congif.js");
const router=require("express").Router();
// const service=require("../services/users.js");
//=========searchflights
router.post("/api/searchflights",authentication,function(req,res){
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

module.exports = router;
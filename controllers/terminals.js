require("../config/congif.js");
const router=require("express").Router();
// const service=require("../services/users.js");
//=========GetAll terminal
router.get("/api/terminals",authentication,function(req,res){
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

module.exports = router;
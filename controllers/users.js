require("../config/congif.js");
const router=require("express").Router();
// const service=require("../services/users.js");
//=========Login
router.post("/api/login",async function(req,res){
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
    await db("flightstaffs","findOne",{userid: req.body.userid.trim().toLowerCase(),status:1}).then(async(res)=>{
      if(res!==null){
        try{
          if(res.password==password){
            var payload={userid:res.userid,email:res.email,name:res.name,gender:res.gender,role:res.role,status:1};
            if(res.terminals!==null&&res.terminals!==undefined){payload={...payload,...{terminals:res.terminals}}};
            res1.status(200).end(JSON.stringify({token:await tokengenerate({...payload,...{_id:res._id}}),value:payload}));
          } else {
            res1.status(401).end(JSON.stringify({msg:"Incorrect Password!"}));
          }  
        } catch(e){
          console.log(e);
          res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
        }
        return;
      }
    }).catch((e)=>{
      console.log(e);
      res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
    });
    await db("users","findOne",{userid: req.body.userid.trim().toLowerCase(),status:1}).then(async(res)=>{
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
        
        db("users","insert",{userid:req1.body.userid.trim().toLowerCase(),password:password,email:req1.body.userid.trim().toLowerCase(),create_time:d,modify_time:d,role:["user"],status:1}).then(async(res)=>{
          try{
            var payload={userid:req1.body.userid.trim().toLowerCase(),email:req1.body.userid.trim().toLowerCase(),role:["user"],status:1};
            res1.status(200).end(JSON.stringify({token:await tokengenerate({...payload,...{_id:res.insertedId.valueOf()}}),value:payload,msg:"New Account Created Successfully."}));
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
            res1.status(200).end(JSON.stringify({token:await tokengenerate({...payload,...{_id:res._id}}),value:payload}));
          } else {
            res1.status(401).end(JSON.stringify({msg:"Incorrect Password!"}));
          }  
        } catch(e){
          
          res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
        }
      }
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
//=========Register
router.post("/api/register",async function(req,res){
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
    await db("users","findOne",{userid: req.body.userid.trim().toLowerCase(),status:1}).then(async(res)=>{
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
        
        db("users","insert",{userid:req1.body.userid.trim().toLowerCase(),password:password,email:req1.body.userid.trim().toLowerCase(),create_time:d,modify_time:d,role:["user"],status:1}).then(async(res)=>{
          try{
            var payload={userid:req1.body.userid.trim().toLowerCase(),email:req1.body.userid.trim().toLowerCase(),role:["user"],status:1};
            res1.status(200).end(JSON.stringify({token:await tokengenerate({...payload,...{_id:res.insertedId.valueOf()}}),value:payload,msg:"New Account Created Successfully."}));
          } catch(e){
            res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
          }
        }).catch((e)=>{
          res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
        });
      } else {
        res1.status(401).end(JSON.stringify({msg:"User ID already exists."}));return;
      }
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
//=========Logout
router.get("/api/logout",authentication,function(req,res){
  var res1=res,req1=req;
  try{
    res1.status(200).end(JSON.stringify({value:[]}));
  } catch(e){
    res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
  }
  return;
})
//=========Refresh
router.get("/api/refresh",authentication,function(req,res){
  var res1=res,req1=req;
  try{
    res1.status(200).end(JSON.stringify({value:[]}));
  } catch(e){
    res1.status(503).end(JSON.stringify({msg:"Server Error"}));return;
  }
  return;
})


module.exports = router;
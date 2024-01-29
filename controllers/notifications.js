require("../config/congif.js");
const jwt=require("jsonwebtoken");
const nodemailer = require('nodemailer');
var twilio = require('twilio');
const router=require("express").Router();

var sendsms=function(mobileto,msg){
  try{  
    var accountSid ='accountSid'; // Your Account SID from www.twilio.com/console
    var authToken = 'authToken';   // Your Auth Token from www.twilio.com/console
  
    var client = new twilio(accountSid, authToken);
  
    client.messages.create({
        body:msg,
        to: "country code with +"+mobileto,  // Text this number
        from: 'tiwlio number' // From a valid Twilio number
    })
    //.then((message) => //

  }catch(ex){
    //
  }
}

const sendEmail=function (from,to,subject,body,cc,bcc,attachment){
  //TO DO
  return;
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",//"aspmx.l.google.com",
    //port: 587,
    secure: true, // use TLS
    service: 'gmail',
    auth: {
      user: 'email',
      pass: 'password',
    }/*,
    tls: {
      // do not fail on invalid certs
      rejectUnauthorized: false
    }
    */
  });
  const mailOptions = {
    from: from,
    to: to,
    subject: subject,
    html: body
  };
  
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      //
    } else {
      //
    }
  });
}
// const service=require("../services/users.js");

//=======Send Msg to Guarduan
router.post("/ms/passengers/notifications",authentication,async function(req,res){
  var res1=res,req1=req;
  try{
    var {name,note,flight_staff,ids, ...t } =req.body;
    if(name==undefined||name==null){
      res1.status(403).end(JSON.stringify({msg:"Invalid Input!"}));return;
    } else {
      note=(note==undefined||note==null)?"":note;
    }
    //SECURITY CHECK
    //if(/Condition for Verfy/){res1.status(401).end(JSON.stringify({msg:"Unauthorized Access!"}));return;}
    
    ids=Array.isArray(ids)?ids:[ids];
    ids=ids.map((e)=>new ObjectId(e));

    const chunk = (arr, size) =>Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>arr.slice(i * size, i * size + size));
    chunk(ids, 8/* 8x3=24 because Email Limit = 25 per minute */).forEach(async(e1)=>{
      var _res=[];
      await db("passengers",ids.length==1?"findOne":"find",{_id:{$in:e1},specialfare: 'Unaccompanied Minor',status:1},{projection:{receiver_guardian_email:1,sender_guardian_email:1,auth_email:1,name:1,pnr:1,from:1,to:1,flight:1,_id:0},skin:_res.length,limit:100}).then((res)=>{
        if(res!==null){_res=(Array.isArray(res))?res:[res];}
      }).catch((e)=>{});
      //3 Email for each passengers
      _res.forEach((e)=>[e.receiver_guardian_email,e.sender_guardian_email,e.auth_email].forEach((email)=>{
        try{
          //TO DO
          //SEND EMAIL
          //sendEmail("flightcompany@domain.com",email,"Unaccompanied Minor Status - Indigo","<h1>Unaccompanied Minor Status - Indigo</h1><br/><br/><h2>"+e.name+" (PNR: "+e.pnr+")</h2><h3>"+e.from.city+" ("+e.from.iata+")-->"+e.to.city+" ("+e.to.iata+") "+e.flight.number+"("+e.flight.type+")</h3><p>"+e.from.airport+" ("+e.from.terminal+")"+" --> "+e.to.airport+" ("+e.to.terminal+")"+"</p><b>"+name+"</b><br/>Note:"+note+"<br/><br/>===================<br/>Team Indigo");
          console.log(email);
          //console.log("<h1>Unaccompanied Minor Status - Indigo</h1><br/><br/><h2>"+e.name+" (PNR: "+e.pnr+")</h2><h3>"+e.from.city+" ("+e.from.iata+")-->"+e.to.city+" ("+e.to.iata+") "+e.flight.number+"("+e.flight.type+")</h3><p>"+e.from.airport+" ("+e.from.terminal+")"+" --> "+e.to.airport+" ("+e.to.terminal+")"+"</p><b>"+name+"</b><br/>Note:"+note+"<br/><br/>===================<br/>Team Indigo")
          
        } catch(e){}
      }))
      setTimeout(()=>{},1000*60);
    })
    res1.status(200).end(JSON.stringify({value:[]}));
  } catch(e){
    res1.status(503).end(JSON.stringify({msg:"Server Error"}));
  }
})



module.exports = router;
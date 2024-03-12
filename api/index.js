const express = require("express");
const cors=require("cors");
const { default: mongoose } = require("mongoose");
const bcrypt=require("bcryptjs");

const jwt=require("jsonwebtoken");
const User=require("./models/User.js")

require('dotenv').config();
const app =  express();

const bcryptSalt=bcrypt.genSaltSync(10);
const jwtSecret="sadasdsdadasdasdasdasdwewe"  ;

app.use(express.json());

app.use(cors({
    credentials: true,
    origin: "http://localhost:5173"
}));

console.log(process.env.MONGO_URL)
mongoose.connect(process.env.MONGO_URL);
// to  check if the server  is  connected to the database
mongoose.connection.on("connected",()=>{
    console.log("connected to the database")
})

app.get("/test",(req,res)=>{
    res.json("Hello World") 
})
// pwd grbYnjU719XU9MBV
app.post("/register", async (req,res)=>{
    const {name,email,password}=req.body;
    try{

        const userDoc = await User.create({
            name,
            email,
            password:bcrypt.hashSync(password,bcryptSalt),
        }) 
        res.json(userDoc);
    } catch(err){
        res.status(422).json(err);
    }
}
)

app.post("/login",async (req,res)=>{
    const {email,password}=req.body;
    const userDoc=User.findOne({email});
    if (userDoc){
        const passOk=bcrypt.compareSync(password,(await userDoc).password);
    if (passOk){
        jwt.sign({email:userDoc.email,id:userDoc._id},jwtSecret,{},(err,token)=>{
            if (err) throw err;

        res.cookie("token",token).json("pass ok");
        });
    } else{
        res.status(422).json("pass not ok");
    
    }
    }
    else{
        res.json("not found");
    }
})

app.listen(4000);

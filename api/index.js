const express = require("express");
const cors=require("cors");
const { default: mongoose } = require("mongoose");
const bcrypt=require("bcryptjs");
const cookieParser=require("cookie-parser");
const jwt=require("jsonwebtoken");
const User=require("./models/User.js")

require('dotenv').config();
const app =  express();

const bcryptSalt=bcrypt.genSaltSync(10);
const jwtSecret="sadasdsdadasdasdasdasdwewe"  ;

app.use(express.json());
app.use(cookieParser())
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

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const userDoc = await User.findOne({ email });
        if (userDoc) {
            const passOk = bcrypt.compareSync(password, userDoc.password);
            if (passOk) {
                jwt.sign({ 
                    email: userDoc.email, 
                    id: userDoc._id,
                // name:userDoc.name 
            }, jwtSecret, {}, (err, token) => {
                    if (err) throw err;
                    res.cookie("token", token).json(userDoc);
                });
            } else {
                res.status(422).json("Password incorrect");
            }
        } else {
            res.status(404).json("User not found");
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

app.get("/profile",(req,res)=>{
    const {token} = req.cookies;
    if (token){
      jwt.verify(token,jwtSecret,{},async  (err,userData)=>{
            if (err) throw err;
            const {name,email,_id}  =  await User.findById(userData.id);
            res.json({name,email,_id} );
        });

    } else{
        
        res.json(null);
    }
})

app.listen(4000);
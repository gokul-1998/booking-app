const express = require("express");
const cors=require("cors");
const { default: mongoose } = require("mongoose");
const bcrypt=require("bcryptjs");
const cookieParser=require("cookie-parser");
const imageDownloader=require("image-downloader");
const Place = require("./models/Place.js");
const jwt=require("jsonwebtoken");
const User=require("./models/User.js");
const multer = require("multer");
const fs = require("fs");
require('dotenv').config();
const app =  express();

const bcryptSalt=bcrypt.genSaltSync(10);
const jwtSecret="sadasdsdadasdasdasdasdwewe"  ;

app.use(express.json());
app.use(cookieParser())
app.use("/uploads",express.static(__dirname+"/uploads"));

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

app.post("/logout",(req,res)=>{
    res.cookie("token","").json(true);
})

app.post("/upload-by-link",async (req,res)=> {
    try{
    const {link} = req.body;
    console.log(link);
    const newName="photo"+Date.now() + ".jpg";

        await  imageDownloader.image({
            url:link,
            dest: __dirname + "/uploads/" + newName
        });
        console.log(newName);
        console.log("saved")
        res.json(newName);
    }
    catch(err){
    console.log(err);
        res.status(500).json(err);
    }


});

const photosMiddleware=multer({dest:'uploads/'});

app.post("/upload",photosMiddleware.array('photos',100), (req,res)=>{
    try{

        const uploadedFiles = [];
        for (let i=0; i < req.files.length;i++){
            const {path,originalname} =  req.files[i];
            const parts=originalname.split('.');
            const ext=parts[parts.length-1];
            const newPath=path+"."+ext;
            fs.renameSync(path,newPath);
            uploadedFiles.push(newPath.replace("uploads","").replace("\\","").replace("/",""));
            console.log(uploadedFiles,"uploaded files")
            
        }
        res.json(uploadedFiles);
    }
    catch(err) {
        console.log(err)
        res.status(500).json(err);
    }

    console.log("saved files")
});


app.post("/places",(req,res)=>{
    console.log(req.cookies);
    const {token} = req.cookies; 
    const {title,address,addedPhotos,description,perks,extraInfo,checkIn,checkOut,maxGuests,price}=req.body;
    jwt.verify(token,jwtSecret,{},async  (err,userData)=>{
        if (err) throw err;
       
       const placeDoc=  await  Place.create({
            owner:userData.id,price,
            title,address,photos:addedPhotos,description,perks,extraInfo,checkIn,checkOut,maxGuests
    });
    res.json(placeDoc);
}) ;   
});

app.get("/user-places",(req,res)=>{
    const {token}= req.cookies;
    jwt.verify(token,jwtSecret,{},async  (err,userData)=>{
        const {id} = userData;
        res.json(await Place.find({owner:id}));
});

});


app.get("/places/:id",async (req,res)=>{
    const {id} = req.params;
    res.json(await Place.findById(id));
}
);

app.put('/places',async (req,res)=>{
    
    const {token} = req.cookies; 
    const {id,title,address,addedPhotos,description,perks,extraInfo,checkIn,checkOut,maxGuests,price}=req.body;
    
    jwt.verify(token,jwtSecret,{},async  (err,userData)=>{
        if (err) throw err;
        const placeDoc = await Place.findById(id);
        if (userData.id === placeDoc.owner.toString()){
            placeDoc.set(
                {
                    owner:userData.id,
                    title,address,photos:addedPhotos,description,perks,extraInfo,checkIn,checkOut,maxGuests,price
            }
            );
           await  placeDoc.save();
            res.json('ok');
        }
    });

} )


app.get("/places",async (req,res)=>{
    res.json(await Place.find())
})

app.listen(8000);

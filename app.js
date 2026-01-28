const express=require("express")
const app=express()
const mongoose=require("mongoose")
const bodyparser=require("body-parser")
const fileUpload=require("express-fileupload")
const cors=require('cors')

const userroutes=require("./routes/user")
const courseroutes=require("./routes/course")
const studentroutes=require("./routes/student")
const feeroutes=require("./routes/fee")

mongoose.connect("mongodb+srv://Prince:12345@institude.ocmurok.mongodb.net/?retryWrites=true&w=majority&appName=institude")
.then(()=>{
    console.log("connected with database")
})
.catch(err=>{
    console.log(err)
})

app.use(bodyparser.json())
app.use(cors())

app.use(fileUpload({
    useTempFiles : true,
    // tempFileDir : '/tmp/'
}));

app.use("/user",userroutes)
app.use("/course",courseroutes)
app.use("/student",studentroutes)
app.use("/fee",feeroutes)

app.use((req,res)=>{                 /*agar kuch agal endpoint denge to ye render hoga*/
    res.status(404).json({
        msg :"bad request"
    })
})


module.exports=app;
const express=require("express")
const router=express.Router()
const checkAuth=require('../middleware/checkAuth')
const Course=require("../model/Course")
const mongoose=require('mongoose')
const cloudinary=require('cloudinary').v2
const jwt=require("jsonwebtoken")
const fee=require('../model/Fee')
const Student = require("../model/Student")

cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
})


router.post("/add-course",checkAuth,(req,res)=>{

    const token=req.headers.authorization.split(" ")[1]
    const verify=jwt.verify(token,'prince online classes 123')

    cloudinary.uploader.upload(req.files.image.tempFilePath,(err,result)=>{
        
    
        const newCourse= new Course({
        _id:new mongoose.Types.ObjectId,
        courseName:req.body.courseName,
        price:req.body.price,
        description:req.body.description,
        startingDate:req.body.startingDate,
        endDate:req.body.endDate,
        uId:verify.uId,
        imageUrl:result.secure_url,
        imageId:result.public_id
    })
    newCourse.save()
    
     
    .then(result=>{
        res.status(200).json({
            newCourse:result
        })
    })
    .catch(err=>{
        res.status(500).json({
            error:err
        })
    })
    
    })
})

router.get('/all-course',checkAuth,(req,res)=>{
    const token=req.headers.authorization.split(" ")[1]
    const verify=jwt.verify(token,'prince online classes 123')

    Course.find({uId:verify.uId})
    .select('_id uId courseName description price startingDate endDate imageUrl imageId')
    .then(result=>{
        res.status(200).json({
            success:true,
            courses:result
        })
    })
    .catch(err=>{
        res.status(500).json({

            error:err
        })
    })
})


router.get('/course-detail/:id',checkAuth,(req,res)=>{
    
    Course.findById(req.params.id)
     .select('_id uId courseName description price startingDate endDate imageUrl imageId')
    .then(result=>{
        Student.find({courseId:req.params.id})
        .then(students=>{
           res.status(200).json({
            courses:result,
            students:students
        })
        })
        
    })
    .catch(err=>{
        res.status(500).json({

            error:err
        })
    })
})

router.delete('/:id',checkAuth,(req,res)=>{
    const token=req.headers.authorization.split(" ")[1]
    const verify=jwt.verify(token,'prince online classes 123')

    Course.findById(req.params.id)
    .then(course=>{
        console.log(course)
        if(course.uId == verify.uId)
            {
           Course.findByIdAndDelete(req.params.id)
           .then(result=>{
            cloudinary.uploader.destroy(course.imageId,(deletedImage)=>{
                Student.deleteMany({courseId:req.params.id})
                .then(data=>{
                    res.status(200).json({
                    result:data
                })

                })
                .catch(err=>{
                     res.status(500).json({
                      msg:err
            
           })

                })
                
            })
           })
           .catch(err=>{
            res.status(500).json({
                msg:err
            })
           })
        }
    })
    .catch(err=>{
        res.status(500).json({
            msg:err
        })
    })
})


router.put('/:id',checkAuth,(req,res)=>{
    const token=req.headers.authorization.split(" ")[1]
    const verify=jwt.verify(token,'prince online classes 123')
    console.log(verify.uId)

    Course.findById(req.params.id)
    .then(course=>{
        console.log(course)
         if(verify.uId!=course.uId)
        {
            return res.status(500).json({
                error:'You are not eligible to update the data'
            
            })
        }
        if(req.files && req.files.image)
        {
             cloudinary.uploader.destroy(course.imageId,(deleteImage)=>{
                cloudinary.uploader.upload(req.files.image.tempFilePath,(err,result)=>{
                    const updatedCourse={
                        courseName:req.body.courseName,
                        price:req.body.price,
                        description:req.body.description,
                        startingDate:req.body.startingDate,
                        endDate:req.body.endDate,
                        uId:verify.uId,
                        imageUrl:course.imageUrl,
                        imageId:result.public_id
                    }
                       Course.findByIdAndUpdate(req.params.id,updatedCourse,{new:true})
                    .then(data=>{
                        res.status(200).json({
                            updatedCourse:data
                        })
                    })
                    .catch(err=>{
                        console.log(err)
                        res.status(500).json({
                            error:err
                        })
                    })
                })
            })
        }
        else
        {
            const updateData={
                courseName:req.body.courseName,
                price:req.body.price,
                description:req.body.description,
                endDate:req.body.endDate,
                uId:verify.uId,
                imageUrl:course.imageUrl,
                imageId:course.imageId

            }
             Course.findByIdAndUpdate(req.params.id,updateData,{new:true})
             .then(data=>{
                 res.status(200).json({
                    updateData:data
                    })
             })
             .catch(err=>{
                console.log(err)
                     res.status(500).json({
                        error:err
                     })
            })
        }
        
        
    })
    .catch(err=>{
        res.status(500).json({
            error:err
        })
    })
})

router.get('/latest-student',checkAuth,(req,res)=>{
     const token=req.headers.authorization.split(" ")[1]
    const verify=jwt.verify(token,'prince online classes 123')

    Course.find({uId:verify.uId})
    .sort({$natural:-1}).limit(5)
    .then(result=>{
        res.status(200).json({
            courses:result
        })
    })
    .catch(err=>{
        res.status(500).json({
            error:err
        })
    })
})

// -------------------Home Api----------------
router.get('/home',checkAuth,async(req,res)=>{

     

    try {
         const token=req.headers.authorization.split(" ")[1]
         const verify=jwt.verify(token,'prince online classes 123')
        const newFees=await fee.find({uId:verify.uId}).sort({$natural:-1}).limit(5)
         const newStudents=await Student.find({uId:verify.uId}).sort({$natural:-1}).limit(5)
         const totalCourse=await Course.countDocuments({uId:verify.uId})
          const totalStudent=await Student.countDocuments({uId:verify.uId})
          const totalAmount=await fee.aggregate([
            {$match : {uId:verify.uId}},
            {$group:{_id:null,total:{$sum:'$amount'}}}
          ])
         res.status(200).json({
            fees:newFees,
            students:newStudents,
            totalCourse:totalCourse,
            totalStudent:totalStudent,
            totalAmount:totalAmount.length>0 ? totalAmount[0].total:0
         })
        
        
    }
     catch (error) {
        res.status(500).json({
            msg:error
        })
        
    }
})
        
      


module.exports=router;
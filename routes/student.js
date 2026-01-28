const express=require("express")
const router=express.Router()
const checkAuth=require('../middleware/checkAuth')
const Student=require("../model/Student")
const mongoose=require('mongoose')
const cloudinary=require('cloudinary').v2
const jwt=require("jsonwebtoken")
const Fee=require('../model/Fee')
const Course=require('../model/Course')


cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
})


// router.post("/add-student",(req,res)=>{
//     res.status(200).json({
//         msg:"add new studentrequest"
//     })

// })
router.post("/add-student",checkAuth,(req,res)=>{

    const token=req.headers.authorization.split(" ")[1]
    const verify=jwt.verify(token,'prince online classes 123')
    // console.log(req.body)
    // console.log(req.files.body)

    cloudinary.uploader.upload(req.files.image.tempFilePath,(err,result)=>{
    //    console.log(err)
    
        const newStudent= new Student({
        _id:new mongoose.Types.ObjectId,
        fullName:req.body.fullName,
        phone:req.body.phone,
        email:req.body.email,
        address:req.body.address,
        courseId:req.body.courseId,
        uId:verify.uId,
        imageUrl:result.secure_url,
        imageId:result.public_id
    })
    newStudent.save()
    
    .then(result=>{
        res.status(200).json({
            newStudent:result
        })
    })
    .catch(err=>{
        res.status(500).json({
            error:err
        })
    })
    
    })
})


router.get('/all-students',checkAuth,(req,res)=>{
    const token=req.headers.authorization.split(" ")[1]
    const verify=jwt.verify(token,'prince online classes 123')

    Student.find({uId:verify.uId})
    .select('_id uId fullName phone address email courseId imageUrl  imageId')
    .then(result=>{
        res.status(200).json({
            Student:result
        })
    })
    .catch(err=>{
        res.status(500).json({

            error:err
        })
    })
})


router.get('/all-students/:courseId',checkAuth,(req,res)=>{
    const token=req.headers.authorization.split(" ")[1]
    const verify=jwt.verify(token,'prince online classes 123')

    Student.find({uId:verify.uId,courseId:req.params.courseId})
    .select('_id uId fullName phone address email courseId imageUrl  imageId')
    .then(result=>{
        res.status(200).json({
            Student:result
        })
    })
    .catch(err=>{
        res.status(500).json({

            error:err
        })
    })
})

router.get('/student-detail/:id',checkAuth,(req,res)=>{


     const token=req.headers.authorization.split(" ")[1]
    const verify=jwt.verify(token,'prince online classes 123')

    Student.findById(req.params.id)
    .select('_id uId fullName phone address email courseId imageUrl  imageId')
    .then(result=>{
        Fee.find({uId:verify.uId,courseId:result.courseId,phone:result.phone})
        .then(feeDetail=>{
            Course.findById(result.courseId)
            .then(courseDetail=>{
                res.status(200).json({
                studentDetail:result,
                feeDetail:feeDetail,
                courseDetail:courseDetail
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
    .catch(err=>{
        res.status(500).json({

            error:err
        })
    })
})


router.delete('/:id',checkAuth,(req,res)=>{
    const token=req.headers.authorization.split(" ")[1]
    const verify=jwt.verify(token,'prince online classes 123')

    Student.findById(req.params.id)
    .then(student=>{
        console.log(student)
        if(student.uId == verify.uId)
            {
           Student.findByIdAndDelete(req.params.id)
           .then(result=>{
            cloudinary.uploader.destroy(student.imageId,(deletedImage)=>{
                res.status(200).json({
                    result:result
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
})

router.put('/:id',checkAuth,(req,res)=>{
    const token=req.headers.authorization.split(" ")[1]
    const verify=jwt.verify(token,'prince online classes 123')
    console.log(verify.uId)

    Student.findById(req.params.id)
    .then(student=>{
        // console.log(course)
         if(verify.uId!=student.uId)
        {
            return res.status(500).json({
                error:'You are not eligible to update the data'
            
            })
        }
        if(req.files)
        {
             cloudinary.uploader.destroy(Student.imageId,(deleteImage)=>{
                cloudinary.uploader.upload(req.files.image.tempFilePath,(err,result)=>{
                    const newUpdatedStudent={
                        fullName:req.body.fullName,
                        phone:req.body.phone,
                        email:req.body.email,
                        address:req.body.address,
                        courseId:req.body.courseId,
                        uId:verify.uId,
                        imageUrl:result.secure_url,
                        imageId:result.public_id
                    }
                       Student.findByIdAndUpdate(req.params.id,newUpdatedStudent,{new:true})
                    .then(data=>{
                        res.status(200).json({
                            updatedStudent:data
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
            const UpdatedData={
                fullName:req.body.fullName,
                phone:req.body.phone,
                email:req.body.email,
                address:req.body.address,
                courseId:req.body.courseId,
                uId:verify.uId,
                imageUrl:Student.imageUrl,
                imageId:Student.imageId
            }
             Student.findByIdAndUpdate(req.params.id,UpdatedData,{new:true})
             .then(data=>{
                 res.status(200).json({
                    updatedStudent:data
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
        

// get latest 5 students data

router.get('/latest-students',checkAuth,(req,res)=>{
    const token=req.headers.authorization.split(" ")[1]
    const verify=jwt.verify(token,'prince online classes 123')


    Student.find({uId:verify.uId})
    .sort({$natural:-1}).limit(5)
    .then(result=>{
        res.status(200).json({
            student:result
        })
    })
    .catch(err=>{
        res.status(500).json({
            error:err
        })
    })
})  

      

module.exports=router;
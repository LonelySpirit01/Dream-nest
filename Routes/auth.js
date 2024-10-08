const router=require("express").Router()
const User =require('../Models/User')
const bcrypt=require('bcryptjs')
const multer=require("multer")
const jwt=require("jsonwebtoken")
const asyncHandler=require("express-async-handler")

/* Configuration Multer for File Upload */
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "public/uploads/"); // Store uploaded files in the 'uploads' folder
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname); // Use the original file name
    },
  });
  
  const upload = multer({ storage });
  
  /* USER REGISTER */
  router.post("/register", upload.single("profileImage"), async (req, res) => {
    try {
      /* Take all information from the form */
      const { firstName, lastName, email, password } = req.body;
  
      /* The uploaded file is available as req.file */
      const profileImage = req.file;
  
      if (!profileImage) {
        return res.status(400).send("No file uploaded");
      }
  
      /* path to the uploaded profile photo */
      const profileImagePath = profileImage.path;
  
      /* Check if user exists */
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ message: "User already exists!" });
      }
  
      /* Hass the password */
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(password, salt);
  
      /* Create a new User */
      const newUser = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        profileImagePath,
      });
  
      /* Save the new User */
      await newUser.save();
  
      /* Send a successful message */
      res
        .status(200)
        .json({ message: "User registered successfully!", user: newUser });
    } catch (err) {
      console.log(err);
      res
        .status(500)
        .json({ message: "Registration failed!", error: err.message });
    }
  });

//Login user
router.post("/login",asyncHandler(async(req,res,next)=>{

    const {email,password}=req.body
    const user= await User.findOne({email})

    //Checking if user exists
    if(!user){
        return res.status(401).json({
            message:"User doesn't exist"})
    }

    //Checking password
    const isPasswordMatched= await bcrypt.compare(password,user.password)
    if(!isPasswordMatched){

        return res.status(403).json({
            message:"Invalid credentials"
        })
    }

    //Generate jwt Token
    const token=jwt.sign({id:user._id},process.env.JWT_SECRET)
    delete user.password

    return res.status(200).json({
        user,token,
        message:"Logged in successfully"
    })
}))

module.exports=router
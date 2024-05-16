//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");//1st step
const ejs = require("ejs");
const _ = require("lodash");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const uuid = require("uuid");

const homeStartingContent = "Hi."
const aboutContent = "This is my first blog website. I dedicated two months to studying both backend and frontend development to create it. In the future, I plan to enhance and optimize the website, making it more advanced and user-friendly for my clients :-)";
const contactContent = "Working on it }:-)";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
// Define the "upload" middleware at the top level
const upload = multer({
  dest: "./path/to/temporary/directory/to/store/uploaded/files",
  
  limits: { fileSize: 12* 1024 * 1024 }, // Limit the file size (1MB in this example)
});


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "uploads")));


//2nd step 
main().catch(err => console.log(err));

//3rd styep connect to mongoose
async function main(){
  await mongoose.connect("mongodb+srv://shivam:Chaubey3301@cluster0.mffh55y.mongodb.net/blogDB",{useNewUrlParser:true});
}

//4th step add schema
const postSchema = {
  title: String,
  content: String,
  image: String
};

//5Th step add mongoose model
const Post = mongoose.model("Post",postSchema);


//step 7 when posts array is on it will help to add data on monodb and does not show on website screen
//let posts = [];

// step 8 delete the exiting array and find all the posts in the posts collection and render in the home.ejs file

/*app.get("/", function(req, res){
  Post.find({},function(err,posts){
  res.render("home", {
    startingContent: homeStartingContent,
    posts: posts
    });
  })
});*/

// generally step 8 add your data on website screen and here it will add on home page
app.get("/", function (req, res) {
  Post.find({})
    .then(function (posts) {
      res.render("home", {
        startingContent: homeStartingContent,
        posts: posts
      });
    })
    .catch(function (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    });
});


app.get("/about", function(req, res){
  res.render("about", {aboutContent: aboutContent});
});

app.get("/contact", function(req, res){
  res.render("contact", {contactContent: contactContent});
});

app.get("/compose", function(req, res){
  res.render("compose");
});

/*app.post("/compose", async (req, res)=>{
  /*const post = {
    title: req.body.postTitle,
    content: req.body.postBody
  };

  //6th create a new post document using mongoose model
  try{
  const post = new Post({
    title: req.body.postTitle,
      content: req.body.postBody
  
  });*/

 /* app.post("/compose", upload.single("file"), async (req, res) => {
    const tempPath = req.file.path;
    //const targetPath = path.join(__dirname, "./uploads/image.png");
    const targetPath = path.join(__dirname, "uploads", "image.png");

    if (path.extname(req.file.originalname).toLowerCase() === ".png") {
      fs.rename(tempPath, targetPath, (err) => {
        if (err) {
          console.error(err);
          res.status(500).send("Internal Server Error");
        } else {
          res.status(200).contentType("text/plain").end("File uploaded!");
        }
      });
    } else {
      fs.unlink(tempPath, (err) => {
        if (err) {
          console.error(err);
          res.status(500).send("Internal Server Error");
        } else {
          res.status(403).contentType("text/plain").end("Only .png files are allowed!");
        }
      });
    }

    const post = new Post({
      title: req.body.postTitle,
      content: req.body.postBody
    });
  
    try {
      await post.save();
      res.redirect("/");
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  });*/
  

  app.post("/compose", upload.single("file"), async (req, res) => {
    const tempPath = req.file.path;
  const uniqueFilename = uuid.v4(); // Generate a unique filename  
const targetPath = path.join(__dirname, `uploads/${uniqueFilename}.png`);

    //const targetPath = path.join(__dirname, "./uploads/image.png");
  
    if (path.extname(req.file.originalname).toLowerCase() === ".png") {
      fs.rename(tempPath, targetPath, (err) => {
        if (err) {
          console.error(err);
          res.status(500).send("Internal Server Error");
        } else {
          const post = new Post({
            title: req.body.postTitle,
            content: req.body.postBody,
            image: `${uniqueFilename}.png` // Save the image filename in the post document
          });
          post.save()
            .then(() => {
              
              res.redirect("/");
            })
            .catch((err) => {
              console.error(err);
              res.status(500).send("Internal Server Error");
            });
        }
      });
    } else {
      fs.unlink(tempPath, (err) => {
        if (err) {
          console.error(err);
          res.status(500).send("Internal Server Error");
        } else {
          res.status(403).contentType("text/plain").end("Only .png files are allowed!");
        }
      });
    }
  });

  
  app.get("/image.png", (req, res) => {
    //res.sendFile(path.join(__dirname, "./uploads/image.png"));
    res.sendFile(path.join(__dirname, "uploads", uniqueFilename + ".png"));

  });


//step 10 postname to post id
/*app.get("/posts/:postId",function(req,res){
  const requestedPostId = req.params.postId;
  Post.findOne({_id: requestedPostId}, function(err, post){

    res.render("post", {
    
    title: post.title,
    
    content: post.content
    
    });
    
    });
    
    
});*/



app.get("/posts/:postId", async (req, res) => {
  try {
    const requestedPostId = req.params.postId;
    const post = await Post.findOne({ _id: requestedPostId });

    if (post) {
      res.render("post", {
        title: post.title,
        content: post.content
      });
    } else {
      res.status(404).send("Post not found");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/upload", upload.single("image"), (req, res) => {
  if (req.file) {
    // Get the dimensions of the uploaded image
    const dimensions = imageSize(req.file.path);

    const maxWidth = 500; // Define the maximum width
    const maxHeight = 500; // Define the maximum height

    if (dimensions.width > maxWidth || dimensions.height > maxHeight) {
      // If the image exceeds the maximum dimensions, delete the file and respond with an error
      fs.unlinkSync(req.file.path);
      return res.status(400).send("Image dimensions exceed the maximum allowed size.");
    }

    // If the image is within the allowed dimensions, you can proceed to save it or process it.
    // You may save it to a different location, store the file path in your database, etc.

    res.send("Image uploaded successfully!");
  } else {
    res.status(400).send("No file was uploaded.");
  }
});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started on port 3000");
});


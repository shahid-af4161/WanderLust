const express = require("express");
const app = express();
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");

app.set("view engine","ejs");
app.set("views", path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.listen(8080);

const mongoose = require("mongoose");
const MONGO_URL = "mongodb://localhost:27017/wanderlust";
main().then(res => console.log("Conneted to Database"))
    .catch(err => console.log(err))
async function main() {
    await mongoose.connect(MONGO_URL);
}


// Homepage/Listings
app.get("/listings", async (req,res)=>{
    const allListing = await Listing.find({});
    res.render("./listings/index.ejs",{allListing});
});

// New Listing
app.get("/listings/new",(req,res)=>{
    res.render("./listings/new.ejs")
});


app.post("/listings", async (req,res)=>{
    const newListing = new Listing(req.body.listing);
    await newListing.save() 
    // console.log(listing);
    res.redirect("/listings");
});

//Show Listing
app.get("/listings/:id",async (req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id);
    res.render("./listings/show.ejs",{listing});
});


// Edit Listing
app.get("/listings/:id/edit",async (req,res)=>{
    let {id} = req.params;
   let listing = await Listing.findById(id);
   res.render("./listings/edit.ejs",{listing});
});

app.put("/listings/:id", async (req,res)=>{
    let {id} = req.params;
    await Listing.findByIdAndUpdate(id,{...req.body.listing});
    res.redirect(`/listings/${id}`);
});

// Delete Listing
app.delete("/listings/:id", async (req,res)=>{
    let {id} = req.params;
    let deletedListing  = await Listing.findByIdAndDelete(id);
    res.redirect("/listings");
});

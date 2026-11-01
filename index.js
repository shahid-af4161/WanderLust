const express = require("express");
const app = express();
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const engine = require("ejs-mate");
const wrapasync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError");
const { listingSchema,reviewSchema } = require("./schema");
const Review = require("./models/review.js");


app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", engine);
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "/public")));


const mongoose = require("mongoose");
const wrapAsync = require("./utils/wrapAsync.js");
const MONGO_URL = "mongodb://localhost:27017/wanderlust";
main().then(res => console.log("Conneted to Database"))
    .catch(err => console.log(err))
async function main() {
    await mongoose.connect(MONGO_URL);
}

const validateListing = (req, res, next) =>{
    let {error} = listingSchema.validate(req.body);

    if(error){
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400 , errMsg);
    } else{
        next();
    }
}

const validateReview = (req, res, next) =>{
    let {error} = reviewSchema.validate(req.body);

    if(error){
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400 , errMsg);
    } else{
        next();
    }
}
// Homepage/Listings
app.get("/listings", wrapAsync( async (req, res) => {
    const allListing = await Listing.find({});
    res.render("./listings/index.ejs", { allListing });
}));


// New Listing
app.get("/listings/new", (req, res) => {
    res.render("./listings/new.ejs");
});


app.post("/listings",validateListing, wrapAsync(async (req, res, next) => {
    // if(!req.body.listing){
    //     throw new ExpressError(400, "Send valid data for listing");
    // }
    // if(!req.body.listing.title){
    //     throw new ExpressError(400, "title is missing");
    // }
    // if(!req.body.listing.description){
    //     throw new ExpressError(400, "description is missing");
    // }
    // let result = listingSchema.validate(req.body);
    // console.log(result);
    // if(result.error){
    //     throw new ExpressError(400 , result.error);
    // }
    const newListing = new Listing(req.body.listing);
    await newListing.save();
    res.redirect("/listings");
}));

//Show Listing
app.get("/listings/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate("reviews");
    res.render("./listings/show.ejs", { listing });
}));


// Edit Listing
app.get("/listings/:id/edit",validateListing, wrapAsync(async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    res.render("./listings/edit.ejs", { listing });
}));

app.put("/listings/:id", wrapAsync(async (req, res) => {
    // if(!req.body.listing){
    //     throw new ExpressError(400, "Send valid data for listing");
    // }
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    res.redirect(`/listings/${id}`);
}));

// Delete Listing
app.delete("/listings/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    res.redirect("/listings");
}));

//reviews
//Post route
app.post("/listings/:id/reviews",validateReview, wrapAsync(async(req,res)=>{
  let listing = await  Listing.findById(req.params.id);
  let newReview = new Review(req.body.review);
  listing.reviews.push(newReview);

  await newReview.save();
  await listing.save();
  console.log("new review saved");
  res.redirect(`/listings/${listing.id}`);
}));

//DElete review Route
app.delete("/listings/:id/reviews/:reviewId", wrapAsync(async(req,res)=>{
    let {id, reviewId} = req.params;

    await Listing.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});
    await Review.findByIdAndDelete(reviewId);

    res.redirect(`/listings/${id}`);
}));

app.all("/*splat", (req, res, next)=>{
    next(new ExpressError(404 , "Page not found"));
});




// Error handling Middleware : if anyone throw error instead of deafault express error handler it handles error
app.use((err, req, res, next) => {
    let {statusCode=500, message} = err;
    res.status(statusCode).render("error.ejs",{message});
    // res.status(statusCode).send(message);
});

app.listen(8080);
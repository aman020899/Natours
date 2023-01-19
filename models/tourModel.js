const mongoose = require("mongoose");
const slugify = require("slugify");
// const User = require("./userModel");
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A tour must have a name"],
      unique: true,
      trim: true,
      maxlength: [40, "A tour name must have less or eual than 40 characters"],
      minlength: [10, "A tour name must have more or eual than 10 characters"]
      // validate: [validator.isAlpha, 'tour name must be contain only charecter'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, "A Tour must have duration"]
    },
    maxGroupSize: {
      type: Number,
      required: [true, "a tour must have group size"]
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Difficulty is either: easy, medium or difficult"
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1.0 "],
      max: [5, "Rating must be below 5.0"],
      set: val => Math.round(val * 10) / 10 // 4.666->5, 46.66->47, 47/10->4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, "A tour must have price"]
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          // this only points to current doc on NEW document creation.
          return val < this.price;
        },
        message: "Discount Price ({VALUE}) should be less than tour price😤"
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, "A tour must have summary"]
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, "A tour must have cover Image.."]
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      //GeoJSOn
      type: {
        type: String,
        default: "Point",
        enum: ["Point"]
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"]
        },
        coordinates: [Number],
        address: String,
        description: String
      }
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User"
      }
    ]

    //toue ref review
    // reviews: [
    //   {
    //     type: mongoose.Schema.ObjectId,
    //     ref: "Review"
    //   }
    // ]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: "2dsphere" });

tourSchema.virtual("durationWeeks").get(function() {
  return this.duration / 7;
});

// virual populate
tourSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "tour",
  localField: "_id"
});
// document middleware: runs before save() and create()  commond
tourSchema.pre("save", function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

//embeding
// tourSchema.pre("save", async function(next) {
//   const guidesPromises = this.guides.map(async id => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });
// tourSchema.pre('save', function (next) {
//   console.log('Will save document...');
//   next();
// });
// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// QUERY middleware
tourSchema.pre(/^find/, function(next) {
  // tourSchema.pre('find', function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: "guides",
    select: "-__v -passwordChangedAt"
  });
  next();
});

tourSchema.post(/^find/, function(docs, next) {
  console.log(`Querry took ${Date.now() - this.start}`);
  // console.log(docs);
  next();
});

//AGGREGATION MIDDLEWARE
// tourSchema.pre("aggregate", function(next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   console.log(this.pipeline());
//   next();
// });
const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;

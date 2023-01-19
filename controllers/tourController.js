const Tour = require("../models/tourModel");
const AppError = require("../utils/appError");
const catchAsync = require("./../utils/catchAsync");
const factory = require("./handleFactory");

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  next();
};

exports.getAllTours = factory.getAll(Tour);

// exports.getAllTours = catchAsync(async (req, res, next) => {
//   // try {
//   console.log(req.query);
//   // BUILD QUERY
//   //1a) Filtering
//   // const querObj = { ...req.query };
//   // const excludedFields = ['page', 'sort', 'limit', 'fields'];
//   // excludedFields.forEach((el) => delete querObj[el]);
//   // //1b) Advaned filtering
//   // let queryStr = JSON.stringify(querObj);
//   // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
//   // console.log(JSON.parse(queryStr));

//   // // { difficulty: 'easy', duration: { $gte: 5} }
//   // //{ difficulty: 'easy', duration: { gte: '5' } }
//   // //gte gt lt lte

//   // let query = Tour.find(JSON.parse(queryStr));

//   // const tours = await Tour.find()
//   //   .where('duration')
//   //   .equals(5)
//   //   .where('difficulty')
//   //   .equals('easy');

//   //2) sorting
//   // if (req.query.sort) {
//   //   const sortBy = req.query.sort.split(',').join(' ');
//   //   console.log(sortBy);
//   //   query = query.sort(sortBy);
//   // } else {
//   //   query = query.sort('-createdAt');
//   // }

//   //3) Field limiting
//   // if (req.query.fields) {
//   //   const fields = req.query.fields.split(',').join(' ');
//   //   query = query.select(fields);
//   // } else {
//   //   query = query.select('-__v');
//   // }
//   //4) pagination
//   // const page = req.query.page * 1 || 1;
//   // const limit = req.query.limit * 1 || 100;

//   // const skip = (page - 1) * limit;

//   // // page=2&limt=10 1->10___page->1,11->20__page->2
//   // query = query.skip(skip).limit(limit);
//   // if (req.query.page) {
//   //   const numTours = await Tour.countDocuments();
//   //   if (skip >= numTours) {
//   //     throw new Error('This page does not exist.');
//   //   }
//   // }
//   //EXECUTE QUERY
//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();
//   const tours = await features.query;

//   //SEND RESPONSE
//   res.status(200).json({
//     status: "sucess",
//     results: tours.length,
//     requestedAt: req.requestTime,
//     data: {
//       tours //tours:tours
//     }
//   });
//   // } catch (err) {
//   //   res.status(400).json({
//   //     status: 'Fail',
//   //     message: err,
//   //   });
//   // }
// });

exports.getTour = factory.getOne(Tour, { path: "reviews" });
// exports.getTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findById(req.params.id).populate("reviews");
//   // populate({
//   //   path: "guides",
//   //   select: "-__v -passwordChangedAt"
//   // });
//   //  Tour.findOne({_id: req.params.id})
//   if (!tour) {
//     return next(new AppError("No tour found with that ID", 404));
//   }

//   res.status(200).json({
//     status: "sucess",
//     data: {
//       tour //tours:tours
//     }
//   });
// });

exports.createTour = factory.createOne(Tour);

// exports.createTour = catchAsync(async (req, res, next) => {
//   const newTour = await Tour.create(req.body);
//   res.status(201).json({
//     status: "sucess",
//     data: {
//       tour: newTour
//     }
//   });
//   // try {
//   //   // const newTour=new Tour({})
//   //   // newTour.save()

//   // } catch (err) {
//   //   res.status(400).json({
//   //     status: 'Fail',
//   //     message: err,
//   //   });
//   // }
// });

exports.updateTour = factory.updateOne(Tour);
// exports.updateTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true
//   });
//   if (!tour) {
//     return next(new AppError("No tour found with that ID", 404));
//   }
//   res.status(200).json({
//     status: "sucess",
//     data: {
//       tour
//     }
//   });
// });
exports.deleteTour = factory.deleteOne(Tour);

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);
//   if (!tour) {
//     return next(new AppError("No tour found with that ID", 404));
//   }
//   res.status(204).json({
//     status: "sucess",
//     data: {
//       tour: null
//     }
//   });
// });

exports.getTourstats = catchAsync(async (req, res, next) => {
  // try {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: { $toUpper: "$difficulty" },
        numTour: { $sum: 1 },
        numRatings: { $sum: "$ratingsQuantity" },
        avgRating: { $avg: "$ratingsAverage" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" }
      }
    },
    {
      $sort: {
        avgPrice: 1
      }
    }
    // {
    //   $match: { _id: { $ne: '$EASY' } },
    // },
  ]);

  res.status(200).json({
    status: "sucess",
    data: {
      stats
    }
  });
  // } catch (err) {
  //   res.status(404).json({
  //     status: 'Fail',
  //     message: err,
  //   });
  // }
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: "$startDates"
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: "$startDates" },
        numToursStarts: { $sum: 1 },
        tours: { $push: "$name" }
      }
    },
    {
      $addFields: { month: "$_id" }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: {
        numToursStarts: -1
      }
    },
    {
      $limit: 12
    }
  ]);
  res.status(200).json({
    status: "sucess",
    data: {
      plan
    }
  });
});

/* 
  /tours-within/:distance/center/:latlang/unit/:unit
  /tours-within/233/center/-40,45/unit/mil

);

*/

exports.getTourWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");
  const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(new AppError("Please provide in the format lat,lng.", 400));
  }
  // console.log(distance, lat, lng, unit);
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });
  res.status(200).json({
    status: "sucess",
    results: tours.length,
    data: {
      data: tours
    }
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");

  const multiplier = unit === "mi" ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(new AppError("Please provide in the format lat,lng.", 400));
  }
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: "distance",
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);

  res.status(200).json({
    status: "sucess",
    data: {
      data: distances
    }
  });
});

const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("./../utils/catchAsync");
const factory = require("./handleFactory");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllUsers = factory.getAll(User);

// exports.getAllUsers = catchAsync(async (req, res, next) => {
//   const users = await User.find();

//   //SEND RESPONSE
//   res.status(200).json({
//     status: "sucess",
//     results: users.length,
//     requestedAt: req.requestTime,
//     data: {
//       users
//     }
//   });
// });

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  //1) create error if user try to update paddword data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password update. please use /updateMyPassword",
        400
      )
    );
  }
  // filter out unwanted fields names that are not allowed to updated
  // body.role: 'admin'
  const filteredBody = filterObj(req.body, "name", "email");
  //3) update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidaters: true
  });

  res.status(200).json({
    status: "sucess",
    data: {
      user: updatedUser
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: "sucess",
    data: null
  });
});

exports.getUser = factory.getOne(User);
exports.createUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not defined! Please use /signup instead"
  });
};

// Do not update password with this
exports.updateUser = factory.updateOne(User);
exports.deleteuser = factory.deleteOne(User);

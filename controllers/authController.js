const crypto = require("crypto");
const { promisify } = require("util"); //util
const jwt = require("jsonwebtoken");
const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const sendEmail = require("./../utils/email");

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const creatSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    // secure: true,
    httpOnly: true // cookie not access nd modified by browser anyway
  };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  //remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: "sucess",
    token,
    data: {
      user
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    // req.body so any one can role as / / admin / /
    // req.body
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
    passwordResetToken: req.body.passwordResetToken,
    passwordResetExpires: req.body.passwordResetExpires
  });
  // console.log(newUser._id);

  creatSendToken(newUser, 201, res);
  // const token = signToken(newUser._id);

  // res.status(201).json({
  //   status: "sucess",
  //   token,
  //   data: {
  //     user: newUser,
  //   },
  // });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1)Check email nd password ix exist
  if (!email || !password) {
    return next(new AppError("please provide a email and password!", 400));
  }

  //2)check if the user exist  && password is correct

  const user = await User.findOne({ email }).select("+password");
  // console.log(user);
  // const correct = await user.correctPassword(password, user.password);
  // console.log(user, await user.correctPassword(password, user.password));
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password!", 401));
  }
  //3)if everything ok , then send the JWT to client
  // console.log(user._id);
  creatSendToken(user, 200, res);

  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: "sucess",
  //   token,
  // });
});

//
exports.protect = catchAsync(async (req, res, next) => {
  //1) get token if token exist
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  // console.log(token);
  if (!token)
    return next(
      new AppError("You are not loggedIn! Plz login to get acess", 401)
    );
  //2) VALIDATE TOKEN VERIFICATION

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // const decoded = await jwt.verify(token, process.env.JWT_SECRET);
  // console.log(decoded);

  //3) CHECK IF USER STILL EXISTS
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError("The user belonging to token does not longer exist.", 401)
    );
  }
  //4)  CHECK IF USER CHANGED PASSWORD AFTER THE JWT TOKEN  ISSUE
  //instance method

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password. Plz login Again..", 401)
    );
  }

  //grant acess
  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'lead-guide']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) next(new AppError("There is no user with email addres", 404));

  //2) generate the random reset token

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //3) send back it to user email
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot your Password? Submit a patch request with new password and passwordConfirm to: ${resetURL}\nIf you didn't forgot your password, please ignore this email!`;

  try {
    console.log(user.email, resetURL);
    await sendEmail({
      email: user.email,
      subject: "Your password reset token (Valid for 10 min)",
      message
    });
    res.status(200).json({
      status: "sucess",
      message: "Token send to email"
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError("There was an error sending  the email. Try again later!"),
      500
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  //1)get user based on token
  const hashToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  //2)if token is not expired and there is user set the new password

  if (!user) {
    return next(new AppError("Token is invalid or expired", 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  //3 update the changedPasswordAt property for current user

  //4) Log the user in, Send JWT
  creatSendToken(user, 200, res);

  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: "sucess",
  //   token,
  // });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1) Get the user from collection
  const user = await User.findById(req.user.id).select("+password");
  //2) check posted password is correct
  // console.log(req.body.passwordCurrent, user.password);
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Your current password is wrong", 401));
  }
  //3) if all are done then update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // user.findByIdAndUpdate will not work as intended

  //4) log the user in, send JWT
  creatSendToken(user, 200, res);

  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: "sucess",
  //   token,
  // });
});

const express = require("express");
const tourContoller = require("../controllers/tourController"); // also use distructuring
const authController = require("../controllers/authController");
const reviewRouter = require("./../routes/reviewRoutes");

const router = express.Router();

// router.param('id', tourContoller.checkID);

router.use("/:tourId/reviews", reviewRouter);

// POST/tour/qw234e3/reviews
// GET/tour/qw234e3/reviews
// GET/tour/qw234e3/reviews/asdf23e

// router
//   .route("/:tourId/reviews")
//   .post(
//     authController.protect,
//     authController.restrictTo("user"),
//     reviewController.createReview
//   );

router
  .route("/top-5-cheap")
  .get(tourContoller.aliasTopTours, tourContoller.getAllTours);

router.route("/tour-stats").get(tourContoller.getTourstats);
router
  .route("/monthly-plan/:year")
  .get(
    authController.protect,
    authController.restrictTo("admin", "lead-guide", "guide"),
    tourContoller.getMonthlyPlan
  );

router
  .route("/tours-within/:distance/center/:latlng/unit/:unit")
  .get(tourContoller.getTourWithin);

router.route("/distances/:latlng/unit/:unit").get(tourContoller.getDistances);

router
  .route("/")
  .get(tourContoller.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourContoller.createTour
  );

router
  .route("/:id")
  .get(tourContoller.getTour)
  .patch(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourContoller.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourContoller.deleteTour
  );

module.exports = router;

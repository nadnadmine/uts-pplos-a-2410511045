const express = require("express");
const controller = require("../controllers/appointmentController");

const router = express.Router();

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

router.get("/doctors/schedule", asyncHandler(controller.schedules));
router.post("/reservations", asyncHandler(controller.createReservation));
router.get("/reservations/me", asyncHandler(controller.myReservations));
router.patch("/reservations/:id/status", asyncHandler(controller.updateStatus));
router.delete("/reservations/:id", asyncHandler(controller.remove));

module.exports = router;

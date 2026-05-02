const express = require("express");
const authController = require("../controllers/authController");
const oauthController = require("../controllers/oauthController");

const router = express.Router();

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

router.post("/register", asyncHandler(authController.register));
router.post("/login", asyncHandler(authController.login));
router.post("/refresh", asyncHandler(authController.refresh));
router.post("/logout", asyncHandler(authController.logout));
router.post("/introspect", asyncHandler(authController.introspect));
router.get("/github", oauthController.githubRedirect);
router.get("/github/callback", asyncHandler(oauthController.githubCallback));

module.exports = router;

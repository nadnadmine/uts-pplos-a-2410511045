const express = require("express");
const axios = require("axios");
const authenticateGateway = require("../middleware/authMiddleware");

const router = express.Router();

const services = {
  auth: process.env.AUTH_SERVICE_URL || "http://localhost:3001",
  patient: process.env.PATIENT_SERVICE_URL || "http://localhost:8000",
  appointment: process.env.APPOINTMENT_SERVICE_URL || "http://localhost:3002"
};

const publicAuthPaths = new Set([
  "/auth/register",
  "/auth/login",
  "/auth/github",
  "/auth/github/callback",
  "/auth/refresh"
]);

function normalizedPath(req) {
  return req.path.length > 1 ? req.path.replace(/\/$/, "") : req.path;
}

async function proxy(req, res, baseUrl, options = {}) {
  const headers = {
    "x-user-id": req.headers["x-user-id"],
    "x-user-email": req.headers["x-user-email"],
    "x-user-role": req.headers["x-user-role"]
  };

  if (!options.publicRoute && req.headers.authorization) {
    headers.authorization = req.headers.authorization;
  }

  const response = await axios({
    method: req.method,
    url: `${baseUrl}${req.originalUrl}`,
    data: req.body,
    maxRedirects: 0,
    headers,
    validateStatus: () => true
  });

  if (response.status >= 300 && response.status < 400 && response.headers.location) {
    return res.redirect(response.status, response.headers.location);
  }

  if (response.status === 204) {
    return res.status(204).send();
  }

  if (response.data === undefined || response.data === "") {
    return res.status(response.status).send();
  }

  return res.status(response.status).json(response.data);
}

router.use(async (req, res, next) => {
  if (!publicAuthPaths.has(normalizedPath(req))) {
    return next();
  }

  try {
    return await proxy(req, res, services.auth, { publicRoute: true });
  } catch (error) {
    return res.status(500).json({
      message: "Gateway failed to reach auth service",
      detail: error.message
    });
  }
});

router.use(authenticateGateway);

function resolveTarget(req) {
  if (req.path.startsWith("/auth")) return services.auth;
  if (req.path.startsWith("/patients") || req.path.startsWith("/records") || req.path.startsWith("/prescriptions")) return services.patient;
  if (req.path.startsWith("/doctors") || req.path.startsWith("/reservations")) return services.appointment;
  return null;
}

router.all("*", async (req, res) => {
  const baseUrl = resolveTarget(req);
  if (!baseUrl) {
    return res.status(404).json({ message: "Route not mapped in gateway" });
  }

  try {
    return await proxy(req, res, baseUrl);
  } catch (error) {
    return res.status(500).json({
      message: "Gateway failed to reach downstream service",
      detail: error.message
    });
  }
});

module.exports = router;

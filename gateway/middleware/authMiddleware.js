const jwt = require("jsonwebtoken");
const axios = require("axios");

const publicRoutes = [
  { method: "POST", path: /^\/auth\/register$/ },
  { method: "POST", path: /^\/auth\/login$/ },
  { method: "GET", path: /^\/auth\/github$/ },
  { method: "GET", path: /^\/auth\/github\/callback$/ },
  { method: "POST", path: /^\/auth\/refresh$/ }
];

function isPublicRoute(req) {
  const normalizedPath = req.path.length > 1 ? req.path.replace(/\/$/, "") : req.path;
  return publicRoutes.some((route) => route.method === req.method && route.path.test(normalizedPath));
}

async function authenticateGateway(req, res, next) {
  if (isPublicRoute(req)) {
    return next();
  }

  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing bearer token" });
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const authBaseUrl = process.env.AUTH_SERVICE_URL || "http://localhost:3001";
    const introspection = await axios.post(
      `${authBaseUrl}/auth/introspect`,
      {},
      {
        headers: { authorization: header },
        validateStatus: () => true
      }
    );

    if (introspection.status !== 200 || introspection.data.active !== true) {
      return res.status(401).json({ message: "Token is inactive or revoked" });
    }

    req.user = payload;
    req.headers["x-user-id"] = String(payload.sub);
    req.headers["x-user-email"] = payload.email || "";
    req.headers["x-user-role"] = payload.role || "patient";
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired access token" });
  }
}

module.exports = authenticateGateway;

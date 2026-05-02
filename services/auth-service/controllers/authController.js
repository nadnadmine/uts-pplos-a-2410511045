const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const userModel = require("../models/userModel");

const refreshDays = Number(process.env.REFRESH_TOKEN_DAYS || 7);

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function createAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name, role: user.role || "patient" },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_TTL || "15m" }
  );
}

async function createRefreshToken(userId) {
  const token = jwt.sign({ sub: userId, type: "refresh" }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: `${refreshDays}d`
  });
  const expiresAt = new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000);
  await pool.execute("INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)", [
    userId,
    hashToken(token),
    expiresAt
  ]);
  return token;
}

async function issueTokenPair(user) {
  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar_url: user.avatar_url || null,
    oauth_provider: user.oauth_provider || "local",
    role: user.role || "patient"
  };

  return {
    token_type: "Bearer",
    expires_in: 900,
    access_token: createAccessToken(user),
    refresh_token: await createRefreshToken(user.id),
    user: safeUser
  };
}

async function register(req, res) {
  const { name, email, password } = req.body;
  const errors = {};

  if (!name || name.trim().length < 3) errors.name = "Name must be at least 3 characters";
  if (!email || !validateEmail(email)) errors.email = "Valid email is required";
  if (!password || password.length < 8) errors.password = "Password must be at least 8 characters";

  if (Object.keys(errors).length) {
    return res.status(422).json({ message: "Validation failed", errors });
  }

  const existing = await userModel.findByEmail(email);
  if (existing) {
    return res.status(409).json({ message: "Email already registered" });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await userModel.createLocalUser({ name, email, passwordHash });
    return res.status(201).json({ message: "User registered", user });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Email already registered" });
    }
    throw error;
  }
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await userModel.findByEmail(email);
  if (!user || !user.password) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  await pool.execute("INSERT INTO login_logs (user_id, ip_address) VALUES (?, ?)", [user.id, req.ip]);
  return res.json(await issueTokenPair(user));
}

async function refresh(req, res) {
  const { refresh_token: refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token is required" });
  }

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const tokenHash = hashToken(refreshToken);
    const [rows] = await pool.execute(
      "SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > NOW() LIMIT 1",
      [tokenHash]
    );

    if (!rows.length) {
      return res.status(401).json({ message: "Refresh token is invalid or revoked" });
    }

    await pool.execute("UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ?", [tokenHash]);
    const user = await userModel.findById(payload.sub);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json(await issueTokenPair(user));
  } catch (error) {
    return res.status(401).json({ message: "Refresh token is invalid or expired" });
  }
}

async function logout(req, res) {
  const authHeader = req.headers.authorization;
  const refreshToken = req.body.refresh_token;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const decoded = jwt.decode(token);
    const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 15 * 60 * 1000);
    await pool.execute("INSERT IGNORE INTO token_blacklist (token_hash, expires_at) VALUES (?, ?)", [
      hashToken(token),
      expiresAt
    ]);
  }

  if (refreshToken) {
    await pool.execute("UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ?", [hashToken(refreshToken)]);
  }

  return res.status(204).send();
}

async function introspect(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ active: false, message: "Missing bearer token" });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const [blacklisted] = await pool.execute(
      "SELECT id FROM token_blacklist WHERE token_hash = ? AND expires_at > NOW() LIMIT 1",
      [hashToken(token)]
    );

    if (blacklisted.length) {
      return res.status(401).json({ active: false, message: "Token revoked" });
    }

    return res.json({ active: true, user: { id: payload.sub, email: payload.email, role: payload.role } });
  } catch (error) {
    return res.status(401).json({ active: false, message: "Invalid token" });
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  introspect,
  issueTokenPair
};

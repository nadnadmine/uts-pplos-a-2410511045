// gateway/src/middleware/jwtValidation.js
'use strict';

const jwt = require('jsonwebtoken');
const { isPublicRoute } = require('../config/routes');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

/**
 * Middleware JWT Validation di sisi Gateway.
 *
 * Alur:
 * 1. Cek apakah route adalah public → langsung forward
 * 2. Baca header Authorization: Bearer <token>
 * 3. Verifikasi token (signature + expiry)
 * 4. Forward ke service tujuan; token asli ikut diteruskan
 *    agar service downstream juga bisa membaca klaim user.
 *
 * Catatan UTS: validasi JWT di gateway dilakukan SEBELUM request
 * diteruskan ke service belakang, sehingga service belakang tidak
 * perlu lagi validasi dari sisi keamanan jaringan (hanya untuk
 * membaca klaim role/user).
 */
const jwtValidation = (req, res, next) => {
  const { method, path } = req;

  // Lewati validasi untuk public routes
  if (isPublicRoute(method, path)) {
    return next();
  }

  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authorization header missing or malformed',
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ACCESS_SECRET);

    // Tempel decoded payload ke request untuk logging/auditing
    req.jwtPayload = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Access token expired' });
    }
    return res.status(401).json({ success: false, message: 'Invalid access token' });
  }
};

module.exports = jwtValidation;
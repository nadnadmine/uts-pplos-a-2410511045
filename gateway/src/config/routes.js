// gateway/src/config/routes.js
'use strict';

/**
 * Peta routing API Gateway → Service tujuan.
 *
 * Setiap entry mendefinisikan:
 *  - prefix : prefix path yang ditangkap gateway
 *  - target : URL service tujuan (dalam Docker network)
 *  - auth   : apakah route ini butuh JWT validation di gateway
 *
 * Endpoint yang dikecualikan dari validasi JWT (public):
 *  - POST /auth/register
 *  - POST /auth/login
 *  - POST /auth/refresh
 *  - GET  /auth/oauth/github
 *  - GET  /auth/oauth/github/callback
 *  - GET  /clinic/doctors        (listing publik)
 *  - GET  /clinic/doctors/:id    (detail publik)
 */

const AUTH_SERVICE_URL    = process.env.AUTH_SERVICE_URL    || 'http://auth-service:3001';
const PATIENT_SERVICE_URL = process.env.PATIENT_SERVICE_URL || 'http://patient-service:8080';
const CLINIC_SERVICE_URL  = process.env.CLINIC_SERVICE_URL  || 'http://clinic-service:3002';

/**
 * Daftar path yang TIDAK perlu JWT (whitelist/bypass).
 * Cek menggunakan exact match atau prefix.
 */
const PUBLIC_PATHS = [
  { method: 'POST', path: '/auth/register' },
  { method: 'POST', path: '/auth/login' },
  { method: 'POST', path: '/auth/refresh' },
  { method: 'GET',  path: '/auth/oauth/github' },
  { method: 'GET',  path: '/auth/oauth/github/callback' },
  { method: 'GET',  path: '/health' },
];

/**
 * Prefix publik untuk clinic doctors (GET tanpa auth).
 */
const PUBLIC_CLINIC_PREFIXES = ['/clinic/doctors'];

/**
 * Tentukan apakah request perlu validasi JWT di gateway.
 */
const isPublicRoute = (method, path) => {
  // Exact match
  const exact = PUBLIC_PATHS.some(
    p => p.method === method && p.path === path
  );
  if (exact) return true;

  // Clinic doctors publik (hanya GET)
  if (method === 'GET') {
    const clinicPublic = PUBLIC_CLINIC_PREFIXES.some(prefix => path.startsWith(prefix));
    if (clinicPublic) return true;
  }

  return false;
};

/**
 * Tentukan target service berdasarkan prefix path.
 */
const getTarget = (path) => {
  if (path.startsWith('/auth'))    return AUTH_SERVICE_URL;
  if (path.startsWith('/patients')) return PATIENT_SERVICE_URL;
  if (path.startsWith('/clinic'))   return CLINIC_SERVICE_URL;
  return null;
};

module.exports = {
  AUTH_SERVICE_URL,
  PATIENT_SERVICE_URL,
  CLINIC_SERVICE_URL,
  isPublicRoute,
  getTarget,
};
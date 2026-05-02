const pool = require("../config/db");

async function listSchedules(filters = {}) {
  const params = [];
  const conditions = [];

  if (filters.clinic_id) {
    conditions.push("c.id = ?");
    params.push(filters.clinic_id);
  }

  if (filters.day) {
    conditions.push("s.day_of_week = ?");
    params.push(filters.day);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [rows] = await pool.execute(
    `SELECT s.id, s.day_of_week, s.start_time, s.end_time, s.quota,
            d.id AS doctor_id, d.name AS doctor_name, d.specialization,
            c.id AS clinic_id, c.clinic_name
     FROM schedules s
     JOIN doctors d ON d.id = s.doctor_id
     JOIN clinics c ON c.id = d.clinic_id
     ${where}
     ORDER BY FIELD(s.day_of_week, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'), s.start_time`,
    params
  );
  return rows;
}

async function findSchedule(id) {
  const [rows] = await pool.execute("SELECT * FROM schedules WHERE id = ? LIMIT 1", [id]);
  return rows[0] || null;
}

async function countReservations(scheduleId, reservationDate) {
  const [rows] = await pool.execute(
    "SELECT COUNT(*) AS total FROM reservations WHERE schedule_id = ? AND reservation_date = ? AND status <> 'cancelled'",
    [scheduleId, reservationDate]
  );
  return rows[0].total;
}

async function createReservation({ userId, patientId, scheduleId, reservationDate, complaint }) {
  const [result] = await pool.execute(
    `INSERT INTO reservations (user_id, patient_id, schedule_id, reservation_date, complaint)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, patientId, scheduleId, reservationDate, complaint || null]
  );
  return findReservationById(result.insertId);
}

async function findReservationById(id) {
  const [rows] = await pool.execute(
    `SELECT r.*, s.day_of_week, s.start_time, s.end_time, d.name AS doctor_name, c.clinic_name
     FROM reservations r
     JOIN schedules s ON s.id = r.schedule_id
     JOIN doctors d ON d.id = s.doctor_id
     JOIN clinics c ON c.id = d.clinic_id
     WHERE r.id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function listReservationsByUser(userId) {
  const [rows] = await pool.execute(
    `SELECT r.*, s.day_of_week, s.start_time, s.end_time, d.name AS doctor_name, c.clinic_name
     FROM reservations r
     JOIN schedules s ON s.id = r.schedule_id
     JOIN doctors d ON d.id = s.doctor_id
     JOIN clinics c ON c.id = d.clinic_id
     WHERE r.user_id = ?
     ORDER BY r.reservation_date DESC, s.start_time DESC`,
    [userId]
  );
  return rows;
}

async function updateReservationStatus(id, status) {
  await pool.execute("UPDATE reservations SET status = ? WHERE id = ?", [status, id]);
  return findReservationById(id);
}

async function deleteReservation(id) {
  const [result] = await pool.execute("DELETE FROM reservations WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

module.exports = {
  listSchedules,
  findSchedule,
  countReservations,
  createReservation,
  findReservationById,
  listReservationsByUser,
  updateReservationStatus,
  deleteReservation
};

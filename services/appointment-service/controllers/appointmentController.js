const axios = require("axios");
const model = require("../models/appointmentModel");

function currentUser(req) {
  return {
    id: Number(req.headers["x-user-id"]),
    role: req.headers["x-user-role"] || "patient"
  };
}

function isDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

async function schedules(req, res) {
  const rows = await model.listSchedules({
    clinic_id: req.query.clinic_id,
    day: req.query.day
  });
  return res.json({ data: rows });
}

async function ensurePatientExists(patientId, authorization) {
  const baseUrl = process.env.PATIENT_SERVICE_URL || "http://localhost:8000";
  const response = await axios.get(`${baseUrl}/patients/${patientId}`, {
    headers: { authorization },
    validateStatus: () => true
  });

  return response.status === 200 ? response.data.data : null;
}

async function createReservation(req, res) {
  const { patient_id: patientId, schedule_id: scheduleId, reservation_date: reservationDate, complaint } = req.body;
  const errors = {};
  const user = currentUser(req);

  if (!user.id) errors.user = "Authenticated user id is required";
  if (!patientId) errors.patient_id = "Patient id is required";
  if (!scheduleId) errors.schedule_id = "Schedule id is required";
  if (!reservationDate || !isDate(reservationDate)) errors.reservation_date = "Reservation date must use YYYY-MM-DD";

  if (Object.keys(errors).length) {
    return res.status(422).json({ message: "Validation failed", errors });
  }

  const patient = await ensurePatientExists(patientId, req.headers.authorization);
  if (!patient) {
    return res.status(404).json({ message: "Patient not found in patient-service" });
  }

  const schedule = await model.findSchedule(scheduleId);
  if (!schedule) {
    return res.status(404).json({ message: "Schedule not found" });
  }

  const booked = await model.countReservations(scheduleId, reservationDate);
  if (booked >= schedule.quota) {
    return res.status(409).json({ message: "Schedule quota is full" });
  }

  try {
    const reservation = await model.createReservation({
      userId: currentUser(req).id,
      patientId,
      scheduleId,
      reservationDate,
      complaint
    });
    return res.status(201).json({ message: "Reservation created", data: reservation });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Patient already has reservation for this schedule and date" });
    }
    throw error;
  }
}

async function myReservations(req, res) {
  const user = currentUser(req);
  if (!user.id) {
    return res.status(401).json({ message: "Authenticated user id is required" });
  }

  const rows = await model.listReservationsByUser(user.id);
  return res.json({ data: rows });
}

async function updateStatus(req, res) {
  const allowed = ["pending", "confirmed", "cancelled", "completed"];
  if (!allowed.includes(req.body.status)) {
    return res.status(422).json({ message: "Status is invalid", allowed });
  }

  const reservation = await model.findReservationById(req.params.id);
  if (!reservation) {
    return res.status(404).json({ message: "Reservation not found" });
  }

  const updated = await model.updateReservationStatus(req.params.id, req.body.status);
  return res.json({ message: "Reservation status updated", data: updated });
}

async function remove(req, res) {
  const reservation = await model.findReservationById(req.params.id);
  if (!reservation) {
    return res.status(404).json({ message: "Reservation not found" });
  }

  if (reservation.user_id !== currentUser(req).id && currentUser(req).role !== "admin") {
    return res.status(403).json({ message: "You cannot delete another user's reservation" });
  }

  await model.deleteReservation(req.params.id);
  return res.status(204).send();
}

module.exports = {
  schedules,
  createReservation,
  myReservations,
  updateStatus,
  remove
};

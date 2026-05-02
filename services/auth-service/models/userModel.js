const pool = require("../config/db");

async function findByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT u.*, COALESCE(r.role_name, 'patient') AS role
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id
     WHERE u.email = ?
     LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT u.id, u.name, u.email, u.avatar_url, u.oauth_provider, COALESCE(r.role_name, 'patient') AS role
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id
     WHERE u.id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function createLocalUser({ name, email, passwordHash, role = "patient" }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [userResult] = await connection.execute(
      "INSERT INTO users (name, email, password, oauth_provider) VALUES (?, ?, ?, 'local')",
      [name, email, passwordHash]
    );
    const [roles] = await connection.execute("SELECT id FROM roles WHERE role_name = ?", [role]);
    if (!roles.length) {
      throw new Error(`Role ${role} is not available. Import auth-service/schema.sql first.`);
    }
    await connection.execute("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)", [
      userResult.insertId,
      roles[0].id
    ]);
    await connection.commit();
    return findById(userResult.insertId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function upsertOAuthUser({ name, email, avatarUrl, oauthId }) {
  const existing = await findByEmail(email);
  if (existing) {
    await pool.execute(
      "UPDATE users SET name = ?, avatar_url = ?, oauth_id = ?, oauth_provider = 'github' WHERE id = ?",
      [name, avatarUrl, oauthId, existing.id]
    );
    return findById(existing.id);
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [userResult] = await connection.execute(
      "INSERT INTO users (name, email, avatar_url, oauth_id, oauth_provider) VALUES (?, ?, ?, ?, 'github')",
      [name, email, avatarUrl, oauthId]
    );
    const [roles] = await connection.execute("SELECT id FROM roles WHERE role_name = 'patient'");
    if (!roles.length) {
      throw new Error("Role patient is not available. Import auth-service/schema.sql first.");
    }
    await connection.execute("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)", [
      userResult.insertId,
      roles[0].id
    ]);
    await connection.commit();
    return findById(userResult.insertId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  findByEmail,
  findById,
  createLocalUser,
  upsertOAuthUser
};

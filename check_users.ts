import { pgPool } from "./server/src/config/postgres.js";

async function checkUsers() {
  try {
    const { rows } = await pgPool.query("SELECT email, role FROM users");
    console.log("Current Users:", rows);
  } catch (err) {
    console.error("DB Error:", err.message);
  } finally {
    process.exit();
  }
}

checkUsers();

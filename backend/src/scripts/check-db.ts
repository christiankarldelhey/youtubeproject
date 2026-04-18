import { checkDbConnection, pool } from '../db/pool.js';

async function main() {
  try {
    await checkDbConnection();
    console.log('DB connection OK');
    process.exitCode = 0;
  } catch (error) {
    console.error('DB connection failed', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void main();

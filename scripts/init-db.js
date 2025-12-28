const { initDatabase, closeDatabase } = require('../database/db');

async function initialize() {
  try {
    console.log('Initializing database...');
    await initDatabase();
    console.log('Database initialized successfully!');
    await closeDatabase();
    process.exit(0);
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

initialize();


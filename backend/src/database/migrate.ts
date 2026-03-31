import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './db';
import path from 'path';
import fs from 'fs';

export async function runMigrations() {
  // Try both possible locations:
  const possiblePaths = [
    path.join(process.cwd(), 'src', 'database', 'migrations'), // development (src)
    path.join(__dirname, '../../database/migrations'), // production (dist)
  ];

  let migrationsFolder: string | null = null;
  for (const p of possiblePaths) {
    const journalPath = path.join(p, 'meta', '_journal.json');
    if (fs.existsSync(p) && fs.existsSync(journalPath)) {
      migrationsFolder = p;
      break;
    }
  }

  if (!migrationsFolder) {
    throw new Error('Migrations folder with meta/_journal.json not found');
  }

  console.log('Running migrations from:', migrationsFolder);
  await migrate(db, { migrationsFolder });
  console.log('Migrations completed');
}

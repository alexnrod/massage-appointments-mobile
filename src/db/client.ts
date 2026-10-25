import { drizzle } from 'drizzle-orm/expo-sqlite';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { openDatabaseSync } from 'expo-sqlite';

import migrations from './migrations/migrations';
import * as schema from './schema';

// Change listener enabled so Drizzle's useLiveQuery re-runs when rows change.
const expoDb = openDatabaseSync('massage-appointments.db', { enableChangeListener: true });
// SQLite enforces foreign keys only once asked, per connection.
expoDb.execSync('PRAGMA foreign_keys = ON');

export const db = drizzle(expoDb, { schema });

export type AppDb = typeof db;

/** Applies pending migrations once at startup. Render nothing that touches the database until `success`. */
export function useDbMigrations() {
  return useMigrations(db, migrations);
}

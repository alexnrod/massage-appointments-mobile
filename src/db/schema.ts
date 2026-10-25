import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const appointments = sqliteTable('appointments', {
  id: text('id').primaryKey(),
  startsAt: integer('starts_at', { mode: 'timestamp' }).notNull(),
  clientName: text('client_name').notNull(),
});

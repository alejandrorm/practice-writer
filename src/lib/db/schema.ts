import { pgTable, uuid, text, boolean, integer, timestamp } from 'drizzle-orm/pg-core'

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  title: text('title').notNull().default('New Entry'),
  content: text('content').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const corrections = pgTable('corrections', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  originalText: text('original_text').notNull(),
  correctedText: text('corrected_text').notNull(),
  correctionType: text('correction_type').notNull(),
  explanation: text('explanation'),
  positionStart: integer('position_start'),
  positionEnd: integer('position_end'),
  wasAccepted: boolean('was_accepted'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export type Document = typeof documents.$inferSelect
export type NewDocument = typeof documents.$inferInsert
export type Correction = typeof corrections.$inferSelect
export type NewCorrection = typeof corrections.$inferInsert

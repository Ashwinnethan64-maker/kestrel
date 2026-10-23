import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  doublePrecision,
  jsonb,
  customType,
  index,
  uniqueIndex
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Custom PostGIS Geometry Point Type
const geometry = customType<{ data: string }>({
  dataType() {
    return 'geometry(Point, 4326)';
  }
});

// Custom pgvector Vector Type
const vector = customType<{ data: number[] }>({
  dataType() {
    return 'vector(1536)';
  }
});

// 1. Officers Table
export const officers = pgTable('officers', {
  id: uuid('id').defaultRandom().primaryKey(),
  badgeNumber: varchar('badge_number', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  role: varchar('role', { length: 50 }).default('Investigator'),
  station: varchar('station', { length: 100 }).notNull(),
  district: varchar('district', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// 2. Cases FIR Table
export const casesFir = pgTable(
  'cases_fir',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    firNumber: varchar('fir_number', { length: 100 }).notNull().unique(),
    crimeCategory: varchar('crime_category', { length: 100 }).notNull(),
    priority: varchar('priority', { length: 50 }).default('Medium'),
    status: varchar('status', { length: 50 }).default('Open'),
    incidentDate: timestamp('incident_date', { withTimezone: true }).notNull(),
    reportedDate: timestamp('reported_date', { withTimezone: true }).defaultNow(),
    district: varchar('district', { length: 100 }).notNull(),
    policeStation: varchar('police_station', { length: 100 }).notNull(),
    investigatingOfficerId: uuid('investigating_officer_id').references(() => officers.id),
    description: text('description').notNull(),
    descriptionKannada: text('description_kannada'),
    applicableActs: jsonb('applicable_acts').default([]),
    latitude: doublePrecision('latitude').notNull(),
    longitude: doublePrecision('longitude').notNull(),
    locationGeom: geometry('location_geom'),
    embedding: vector('embedding'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
  },
  (table) => [
    index('idx_firs_geom').using('gist', table.locationGeom),
    index('idx_firs_trgm').using(
      'gin',
      sql`${table.firNumber} gin_trgm_ops`,
      sql`${table.description} gin_trgm_ops`
    )
  ]
);

// 3. Accused & Suspect Entities Table
export const entitiesAccused = pgTable('entities_accused', {
  id: uuid('id').defaultRandom().primaryKey(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  aliases: jsonb('aliases').default([]),
  isRepeatOffender: boolean('is_repeat_offender').default(false),
  riskLevel: varchar('risk_level', { length: 50 }).default('Medium'),
  gangAffiliation: varchar('gang_affiliation', { length: 100 }),
  phoneNumbers: jsonb('phone_numbers').default([]),
  knownAddresses: jsonb('known_addresses').default([]),
  vehiclePlates: jsonb('vehicle_plates').default([]),
  totalPriorArrests: varchar('total_prior_arrests', { length: 50 }).default('0'),
  bailStatus: varchar('bail_status', { length: 50 }).default('None'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// 4. Case-Accused Junction Table
export const caseAccusedJunction = pgTable(
  'case_accused_junction',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    caseId: uuid('case_id').notNull().references(() => casesFir.id, { onDelete: 'cascade' }),
    accusedId: uuid('accused_id').notNull().references(() => entitiesAccused.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: 100 }).default('Prime Suspect'),
    status: varchar('status', { length: 50 }).default('Wanted')
  },
  (table) => [
    uniqueIndex('idx_case_accused_unique').on(table.caseId, table.accusedId)
  ]
);

// 5. Evidence Vault Table
export const caseEvidence = pgTable('case_evidence', {
  id: uuid('id').defaultRandom().primaryKey(),
  caseId: uuid('case_id').notNull().references(() => casesFir.id, { onDelete: 'cascade' }),
  evidenceType: varchar('evidence_type', { length: 100 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  fileUrl: text('file_url'),
  collectedDate: timestamp('collected_date', { withTimezone: true }).defaultNow(),
  chainOfCustody: jsonb('chain_of_custody').default([])
});

// 6. AI Conversation Threads Table
export const aiThreads = pgTable('ai_threads', {
  id: uuid('id').defaultRandom().primaryKey(),
  officerId: uuid('officer_id').references(() => officers.id),
  title: varchar('title', { length: 255 }).notNull(),
  messages: jsonb('messages').default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

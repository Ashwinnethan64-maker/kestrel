CREATE TABLE IF NOT EXISTS "ai_threads" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"officer_id" varchar(100),
	"title" varchar(255) NOT NULL,
	"messages" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "case_accused_junction" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"case_id" varchar(100) NOT NULL,
	"accused_id" varchar(100) NOT NULL,
	"role" varchar(100) DEFAULT 'Prime Suspect',
	"status" varchar(50) DEFAULT 'Wanted'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "case_evidence" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"case_id" varchar(100) NOT NULL,
	"evidence_type" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"file_url" text,
	"collected_date" timestamp with time zone DEFAULT now(),
	"chain_of_custody" jsonb DEFAULT '[]'::jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cases_fir" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"fir_number" varchar(100) NOT NULL,
	"crime_category" varchar(100) NOT NULL,
	"priority" varchar(50) DEFAULT 'Medium',
	"status" varchar(50) DEFAULT 'Open',
	"incident_date" timestamp with time zone NOT NULL,
	"reported_date" timestamp with time zone DEFAULT now(),
	"district" varchar(100) NOT NULL,
	"police_station" varchar(100) NOT NULL,
	"investigating_officer_id" varchar(100),
	"description" text NOT NULL,
	"description_kannada" text,
	"applicable_acts" jsonb DEFAULT '[]'::jsonb,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"location_geom" geometry(Point, 4326),
	"embedding" vector(1536),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "cases_fir_fir_number_unique" UNIQUE("fir_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "entities_accused" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"aliases" jsonb DEFAULT '[]'::jsonb,
	"is_repeat_offender" boolean DEFAULT false,
	"risk_level" varchar(50) DEFAULT 'Medium',
	"gang_affiliation" varchar(100),
	"phone_numbers" jsonb DEFAULT '[]'::jsonb,
	"known_addresses" jsonb DEFAULT '[]'::jsonb,
	"vehicle_plates" jsonb DEFAULT '[]'::jsonb,
	"total_prior_arrests" varchar(50) DEFAULT '0',
	"bail_status" varchar(50) DEFAULT 'None',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "investigative_tasks" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"case_id" varchar(100) NOT NULL,
	"assigned_officer_id" varchar(100),
	"title" varchar(255) NOT NULL,
	"task_type" varchar(100) NOT NULL,
	"priority" varchar(50) DEFAULT 'Medium',
	"status" varchar(50) DEFAULT 'Pending',
	"due_date" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "officers" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"badge_number" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'Investigator',
	"station" varchar(100) NOT NULL,
	"district" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "officers_badge_number_unique" UNIQUE("badge_number"),
	CONSTRAINT "officers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_threads" ADD CONSTRAINT "ai_threads_officer_id_officers_id_fk" FOREIGN KEY ("officer_id") REFERENCES "public"."officers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "case_accused_junction" ADD CONSTRAINT "case_accused_junction_case_id_cases_fir_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases_fir"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "case_accused_junction" ADD CONSTRAINT "case_accused_junction_accused_id_entities_accused_id_fk" FOREIGN KEY ("accused_id") REFERENCES "public"."entities_accused"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "case_evidence" ADD CONSTRAINT "case_evidence_case_id_cases_fir_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases_fir"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cases_fir" ADD CONSTRAINT "cases_fir_investigating_officer_id_officers_id_fk" FOREIGN KEY ("investigating_officer_id") REFERENCES "public"."officers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "investigative_tasks" ADD CONSTRAINT "investigative_tasks_case_id_cases_fir_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases_fir"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "investigative_tasks" ADD CONSTRAINT "investigative_tasks_assigned_officer_id_officers_id_fk" FOREIGN KEY ("assigned_officer_id") REFERENCES "public"."officers"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_case_accused_unique" ON "case_accused_junction" USING btree ("case_id","accused_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_firs_geom" ON "cases_fir" USING gist ("location_geom");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_firs_trgm" ON "cases_fir" USING gin ("fir_number" gin_trgm_ops,"description" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tasks_officer_status" ON "investigative_tasks" USING btree ("assigned_officer_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tasks_case" ON "investigative_tasks" USING btree ("case_id");
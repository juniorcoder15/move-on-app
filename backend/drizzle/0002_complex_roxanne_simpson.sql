CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" integer NOT NULL,
	"recipient_id" integer NOT NULL,
	"message" text NOT NULL,
	"read" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);

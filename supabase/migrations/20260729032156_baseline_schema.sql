


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."get_published_series_with_count"() RETURNS TABLE("series_id" "uuid", "category_id" "uuid", "title" "text", "description" "text", "thumbnail_url" "text", "slug" "text", "display_order" integer, "published" boolean, "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "post_count" bigint)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT
    s.series_id,
    s.category_id,
    s.title,
    s.description,
    s.thumbnail_url,
    s.slug,
    s.display_order,
    s.published,
    s.created_at,
    s.updated_at,
    COUNT(p.post_id) AS post_count
  FROM series s
  LEFT JOIN posts p ON s.series_id = p.series_id AND p.published = true
  WHERE s.published = true
  GROUP BY s.series_id
  ORDER BY s.display_order ASC;
$$;


ALTER FUNCTION "public"."get_published_series_with_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "category_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."posts" (
    "post_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text",
    "content" "text" DEFAULT ''::"text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "published" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "display_order" integer DEFAULT 0,
    "series_id" "uuid"
);


ALTER TABLE "public"."posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."series" (
    "series_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text",
    "thumbnail_url" "text",
    "slug" "text" NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "published" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."series" OWNER TO "postgres";


ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("category_id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("post_id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."series"
    ADD CONSTRAINT "series_pkey" PRIMARY KEY ("series_id");



ALTER TABLE ONLY "public"."series"
    ADD CONSTRAINT "series_slug_key" UNIQUE ("slug");



CREATE INDEX "idx_categories_display_order" ON "public"."categories" USING "btree" ("display_order");



CREATE INDEX "idx_posts_display_order" ON "public"."posts" USING "btree" ("display_order");



CREATE INDEX "idx_posts_published" ON "public"."posts" USING "btree" ("published", "created_at" DESC);



CREATE INDEX "idx_posts_series" ON "public"."posts" USING "btree" ("series_id", "display_order");



CREATE INDEX "idx_posts_slug" ON "public"."posts" USING "btree" ("slug");



CREATE INDEX "idx_series_category" ON "public"."series" USING "btree" ("category_id", "display_order");



CREATE INDEX "idx_series_published" ON "public"."series" USING "btree" ("published", "display_order");



CREATE INDEX "idx_series_slug" ON "public"."series" USING "btree" ("slug");



CREATE OR REPLACE TRIGGER "posts_updated_at" BEFORE UPDATE ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_series_updated_at" BEFORE UPDATE ON "public"."series" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "public"."series"("series_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."series"
    ADD CONSTRAINT "series_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("category_id") ON DELETE RESTRICT;



CREATE POLICY "Public read published posts" ON "public"."posts" FOR SELECT USING (("published" = true));



ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "categories_select" ON "public"."categories" FOR SELECT USING (true);



ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."series" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "series_select_published" ON "public"."series" FOR SELECT USING (("published" = true));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_published_series_with_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_published_series_with_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_published_series_with_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";



GRANT ALL ON TABLE "public"."series" TO "anon";
GRANT ALL ON TABLE "public"."series" TO "authenticated";
GRANT ALL ON TABLE "public"."series" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";








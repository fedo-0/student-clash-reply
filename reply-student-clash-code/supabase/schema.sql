-- =============================================================================
-- AppName — schema Supabase (prototipo hackathon)
-- Eseguibile nel SQL Editor di Supabase. Idempotente dove possibile.
-- Niente seed: i dati del prototipo sono mock lato frontend.
-- =============================================================================
-- DIMENSIONE EMBEDDING: per cambiarla, sostituire "vector(1536)" in questo file
-- (cerca "EMBEDDING_DIM"). Le occorrenze sono in document_chunks e opportunities.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Estensioni
-- -----------------------------------------------------------------------------
create extension if not exists pgcrypto;
create extension if not exists vector;

-- -----------------------------------------------------------------------------
-- 1. Tipi enum (creati solo se non esistono)
-- -----------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('student', 'teacher', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type staff_role as enum ('owner', 'assistant');
exception when duplicate_object then null; end $$;

do $$ begin
  create type event_source as enum ('quiz', 'ai_grading', 'simulation', 'self_assessment', 'official_grade');
exception when duplicate_object then null; end $$;

do $$ begin
  create type question_type as enum ('single_choice', 'multiple_choice', 'true_false', 'open', 'numeric');
exception when duplicate_object then null; end $$;

do $$ begin
  create type quiz_status as enum ('draft', 'review', 'published', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type question_status as enum ('proposed', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type chat_mode as enum ('tutor', 'guided_gap', 'oral_exam', 'roleplay');
exception when duplicate_object then null; end $$;

do $$ begin
  create type chat_role as enum ('user', 'assistant', 'system');
exception when duplicate_object then null; end $$;

do $$ begin
  create type job_status as enum ('queued', 'running', 'done', 'failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type document_kind as enum ('slides', 'notes', 'book', 'exercises', 'exam', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type opportunity_kind as enum ('internship', 'job', 'event', 'scholarship');
exception when duplicate_object then null; end $$;

do $$ begin
  create type match_feedback as enum ('interested', 'not_interested');
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- 2. Identità
-- -----------------------------------------------------------------------------
create table if not exists tenants (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  created_at  timestamptz not null default now()
);

create table if not exists profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  tenant_id       uuid not null references tenants(id) on delete cascade,
  role            user_role not null default 'student',
  full_name       text not null,
  email           text,
  avatar_url      text,
  degree_program  text,          -- corso di laurea (studenti)
  department      text,          -- dipartimento (docenti)
  year            smallint,      -- anno di corso
  external_id     text,          -- matricola / id ESSE3
  created_at      timestamptz not null default now()
);
create index if not exists profiles_tenant_idx on profiles(tenant_id, role);

-- Helper: tenant e ruolo dell'utente corrente (usati dalle policy RLS)
create or replace function current_tenant_id() returns uuid
language sql stable security definer set search_path = public as $$
  select tenant_id from profiles where id = auth.uid()
$$;

create or replace function current_user_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

create table if not exists student_goals (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references tenants(id) on delete cascade,
  student_id         uuid not null references profiles(id) on delete cascade,
  target_average     numeric(4,2),          -- media obiettivo (/30)
  target_graduation  smallint,              -- voto di laurea obiettivo (/110)
  target_date        date,
  notes              text,
  created_at         timestamptz not null default now(),
  unique (student_id)
);

create table if not exists student_skills (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  student_id  uuid not null references profiles(id) on delete cascade,
  name        text not null,
  level       smallint check (level between 1 and 5),
  source      text not null default 'manual',   -- manual | cv_ai | project
  created_at  timestamptz not null default now(),
  unique (student_id, name)
);

create table if not exists student_projects (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants(id) on delete cascade,
  student_id   uuid not null references profiles(id) on delete cascade,
  title        text not null,
  description  text,
  skills       text[] not null default '{}',
  url          text,
  created_at   timestamptz not null default now()
);

create table if not exists student_documents (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  student_id      uuid not null references profiles(id) on delete cascade,
  kind            text not null default 'cv',    -- cv | certificate | other
  storage_path    text not null,
  extracted_json  jsonb,                          -- skill/esperienze estratte dall'AI
  created_at      timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 3. Didattica
-- -----------------------------------------------------------------------------
create table if not exists courses (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  code            text not null,
  name            text not null,
  degree_program  text,
  cfu             smallint not null default 6,
  year            smallint,
  semester        smallint,
  description     text,
  external_id     text,
  created_at      timestamptz not null default now(),
  unique (tenant_id, code)
);

create table if not exists course_staff (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  course_id   uuid not null references courses(id) on delete cascade,
  teacher_id  uuid not null references profiles(id) on delete cascade,
  role        staff_role not null default 'owner',
  created_at  timestamptz not null default now(),
  unique (course_id, teacher_id)
);

create table if not exists enrollments (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references tenants(id) on delete cascade,
  course_id      uuid not null references courses(id) on delete cascade,
  student_id     uuid not null references profiles(id) on delete cascade,
  academic_year  text not null,             -- es. '2026/27'
  active         boolean not null default true,
  created_at     timestamptz not null default now(),
  unique (course_id, student_id, academic_year)
);
create index if not exists enrollments_student_idx on enrollments(student_id);

-- Libretto ufficiale (da ESSE3). course_id nullable per esami fuori piattaforma.
create table if not exists exam_records (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants(id) on delete cascade,
  student_id   uuid not null references profiles(id) on delete cascade,
  course_id    uuid references courses(id) on delete set null,
  course_name  text not null,
  cfu          smallint not null,
  grade        smallint check (grade between 18 and 30),   -- null = idoneità / non sostenuto
  honors       boolean not null default false,             -- lode
  passed_at    date,
  external_id  text,
  created_at   timestamptz not null default now()
);
create index if not exists exam_records_student_idx on exam_records(student_id);

-- Appelli
create table if not exists exam_sessions (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants(id) on delete cascade,
  course_id    uuid not null references courses(id) on delete cascade,
  date         timestamptz not null,
  room         text,
  kind         text not null default 'written',   -- written | oral
  external_id  text,
  created_at   timestamptz not null default now()
);
create index if not exists exam_sessions_course_idx on exam_sessions(course_id, date);

-- Propedeuticità tra corsi
create table if not exists prerequisites (
  id                    uuid primary key default gen_random_uuid(),
  tenant_id             uuid not null references tenants(id) on delete cascade,
  course_id             uuid not null references courses(id) on delete cascade,
  prerequisite_course_id uuid not null references courses(id) on delete cascade,
  mandatory             boolean not null default false,
  created_at            timestamptz not null default now(),
  unique (course_id, prerequisite_course_id)
);

-- -----------------------------------------------------------------------------
-- 4. Competenze
-- -----------------------------------------------------------------------------
create table if not exists topics (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants(id) on delete cascade,
  course_id    uuid not null references courses(id) on delete cascade,
  name         text not null,
  description  text,
  exam_weight  numeric(4,3) not null default 0 check (exam_weight between 0 and 1),
  position     smallint not null default 0,
  module       text,                      -- modulo didattico (per checkpoint)
  created_at   timestamptz not null default now()
);
create index if not exists topics_course_idx on topics(course_id);

create table if not exists topic_prerequisites (
  id                     uuid primary key default gen_random_uuid(),
  tenant_id              uuid not null references tenants(id) on delete cascade,
  topic_id               uuid not null references topics(id) on delete cascade,
  prerequisite_topic_id  uuid not null references topics(id) on delete cascade,
  created_at             timestamptz not null default now(),
  unique (topic_id, prerequisite_topic_id)
);

create table if not exists learning_events (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  student_id  uuid not null references profiles(id) on delete cascade,
  topic_id    uuid not null references topics(id) on delete cascade,
  score       numeric(5,2) not null check (score between 0 and 100),
  difficulty  numeric(3,2) not null default 0.5 check (difficulty between 0 and 1),
  weight      numeric(3,2) not null default 1 check (weight between 0 and 1),
  source      event_source not null,
  source_ref  uuid,                       -- es. quiz_answers.id, chat_sessions.id
  created_at  timestamptz not null default now()
);
create index if not exists learning_events_student_topic_idx on learning_events(student_id, topic_id, created_at);

create table if not exists mastery (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  student_id    uuid not null references profiles(id) on delete cascade,
  topic_id      uuid not null references topics(id) on delete cascade,
  score         numeric(5,2) not null default 0,
  confidence    numeric(4,3) not null default 0,
  events_count  integer not null default 0,
  updated_at    timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  unique (student_id, topic_id)
);
create index if not exists mastery_topic_idx on mastery(topic_id);

create table if not exists mastery_snapshots (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants(id) on delete cascade,
  student_id   uuid not null references profiles(id) on delete cascade,
  topic_id     uuid not null references topics(id) on delete cascade,
  score        numeric(5,2) not null,
  confidence   numeric(4,3) not null,
  week_start   date not null,
  created_at   timestamptz not null default now(),
  unique (student_id, topic_id, week_start)
);

-- Trigger: aggiorna mastery ad ogni learning_event (stessa formula di src/lib/mastery.ts)
--   k   = greatest(0.15, 1 / (n + 1))       n = eventi precedenti
--   new = old + k * weight * (score - old)  (primo evento: new = score)
--   confidence = 1 - exp(-(n+1) / 4)
create or replace function apply_learning_event() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  m mastery%rowtype;
  k numeric;
  new_score numeric;
begin
  select * into m from mastery where student_id = new.student_id and topic_id = new.topic_id for update;

  if not found then
    insert into mastery (tenant_id, student_id, topic_id, score, confidence, events_count, updated_at)
    values (new.tenant_id, new.student_id, new.topic_id, new.score, 1 - exp(-1.0 / 4), 1, now());
  else
    k := greatest(0.15, 1.0 / (m.events_count + 1));
    new_score := m.score + k * new.weight * (new.score - m.score);
    update mastery
       set score        = round(least(100, greatest(0, new_score)), 2),
           events_count = m.events_count + 1,
           confidence   = round(1 - exp(-(m.events_count + 1) / 4.0), 3),
           updated_at   = now()
     where id = m.id;
  end if;
  return new;
end $$;

drop trigger if exists trg_apply_learning_event on learning_events;
create trigger trg_apply_learning_event
  after insert on learning_events
  for each row execute function apply_learning_event();

-- -----------------------------------------------------------------------------
-- 5. Materiali / RAG
-- -----------------------------------------------------------------------------
create table if not exists documents (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  course_id     uuid not null references courses(id) on delete cascade,
  uploaded_by   uuid references profiles(id) on delete set null,
  title         text not null,
  kind          document_kind not null default 'slides',
  storage_path  text not null,
  pages         integer,
  status        job_status not null default 'queued',  -- stato indicizzazione
  created_at    timestamptz not null default now()
);

create table if not exists document_chunks (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants(id) on delete cascade,
  document_id  uuid not null references documents(id) on delete cascade,
  chunk_index  integer not null,
  content      text not null,
  page         integer,
  topic_ids    uuid[] not null default '{}',
  embedding    vector(1536),                                   -- EMBEDDING_DIM
  tsv          tsvector generated always as (to_tsvector('italian', content)) stored,
  created_at   timestamptz not null default now()
);
create index if not exists document_chunks_embedding_idx on document_chunks using hnsw (embedding vector_cosine_ops);
create index if not exists document_chunks_tsv_idx on document_chunks using gin (tsv);
create index if not exists document_chunks_doc_idx on document_chunks(document_id, chunk_index);

create table if not exists jobs (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  kind        text not null,              -- ingest_document | generate_quiz | predict_exam | cluster_questions
  status      job_status not null default 'queued',
  payload     jsonb not null default '{}',
  result      jsonb,
  error       text,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  finished_at timestamptz
);

-- -----------------------------------------------------------------------------
-- 6. Quiz / esami
-- -----------------------------------------------------------------------------
create table if not exists quizzes (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  course_id     uuid not null references courses(id) on delete cascade,
  created_by    uuid references profiles(id) on delete set null,
  title         text not null,
  description   text,
  status        quiz_status not null default 'draft',
  source_document_ids uuid[] not null default '{}',
  published_at  timestamptz,
  created_at    timestamptz not null default now()
);

create table if not exists quiz_questions (
  id                    uuid primary key default gen_random_uuid(),
  tenant_id             uuid not null references tenants(id) on delete cascade,
  quiz_id               uuid not null references quizzes(id) on delete cascade,
  position              smallint not null default 0,
  type                  question_type not null,
  prompt                text not null,
  options               jsonb,              -- [{id, text}]
  correct_answer        jsonb not null,     -- ["b"] | true | 42 | "testo atteso"
  explanation           text,
  topic_ids             uuid[] not null default '{}',
  difficulty_estimated  numeric(3,2) check (difficulty_estimated between 0 and 1),
  difficulty_observed   numeric(3,2) check (difficulty_observed between 0 and 1),
  source_chunk_ids      uuid[] not null default '{}',
  status                question_status not null default 'proposed',
  created_at            timestamptz not null default now()
);
create index if not exists quiz_questions_quiz_idx on quiz_questions(quiz_id, position);

create table if not exists quiz_attempts (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants(id) on delete cascade,
  quiz_id      uuid not null references quizzes(id) on delete cascade,
  student_id   uuid not null references profiles(id) on delete cascade,
  score        numeric(5,2),
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  created_at   timestamptz not null default now()
);

create table if not exists quiz_answers (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants(id) on delete cascade,
  attempt_id   uuid not null references quiz_attempts(id) on delete cascade,
  question_id  uuid not null references quiz_questions(id) on delete cascade,
  answer       jsonb,
  is_correct   boolean,
  score        numeric(5,2),
  feedback     text,
  created_at   timestamptz not null default now()
);

-- Esame "logico" (es. scritto di giugno) collegato a un appello
create table if not exists exams (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references tenants(id) on delete cascade,
  course_id        uuid not null references courses(id) on delete cascade,
  exam_session_id  uuid references exam_sessions(id) on delete set null,
  title            text not null,
  max_points       numeric(5,2) not null default 30,
  pass_threshold   numeric(5,2) not null default 18,
  created_at       timestamptz not null default now()
);

create table if not exists exam_drafts (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  exam_id       uuid references exams(id) on delete cascade,
  course_id     uuid not null references courses(id) on delete cascade,
  created_by    uuid references profiles(id) on delete set null,
  title         text not null,
  storage_path  text,
  exercises     jsonb not null default '[]',   -- [{id, title, points, topic_ids, difficulty}]
  created_at    timestamptz not null default now()
);

create table if not exists exam_predictions (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  exam_draft_id   uuid not null references exam_drafts(id) on delete cascade,
  params          jsonb not null default '{}',   -- iterazioni, pesi what-if
  expected_mean   numeric(5,2),
  ci_low          numeric(5,2),
  ci_high         numeric(5,2),
  pass_rate       numeric(4,3),
  per_exercise    jsonb,                         -- [{exercise_id, success_rate}]
  histogram       jsonb,
  ai_explanation  text,                          -- unico campo scritto dall'LLM
  created_at      timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 7. Interazioni AI
-- -----------------------------------------------------------------------------
create table if not exists chat_sessions (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants(id) on delete cascade,
  student_id   uuid not null references profiles(id) on delete cascade,
  course_id    uuid references courses(id) on delete set null,
  topic_id     uuid references topics(id) on delete set null,
  scenario_id  uuid,                              -- FK aggiunta sotto (roleplay)
  mode         chat_mode not null default 'tutor',
  title        text,
  created_at   timestamptz not null default now()
);

create table if not exists chat_messages (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  session_id  uuid not null references chat_sessions(id) on delete cascade,
  role        chat_role not null,
  content     text not null,
  citations   jsonb not null default '[]',   -- [{document_id, title, page, chunk_id}]
  created_at  timestamptz not null default now()
);
create index if not exists chat_messages_session_idx on chat_messages(session_id, created_at);

create table if not exists question_clusters (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references tenants(id) on delete cascade,
  course_id         uuid not null references courses(id) on delete cascade,
  topic_id          uuid references topics(id) on delete set null,
  title             text not null,
  summary           text,
  official_answer   text,
  answered_by       uuid references profiles(id) on delete set null,
  answered_at       timestamptz,
  created_at        timestamptz not null default now()
);

-- Domande anonimizzate: NESSUN student_id per design
create table if not exists student_questions (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  course_id   uuid not null references courses(id) on delete cascade,
  topic_id    uuid references topics(id) on delete set null,
  cluster_id  uuid references question_clusters(id) on delete set null,
  text        text not null,
  asked_at    timestamptz not null default now(),
  created_at  timestamptz not null default now()
);
create index if not exists student_questions_course_idx on student_questions(course_id, asked_at);

create table if not exists roleplay_scenarios (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  course_id     uuid not null references courses(id) on delete cascade,  -- materia per cui prepara
  topic_ids     uuid[] not null default '{}',                             -- topic allenati
  degree_program text,
  title         text not null,
  description   text,
  counterpart_label text not null default 'Cliente',   -- Cliente | Paziente | ...
  skills        text[] not null default '{}',          -- competenze allenate
  prepares_for  text,                                  -- situazione professionale simulata
  persona       jsonb not null,     -- {name, age, role, context, opening_lines: {gentle, moderate, aggressive}}
  hidden_facts  jsonb not null default '[]',   -- [{id, topic_id, fact, reply, keywords[], level 1-3, hint}]
  objections    jsonb not null default '[]',   -- [string] obiezioni a difficoltà avanzata
  solution_keywords text[] not null default '{}',
  rubric        jsonb not null default '[]',   -- [{criterion, weight, description, focus}]
  created_by    uuid references profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

do $$ begin
  alter table chat_sessions
    add constraint chat_sessions_scenario_fk foreign key (scenario_id) references roleplay_scenarios(id) on delete set null;
exception when duplicate_object then null; end $$;

create table if not exists roleplay_evaluations (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references tenants(id) on delete cascade,
  session_id        uuid not null references chat_sessions(id) on delete cascade,
  scenario_id       uuid not null references roleplay_scenarios(id) on delete cascade,
  student_id        uuid not null references profiles(id) on delete cascade,
  difficulty        smallint not null default 1 check (difficulty between 1 and 3),
  attitude          text not null default 'moderate' check (attitude in ('gentle','moderate','aggressive')),
  total_score       numeric(5,2),
  criteria_scores   jsonb not null default '[]',   -- [{criterion, score, comment}]
  facts_discovered  jsonb not null default '[]',
  feedback          text,
  created_at        timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 8. Ponte / altro
-- -----------------------------------------------------------------------------
create table if not exists opportunities (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id) on delete cascade,
  kind          opportunity_kind not null,
  title         text not null,
  organization  text not null,
  description   text,
  location      text,
  skills        text[] not null default '{}',
  degree_programs text[] not null default '{}',
  deadline      date,
  url           text,
  embedding     vector(1536),                       -- EMBEDDING_DIM
  created_at    timestamptz not null default now()
);
create index if not exists opportunities_embedding_idx on opportunities using hnsw (embedding vector_cosine_ops);

create table if not exists opportunity_matches (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  opportunity_id  uuid not null references opportunities(id) on delete cascade,
  student_id      uuid not null references profiles(id) on delete cascade,
  score           numeric(4,3) not null,
  reason          text,
  feedback        match_feedback,
  created_at      timestamptz not null default now(),
  unique (opportunity_id, student_id)
);

create table if not exists notifications (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  kind        text not null,
  title       text not null,
  body        text,
  link        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists notifications_user_idx on notifications(user_id, read_at);

-- -----------------------------------------------------------------------------
-- 9. Viste aggregate per il docente (solo aggregati, nessun dato individuale)
--    security_invoker: rispettano la RLS dell'utente che interroga.
-- -----------------------------------------------------------------------------
create or replace view v_course_topic_mastery with (security_invoker = true) as
select
  t.tenant_id,
  t.course_id,
  t.id                                                   as topic_id,
  t.name                                                 as topic_name,
  t.exam_weight,
  count(m.id)                                            as students_count,
  round(avg(m.score), 1)                                 as avg_score,
  count(*) filter (where m.confidence < 0.35)            as unverified_count,
  count(*) filter (where m.confidence >= 0.35 and m.score < 40)                  as gap_count,
  count(*) filter (where m.confidence >= 0.35 and m.score >= 40 and m.score < 70) as consolidating_count,
  count(*) filter (where m.confidence >= 0.35 and m.score >= 70)                 as mastered_count
from topics t
left join mastery m on m.topic_id = t.id
group by t.tenant_id, t.course_id, t.id, t.name, t.exam_weight;

-- Readiness per studente (interna, usata solo per aggregare la vista successiva)
create or replace view v_student_course_readiness with (security_invoker = true) as
select
  e.tenant_id,
  e.course_id,
  e.student_id,
  round(coalesce(sum(t.exam_weight * coalesce(m.score, 0)) / nullif(sum(t.exam_weight), 0), 0), 1) as readiness
from enrollments e
join topics t on t.course_id = e.course_id
left join mastery m on m.topic_id = t.id and m.student_id = e.student_id
where e.active
group by e.tenant_id, e.course_id, e.student_id;

create or replace view v_course_readiness with (security_invoker = true) as
select
  tenant_id,
  course_id,
  count(*)                                        as students_count,
  round(avg(readiness), 1)                        as avg_readiness,
  percentile_cont(0.5) within group (order by readiness) as median_readiness,
  count(*) filter (where readiness < 40)          as at_risk_count
from v_student_course_readiness
group by tenant_id, course_id;

-- -----------------------------------------------------------------------------
-- 10. Row Level Security (base, da prototipo)
--   - policy "tenant_isolation": ogni utente vede solo righe del proprio tenant
--   - policy "owner_*": tabelle personali dello studente → solo il proprietario
--     (più docenti/admin dello stesso tenant in lettura dove serve).
--   Le Edge Functions usano la service_role key, che bypassa la RLS.
-- -----------------------------------------------------------------------------
alter table tenants enable row level security;
drop policy if exists tenant_self on tenants;
create policy tenant_self on tenants for select using (id = current_tenant_id());

-- Isolamento per tenant su tutte le tabelle "condivise"
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','courses','course_staff','enrollments','exam_sessions','prerequisites',
    'topics','topic_prerequisites','documents','document_chunks','jobs',
    'quizzes','quiz_questions','exams','exam_drafts','exam_predictions',
    'question_clusters','student_questions','roleplay_scenarios',
    'opportunities'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists tenant_isolation on %I', t);
    execute format(
      'create policy tenant_isolation on %I for all using (tenant_id = current_tenant_id()) with check (tenant_id = current_tenant_id())', t);
  end loop;
end $$;

-- Tabelle personali dello studente: il proprietario fa tutto; docenti/admin del tenant leggono
-- (in produzione il docente dovrebbe leggere solo tramite le viste aggregate).
do $$
declare t text;
begin
  foreach t in array array[
    'student_goals','student_skills','student_projects','student_documents',
    'exam_records','learning_events','mastery','mastery_snapshots',
    'quiz_attempts','chat_sessions','roleplay_evaluations','opportunity_matches'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists owner_all on %I', t);
    execute format('drop policy if exists staff_read on %I', t);
    execute format(
      'create policy owner_all on %I for all using (student_id = auth.uid() and tenant_id = current_tenant_id()) with check (student_id = auth.uid() and tenant_id = current_tenant_id())', t);
    execute format(
      'create policy staff_read on %I for select using (tenant_id = current_tenant_id() and current_user_role() in (''teacher'',''admin''))', t);
  end loop;
end $$;

-- Tabelle figlie senza student_id: proprietà via join sul padre
alter table quiz_answers enable row level security;
drop policy if exists owner_all on quiz_answers;
create policy owner_all on quiz_answers for all using (
  exists (select 1 from quiz_attempts a where a.id = attempt_id and a.student_id = auth.uid())
);

alter table chat_messages enable row level security;
drop policy if exists owner_all on chat_messages;
create policy owner_all on chat_messages for all using (
  exists (select 1 from chat_sessions s where s.id = session_id and s.student_id = auth.uid())
);

alter table notifications enable row level security;
drop policy if exists owner_all on notifications;
create policy owner_all on notifications for all using (user_id = auth.uid());

-- =============================================================================
-- Fine schema
-- =============================================================================

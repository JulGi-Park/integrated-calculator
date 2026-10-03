PRAGMA foreign_keys = ON;

CREATE TABLE services (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX services_status_idx ON services(status);

CREATE TABLE knowledge_questions (
  id TEXT PRIMARY KEY,
  is_anonymous INTEGER NOT NULL CHECK (is_anonymous IN (0, 1)),
  nickname TEXT,
  password_hash TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT CHECK (category IS NULL OR category IN (
    '근로·고용', '금융', '세금', '부동산', '사업', '투자', '자동차', '교육·자격', '복지·지원', '생활'
  )),
  origin TEXT NOT NULL CHECK (origin IN ('user', 'admin_seed')),
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'hidden')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK ((is_anonymous = 1 AND nickname IS NULL) OR (is_anonymous = 0 AND nickname IS NOT NULL))
);
CREATE INDEX knowledge_questions_status_idx ON knowledge_questions(status, created_at DESC, id DESC);
CREATE INDEX knowledge_questions_category_idx ON knowledge_questions(category, status, created_at DESC);

CREATE TABLE knowledge_answers (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL UNIQUE REFERENCES knowledge_questions(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE knowledge_question_services (
  question_id TEXT NOT NULL REFERENCES knowledge_questions(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL,
  PRIMARY KEY (question_id, service_id)
);
CREATE INDEX knowledge_question_services_service_idx ON knowledge_question_services(service_id, question_id);

CREATE TABLE knowledge_imports (
  source_key TEXT PRIMARY KEY,
  payload_hash TEXT NOT NULL,
  batch_id TEXT NOT NULL,
  question_id TEXT NOT NULL UNIQUE REFERENCES knowledge_questions(id) ON DELETE CASCADE,
  answer_id TEXT NOT NULL UNIQUE REFERENCES knowledge_answers(id) ON DELETE CASCADE,
  service_slugs TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX knowledge_imports_batch_idx ON knowledge_imports(batch_id, source_key);

CREATE TABLE knowledge_idempotency_records (
  operation TEXT NOT NULL CHECK (operation = 'admin_mutation'),
  owner_token_hash TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  resource_id TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  PRIMARY KEY (operation, owner_token_hash, idempotency_key)
);
CREATE INDEX knowledge_idempotency_expiry_idx ON knowledge_idempotency_records(expires_at);

CREATE TABLE knowledge_submission_guards (
  id TEXT PRIMARY KEY,
  question_id TEXT UNIQUE REFERENCES knowledge_questions(id) ON DELETE SET NULL,
  requester_hash TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX knowledge_submission_requester_idx ON knowledge_submission_guards(requester_hash, created_at);
CREATE INDEX knowledge_submission_content_idx ON knowledge_submission_guards(content_hash, created_at);
CREATE INDEX knowledge_submission_expiry_idx ON knowledge_submission_guards(created_at);

CREATE TABLE knowledge_audit_actions (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN (
    'knowledge_question_created', 'knowledge_question_updated', 'knowledge_question_published',
    'knowledge_question_hidden', 'knowledge_question_deleted', 'knowledge_answer_created',
    'knowledge_answer_updated', 'knowledge_services_updated'
  )),
  actor_subject_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX knowledge_audit_question_idx ON knowledge_audit_actions(question_id, created_at DESC);

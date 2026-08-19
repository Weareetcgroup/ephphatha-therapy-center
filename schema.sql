PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'parent' CHECK(role IN ('parent','therapist','reception','admin','super_admin')),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS patients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  date_of_birth TEXT,
  age_text TEXT,
  relationship TEXT,
  notes TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 45,
  mode TEXT NOT NULL DEFAULT 'both' CHECK(mode IN ('clinic','online','both')),
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS therapists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  title TEXT,
  qualifications TEXT,
  bio TEXT,
  email TEXT,
  phone TEXT,
  photo_url TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS therapist_services (
  therapist_id INTEGER NOT NULL,
  service_id INTEGER NOT NULL,
  PRIMARY KEY(therapist_id, service_id),
  FOREIGN KEY(therapist_id) REFERENCES therapists(id) ON DELETE CASCADE,
  FOREIGN KEY(service_id) REFERENCES services(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS availability (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  therapist_id INTEGER NOT NULL,
  weekday INTEGER NOT NULL CHECK(weekday BETWEEN 0 AND 6),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY(therapist_id) REFERENCES therapists(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_availability_therapist_day ON availability(therapist_id, weekday);

CREATE TABLE IF NOT EXISTS center_closures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blocked_times (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  therapist_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  reason TEXT,
  FOREIGN KEY(therapist_id) REFERENCES therapists(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  patient_id INTEGER NOT NULL,
  service_id INTEGER NOT NULL,
  therapist_id INTEGER NOT NULL,
  appointment_date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'clinic' CHECK(mode IN ('clinic','online')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','completed','cancelled','no_show')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY(service_id) REFERENCES services(id),
  FOREIGN KEY(therapist_id) REFERENCES therapists(id)
);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date, therapist_id, start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_user ON appointments(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_slot ON appointments(therapist_id, appointment_date, start_time) WHERE status IN ('pending','confirmed');

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS content_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('announcement','testimonial','gallery','faq','program')),
  title TEXT,
  body TEXT,
  image_url TEXT,
  meta_json TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO services (slug,title,summary,duration_minutes,mode,sort_order) VALUES
('speech','Speech & Language Therapy','Speech clarity, language, fluency, social and functional communication support.',45,'both',1),
('occupational','Occupational Therapy','Sensory processing, fine-motor, self-care, play, attention and participation.',45,'clinic',2),
('behaviour','Behavioural Support','Structured support for participation, routines and emotional regulation.',45,'clinic',3),
('early-intervention','Early Intervention','Development-focused support for young children with family guidance.',45,'both',4),
('special-education','Special Education','Individualized learning, school readiness and functional education support.',60,'clinic',5),
('sensory-integration','Sensory Integration','Sensory-motor activities supporting regulation, coordination and participation.',45,'clinic',6),
('avt','Auditory-Verbal Therapy','Listening and spoken-language support for appropriate candidates using hearing technology.',45,'both',7),
('adult-communication','Adult Communication Support','Assessment-led support for adult speech, language, voice, fluency and acquired communication needs.',45,'both',8);

INSERT OR IGNORE INTO settings(key,value) VALUES
('clinic_name','Ephphatha Therapy Center'),
('phone_primary','+91 97911 92699'),
('phone_secondary','+91 98401 19895'),
('email','ephphathatherapycenter@gmail.com'),
('address','Vishwas Apartment, B-Block, Soundariya Nagar, Gowrivakkam, Chennai, Tamil Nadu 600073'),
('primary_color','#65bdc0'),
('accent_color','#d94b8d'),
('ink_color','#17383d'),
('card_radius','28'),
('hero_style','split'),
('announcement_enabled','0'),
('announcement_text',''),
('slot_interval_minutes','15'),
('booking_lead_minutes','60'),
('booking_horizon_days','60'),
('business_hours','{"0":null,"1":["09:30","20:00"],"2":["09:30","20:00"],"3":["09:30","20:00"],"4":["09:30","20:00"],"5":["09:30","20:00"],"6":["09:30","12:30"]}'),
('show_gallery','1'),
('show_testimonials','1'),
('show_programs','1');

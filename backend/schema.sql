-- students table
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  gpa REAL,
  skills TEXT[],
  projects JSONB,
  certifications TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- resumes table
CREATE TABLE IF NOT EXISTS resumes (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  content JSONB,
  pdf_path TEXT,
  score INTEGER,
  suggestions JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

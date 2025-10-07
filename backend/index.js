require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const multer = require('multer');
const OpenAI = require('openai');

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(bodyParser.json({ limit: '1mb' }));
app.use('/resumes', express.static(path.join(__dirname, 'resumes')));

// pool will be initialized in the DB layer (Postgres or SQLite fallback)

let openai = null;
if (process.env.OPENAI_API_KEY) {
  try {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  } catch (e) {
    console.warn('OpenAI client init failed:', e.message);
    openai = null;
  }
} else {
  console.warn('OPENAI_API_KEY not set — AI features will use a local fallback.');
}

const upload = multer({ dest: path.join(__dirname, 'uploads/') });

// --- DB layer: try Postgres, fall back to SQLite for local dev
let pool = null;
let useSqlite = false;
let sqliteDb = null;
if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  } catch (e) {
    console.warn('pg Pool init failed:', e.message);
    pool = null;
  }
}

// JSON-file fallback DB for local dev (no native deps)
const fileDbPath = path.join(__dirname, 'data.json');
function ensureFileDb() {
  if (!fs.existsSync(fileDbPath)) {
    fs.writeFileSync(fileDbPath, JSON.stringify({ students: [], resumes: [] }, null, 2));
  }
}
function readFileDb(){ ensureFileDb(); return JSON.parse(fs.readFileSync(fileDbPath)); }
function writeFileDb(data){ fs.writeFileSync(fileDbPath, JSON.stringify(data, null, 2)); }

async function dbQuery(text, params) {
  params = params || [];
  if (pool) {
    try {
      const res = await pool.query(text, params);
      return res;
    } catch (err) {
      console.warn('Postgres query failed, switching to JSON-file fallback:', err.message);
      pool = null;
    }
  }
  // Basic mapping for the queries used in this app
  ensureFileDb();
  const db = readFileDb();
  const q = text.trim().toLowerCase();
  if (q.startsWith('insert into students')) {
    const [email, password, name] = params;
    const id = (db.students.length ? (db.students[db.students.length-1].id || db.students.length) : 0) + 1;
    db.students.push({ id, email, password, name });
    writeFileDb(db);
    return { rows: [{ id }] };
  }
  if (q.startsWith('select id, email, password, name from students where email')) {
    const [email] = params;
    const user = db.students.find(s => s.email === email);
    return { rows: user ? [user] : [] };
  }
  if (q.startsWith('select id, email, name, gpa')) {
    const [id] = params;
    const user = db.students.find(s => s.id === id);
    return { rows: user ? [user] : [] };
  }
  if (q.startsWith('update students set name')) {
    const [name, gpa, skills, projects, certifications, id] = params;
    const user = db.students.find(s => s.id === id);
    if (user) {
      user.name = name; user.gpa = gpa; user.skills = skills; user.projects = projects; user.certifications = certifications;
      writeFileDb(db);
    }
    return { rowCount: 1 };
  }
  if (q.startsWith('insert into resumes')) {
    const [student_id, content, pdf_path] = params;
    const id = (db.resumes.length ? (db.resumes[db.resumes.length-1].id || db.resumes.length) : 0) + 1;
    db.resumes.push({ id, student_id, content, pdf_path, created_at: new Date().toISOString() });
    writeFileDb(db);
    return { rows: [{ id }] };
  }
  if (q.startsWith('update resumes set score')) {
    const [score, suggestions, student_id] = params;
    const r = db.resumes.find(x => x.student_id === student_id);
    if (r) { r.score = score; r.suggestions = suggestions; writeFileDb(db); }
    return { rowCount: 1 };
  }
  if (q.startsWith('select r.id')) {
    const joined = db.resumes.map(r => ({ id: r.id, student_id: r.student_id, pdf_path: r.pdf_path, score: r.score, name: (db.students.find(s=>s.id===r.student_id)||{}).name, email: (db.students.find(s=>s.id===r.student_id)||{}).email }));
    return { rows: joined };
  }
  return { rows: [] };
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'missing token' });
  const token = auth.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'invalid token' });
  }
}

// Simple health
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Auth: register (student)
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'invalid' });
  const hashed = await bcrypt.hash(password, 10);
  try {
    const r = await dbQuery('INSERT INTO students (email, password, name) VALUES ($1, $2, $3)', [email, hashed, name || null]);
    const id = (r.rows && r.rows[0] && r.rows[0].id) || (r.rows && r.rows.insertId) || null;
    const token = jwt.sign({ id, email }, process.env.JWT_SECRET);
    res.json({ token, user: { id, email, name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed' });
  }
});

// Auth: login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const r = await dbQuery('SELECT id, email, password, name FROM students WHERE email=$1', [email]);
    const user = r.rows && r.rows[0];
    if (!user) return res.status(401).json({ error: 'invalid' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'invalid' });
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed' });
  }
});

// Get profile
app.get('/api/student/profile', authMiddleware, async (req, res) => {
  try {
    const r = await dbQuery('SELECT id, email, name, gpa, skills, projects, certifications FROM students WHERE id=$1', [req.user.id]);
    res.json((r.rows && r.rows[0]) || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed' });
  }
});

// Update profile
app.post('/api/student/profile', authMiddleware, async (req, res) => {
  const { name, gpa, skills, projects, certifications } = req.body;
  try {
    await dbQuery('UPDATE students SET name=$1, gpa=$2, skills=$3, projects=$4, certifications=$5 WHERE id=$6', [name || null, gpa || null, JSON.stringify(skills||[]), JSON.stringify(projects||[]), JSON.stringify(certifications||[]), req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed' });
  }
});

// Generate PDF resume
app.post('/api/resume/generate', authMiddleware, async (req, res) => {
  const content = req.body;
  try {
    if (!fs.existsSync(path.join(__dirname, 'resumes'))) fs.mkdirSync(path.join(__dirname, 'resumes'));
    const filename = `resume_${req.user.id}_${Date.now()}.pdf`;
    const filepath = path.join(__dirname, 'resumes', filename);
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(filepath));
    doc.fontSize(20).text(content.name || '', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Email: ${content.email || ''}`);
    doc.text(`GPA: ${content.gpa || ''}`);
    doc.moveDown();
    doc.text('Skills:');
    if (Array.isArray(content.skills)) doc.text(content.skills.join(', '));
    doc.moveDown();
    doc.text('Projects:');
    if (Array.isArray(content.projects)) content.projects.forEach(p => { doc.text(`- ${p.title || ''}: ${p.description || ''}`); });
    doc.end();
    // save resume record
    try {
      await dbQuery('INSERT INTO resumes (student_id, content, pdf_path) VALUES ($1, $2, $3)', [req.user.id, JSON.stringify(content), `/resumes/${filename}`]);
    } catch (e) { console.error('resume save failed', e); }
    res.json({ pdf: `/resumes/${filename}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed' });
  }
});

// Grade resume using OpenAI
app.post('/api/resume/grade', authMiddleware, async (req, res) => {
  const { text } = req.body;
  try {
    if (openai) {
      const prompt = `You are a resume grader. Given the resume text below, produce a JSON response with fields: score (0-100), suggestions (array of strings), missing_keywords (array), career_advice (string). Resume:\n${text}`;
      const ai = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 800 });
      const raw = ai.choices && ai.choices[0] && ai.choices[0].message ? ai.choices[0].message.content : JSON.stringify(ai);
      let parsed;
      try { parsed = JSON.parse(raw); } catch (e) { parsed = { raw }; }
      if (parsed.score) {
        try { await dbQuery('UPDATE resumes SET score=$1, suggestions=$2 WHERE student_id=$3', [parsed.score, JSON.stringify(parsed.suggestions||[]), req.user.id]); } catch(e){ console.error(e); }
      }
      res.json({ result: parsed });
    } else {
      // Fallback simple grader
      const words = (text || '').split(/\s+/).filter(Boolean).length;
      const skillsCount = ((text||'').match(/skills|skill/gi) || []).length;
      const score = Math.min(85, Math.max(30, Math.round((Math.min(1500, words) / 1500) * 80 + skillsCount * 2)));
      const suggestions = [];
      if (words < 150) suggestions.push('Add more content about projects and measurable achievements.');
      if (!/gpa/i.test(text||'')) suggestions.push('Add GPA if it is strong, or coursework to show academic strength.');
      if (!/project|projects/i.test(text||'')) suggestions.push('List 2-4 projects with outcomes and your role.');
      const missing_keywords = ['teamwork', 'leadership', 'problem solving'].filter(k => !(new RegExp(k, 'i')).test(text||''));
      const career_advice = 'Consider certifications or internships aligned with your target roles; add quantifiable results in experience.';
      const parsed = { score, suggestions, missing_keywords, career_advice };
  try { await dbQuery('UPDATE resumes SET score=$1, suggestions=$2 WHERE student_id=$3', [parsed.score, JSON.stringify(parsed.suggestions||[]), req.user.id]); } catch(e){ console.error(e); }
      res.json({ result: parsed });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'ai_failed' });
  }
});

// Admin: list resumes
app.get('/api/admin/resumes', async (req, res) => {
  try {
    const r = await dbQuery('SELECT r.id, r.student_id, r.pdf_path, r.score, s.name, s.email FROM resumes r JOIN students s ON s.id=r.student_id ORDER BY r.created_at DESC');
    res.json(r.rows || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed' });
  }
});

const port = parseInt(process.env.PORT || '5000', 10);
const host = process.env.HOST || '0.0.0.0';
const server = app.listen(port, host, () => {
  const addr = server.address();
  console.log('backend listening on', typeof addr === 'string' ? addr : `${addr.address}:${addr.port}`);
});

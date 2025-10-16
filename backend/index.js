// Auto-generate resume content using AI
app.post('/api/resume/auto-generate', authMiddleware, async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ error: 'student_not_found' });
    if (!openai) return res.status(503).json({ error: 'ai_not_available' });
    const prompt = `Generate a professional resume in JSON format for the following student. Include summary, education, skills, work experience, certifications, achievements, and leadership roles.\n\nStudent Info:\nName: ${student.name}\nEmail: ${student.email}\nGPA: ${student.gpa || ''}\nSkills: ${(student.skills||[]).join(', ')}\nProjects: ${(student.projects||[]).map(p=>p.title+': '+p.description).join('; ')}\nCertifications: ${(student.certifications||[]).join(', ')}\n`;
    const ai = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 1000 });
    const raw = ai.choices && ai.choices[0] && ai.choices[0].message ? ai.choices[0].message.content : JSON.stringify(ai);
    let content;
    try { content = JSON.parse(raw); } catch (e) { content = { raw }; }
    res.json({ content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'ai_failed' });
  }
});
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const multer = require('multer');
const OpenAI = require('openai');

const Student = require('./models/Student');
const Resume = require('./models/Resume');

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(bodyParser.json({ limit: '1mb' }));
app.use('/resumes', express.static(path.join(__dirname, 'resumes')));


// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resume_builder', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
});
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

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
    const student = new Student({ email, password: hashed, name });
    await student.save();
    const token = jwt.sign({ id: student._id, email }, process.env.JWT_SECRET);
    res.json({ token, user: { id: student._id, email, name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed' });
  }
});


// Auth: login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const student = await Student.findOne({ email });
    if (!student) return res.status(401).json({ error: 'invalid' });
    const ok = await bcrypt.compare(password, student.password);
    if (!ok) return res.status(401).json({ error: 'invalid' });
    const token = jwt.sign({ id: student._id, email: student.email }, process.env.JWT_SECRET);
    res.json({ token, user: { id: student._id, email: student.email, name: student.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed' });
  }
});


// Get profile
app.get('/api/student/profile', authMiddleware, async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    res.json(student || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed' });
  }
});


// Update profile
app.post('/api/student/profile', authMiddleware, async (req, res) => {
  const { name, gpa, skills, projects, certifications } = req.body;
  try {
    await Student.findByIdAndUpdate(req.user.id, {
      name,
      gpa,
      skills,
      projects,
      certifications
    });
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
    // save resume record in MongoDB
    try {
      const resume = new Resume({
        studentId: req.user.id,
        content,
        pdfPath: `/resumes/${filename}`
      });
      await resume.save();
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
    let parsed = null;
    if (openai) {
      const prompt = `You are a resume grader. Given the resume text below, produce a JSON response with fields: score (0-100), suggestions (array of strings), missing_keywords (array), career_advice (string). Resume:\n${text}`;
      const ai = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 800 });
      const raw = ai.choices && ai.choices[0] && ai.choices[0].message ? ai.choices[0].message.content : JSON.stringify(ai);
      try { parsed = JSON.parse(raw); } catch (e) { parsed = { raw }; }
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
      parsed = { score, suggestions, missing_keywords, career_advice };
    }
    // Update resume in MongoDB
    await Resume.findOneAndUpdate(
      { studentId: req.user.id },
      { score: parsed.score, suggestions: parsed.suggestions },
      { sort: { createdAt: -1 } }
    );
    res.json({ result: parsed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'ai_failed' });
  }
});


// Admin: list resumes
app.get('/api/admin/resumes', async (req, res) => {
  try {
    const resumes = await Resume.find().sort({ createdAt: -1 }).populate('studentId', 'name email');
    const result = resumes.map(r => ({
      id: r._id,
      student_id: r.studentId._id,
      pdf_path: r.pdfPath,
      score: r.score,
      name: r.studentId.name,
      email: r.studentId.email
    }));
    res.json(result);
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

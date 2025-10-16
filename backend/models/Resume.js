const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  content: { type: Object, required: true },
  pdfPath: { type: String },
  score: { type: Number },
  suggestions: { type: [String] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Resume', ResumeSchema);

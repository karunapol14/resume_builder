const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String },
  gpa: { type: String },
  skills: { type: [String] },
  projects: { type: [Object] },
  certifications: { type: [String] }
});

module.exports = mongoose.model('Student', StudentSchema);

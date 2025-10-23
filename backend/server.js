const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { GoogleGenAI } = require('@google/genai');

require('dotenv').config(); 

const app = express();
const PORT = 3001;

// --- API Key Management and Initialization ---
// 1. Check for a global variable (for Canvas/Course Environments)
// 2. Fallback to process.env (used by Docker/local setup from the .env file)
const GEMINI_API_KEY = (typeof __gemini_api_key !== 'undefined' ? __gemini_api_key : process.env.GEMINI_API_KEY);

let ai = null;
if (GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
} else {
    console.error("CRITICAL: GEMINI_API_KEY is missing. AI functionality will fail.");
}

// --- Middleware Setup ---
app.use(cors()); // Allows frontend running on port 3000 to talk to backend on 3001
app.use(bodyParser.json());

// --- MOCK DATABASE SETUP (Replace with MongoDB/Mongoose) ---
// NOTE: For a real application, you would initialize MongoDB/Mongoose connection here.
// Example: mongoose.connect(process.env.MONGODB_URI);
const mockDb = {
    // Mock user profile data
    'mockUserId': {
        personalInfo: { name: 'Alex Johnson', email: 'alex.j@example.com', phone: '555-500-1234', linkedin: 'linkedin.com/in/alexj', github: 'github.com/alexj-dev', portfolio: 'alexj.dev' },
        education: [{ college: 'State University', degree: 'M.S. Data Science', cgpa: '3.9', year: '2025', coursework: 'Machine Learning, Cloud Computing' }],
        skills: [{ name: 'Python', level: 'Expert' }, { name: 'TensorFlow', level: 'Expert' }],
        experience: [{ company: 'Tech Innovators', role: 'Data Intern', duration: 'Summer 2024', description: 'Assisted in data cleansing and model training.' }],
        projects: [{ title: 'AI Resume Grader', technologies: 'React, Node, Gemini API', description: 'Developed a full-stack tool for resume optimization.', github: 'github.com/project/grader' }],
        achievements: 'Dean\'s List for 4 semesters',
        extracurriculars: 'Volunteer at local coding non-profit',
    }
};
// --- END MOCK DB ---


// --- API Endpoints Implementation ---

/**
 * POST /api/resume/fetch-profile
 * Fetches existing student profile data (MOCKED)
 */
app.post('/api/resume/fetch-profile', (req, res) => {
    // In a real app, you would use JWT or session to get the studentId
    const studentId = 'mockUserId'; 
    const profileData = mockDb[studentId];

    if (profileData) {
        return res.json({ success: true, data: profileData });
    }
    res.status(404).json({ success: false, message: 'Profile not found.' });
});

/**
 * POST /api/resume/save-draft
 * Auto-saves resume data to the database (MOCKED)
 */
app.post('/api/resume/save-draft', (req, res) => {
    // In a real app, save req.body.resumeData to a 'resumes' MongoDB collection.
    // Ensure you use the studentId and version tracking.
    console.log(`[Database] Draft saved for: ${req.body.resumeData.personalInfo.name || 'Anonymous'}`);
    res.json({ success: true, message: 'Draft saved successfully!' });
});

/**
 * POST /api/resume/grade
 * Grades the resume using the Gemini API and structured output.
 */
app.post('/api/resume/grade', async (req, res) => {
    const resumeData = req.body.resumeData;
    console.log(`[AI] Requesting REAL grade for: ${resumeData.personalInfo.name}`);
    
    if (!ai) {
        return res.status(500).json({ success: false, message: "Gemini AI Client is not initialized. API Key is missing." });
    }

    try {
        const prompt = `You are a world-class ATS (Applicant Tracking System) and Career Advisor. Analyze the following resume data provided as a JSON object. Your goal is to provide a structured grade and specific, actionable suggestions for improvement. The entire response MUST be a single JSON object that strictly adheres to the provided JSON schema.

        Focus grading on:
        1. **ATS Compatibility:** Are there enough relevant keywords? Is the formatting easy for a machine to parse?
        2. **Content Quality:** Are strong action verbs used? Are achievements quantified (e.g., 'Increased sales by 20%')?
        3. **Formatting & Design:** Is the information clear, logically grouped, and well-spaced?
        4. **Completeness:** Are all critical sections (contact, education, skills, experience) present and detailed?

        Resume Data: 
        ${JSON.stringify(resumeData, null, 2)}
        `;

        // Define the JSON schema for the expected output
        const responseSchema = {
            type: "OBJECT",
            properties: {
                overallScore: { type: "INTEGER", description: "Overall score out of 100 based on the average of category scores." },
                categoryScores: {
                    type: "OBJECT",
                    properties: {
                        atsCompatibility: { type: "INTEGER", description: "Score out of 100 for ATS parsing and keyword usage." },
                        contentQuality: { type: "INTEGER", description: "Score out of 100 for strong action verbs and quantified results." },
                        formattingDesign: { type: "INTEGER", description: "Score out of 100 for structure, clarity, and readability." },
                        completeness: { type: "INTEGER", description: "Score out of 100 for having all necessary sections and contact info." },
                    }
                },
                suggestions: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            priority: { type: "STRING", enum: ["High", "Medium", "Low"] },
                            area: { type: "STRING", description: "E.g., Content Quality, ATS Keywords, Grammar/Spelling" },
                            text: { type: "STRING", description: "Specific, actionable suggestion for improvement. Be concise." },
                        }
                    }
                },
                enhancedContent: { type: "STRING", description: "A rewritten, professional 2-3 sentence summary based on the resume data." }
            },
            required: ["overallScore", "categoryScores", "suggestions", "enhancedContent"]
        };


        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.2 // Lower temperature for more objective grading
            }
        });

        // Parse the JSON string output
        const resultJson = JSON.parse(response.text);
        
        // Return the structured response to the frontend
        res.json({ success: true, data: resultJson });

    } catch (error) {
        console.error("Gemini API Error during grading:", error.message);
        res.status(500).json({ 
            success: false, 
            message: "AI Grading failed. Please check your API key, network, and quota.",
            errorDetail: error.message 
        });
    }
});

/**
 * POST /api/resume/generate
 * Generates the resume preview and saves the enhanced version (MOCKED)
 */
app.post('/api/resume/generate', async (req, res) => {
    // In a final app, this would be a real AI call, but for simplicity, 
    // we assume grading already provided the enhanced content, so this is just a save operation.
    console.log(`[Backend] Generating final resume HTML and saving enhanced content.`);

    // MOCK: Simulate success
    setTimeout(() => {
        res.json({ success: true, message: 'Resume successfully generated and saved!' });
    }, 200);
});


/**
 * POST /api/resume/apply-suggestions
 * Applies AI suggestions to update the resume data (MOCKED)
 */
app.post('/api/resume/apply-suggestions', (req, res) => {
    // In a real app, send the resume and suggestions back to Gemini 
    // to update specific fields, then save the new version.
    console.log(`[Backend] Applying suggestions to resume.`);
    
    // MOCK: Just send a confirmation
    res.json({ success: true, message: 'Suggestions applied. Please refresh.' });
});

/**
 * GET /api/resume/download/:id
 * Downloads the resume as a PDF (MOCKED)
 */
app.get('/api/resume/download/:id', (req, res) => {
    // CRITICAL: In a real app, use Puppeteer or pdfkit here.
    // 1. Fetch the generated HTML content for the resume template.
    // 2. Use Puppeteer to launch a headless browser and convert the HTML to PDF.
    // 3. Send the resulting buffer back to the client.
    
    console.log(`[Backend] Mock PDF download requested for ID: ${req.params.id}`);
    
    res.status(501).send("PDF Generation Not Implemented (Requires Puppeteer/PDFKit setup)");
});

/**
 * GET /api/resume/history/:studentId
 * Gets all previous resumes for a student (MOCKED)
 */
app.get('/api/resume/history/:studentId', (req, res) => {
    // In a real app, query MongoDB for all resumes matching the studentId.
    console.log(`[Backend] Mock history requested for ID: ${req.params.studentId}`);
    res.json({ success: true, data: [] }); // Empty history mock
});


// --- Start Server ---
app.listen(PORT, () => {
  console.log(`🚀 Backend Server running on http://localhost:${PORT}`);
  const keySource = GEMINI_API_KEY ? (typeof __gemini_api_key !== 'undefined' ? 'Global Variable' : '.env File') : 'MISSING';
  console.log(`API Key Status: Loaded from ${keySource}`);
});

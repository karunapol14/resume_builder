import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Download, Zap, Edit, Activity, CheckCircle, XCircle, Info, TrendingUp, Cpu, Gauge, Clipboard, Save } from 'lucide-react';

// --- MOCK DATA & SIMULATED API FUNCTIONS ---
// These replace actual calls to your Node.js/Express Backend and Gemini/OpenAI API.

// Placeholder data structure for the resume
const initialResumeData = {
  personalInfo: { name: '', email: '', phone: '', linkedin: '', github: '', portfolio: '' },
  education: [],
  skills: [], // array of { name: 'Skill', level: 'Expert' }
  experience: [],
  projects: [],
  achievements: '',
  extracurriculars: '',
};

// Mock AI Grading and Suggestions Response
const mockAIGrading = {
  overallScore: 78,
  categoryScores: {
    atsCompatibility: 85,
    contentQuality: 70,
    formattingDesign: 90,
    completeness: 65,
  },
  suggestions: [
    { priority: 'High', area: 'Content Quality', text: 'Enhance the first bullet point in your "Experience" section by adding quantifiable metrics (e.g., "Improved conversion rate by 15%").' },
    { priority: 'Medium', area: 'Completeness', text: 'Consider adding a brief Professional Summary/Objective section at the top for better impact.' },
    { priority: 'Low', area: 'Formatting', text: 'Ensure consistent date format (MM/YYYY) across all entries.' },
    { priority: 'High', area: 'ATS Keywords', text: 'Missing high-value keywords for "Senior Web Developer" such as "CI/CD" and "Cloud Architecture".' },
  ],
  enhancedContent: "Simulated AI-Enhanced Professional Summary:\nResults-driven Full Stack Developer with 3+ years of experience specializing in high-performance web applications. Successfully led the migration of a legacy system, improving processing efficiency by 40%. Proficient in React, Node.js, MongoDB, and modern DevOps practices.",
};

// Simulated API Calls
const simulateAPICall = (endpoint, data) => new Promise((resolve) => {
  setTimeout(() => {
    console.log(`[API Call] Endpoint: ${endpoint}`, data);
    
    switch (endpoint) {
        case 'fetch-profile':
            // Mock profile data fetch
            resolve({ 
                success: true, 
                data: {
                    ...initialResumeData,
                    personalInfo: { name: 'Jane Doe', email: 'jane.doe@example.com', phone: '555-123-4567', linkedin: 'linkedin.com/in/janedoe', github: 'github.com/janedoe', portfolio: 'janedoe.com' },
                    skills: [{ name: 'React', level: 'Expert' }, { name: 'Node.js', level: 'Intermediate' }],
                    education: [{ college: 'Tech University', degree: 'B.S. Computer Science', cgpa: '3.8', year: '2024', coursework: 'Data Structures, AI' }],
                }
            });
            break;
        case 'save-draft':
            resolve({ success: true, message: 'Draft saved successfully!' });
            break;
        case 'generate':
        case 'grade':
            // Mock AI processing result
            resolve({ 
                success: true, 
                data: mockAIGrading 
            });
            break;
        case 'apply-suggestions':
            // Mock the updated resume after AI application
             resolve({ 
                success: true, 
                message: 'Suggestions applied.',
                updatedResume: {
                    ...data.resume,
                    education: data.resume.education.map(edu => ({ ...edu, cgpa: edu.cgpa + '*' })), // Simple change simulation
                }
            });
            break;
        default:
            resolve({ success: false, message: 'Unknown endpoint' });
            break;
    }
  }, 1000); // Simulate network delay
});


// --- UTILITY COMPONENTS ---

const Card = ({ title, children, icon: Icon, className = '' }) => (
  <div className={`bg-white p-6 rounded-xl shadow-lg border border-gray-100 transition-shadow duration-300 hover:shadow-xl ${className}`}>
    <div className="flex items-center text-indigo-600 mb-4">
      {Icon && <Icon className="w-6 h-6 mr-3" />}
      <h2 className="text-xl font-bold text-gray-800">{title}</h2>
    </div>
    {children}
  </div>
);

const IconButton = ({ icon: Icon, text, onClick, disabled = false, className = '' }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center justify-center px-4 py-2 rounded-lg font-semibold transition-all duration-300 shadow-md 
        ${disabled ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'text-white bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 active:shadow-none'} 
        ${className}`}
    >
        {Icon && <Icon className="w-5 h-5 mr-2" />}
        {text}
    </button>
);

const InputField = ({ label, name, type = 'text', value, onChange, placeholder = '' }) => (
  <div className="relative z-0 w-full mb-5 group">
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-teal-500 peer"
      placeholder=" "
      required={label !== 'CGPA' && label !== 'Phone'}
    />
    <label 
      htmlFor={name}
      className="absolute text-sm text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 z-10 origin-[0] peer-focus:start-0 peer-focus:text-teal-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto"
    >
      {label}
    </label>
  </div>
);

const TagInput = ({ tags, setTags, label }) => {
    const [inputValue, setInputValue] = useState('');

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newTag = inputValue.trim().replace(/,$/, '');
            if (newTag && !tags.some(t => t.name === newTag)) {
                setTags([...tags, { name: newTag, level: 'Intermediate' }]);
                setInputValue('');
            }
        }
    };

    const removeTag = (tagToRemove) => {
        setTags(tags.filter(t => t.name !== tagToRemove.name));
    };

    return (
        <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            <div className="flex flex-wrap items-center border border-gray-300 rounded-lg p-2 focus-within:border-teal-500 transition-colors">
                {tags.map((tag, index) => (
                    <span 
                        key={index} 
                        className="flex items-center bg-teal-100 text-teal-800 text-xs font-semibold mr-2 mb-2 px-2.5 py-1 rounded-full"
                    >
                        {tag.name}
                        <button 
                            type="button" 
                            onClick={() => removeTag(tag)} 
                            className="ml-1 text-teal-600 hover:text-teal-800 transition-colors"
                        >
                            <XCircle className="w-3 h-3" />
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type skill and press Enter or comma"
                    className="flex-grow p-1 text-sm bg-transparent focus:outline-none"
                />
            </div>
        </div>
    );
};

// --- CORE APP COMPONENT ---

export default function App() {
  const [resume, setResume] = useState(initialResumeData);
  const [activeTab, setActiveTab] = useState('builder'); // 'builder', 'preview', 'grade'
  const [aiResult, setAiResult] = useState(null);
  const [toast, setToast] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- State Management Helpers ---

  const updatePersonalInfo = (e) => {
    setResume(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [e.target.name]: e.target.value }
    }));
  };

  const updateSectionArray = (section, index, field, value) => {
    setResume(prev => ({
      ...prev,
      [section]: prev[section].map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addSectionItem = (section, defaultItem) => {
    setResume(prev => ({
      ...prev,
      [section]: [...prev[section], defaultItem]
    }));
  };

  const removeSectionItem = (section, index) => {
    setResume(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
    }));
  };

  // --- Auto-Save and Progress ---

  const completionPercentage = useMemo(() => {
    const requiredFields = [
      resume.personalInfo.name, 
      resume.personalInfo.email,
      resume.education.length > 0,
      resume.skills.length > 0,
    ];
    const completed = requiredFields.filter(Boolean).length;
    return Math.round((completed / 4) * 100); // Simplified calculation
  }, [resume]);

  useEffect(() => {
    // Auto-save functionality (Simulated)
    const timer = setInterval(() => {
      if (!isProcessing) {
        // Only save if the user is actively building and not processing AI requests
        simulateAPICall('save-draft', { resumeData: resume })
          .then(() => console.log('Auto-saved draft.'))
          .catch(err => console.error('Auto-save failed:', err));
      }
    }, 30000); // Save every 30 seconds

    return () => clearInterval(timer);
  }, [resume, isProcessing]);


  // --- API/Action Handlers ---

  const handleFetchProfile = useCallback(async () => {
    setIsProcessing(true);
    try {
      const result = await simulateAPICall('fetch-profile');
      if (result.success) {
        setResume(result.data);
        setToast({ message: 'Profile data successfully loaded!', type: 'success' });
      } else {
        setToast({ message: 'Failed to fetch profile: ' + result.message, type: 'error' });
      }
    } catch (e) {
      setToast({ message: 'An error occurred during fetch.', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleGenerateAndGrade = useCallback(async () => {
    setIsProcessing(true);
    setAiResult(null);
    try {
      // 1. Generate/Enhance (POST /api/resume/generate)
      const generateResult = await simulateAPICall('generate', { resumeData: resume });
      
      // 2. Grade (POST /api/resume/grade)
      const gradeResult = await simulateAPICall('grade', { resumeData: resume });
      
      if (generateResult.success && gradeResult.success) {
        setAiResult(gradeResult.data);
        setActiveTab('grade');
        setToast({ message: 'Resume analyzed and graded!', type: 'success' });
      } else {
        setToast({ message: 'AI processing failed. Check backend logs.', type: 'error' });
      }
    } catch (e) {
      setToast({ message: 'AI integration failed due to an error.', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  }, [resume]);
  
  const handleApplySuggestions = useCallback(async () => {
      setIsProcessing(true);
      try {
          const result = await simulateAPICall('apply-suggestions', { resume: resume, suggestions: aiResult.suggestions });
          if (result.success) {
              setResume(result.updatedResume);
              setAiResult(null); // Clear grade to indicate changes needed a re-run
              setActiveTab('builder');
              setToast({ message: 'AI suggestions applied to your draft!', type: 'success' });
          } else {
              setToast({ message: 'Failed to apply suggestions.', type: 'error' });
          }
      } catch (e) {
          setToast({ message: 'An error occurred while applying suggestions.', type: 'error' });
      } finally {
          setIsProcessing(false);
      }
  }, [aiResult, resume]);

  const handleDownload = async (format) => {
    // Simulates calling the backend endpoint for PDF generation
    setIsProcessing(true);
    const downloadEndpoint = format === 'pdf' ? '/api/resume/download/mock-id' : '/api/resume/download-docx/mock-id';
    
    try {
        // In a real app, this fetch would trigger the PDF generation in Express/Puppeteer
        await simulateAPICall(downloadEndpoint);
        setToast({ message: `${format.toUpperCase()} download initiated!`, type: 'success' });
        // The actual download would be handled by the server sending a file stream.
    } catch (e) {
        setToast({ message: `Download failed for ${format.toUpperCase()}.`, type: 'error' });
    } finally {
        setIsProcessing(false);
    }
  };


  // --- UI RENDER SECTIONS ---

  const renderPersonalForm = () => (
    <Card title="Personal Information" icon={Info}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField label="Full Name" name="name" value={resume.personalInfo.name} onChange={updatePersonalInfo} />
        <InputField label="Email Address" name="email" type="email" value={resume.personalInfo.email} onChange={updatePersonalInfo} />
        <InputField label="Phone Number" name="phone" type="tel" value={resume.personalInfo.phone} onChange={updatePersonalInfo} />
        <InputField label="LinkedIn URL" name="linkedin" value={resume.personalInfo.linkedin} onChange={updatePersonalInfo} placeholder="e.g. linkedin.com/in/..." />
        <InputField label="GitHub URL" name="github" value={resume.personalInfo.github} onChange={updatePersonalInfo} placeholder="e.g. github.com/..." />
        <InputField label="Portfolio URL" name="portfolio" value={resume.personalInfo.portfolio} onChange={updatePersonalInfo} placeholder="e.g. www.my-portfolio.com" />
      </div>
    </Card>
  );

  const renderArrayForm = (section, title, icon, defaultItem, fields) => (
    <Card title={title} icon={icon} className="mt-6">
      <div className="space-y-6">
        {resume[section].map((item, index) => (
          <div key={index} className="border border-gray-200 p-4 rounded-lg bg-gray-50 relative">
            <h3 className="text-lg font-medium text-gray-700 mb-3">{title} Item #{index + 1}</h3>
            <button
              onClick={() => removeSectionItem(section, index)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700 transition-colors p-1 rounded-full bg-white shadow"
              aria-label={`Remove ${title} item ${index + 1}`}
            >
              <XCircle className="w-5 h-5" />
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map(field => (
                <InputField
                  key={field.name}
                  label={field.label}
                  name={field.name}
                  type={field.type || 'text'}
                  value={item[field.name]}
                  onChange={(e) => updateSectionArray(section, index, field.name, e.target.value)}
                />
              ))}
            </div>
          </div>
        ))}
        <button
          onClick={() => addSectionItem(section, defaultItem)}
          className="w-full text-center py-2 border-2 border-dashed border-teal-300 text-teal-600 hover:bg-teal-50 transition-colors rounded-lg font-medium"
        >
          + Add New {title} Item
        </button>
      </div>
    </Card>
  );
  
  const renderBuilderTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-lg border-l-4 border-teal-500">
        <h3 className="text-lg font-semibold text-gray-800">Data Input Options</h3>
        <div className="flex gap-3">
          <IconButton 
            icon={Clipboard} 
            text="Fetch from Profile (Mock)" 
            onClick={handleFetchProfile} 
            disabled={isProcessing}
            className="!bg-teal-500 hover:!bg-teal-600"
          />
          <IconButton 
            icon={Save} 
            text="Save Draft (Mock)" 
            onClick={() => simulateAPICall('save-draft', { resumeData: resume })} 
            disabled={isProcessing}
            className="!bg-gray-500 hover:!bg-gray-600"
          />
        </div>
      </div>
        
      {renderPersonalForm()}

      <Card title="Skills" icon={TrendingUp} className="mt-6">
          <TagInput 
              tags={resume.skills} 
              setTags={(newTags) => setResume(prev => ({ ...prev, skills: newTags }))} 
              label="Technical Skills (Separate with Enter or comma)" 
          />
      </Card>
      
      {renderArrayForm('education', 'Education', Info, { college: '', degree: '', cgpa: '', year: '', coursework: '' }, [
        { name: 'college', label: 'College/University' },
        { name: 'degree', label: 'Degree' },
        { name: 'cgpa', label: 'CGPA / Grade' },
        { name: 'year', label: 'Year of Graduation' },
        { name: 'coursework', label: 'Relevant Coursework' },
      ])}
      
      {renderArrayForm('experience', 'Experience / Internships', Activity, { company: '', role: '', duration: '', description: '' }, [
        { name: 'company', label: 'Company' },
        { name: 'role', label: 'Role/Title' },
        { name: 'duration', label: 'Duration (e.g., Jun 2023 - Present)' },
        { name: 'description', label: 'Description (Use bullet points)', type: 'textarea' },
      ])}
      
      {renderArrayForm('projects', 'Projects', Cpu, { title: '', technologies: '', description: '', githubLink: '' }, [
        { name: 'title', label: 'Project Title' },
        { name: 'technologies', label: 'Technologies Used' },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'githubLink', label: 'GitHub Link' },
      ])}
      
      <Card title="Additional Sections" icon={CheckCircle} className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Achievements & Certifications (Separate with bullet points)</label>
          <textarea
              value={resume.achievements}
              onChange={(e) => setResume(prev => ({ ...prev, achievements: e.target.value }))}
              rows="4"
              className="block w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="- AWS Certified Developer (2024)"
          />
          <label className="block text-sm font-medium text-gray-700 mt-4 mb-2">Extracurricular Activities</label>
          <textarea
              value={resume.extracurriculars}
              onChange={(e) => setResume(prev => ({ ...prev, extracurriculars: e.target.value }))}
              rows="3"
              className="block w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="- Volunteered at local shelter..."
          />
      </Card>
      
    </div>
  );
  
  const renderPreviewTab = () => (
    <Card title="Live HTML Resume Preview" icon={Edit}>
      <div className="p-8 bg-white border border-gray-300 rounded-lg shadow-inner min-h-[500px] overflow-auto">
        <style jsx>{`
          .resume-container { font-family: 'Inter', sans-serif; line-height: 1.5; color: #1e293b; max-width: 800px; margin: 0 auto; }
          .resume-header { text-align: center; border-bottom: 2px solid #6366f1; padding-bottom: 10px; margin-bottom: 20px; }
          .resume-header h1 { font-size: 2.25rem; font-weight: 700; color: #3b82f6; margin: 0; }
          .resume-header p { margin: 2px 0; font-size: 0.9rem; }
          .resume-section h2 { font-size: 1.25rem; font-weight: 600; color: #14b8a6; border-bottom: 1px solid #14b8a6; padding-bottom: 4px; margin-bottom: 15px; margin-top: 25px; }
          .item-title { font-weight: 600; margin-bottom: 2px; }
          .item-meta { font-style: italic; font-size: 0.9rem; color: #475569; }
          .bullet-point { margin-left: 20px; list-style-type: disc; }
        `}</style>
        <div className="resume-container">
          {/* Header */}
          <div className="resume-header">
            <h1>{resume.personalInfo.name || 'Your Name Here'}</h1>
            <p>{resume.personalInfo.email} | {resume.personalInfo.phone} | <a href={resume.personalInfo.linkedin} target="_blank" className="text-blue-500 hover:underline">{resume.personalInfo.linkedin && 'LinkedIn'}</a> | <a href={resume.personalInfo.github} target="_blank" className="text-blue-500 hover:underline">{resume.personalInfo.github && 'GitHub'}</a></p>
          </div>
          
          {/* Enhanced Summary (from AI result) */}
          {aiResult?.enhancedContent && (
            <div className="resume-section">
                <h2>Professional Summary (AI Enhanced)</h2>
                <p className="text-gray-700 italic border-l-4 border-indigo-400 pl-3">
                    {aiResult.enhancedContent.split('\n').map((line, i) => <span key={i} className="block">{line}</span>)}
                </p>
            </div>
          )}

          {/* Education */}
          {resume.education.length > 0 && (
            <div className="resume-section">
              <h2>Education</h2>
              {resume.education.map((edu, i) => (
                <div key={i} className="mb-3">
                  <div className="item-title flex justify-between">
                    <span>{edu.degree} - {edu.college}</span>
                    <span>{edu.year}</span>
                  </div>
                  <p className="item-meta">CGPA: {edu.cgpa} | Relevant Coursework: {edu.coursework}</p>
                </div>
              ))}
            </div>
          )}

          {/* Skills */}
          {resume.skills.length > 0 && (
            <div className="resume-section">
              <h2>Skills</h2>
              <p className="text-gray-700">{resume.skills.map(s => s.name).join(' • ')}</p>
            </div>
          )}

          {/* Experience */}
          {resume.experience.length > 0 && (
            <div className="resume-section">
              <h2>Experience</h2>
              {resume.experience.map((exp, i) => (
                <div key={i} className="mb-3">
                  <div className="item-title flex justify-between">
                    <span>{exp.role} at {exp.company}</span>
                    <span>{exp.duration}</span>
                  </div>
                  {exp.description && (
                    <ul className="list-disc ml-5 mt-1 text-gray-700">
                      {exp.description.split('\n').filter(Boolean).map((bullet, j) => (
                        <li key={j} className="text-sm">{bullet.trim()}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Projects */}
          {resume.projects.length > 0 && (
            <div className="resume-section">
              <h2>Projects</h2>
              {resume.projects.map((proj, i) => (
                <div key={i} className="mb-3">
                  <div className="item-title flex justify-between">
                    <span>{proj.title}</span>
                    <a href={proj.githubLink} target="_blank" className="text-blue-500 hover:underline text-sm">{proj.githubLink && 'GitHub Link'}</a>
                  </div>
                  <p className="item-meta mb-1">Technologies: {proj.technologies}</p>
                  {proj.description && (
                    <p className="text-sm text-gray-700">{proj.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  const renderGradeTab = () => (
    <div className="space-y-6">
      {aiResult ? (
        <>
          <Card title="AI Grading Dashboard" icon={Gauge} className="!bg-gradient-to-r from-purple-500/10 to-blue-500/10">
            <div className="flex flex-col md:flex-row items-center justify-between">
              {/* Overall Score Circle */}
              <div className="flex flex-col items-center">
                <AnimatedScoreCircle score={aiResult.overallScore} />
                <p className="text-xl font-bold text-gray-700 mt-2">Overall Score</p>
              </div>

              {/* Category Breakdown */}
              <div className="grid grid-cols-2 gap-4 flex-grow md:ml-10 mt-6 md:mt-0">
                {Object.entries(aiResult.categoryScores).map(([category, score]) => (
                  <div key={category} className="p-3 rounded-lg border border-gray-200 shadow-sm">
                    <p className="text-sm font-medium text-gray-500 capitalize">{category.replace(/([A-Z])/g, ' $1')}</p>
                    <p className={`text-xl font-bold ${getScoreColor(score).text}`}>{score}</p>
                    <div className="h-1 bg-gray-200 rounded-full mt-1">
                        <div 
                            className={`h-1 rounded-full ${getScoreColor(score).bg}`}
                            style={{ width: `${score}%` }}
                        ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
          
          <Card title="AI-Powered Suggestions" icon={Zap} className="mt-6">
              <IconButton
                  icon={Clipboard}
                  text="Apply Suggestions & Re-Draft"
                  onClick={handleApplySuggestions}
                  disabled={isProcessing}
                  className="mb-4 !bg-teal-500 hover:!bg-teal-600"
              />
              <div className="space-y-4">
                  {aiResult.suggestions.map((s, index) => (
                      <div 
                          key={index} 
                          className={`p-4 rounded-lg shadow-sm border-l-4 ${getPriorityBorder(s.priority)} bg-white`}
                      >
                          <div className="flex justify-between items-start mb-2">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getPriorityColor(s.priority).bg} ${getPriorityColor(s.priority).text}`}>
                                  {s.priority} Priority
                              </span>
                              <span className="text-xs font-medium text-gray-500">{s.area}</span>
                          </div>
                          <p className="text-gray-800 text-sm">{s.text}</p>
                      </div>
                  ))}
              </div>
          </Card>
        </>
      ) : (
        <div className="text-center py-10 text-gray-500 italic">Run the "Generate & Grade" step to see the AI analysis here.</div>
      )}
    </div>
  );
  
  // --- UI Components for Grading ---

  const getScoreColor = (score) => {
    if (score > 80) return { text: 'text-emerald-600', bg: 'bg-emerald-500' };
    if (score >= 60) return { text: 'text-amber-600', bg: 'bg-amber-500' };
    return { text: 'text-rose-600', bg: 'bg-rose-500' };
  };
  
  const getPriorityColor = (priority) => {
      switch (priority) {
          case 'High': return { bg: 'bg-rose-100', text: 'text-rose-700' };
          case 'Medium': return { bg: 'bg-amber-100', text: 'text-amber-700' };
          default: return { bg: 'bg-teal-100', text: 'text-teal-700' };
      }
  };
  
  const getPriorityBorder = (priority) => {
      switch (priority) {
          case 'High': return 'border-rose-500';
          case 'Medium': return 'border-amber-500';
          default: return 'border-teal-500';
      }
  };

  const AnimatedScoreCircle = ({ score }) => {
      const color = getScoreColor(score).bg.replace('bg-', '');
      const circumference = 2 * Math.PI * 40;
      const offset = circumference - (score / 100) * circumference;

      return (
          <div className="relative w-24 h-24">
              <svg className="w-full h-full transform -rotate-90">
                  <circle
                      cx="50%"
                      cy="50%"
                      r="40"
                      fill="transparent"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                  />
                  <circle
                      cx="50%"
                      cy="50%"
                      r="40"
                      fill="transparent"
                      stroke={getScoreColor(score).bg.split('-')[1]} // dynamic tailwind color
                      strokeWidth="8"
                      strokeLinecap="round"
                      style={{
                          transition: 'stroke-dashoffset 0.8s ease-out',
                          strokeDasharray: circumference,
                          strokeDashoffset: offset,
                          stroke: `var(--color-${color})` // Use CSS variables for dynamic color
                      }}
                  />
              </svg>
              <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl font-extrabold text-gray-800">
                  {score}
              </span>
              {/* Inject custom CSS for dynamic color variables */}
              <style>{`
                  :root {
                      --color-emerald: #10b981;
                      --color-amber: #f59e0b;
                      --color-rose: #f43f5e;
                  }
              `}</style>
          </div>
      );
  };
  
  // --- Main Render ---

  return (
    <div className="min-h-screen bg-gray-50 font-sans p-4 sm:p-8">
      
      {/* Toast Notification */}
      {toast && (
          <div 
              className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-xl text-white transition-opacity duration-300 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}
              style={{ opacity: 1 }}
          >
              <p className="font-semibold">{toast.message}</p>
          </div>
      )}
      
      {/* Header and Controls */}
      <header className="mb-8 p-6 rounded-2xl shadow-2xl bg-gradient-to-r from-purple-700 to-indigo-600 text-white">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-4xl font-extrabold tracking-tight">AI Resume Studio</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">Completion:</span>
            <div className="w-32 bg-indigo-500 rounded-full h-2.5">
              <div 
                className="bg-teal-400 h-2.5 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            <span className="text-lg font-bold">{completionPercentage}%</span>
          </div>
        </div>
        <p className="mt-2 text-indigo-200">Build, Enhance, and Grade your resume for success.</p>
        
        {/* Main Actions */}
        <div className="mt-6 flex flex-wrap gap-4">
          <IconButton 
            icon={Zap} 
            text={isProcessing ? 'Processing...' : 'Generate & Grade with AI (Mock)'} 
            onClick={handleGenerateAndGrade} 
            disabled={isProcessing}
            className="!bg-teal-500 hover:!bg-teal-600"
          />
          <IconButton 
            icon={Download} 
            text="Download PDF (Mock)" 
            onClick={() => handleDownload('pdf')} 
            disabled={isProcessing}
            className="!bg-indigo-400 hover:!bg-indigo-500"
          />
           <IconButton 
            icon={Download} 
            text="Download DOCX (Mock)" 
            onClick={() => handleDownload('docx')} 
            disabled={isProcessing}
            className="!bg-indigo-400 hover:!bg-indigo-500"
          />
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 mb-8">
        {[
          { id: 'builder', label: 'Resume Builder', icon: Edit },
          { id: 'preview', label: 'Live Preview', icon: Clipboard },
          { id: 'grade', label: 'AI Grade & Suggestions', icon: Gauge },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-6 py-3 font-semibold transition-colors duration-200 ${
              activeTab === tab.id
                ? 'border-b-4 border-teal-500 text-teal-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-5 h-5 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <main>
        {activeTab === 'builder' && renderBuilderTab()}
        {activeTab === 'preview' && renderPreviewTab()}
        {activeTab === 'grade' && renderGradeTab()}
      </main>
      
      {/* Floating Processing Spinner */}
      {isProcessing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-50 backdrop-blur-sm">
              <div className="p-6 rounded-xl bg-white flex items-center shadow-2xl">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500 mr-3"></div>
                  <p className="text-gray-800 font-semibold">AI is hard at work...</p>
              </div>
          </div>
      )}

    </div>
  );
}

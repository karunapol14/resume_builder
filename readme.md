AI Resume Studio Full Stack Application

This project contains a simulated full-stack application for building, grading, and enhancing resumes using a React frontend, a Node.js/Express backend, and Docker for easy deployment.

Project Structure

Please set up your local directory to match this structure:

ai-resume-studio/
├── frontend/
│   └── resume-builder-frontend.jsx (Your React App)
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── server.js (Node.js API)
├── docker-compose.yml
└── README.md


Setup and Running

1. Configure API Key

You need a Gemini API key for the AI functionality.

Create a file named .env in the root directory (ai-resume-studio/) and add your key:

GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"


2. Copy Files

Copy the contents of the files provided (Frontend, Backend, and Configuration) into their respective locations in your project structure.

3. Run with Docker

Ensure you have Docker and Docker Compose installed.

Open your terminal in the root directory (ai-resume-studio/).

Run the build and startup command:

docker-compose up --build


4. Access the Application

The frontend will be served by Nginx on port 3000.

Frontend URL: http://localhost:3000

Backend API URL (Internal): http://backend:3001 (Accessible from the frontend container)
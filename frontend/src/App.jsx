import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ResumeForm from './pages/ResumeForm'
import ResumePreview from './pages/ResumePreview'
import Register from './pages/Register'

export default function App(){
  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/resume" element={<ResumeForm />} />
        <Route path="/preview" element={<ResumePreview />} />
      </Routes>
    </div>
  )
}

import React from 'react'
import { Link } from 'react-router-dom'

export default function Dashboard(){
  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-3xl mb-6">Student Dashboard</h1>
      <div className="grid grid-cols-2 gap-4">
        <Link to="/resume" className="p-6 bg-white rounded shadow">Create / Edit Resume</Link>
        <Link to="/preview" className="p-6 bg-white rounded shadow">Preview / Grade</Link>
      </div>
    </div>
  )
}

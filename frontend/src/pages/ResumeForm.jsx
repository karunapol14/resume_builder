import React, { useState, useEffect } from 'react'
import axios from 'axios'

export default function ResumeForm(){
  const [form, setForm] = useState({ name: '', email: '', gpa: '', skills: [], projects: [] })

  useEffect(()=>{
    const t = localStorage.getItem('token')
    if (!t) return
    axios.get(import.meta.env.VITE_API_BASE + '/api/student/profile', { headers: { Authorization: 'Bearer '+t } }).then(r=>{
      setForm(r.data || {})
    }).catch(()=>{})
  }, [])

  const save = async () => {
    const t = localStorage.getItem('token')
    await axios.post(import.meta.env.VITE_API_BASE + '/api/student/profile', form, { headers: { Authorization: 'Bearer '+t } })
    alert('saved')
  }

  const generate = async () => {
    const t = localStorage.getItem('token')
    const res = await axios.post(import.meta.env.VITE_API_BASE + '/api/resume/generate', form, { headers: { Authorization: 'Bearer '+t } })
    const url = import.meta.env.VITE_API_BASE + res.data.pdf
    window.open(url, '_blank')
  }

  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-2xl mb-4">Resume Builder</h1>
      <div className="bg-white p-6 rounded shadow">
        <label className="block">Name<input value={form.name||''} onChange={e=>setForm({...form, name: e.target.value})} className="border p-2 w-full" /></label>
        <label className="block mt-3">Email<input value={form.email||''} onChange={e=>setForm({...form, email: e.target.value})} className="border p-2 w-full" /></label>
        <label className="block mt-3">GPA<input value={form.gpa||''} onChange={e=>setForm({...form, gpa: e.target.value})} className="border p-2 w-full" /></label>
        <label className="block mt-3">Skills (comma separated)<input value={(form.skills||[]).join(', ')} onChange={e=>setForm({...form, skills: e.target.value.split(',').map(s=>s.trim())})} className="border p-2 w-full" /></label>
        <label className="block mt-3">Projects (JSON array)<textarea value={JSON.stringify(form.projects||[], null, 2)} onChange={e=>{ try{ setForm({...form, projects: JSON.parse(e.target.value) }) }catch(err){} }} className="border p-2 w-full h-32" /></label>
        <div className="mt-4 flex gap-2">
          <button onClick={save} className="bg-green-600 text-white px-4 py-2 rounded">Save</button>
          <button onClick={generate} className="bg-blue-600 text-white px-4 py-2 rounded">Generate PDF</button>
        </div>
      </div>
    </div>
  )
}

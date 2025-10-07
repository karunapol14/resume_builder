import React, { useState } from 'react'
import axios from 'axios'

export default function ResumePreview(){
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)

  const grade = async ()=>{
    const t = localStorage.getItem('token')
    const r = await axios.post(import.meta.env.VITE_API_BASE + '/api/resume/grade', { text }, { headers: { Authorization: 'Bearer '+t } })
    setResult(r.data.result)
  }

  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-2xl mb-4">Preview & Grade</h1>
      <textarea value={text} onChange={e=>setText(e.target.value)} className="w-full h-60 p-3 border" placeholder="Paste resume text here" />
      <div className="mt-3 flex gap-2"><button onClick={grade} className="bg-indigo-600 text-white px-4 py-2 rounded">Grade</button></div>
      {result && <div className="mt-4 bg-white p-4 rounded shadow">
        <h2 className="text-xl">Score: {result.score || 'N/A'}</h2>
        <div className="mt-2">Career advice: <div className="italic">{result.career_advice || JSON.stringify(result.raw||result)}</div></div>
      </div>}
    </div>
  )
}

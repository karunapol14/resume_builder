import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export default function Register(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const nav = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    try{
      const res = await axios.post(import.meta.env.VITE_API_BASE + '/api/auth/register', { email, password, name })
      localStorage.setItem('token', res.data.token)
      nav('/dashboard')
    }catch(err){ alert('register failed') }
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <form onSubmit={submit} className="bg-white p-8 rounded shadow w-full max-w-md">
        <h1 className="text-2xl mb-4">Student Register</h1>
        <label className="block">Name<input value={name} onChange={e=>setName(e.target.value)} className="border p-2 w-full"/></label>
        <label className="block mt-3">Email<input value={email} onChange={e=>setEmail(e.target.value)} className="border p-2 w-full"/></label>
        <label className="block mt-3">Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="border p-2 w-full"/></label>
        <button className="mt-4 bg-green-600 text-white px-4 py-2 rounded">Register</button>
      </form>
    </div>
  )
}

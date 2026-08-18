import React, { useEffect, useState } from 'react'

// ClockPanel with add/remove and persistence (localStorage)
// Default zones: browser local, UTC, Dhaka, New York, London, Tokyo

const STORAGE_KEY = 's2s:clock_zones'

function formatTime(date, timeZone){
  try{
    const fmt = new Intl.DateTimeFormat([], {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone
    })
    return fmt.format(date)
  }catch(e){
    return date.toLocaleTimeString()
  }
}

function isValidTimeZone(tz){
  try{
    // try to format a date in that zone; will throw for invalid zones in some browsers
    Intl.DateTimeFormat('en-US', { timeZone: tz }).format(new Date())
    return true
  }catch(e){
    return false
  }
}

export default function ClockPanel({ zones: propZones = null }){
  const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  const defaultZones = [
    { id: 'Local', tz: browserTz },
    { id: 'UTC', tz: 'UTC' },
    { id: 'Dhaka', tz: 'Asia/Dhaka' },
    { id: 'New York', tz: 'America/New_York' },
    { id: 'London', tz: 'Europe/London' },
    { id: 'Tokyo', tz: 'Asia/Tokyo' }
  ]

  const [now, setNow] = useState(new Date())
  const [zones, setZones] = useState(() => {
    if(propZones && propZones.length) return propZones
    try{
      const raw = localStorage.getItem(STORAGE_KEY)
      if(raw) return JSON.parse(raw)
    }catch(e){}
    return defaultZones
  })
  const [newTz, setNewTz] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [error, setError] = useState(null)

  useEffect(()=>{
    const t = setInterval(()=> setNow(new Date()), 1000)
    return ()=> clearInterval(t)
  },[])

  useEffect(()=>{
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(zones)) }catch(e){}
  },[zones])

  function handleAdd(e){
    e.preventDefault()
    const tz = newTz.trim()
    const label = newLabel.trim() || tz
    if(!tz){ setError('Enter a timezone identifier (e.g. Asia/Dhaka)'); return }
    if(!isValidTimeZone(tz)){
      setError('Invalid timezone identifier')
      return
    }
    // avoid duplicates
    if(zones.find(z=>z.tz === tz)){
      setError('Timezone already in the list')
      return
    }
    setZones([...zones, { id: label, tz }])
    setNewTz('')
    setNewLabel('')
    setError(null)
  }

  function handleRemove(index){
    const copy = zones.slice()
    copy.splice(index, 1)
    setZones(copy)
  }

  return (
    <div style={{marginTop:12}}>
      <h4>Clocks</h4>
      <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
        {zones.map((z, i)=> (
          <div key={i} style={{minWidth:140, padding:8, border:'1px solid #eee', borderRadius:6, background:'#fafafa'}}>
            <div style={{fontSize:12, color:'#666'}}>{z.id}</div>
            <div style={{fontSize:18, fontWeight:600}}>{formatTime(now, z.tz)}</div>
            <div style={{fontSize:11, color:'#666', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <span>{z.tz}</span>
              <button onClick={()=>handleRemove(i)} style={{marginLeft:8, fontSize:11}}>Remove</button>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleAdd} style={{marginTop:10}}>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <input placeholder="Label (optional)" value={newLabel} onChange={e=>setNewLabel(e.target.value)} style={{flex:1, padding:6}} />
          <input placeholder="Timezone (e.g. Asia/Dhaka)" value={newTz} onChange={e=>setNewTz(e.target.value)} style={{flex:1, padding:6}} />
          <button type="submit">Add</button>
        </div>
        {error && <div style={{color:'red', marginTop:6}}>{error}</div>}
        <div style={{fontSize:11, color:'#666', marginTop:6}}>Timezone list is saved locally in your browser.</div>
      </form>

    </div>
  )
}

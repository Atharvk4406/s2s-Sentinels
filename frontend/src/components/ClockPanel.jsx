import React, { useEffect, useState } from 'react'

// Simple ClockPanel that displays current time in multiple time zones.
// Uses browser Intl.DateTimeFormat with timeZone option and updates every second.

function formatTime(date, timeZone){
  try{
    const fmt = new Intl.DateTimeFormat([], {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone
    })
    return fmt.format(date)
  }catch(e){
    // If timezone unsupported, fall back to toLocaleTimeString
    return date.toLocaleTimeString()
  }
}

export default function ClockPanel({ zones = null }){
  const defaultZones = [
    { id: 'Local', tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' },
    { id: 'UTC', tz: 'UTC' },
    { id: 'Dhaka', tz: 'Asia/Dhaka' },
    { id: 'New York', tz: 'America/New_York' },
    { id: 'London', tz: 'Europe/London' },
    { id: 'Tokyo', tz: 'Asia/Tokyo' }
  ]

  const zonesToUse = zones || defaultZones

  const [now, setNow] = useState(new Date())

  useEffect(()=>{
    const t = setInterval(()=> setNow(new Date()), 1000)
    return ()=> clearInterval(t)
  },[])

  return (
    <div style={{marginTop:12}}>
      <h4>Clocks</h4>
      <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
        {zonesToUse.map((z, i)=> (
          <div key={i} style={{minWidth:140, padding:8, border:'1px solid #eee', borderRadius:6, background:'#fafafa'}}>
            <div style={{fontSize:12, color:'#666'}}>{z.id}</div>
            <div style={{fontSize:18, fontWeight:600}}>{formatTime(now, z.tz)}</div>
            <div style={{fontSize:11, color:'#666'}}>{z.tz}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

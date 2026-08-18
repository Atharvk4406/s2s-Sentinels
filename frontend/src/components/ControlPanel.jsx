import React, { useState } from 'react'
import * as api from '../services/api'
import WeatherPanel from './WeatherPanel'
import ClockPanel from './ClockPanel'

const SAMPLE_AOI = {
  "type": "Feature",
  "properties": {},
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [90.404, 23.807],
        [90.421, 23.807],
        [90.421, 23.818],
        [90.404, 23.818],
        [90.404, 23.807]
      ]
    ]
  }
}

function centroidFromAoi(aoi){
  try{
    const coords = aoi.geometry.coordinates[0]
    let sumx=0,sumy=0
    coords.forEach(c=>{ sumx+=c[0]; sumy+=c[1] })
    const n = coords.length
    return { lon: sumx/n, lat: sumy/n }
  }catch(e){
    return { lat:23.8103, lon:90.4125 }
  }
}

export default function ControlPanel({ aoi, setAoi, setResult }){
  const [disaster, setDisaster] = useState('flood')
  const [status, setStatus] = useState('idle')

  async function handleLoadSample(){
    setAoi(SAMPLE_AOI)
    setStatus('sample-loaded')
  }

  async function handleAnalyze(){
    if(!aoi){
      alert('Load or draw an AOI first (use Load Sample AOI)')
      return
    }
    setStatus('running')
    try{
      const res = await api.postAnalyze({ disasterType: disaster, aoi })
      // poll for result
      const jobId = res.job_id
      let attempts = 0
      let result = null
      while(attempts < 20){
        // wait
        await new Promise(r=>setTimeout(r, 1000))
        const r2 = await api.getAnalysis(jobId)
        if(r2.status === 'finished'){
          result = r2.result
          break
        }
        attempts += 1
      }
      if(result){
        setResult(result)
        setStatus('finished')
      } else {
        setStatus('timeout')
        alert('Analysis timed out')
      }
    }catch(err){
      console.error(err)
      setStatus('error')
      alert('Analysis failed')
    }
  }

  const center = aoi ? centroidFromAoi(aoi) : { lat:23.8103, lon:90.4125 }

  return (
    <div>
      <h2>S2S Sentinel</h2>
      <div style={{marginBottom:12}}>
        <label>Disaster:</label>
        <select value={disaster} onChange={e=>setDisaster(e.target.value)} style={{marginLeft:8}}>
          <option value="flood">🌊 Flood (Available)</option>
          <option value="landslide">🏔️ Landslide (Coming soon)</option>
          <option value="wildfire">🔥 Wildfire (Coming soon)</option>
        </select>
      </div>
      <div style={{marginBottom:12}}>
        <button onClick={handleLoadSample}>Load Sample AOI</button>
        <button onClick={()=>{ setAoi(null); setResult(null); setStatus('idle') }} style={{marginLeft:8}}>Clear</button>
      </div>
      <div style={{marginBottom:12}}>
        <button onClick={handleAnalyze}>Analyze</button>
      </div>
      <div>
        <strong>Status:</strong> {status}
      </div>
      <hr />

      <ClockPanel />

      <WeatherPanel lat={center.lat} lon={center.lon} />
      <div>
        <h3>Notes</h3>
        <ul>
          <li>Sample AOI is a small polygon. Use it to demo the pipeline.</li>
          <li>Analysis is a demo: backend returns a synthesized "flood" result if sample sentinel data is missing.</li>
        </ul>
      </div>
    </div>
  )
}

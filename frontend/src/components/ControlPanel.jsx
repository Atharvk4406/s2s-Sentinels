import React, { useState } from 'react'
import * as api from '../services/api'

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
      <div>
        <h3>Notes</h3>
        <ul>
          <li>Sample AOI is a small polygon. Use it to demo the pipeline.</li>
          <li>Analysis is a demo: backend returns a synthesized "flood" result.</li>
        </ul>
      </div>
    </div>
  )
}

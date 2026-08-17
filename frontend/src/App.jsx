import React, { useState } from 'react'
import MapView from './components/MapView'
import ControlPanel from './components/ControlPanel'
import './styles.css'

export default function App(){
  const [aoi, setAoi] = useState(null)
  const [result, setResult] = useState(null)

  return (
    <div style={{display:'flex', height:'100vh'}}>
      <div style={{width:320, borderRight:'1px solid #eee', padding:16}}>
        <ControlPanel aoi={aoi} setAoi={setAoi} setResult={setResult} />
      </div>
      <div style={{flex:1}}>
        <MapView aoi={aoi} result={result} />
      </div>
    </div>
  )
}

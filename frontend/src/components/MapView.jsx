import React, { useEffect } from 'react'
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

export default function MapView({ aoi, result }){
  useEffect(()=>{
    // placeholder for map side-effects
  },[aoi, result])

  const center = aoi ? [aoi.geometry.coordinates[0][0][1], aoi.geometry.coordinates[0][0][0]] : [23.8103,90.4125]

  return (
    <MapContainer center={center} zoom={12} style={{height:'100%', width:'100%'}}>
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {aoi && (
        <GeoJSON data={aoi} style={{color:'#0b84a5', weight:2, fillOpacity:0.1}} />
      )}
      {result && result.affectedGeometry && (
        <GeoJSON data={result.affectedGeometry} style={{color:'#d9534f', weight:2, fillOpacity:0.35}} />
      )}
    </MapContainer>
  )
}

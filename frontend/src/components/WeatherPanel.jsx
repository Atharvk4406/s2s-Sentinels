import React, { useEffect, useState } from 'react'

// Open-Meteo-based WeatherPanel (no API key required)
// Docs: https://open-meteo.com/

const WEATHER_CODE = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow fall',
  73: 'Moderate snow fall',
  75: 'Heavy snow fall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail'
}

export default function WeatherPanel({ lat = 23.8103, lon = 90.4125 }){
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  useEffect(()=>{
    async function fetchWeather(){
      setLoading(true)
      setError(null)
      try{
        // Request current weather and hourly precipitation
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,precipitation&timezone=auto`
        const res = await fetch(url)
        if(!res.ok) throw new Error('weather fetch failed')
        const json = await res.json()
        setData(json)
      }catch(err){
        setError(err.message)
      }finally{
        setLoading(false)
      }
    }
    fetchWeather()
  },[lat, lon])

  if(loading) return <div>Loading weather...</div>
  if(error) return <div style={{color:'red'}}>Weather error: {error}</div>
  if(!data) return null

  const cw = data.current_weather || {}
  const temp = cw.temperature
  const wind = cw.windspeed
  const code = cw.weathercode
  const desc = WEATHER_CODE[code] || 'Unknown'

  // show simple hourly precipitation and humidity if available
  const hourly = data.hourly || {}
  const nextHours = []
  if(hourly.time && hourly.precipitation){
    for(let i=0;i<6 && i<hourly.time.length;i++){
      nextHours.push({ time: hourly.time[i], precipitation: hourly.precipitation[i], temp: hourly.temperature_2m ? hourly.temperature_2m[i] : null })
    }
  }

  return (
    <div style={{marginTop:12}}>
      <h4>Weather</h4>
      <div><strong>Location:</strong> {lat.toFixed(4)}, {lon.toFixed(4)}</div>
      <div><strong>Now:</strong> {temp} °C — {desc} — wind {wind} m/s</div>
      {nextHours.length>0 && (
        <div style={{marginTop:8}}>
          <strong>Next hours (sample):</strong>
          <ul style={{paddingLeft:18}}>
            {nextHours.map((h,i)=> (
              <li key={i}>{new Date(h.time).toLocaleString()}: {h.temp!==null?`${h.temp}°C, `:''}precip {h.precipitation} mm</li>
            ))}
          </ul>
        </div>
      )}
      <div style={{fontSize:12, marginTop:8, color:'#666'}}>Data source: Open-Meteo (no API key required)</div>
    </div>
  )
}

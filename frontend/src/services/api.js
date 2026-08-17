export async function postAnalyze(payload){
  const res = await fetch('/api/analyze', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(payload) })
  if(!res.ok) throw new Error('analyze failed')
  return res.json()
}

export async function getAnalysis(jobId){
  const res = await fetch(`/api/analysis/${jobId}`)
  if(!res.ok) throw new Error('getAnalysis failed')
  return res.json()
}

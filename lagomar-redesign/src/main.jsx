import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const rootEl = document.getElementById('root')
const loadCheck = document.getElementById('load-check')

if (!rootEl) {
  document.body.innerHTML = '<div style="padding:2rem;font-family:system-ui;color:#333">Root element #root not found.</div>'
} else {
  try {
    ReactDOM.createRoot(rootEl).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
    if (loadCheck) loadCheck.style.display = 'none'
  } catch (err) {
    if (loadCheck) loadCheck.style.display = 'none'
    rootEl.innerHTML = `<div style="padding:2rem;font-family:system-ui;color:#b91c1c;max-width:600px"><strong>App failed to load</strong><pre style="margin-top:0.5rem;font-size:12px;overflow:auto">${err?.message ?? String(err)}</pre></div>`
  }
}

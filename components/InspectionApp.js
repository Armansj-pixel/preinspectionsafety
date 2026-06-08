'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { UNITS, CHECKLIST } from '@/lib/checklist-data'

const STATUS = { OK: 'OK', NOK: 'NOK', NA: 'N/A' }

const C = {
  bg: '#0d1117',
  surface: '#161b22',
  surface2: '#21262d',
  border: '#30363d',
  accent: '#f0a500',
  accentDim: '#f0a50018',
  red: '#f85149',
  redDim: '#f8514918',
  green: '#3fb950',
  greenDim: '#3fb95018',
  muted: '#8b949e',
  text: '#e6edf3',
  textDim: '#c9d1d9',
}

// ── PDF PRINT FUNCTION ────────────────────────────────────────────────────
function printInspectionReport({ unit, operatorName, sioNumber, today, todayISO,
  checklist, checks, notes, okCount, nokCount, naCount, signatureData, reportId }) {

  const statusColor = { OK: '#16a34a', NOK: '#dc2626', 'N/A': '#6b7280', '–': '#9ca3af' }
  const statusBg   = { OK: '#f0fdf4', NOK: '#fef2f2', 'N/A': '#f9fafb', '–': '#f9fafb' }
  const categories = [...new Set(checklist.map(i => i.cat))]

  const checklistRows = categories.map(cat => {
    const items = checklist.filter(i => i.cat === cat)
    const rows = items.map((item, idx) => {
      const s = checks[item.id] || '–'
      const note = notes[item.id] || ''
      return `
        <tr style="background:${idx % 2 === 0 ? '#fff' : '#f9fafb'}">
          <td style="padding:5px 8px; border:1px solid #e5e7eb; font-size:9pt; width:40px; text-align:center; color:#6b7280;">${idx + 1}</td>
          <td style="padding:5px 8px; border:1px solid #e5e7eb; font-size:9pt; line-height:1.4;">${item.item}${note ? `<br><span style="color:#6b7280; font-size:8pt;">📝 ${note}</span>` : ''}</td>
          <td style="padding:5px 8px; border:1px solid #e5e7eb; font-size:9pt; text-align:center; width:60px; font-weight:bold; color:${statusColor[s]}; background:${statusBg[s]};">${s}</td>
        </tr>`
    }).join('')
    return `
      <tr>
        <td colspan="3" style="padding:6px 8px; background:#1e3a5f; color:white; font-size:9pt; font-weight:bold; letter-spacing:1px;">▶ ${cat.toUpperCase()}</td>
      </tr>
      ${rows}`
  }).join('')

  const nokItems = checklist.filter(i => checks[i.id] === 'NOK')
  const nokSection = nokItems.length > 0 ? `
    <div style="margin-top:16px; border:1.5px solid #dc2626; border-radius:4px; overflow:hidden;">
      <div style="background:#dc2626; color:white; padding:7px 12px; font-size:9.5pt; font-weight:bold;">
        ⛔ ITEM NOK — PERLU TINDAK LANJUT SEGERA (${nokItems.length} item)
      </div>
      <div style="padding:10px 12px;">
        ${nokItems.map((item, i) => `
          <div style="padding:5px 0; border-bottom:1px solid #fee2e2; font-size:9pt; color:#991b1b;">
            ${i + 1}. ${item.item}
            ${notes[item.id] ? `<span style="color:#6b7280;"> — ${notes[item.id]}</span>` : ''}
          </div>`).join('')}
      </div>
    </div>` : ''

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Laporan Inspeksi — ${unit.label} — ${todayISO}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #1a1a1a; }
  @page { size: A4; margin: 12mm 14mm; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>

<!-- HEADER -->
<table style="width:100%; border-bottom:3px solid #1e3a5f; padding-bottom:10px; margin-bottom:12px;">
  <tr>
    <td style="width:160px;">
      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Elsewedy_Electric_Logo.svg/320px-Elsewedy_Electric_Logo.svg.png"
           style="height:40px; object-fit:contain;"
           onerror="this.style.display='none'; this.nextSibling.style.display='block'"/>
      <div style="display:none; font-size:13pt; font-weight:bold; color:#1e3a5f;">ELSEWEDY<br>ELECTRIC</div>
    </td>
    <td style="text-align:center;">
      <div style="font-size:8pt; color:#666; letter-spacing:1px; text-transform:uppercase;">PT Elsewedy Electric Indonesia</div>
      <div style="font-size:14pt; font-weight:bold; color:#1e3a5f; margin:2px 0;">LAPORAN PRE-INSPECTION HARIAN</div>
      <div style="font-size:9pt; color:#444;">Departemen Winding — Phase Assembly</div>
    </td>
    <td style="width:140px; text-align:right; font-size:8pt; color:#666; line-height:1.7;">
      <div>No: <b>WND-K3-${todayISO.replace(/-/g,'')}-${reportId?.slice(0,6).toUpperCase() || 'XXXXXX'}</b></div>
      <div>Tanggal: <b>${today}</b></div>
      <div>Shift: <b>Pagi</b></div>
    </td>
  </tr>
</table>

<!-- STATUS BANNER -->
<div style="background:${nokCount > 0 ? '#dc2626' : '#16a34a'}; color:white; text-align:center; padding:8px; font-size:12pt; font-weight:bold; letter-spacing:2px; border-radius:4px; margin-bottom:12px;">
  ${nokCount > 0 ? '⛔ TIDAK LAYAK OPERASI' : '✅ UNIT LAYAK OPERASI'}
</div>

<!-- INFO UNIT & OPERATOR -->
<table style="width:100%; border-collapse:collapse; margin-bottom:12px;">
  <tr>
    <td style="width:50%; padding:4px; vertical-align:top;">
      <table style="width:100%; border:1px solid #e5e7eb; border-radius:4px; overflow:hidden; border-collapse:collapse;">
        <tr><td colspan="2" style="background:#1e3a5f; color:white; padding:6px 10px; font-size:9pt; font-weight:bold;">INFORMASI UNIT</td></tr>
        <tr><td style="padding:5px 10px; font-size:9pt; color:#6b7280; border-bottom:1px solid #f3f4f6; width:40%;">Unit</td><td style="padding:5px 10px; font-size:9pt; font-weight:bold; border-bottom:1px solid #f3f4f6;">${unit.label}</td></tr>
        <tr><td style="padding:5px 10px; font-size:9pt; color:#6b7280; border-bottom:1px solid #f3f4f6;">Lokasi</td><td style="padding:5px 10px; font-size:9pt; border-bottom:1px solid #f3f4f6;">${unit.hall !== '–' ? unit.hall : unit.type === 'forklift_electric' ? 'Forklift Elektrik' : 'Forklift Gas'}</td></tr>
        <tr><td style="padding:5px 10px; font-size:9pt; color:#6b7280;">Tipe</td><td style="padding:5px 10px; font-size:9pt;">${unit.type === 'crane' ? 'Overhead Crane' : 'Forklift'}</td></tr>
      </table>
    </td>
    <td style="width:4px;"></td>
    <td style="width:50%; padding:4px; vertical-align:top;">
      <table style="width:100%; border:1px solid #e5e7eb; border-radius:4px; overflow:hidden; border-collapse:collapse;">
        <tr><td colspan="2" style="background:#1e3a5f; color:white; padding:6px 10px; font-size:9pt; font-weight:bold;">INFORMASI OPERATOR</td></tr>
        <tr><td style="padding:5px 10px; font-size:9pt; color:#6b7280; border-bottom:1px solid #f3f4f6; width:40%;">Nama</td><td style="padding:5px 10px; font-size:9pt; font-weight:bold; border-bottom:1px solid #f3f4f6;">${operatorName}</td></tr>
        <tr><td style="padding:5px 10px; font-size:9pt; color:#6b7280; border-bottom:1px solid #f3f4f6;">No. SIO</td><td style="padding:5px 10px; font-size:9pt; border-bottom:1px solid #f3f4f6;">${sioNumber}</td></tr>
        <tr><td style="padding:5px 10px; font-size:9pt; color:#6b7280;">Waktu Submit</td><td style="padding:5px 10px; font-size:9pt;">${new Date().toLocaleTimeString('id-ID')}</td></tr>
      </table>
    </td>
  </tr>
</table>

<!-- RINGKASAN -->
<table style="width:100%; border-collapse:collapse; margin-bottom:12px; text-align:center;">
  <tr>
    <td style="width:33%; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:4px; padding:8px;">
      <div style="font-size:20pt; font-weight:bold; color:#16a34a;">${okCount}</div>
      <div style="font-size:8pt; color:#6b7280; letter-spacing:1px;">ITEM OK</div>
    </td>
    <td style="width:2%;"></td>
    <td style="width:33%; background:${nokCount > 0 ? '#fef2f2' : '#f9fafb'}; border:1px solid ${nokCount > 0 ? '#fca5a5' : '#e5e7eb'}; border-radius:4px; padding:8px;">
      <div style="font-size:20pt; font-weight:bold; color:${nokCount > 0 ? '#dc2626' : '#9ca3af'};">${nokCount}</div>
      <div style="font-size:8pt; color:#6b7280; letter-spacing:1px;">ITEM NOK</div>
    </td>
    <td style="width:2%;"></td>
    <td style="width:33%; background:#f9fafb; border:1px solid #e5e7eb; border-radius:4px; padding:8px;">
      <div style="font-size:20pt; font-weight:bold; color:#6b7280;">${naCount}</div>
      <div style="font-size:8pt; color:#6b7280; letter-spacing:1px;">ITEM N/A</div>
    </td>
  </tr>
</table>

<!-- NOK SECTION -->
${nokSection}

<!-- CHECKLIST TABLE -->
<div style="margin-top:14px;">
  <div style="background:#1e3a5f; color:white; padding:7px 12px; font-size:10pt; font-weight:bold; border-radius:4px 4px 0 0;">
    DETAIL HASIL PEMERIKSAAN
  </div>
  <table style="width:100%; border-collapse:collapse;">
    <thead>
      <tr style="background:#f1f5f9;">
        <th style="padding:6px 8px; border:1px solid #e5e7eb; font-size:8.5pt; width:40px; text-align:center;">No</th>
        <th style="padding:6px 8px; border:1px solid #e5e7eb; font-size:8.5pt; text-align:left;">Item Pemeriksaan</th>
        <th style="padding:6px 8px; border:1px solid #e5e7eb; font-size:8.5pt; width:60px; text-align:center;">Status</th>
      </tr>
    </thead>
    <tbody>
      ${checklistRows}
    </tbody>
  </table>
</div>

<!-- TANDA TANGAN -->
<table style="width:100%; border-collapse:collapse; margin-top:16px;">
  <tr>
    <td style="width:50%; border:1px solid #e5e7eb; padding:8px; vertical-align:top; border-radius:4px;">
      <div style="font-size:8.5pt; color:#6b7280; margin-bottom:4px;">TANDA TANGAN OPERATOR</div>
      <div style="font-size:9pt; font-weight:bold; margin-bottom:6px;">${operatorName} — SIO: ${sioNumber}</div>
      ${signatureData
        ? `<img src="${signatureData}" style="max-width:180px; max-height:70px; border:1px solid #e5e7eb; border-radius:3px; background:#fff;"/>`
        : `<div style="height:60px; border:1px dashed #ccc; border-radius:3px;"></div>`
      }
    </td>
    <td style="width:4px;"></td>
    <td style="width:50%; border:1px solid #e5e7eb; padding:8px; vertical-align:top; border-radius:4px;">
      <div style="font-size:8.5pt; color:#6b7280; margin-bottom:4px;">DIKETAHUI OLEH / SUPERVISOR</div>
      <div style="height:60px; border-bottom:1px solid #888; margin: 0 30px; margin-top:50px;"></div>
      <div style="font-size:8.5pt; color:#6b7280; text-align:center; margin-top:4px;">( ............................ )</div>
    </td>
  </tr>
</table>

<!-- FOOTER -->
<div style="margin-top:14px; border-top:1px solid #e5e7eb; padding-top:6px; text-align:center; font-size:7.5pt; color:#9ca3af;">
  Dokumen ini digenerate otomatis oleh Sistem Pre-Inspection Checklist Digital — Dept. Winding PT Elsewedy Electric Indonesia<br>
  ID Laporan: ${reportId || '-'} &nbsp;|&nbsp; ${todayISO} &nbsp;|&nbsp; Shift Pagi
</div>

</body>
</html>`

  const win = window.open('', '_blank', 'width=800,height=1000')
  if (!win) { alert('Pop-up diblokir browser. Izinkan pop-up untuk mencetak laporan.'); return }
  win.document.write(html)
  win.document.close()
  win.onload = () => {
    setTimeout(() => {
      win.focus()
      win.print()
    }, 500)
  }
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function InspectionApp() {
  const [screen, setScreen] = useState('home')
  const [selectedUnit, setSelectedUnit] = useState(null)
  const [operatorName, setOperatorName] = useState('')
  const [sioNumber, setSioNumber] = useState('')
  const [checks, setChecks] = useState({})
  const [notes, setNotes] = useState({})
  const [drawing, setDrawing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [savedReport, setSavedReport] = useState(null)
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [dupWarning, setDupWarning] = useState(false)
  const [todayDone, setTodayDone] = useState([])

  const canvasRef = useRef(null)
  const lastPos = useRef(null)

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
  const todayISO = new Date().toISOString().split('T')[0]

  const unit = UNITS.find(u => u.id === selectedUnit)
  const checklist = selectedUnit ? CHECKLIST[unit.type] : []
  const categories = [...new Set(checklist.map(i => i.cat))]
  const progress = checklist.filter(i => checks[i.id]).length
  const nokCount = checklist.filter(i => checks[i.id] === STATUS.NOK).length
  const okCount = checklist.filter(i => checks[i.id] === STATUS.OK).length
  const naCount = checklist.filter(i => checks[i.id] === STATUS.NA).length

  const fetchTodayDone = async () => {
    const { data } = await supabase
      .from('inspection_reports')
      .select('unit_id')
      .eq('inspection_date', todayISO)
    if (data) setTodayDone(data.map(d => d.unit_id))
  }

  useEffect(() => { fetchTodayDone() }, [])

  const selectUnit = async (uid) => {
    setSelectedUnit(uid)
    setChecks({}); setNotes({}); setSaveError(null); setDupWarning(false)
    const { data } = await supabase
      .from('inspection_reports')
      .select('id')
      .eq('inspection_date', todayISO)
      .eq('unit_id', uid)
    setDupWarning(data && data.length > 0)
    setScreen('form')
  }

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect()
    const src = e.touches ? e.touches[0] : e
    return {
      x: (src.clientX - rect.left) * (canvas.width / rect.width),
      y: (src.clientY - rect.top) * (canvas.height / rect.height)
    }
  }
  const startDraw = (e) => { e.preventDefault(); setDrawing(true); lastPos.current = getPos(e, canvasRef.current) }
  const draw = (e) => {
    e.preventDefault(); if (!drawing) return
    const canvas = canvasRef.current; const ctx = canvas.getContext('2d')
    const pos = getPos(e, canvas)
    ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y); ctx.strokeStyle = '#0d1117'; ctx.lineWidth = 2.5
    ctx.lineCap = 'round'; ctx.stroke()
    lastPos.current = pos
  }
  const endDraw = () => setDrawing(false)
  const clearCanvas = () => { canvasRef.current?.getContext('2d').clearRect(0, 0, 500, 180) }

  const handleSubmit = async () => {
    setSaving(true); setSaveError(null)
    const sig = canvasRef.current?.toDataURL()
    const results = checklist.map(i => ({
      id: i.id, item: i.item, category: i.cat,
      status: checks[i.id] || '–',
      note: notes[i.id] || ''
    }))
    const { data, error } = await supabase
      .from('inspection_reports')
      .insert({
        inspection_date: todayISO,
        shift: 'Pagi',
        equipment_type: unit.type,
        unit_id: selectedUnit,
        unit_label: unit.label,
        operator_name: operatorName,
        sio_number: sioNumber,
        checklist_results: results,
        total_ok: okCount,
        total_nok: nokCount,
        total_na: naCount,
        is_fit_for_operation: nokCount === 0,
        signature_data: sig,
      })
      .select()

    if (error) {
      setSaveError('Gagal menyimpan: ' + error.message)
      setSaving(false)
      return
    }

    const report = data[0]
    setSavedReport(report)
    fetchTodayDone()

    // ── AUTO PRINT PDF
    printInspectionReport({
      unit, operatorName, sioNumber, today, todayISO,
      checklist, checks, notes,
      okCount, nokCount, naCount,
      signatureData: sig,
      reportId: report?.id
    })

    setSaving(false)
    setScreen('done')
  }

  const loadHistory = async () => {
    setLoadingHistory(true)
    const { data } = await supabase
      .from('inspection_reports')
      .select('*')
      .eq('inspection_date', todayISO)
      .order('created_at', { ascending: false })
    setHistory(data || [])
    setLoadingHistory(false)
    setScreen('history')
  }

  const reset = () => {
    setScreen('home'); setSelectedUnit(null); setOperatorName(''); setSioNumber('')
    setChecks({}); setNotes({}); setSavedReport(null); setDupWarning(false)
  }

  const card = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: 14, marginBottom: 10 }
  const label = { fontSize: 9, letterSpacing: 3, color: C.muted, textTransform: 'uppercase', marginBottom: 6 }
  const input = { width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, padding: '9px 12px', color: C.text, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }

  const btn = (v = 'primary', extra = {}) => ({
    padding: v === 'sm' ? '5px 12px' : '11px 20px',
    background: v === 'primary' ? C.accent : v === 'danger' ? C.red : 'transparent',
    color: v === 'primary' ? '#0d1117' : C.text,
    border: v !== 'primary' && v !== 'danger' ? `1px solid ${C.border}` : 'none',
    borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit',
    fontWeight: 'bold', fontSize: v === 'sm' ? 11 : 13, letterSpacing: 1, ...extra
  })

  const statusBtn = (s, active) => {
    const col = { OK: { bg: C.greenDim, text: C.green, b: C.green }, NOK: { bg: C.redDim, text: C.red, b: C.red }, 'N/A': { bg: C.surface2, text: C.muted, b: C.border } }[s]
    return { padding: '5px 13px', background: active ? col.bg : 'transparent', color: active ? col.text : C.muted, border: `1px solid ${active ? col.b : C.border}`, borderRadius: 3, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', fontSize: 12 }
  }

  const header = (tag, title, sub) => (
    <div style={{ background: C.surface, borderBottom: `2px solid ${C.accent}`, padding: '14px 16px', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ fontSize: 9, letterSpacing: 3, color: C.accent, textTransform: 'uppercase' }}>{tag}</div>
      <div style={{ fontSize: 17, fontWeight: 'bold', color: C.text, letterSpacing: 0.5, marginTop: 2 }}>{title}</div>
      {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{sub}</div>}
    </div>
  )

  const wrap = (children) => (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'IBM Plex Mono','Courier New',monospace", paddingBottom: 80 }}>
      {children}
    </div>
  )

  const container = { maxWidth: 600, margin: '0 auto', padding: '14px' }

  // ── HOME
  if (screen === 'home') return wrap(<>
    {header('PT Elsewedy Electric Indonesia · Dept. Winding', 'PRE-INSPECTION CHECKLIST', today)}
    <div style={container}>
      <div style={{ ...card, borderColor: C.accent, background: C.accentDim }}>
        <div style={{ fontSize: 11, color: C.accent, letterSpacing: 1 }}>⚠ WAJIB sebelum operasi — Shift Pagi</div>
        <div style={{ fontSize: 12, color: C.textDim, marginTop: 4 }}>Pilih unit di bawah untuk memulai inspeksi.</div>
      </div>
      <div style={{ fontSize: 9, letterSpacing: 3, color: C.muted, textTransform: 'uppercase', marginBottom: 8 }}>Pilih Unit</div>
      {[{ hall: 'Hall B', label: 'OVERHEAD CRANE · HALL B' }, { hall: 'Hall D', label: 'OVERHEAD CRANE · HALL D' }, { hall: '–', label: 'FORKLIFT' }].map(({ hall, label: hl }) => {
        const units = UNITS.filter(u => u.hall === hall)
        if (!units.length) return null
        return (
          <div key={hall} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: C.muted, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8, borderBottom: `1px solid ${C.border}`, paddingBottom: 4 }}>{hl}</div>
            {units.map(u => {
              const done = todayDone.includes(u.id)
              return (
                <button key={u.id} onClick={() => selectUnit(u.id)}
                  style={{ display: 'flex', alignItems: 'center', width: '100%', background: done ? C.greenDim : C.surface, border: `1px solid ${done ? C.green : C.border}`, borderRadius: 6, padding: '12px 14px', marginBottom: 8, cursor: 'pointer', textAlign: 'left', gap: 12 }}>
                  <span style={{ fontSize: 22 }}>{u.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 'bold', color: C.text, fontFamily: 'inherit' }}>{u.label}</div>
                    <div style={{ fontSize: 11, color: C.muted, fontFamily: 'inherit' }}>
                      {u.hall !== '–' ? u.hall : u.type === 'forklift_electric' ? 'Battery Electric' : 'LPG / Gas'}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: done ? C.green : C.muted, fontFamily: 'inherit', fontWeight: 'bold' }}>
                    {done ? '✓ DONE' : 'MULAI →'}
                  </div>
                </button>
              )
            })}
          </div>
        )
      })}
      <button style={{ ...btn('ghost'), width: '100%', marginTop: 4 }} onClick={loadHistory}>
        📋 Riwayat Inspeksi Hari Ini
      </button>
    </div>
  </>)

  // ── FORM
  if (screen === 'form') return wrap(<>
    {header(`${unit?.icon} ${unit?.label}${unit?.hall !== '–' ? ' · ' + unit?.hall : ''}`, 'FORM INSPEKSI PAGI', today)}
    <div style={container}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: C.muted }}>{progress}/{checklist.length}</div>
        <div style={{ flex: 1, height: 3, background: C.surface2, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(progress / checklist.length) * 100}%`, background: C.accent, transition: 'width 0.3s' }} />
        </div>
        <div style={{ fontSize: 11, color: nokCount > 0 ? C.red : C.muted }}>{nokCount > 0 ? `${nokCount} NOK` : 'OK'}</div>
      </div>
      {dupWarning && (
        <div style={{ background: '#2d1f00', border: `1px solid ${C.accent}`, borderRadius: 4, padding: '10px 14px', marginBottom: 10, fontSize: 12, color: '#ffd77a' }}>
          ⚠ Unit ini sudah diinspeksi hari ini. Submit ulang jika diperlukan.
        </div>
      )}
      <div style={card}>
        <div style={label}>Nama Operator</div>
        <input style={input} placeholder="Nama lengkap..." value={operatorName} onChange={e => setOperatorName(e.target.value)} />
        <div style={{ ...label, marginTop: 10 }}>Nomor SIO</div>
        <input style={input} placeholder="No. SIO operator..." value={sioNumber} onChange={e => setSioNumber(e.target.value)} />
      </div>
      {categories.map(cat => (
        <div key={cat}>
          <div style={{ fontSize: 10, color: C.accent, letterSpacing: 3, textTransform: 'uppercase', padding: '10px 0 6px', borderBottom: `1px solid ${C.surface2}`, marginBottom: 8 }}>▶ {cat}</div>
          {checklist.filter(i => i.cat === cat).map(item => (
            <div key={item.id} style={{ ...card, borderColor: checks[item.id] === 'NOK' ? C.red : checks[item.id] === 'OK' ? '#1a3a1f' : C.border, marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: C.textDim, marginBottom: 10, lineHeight: 1.6 }}>{item.item}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {Object.values(STATUS).map(s => (
                  <button key={s} style={statusBtn(s, checks[item.id] === s)}
                    onClick={() => setChecks(p => ({ ...p, [item.id]: s }))}>
                    {s === 'OK' ? '✓' : s === 'NOK' ? '✗' : '—'} {s}
                  </button>
                ))}
              </div>
              {checks[item.id] && (
                <input style={{ ...input, marginTop: 8, fontSize: 12, padding: '7px 10px' }}
                  placeholder="Catatan (opsional)..."
                  value={notes[item.id] || ''}
                  onChange={e => setNotes(p => ({ ...p, [item.id]: e.target.value }))} />
              )}
            </div>
          ))}
        </div>
      ))}
      <button
        style={{ ...btn('primary'), width: '100%', marginTop: 8, opacity: (progress === checklist.length && operatorName && sioNumber) ? 1 : 0.4 }}
        disabled={progress < checklist.length || !operatorName || !sioNumber}
        onClick={() => setScreen('sign')}>
        LANJUT → TANDA TANGAN
      </button>
      {(progress < checklist.length || !operatorName || !sioNumber) && (
        <p style={{ textAlign: 'center', fontSize: 11, color: C.muted, marginTop: 6 }}>
          {!operatorName || !sioNumber ? 'Lengkapi nama & SIO terlebih dahulu' : `${checklist.length - progress} item belum diperiksa`}
        </p>
      )}
      <button style={{ ...btn('ghost'), width: '100%', marginTop: 6 }} onClick={reset}>← Kembali</button>
    </div>
  </>)

  // ── SIGN
  if (screen === 'sign') return wrap(<>
    {header('Langkah Terakhir', 'TANDA TANGAN & SUBMIT')}
    <div style={container}>
      <div style={card}>
        <div style={label}>Ringkasan Hasil</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 6 }}>
          {[['OK', okCount, C.green], ['NOK', nokCount, C.red], ['N/A', naCount, C.muted]].map(([l, c, color]) => (
            <div key={l} style={{ textAlign: 'center', background: C.bg, borderRadius: 4, padding: '10px 4px' }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color }}>{c}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      {nokCount > 0
        ? <div style={{ background: '#2d0f0f', border: `1px solid ${C.red}`, borderRadius: 4, padding: '10px 14px', marginBottom: 10, fontSize: 12, color: '#f87171' }}>
            ⛔ {nokCount} item NOK — Unit <strong>TIDAK LAYAK OPERASI</strong>
          </div>
        : <div style={{ background: '#0d2b18', border: `1px solid ${C.green}`, borderRadius: 4, padding: '10px 14px', marginBottom: 10, fontSize: 12, color: '#4ade80' }}>
            ✅ Semua item OK — Unit <strong>LAYAK OPERASI</strong>
          </div>
      }
      <div style={card}>
        <div style={label}>Tanda Tangan — {operatorName}</div>
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 4, background: '#f8fafc', marginTop: 8, overflow: 'hidden', touchAction: 'none' }}>
          <canvas ref={canvasRef} width={500} height={180}
            style={{ width: '100%', height: 160, display: 'block', touchAction: 'none', cursor: 'crosshair' }}
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
        </div>
        <button style={{ ...btn('ghost', { marginTop: 8, fontSize: 11, padding: '6px 14px' }) }} onClick={clearCanvas}>Hapus</button>
      </div>
      {saveError && (
        <div style={{ background: C.redDim, border: `1px solid ${C.red}`, borderRadius: 4, padding: '10px 14px', marginBottom: 10, fontSize: 12, color: C.red }}>{saveError}</div>
      )}
      <div style={{ background: C.accentDim, border: `1px solid ${C.accent}`, borderRadius: 4, padding: '10px 14px', marginBottom: 10, fontSize: 11, color: C.accent }}>
        📄 PDF laporan akan otomatis muncul untuk dicetak setelah submit
      </div>
      <button style={{ ...btn('primary'), width: '100%', opacity: saving ? 0.6 : 1 }} disabled={saving} onClick={handleSubmit}>
        {saving ? '⏳ Menyimpan & Mencetak...' : '✓ SUBMIT & CETAK LAPORAN'}
      </button>
      <button style={{ ...btn('ghost'), width: '100%', marginTop: 8 }} onClick={() => setScreen('form')}>← Kembali</button>
    </div>
  </>)

  // ── DONE
  if (screen === 'done') return wrap(<>
    {header('Inspeksi Tersimpan ✓', 'LAPORAN FINAL')}
    <div style={container}>
      <div style={{ display: 'inline-block', background: nokCount > 0 ? C.red : C.green, color: '#0d1117', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, padding: '3px 12px', borderRadius: 3, marginBottom: 12 }}>
        {nokCount > 0 ? '⛔ TIDAK LAYAK OPERASI' : '✅ LAYAK OPERASI'}
      </div>
      <div style={{ ...card, borderColor: C.green }}>
        <div style={label}>Detail Laporan</div>
        {[
          ['Unit', unit?.label],
          ['Lokasi', unit?.hall !== '–' ? unit?.hall : unit?.type.includes('electric') ? 'Elektrik' : 'Gas'],
          ['Operator', operatorName],
          ['SIO', sioNumber],
          ['Tanggal', today],
          ['ID', savedReport?.id?.slice(0, 8) + '...'],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
            <span style={{ color: C.muted }}>{k}</span>
            <span style={{ color: C.text }}>{v}</span>
          </div>
        ))}
      </div>
      {nokCount > 0 && (
        <div style={{ ...card, borderColor: C.red }}>
          <div style={{ ...label, color: C.red }}>Item NOK — Perlu Tindak Lanjut</div>
          {checklist.filter(i => checks[i.id] === STATUS.NOK).map(item => (
            <div key={item.id} style={{ padding: '7px 0', borderBottom: `1px solid ${C.border}`, fontSize: 12, color: '#f87171' }}>
              ✗ {item.item}
              {notes[item.id] && <span style={{ color: C.muted }}> — {notes[item.id]}</span>}
            </div>
          ))}
        </div>
      )}
      {/* Tombol cetak ulang */}
      <button style={{ ...btn('ghost'), width: '100%', marginBottom: 8 }}
        onClick={() => printInspectionReport({
          unit, operatorName, sioNumber, today, todayISO,
          checklist, checks, notes,
          okCount, nokCount, naCount,
          signatureData: canvasRef.current?.toDataURL(),
          reportId: savedReport?.id
        })}>
        🖨️ Cetak Ulang PDF
      </button>
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={{ ...btn('primary'), flex: 1 }} onClick={reset}>+ Inspeksi Unit Lain</button>
        <button style={{ ...btn('ghost'), flex: 1 }} onClick={loadHistory}>📋 Riwayat</button>
      </div>
    </div>
  </>)

  // ── HISTORY
  if (screen === 'history') return wrap(<>
    {header('Rekap Inspeksi', 'RIWAYAT HARI INI', today)}
    <div style={container}>
      {loadingHistory
        ? <div style={{ textAlign: 'center', color: C.muted, padding: 40 }}>Memuat...</div>
        : history.length === 0
          ? <div style={{ textAlign: 'center', color: C.muted, padding: 40 }}>Belum ada inspeksi hari ini.</div>
          : history.map(r => (
            <div key={r.id} style={{ ...card, borderColor: r.is_fit_for_operation ? C.green : C.red }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 'bold', color: C.text }}>{r.unit_label}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{r.operator_name} · {r.sio_number}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{new Date(r.created_at).toLocaleTimeString('id-ID')}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, fontWeight: 'bold', color: r.is_fit_for_operation ? C.green : C.red, letterSpacing: 1 }}>
                    {r.is_fit_for_operation ? '✓ LAYAK' : '⛔ NOK'}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>OK:{r.total_ok} NOK:{r.total_nok}</div>
                </div>
              </div>
            </div>
          ))
      }
      <button style={{ ...btn('ghost'), width: '100%', marginTop: 4 }} onClick={reset}>← Kembali</button>
    </div>
  </>)
}

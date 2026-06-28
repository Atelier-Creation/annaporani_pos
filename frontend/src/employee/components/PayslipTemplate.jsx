import dayjs from "dayjs";

const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

const fmt = (v) => parseFloat(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });
const num = (v) => parseFloat(v || 0);

// ── Salary row ────────────────────────────────────────────────────────────────
const SRow = ({ label, sub, value, total, accent }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: total ? '10px 16px' : '8px 16px',
    background: total ? (accent === 'green' ? '#f0fdf4' : '#fef2f2') : 'transparent',
    borderTop: total ? `1px solid ${accent === 'green' ? '#bbf7d0' : '#fecaca'}` : '1px solid #f8fafc',
  }}>
    <div>
      <div style={{ fontSize: total ? 13 : 12, fontWeight: total ? 700 : 500, color: total ? '#1e293b' : '#475569' }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{sub}</div>}
    </div>
    <div style={{ fontSize: total ? 14 : 13, fontWeight: total ? 800 : 600, color: total ? (accent === 'green' ? '#15803d' : '#b91c1c') : '#334155' }}>
      ₹{fmt(value)}
    </div>
  </div>
);

// ── Small icon box (SVG-based, no emoji) ──────────────────────────────────────
const IconBox = ({ color, bg, border, children }) => (
  <div style={{
    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
    background: bg, border: `1px solid ${border}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: color,
  }}>
    {children}
  </div>
);

export default function PayslipTemplate({ data, printId = "payslip-print" }) {
  const emp = data.employee || {};
  const month = MONTHS[(data.month || 1) - 1];
  const net = num(data.net_salary);
  const gross = num(data.gross_salary);
  const advDed = num(data.advance_deduction);
  const ded = num(data.total_deductions) + advDed;  // include advance in total shown
  const netPct = gross > 0 ? Math.round((net / gross) * 100) : 0;
  const isPaid = data.status === 'paid';
  const attPct = num(data.working_days) > 0
    ? Math.round(((num(data.present_days) + num(data.leave_days)) / num(data.working_days)) * 100)
    : 0;

  return (
    <div id={printId} style={{
      fontFamily: "'Segoe UI', 'Inter', Arial, sans-serif",
      background: '#fff',
      maxWidth: 780,
      margin: '0 auto',
      borderRadius: 20,
      overflow: 'hidden',
      boxShadow: '0 8px 40px rgba(30,58,138,0.13)',
      border: '1px solid #e0e7ff',
    }}>

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <div style={{
        background: 'linear-gradient(120deg, #0f172a 0%, #1e3a8a 45%, #1d4ed8 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(99,102,241,0.15)' }} />
        <div style={{ position: 'absolute', bottom: -80, left: 120, width: 260, height: 260, borderRadius: '50%', background: 'rgba(59,130,246,0.1)' }} />

        <div style={{ position: 'relative', zIndex: 1, padding: '28px 36px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>

            {/* Left - Company Info with Logo */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                {/* Company Logo */}
                <div style={{
                  width: 56, height: 56, borderRadius: 12,
                  background: '#000',
                  border: '2px solid rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  padding: 4,
                }}>
                  <img
                    src="/duch_small_logo.png"
                    alt="DUCH CLOTHING"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>';
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '0.5px' }}>DUCH CLOTHING</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 3, lineHeight: 1.4 }}>
                    Saibaba Colony Branch, Raja Annamalai Road<br />
                    Saibaba Colony, Coimbatore, Tamil Nadu – 641011
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                    </svg>
                    <span>Phone: 9629998446</span>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1, marginTop: 12 }}>Salary Payslip</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 6 }}>{month} {data.year} &nbsp;·&nbsp; Pay Period</div>
            </div>

            {/* Right */}
            <div style={{ textAlign: 'right' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 16px', borderRadius: 24, marginBottom: 12,
                background: isPaid ? 'rgba(34,197,94,0.2)' : 'rgba(251,191,36,0.2)',
                border: `1px solid ${isPaid ? 'rgba(34,197,94,0.4)' : 'rgba(251,191,36,0.4)'}`,
              }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: isPaid ? '#4ade80' : '#fbbf24' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: isPaid ? '#86efac' : '#fde68a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {isPaid ? 'Paid' : data.status || 'Generated'}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Generated: {dayjs().format("DD MMM YYYY")}</div>
              {data.payment_date && (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>
                  Paid on: {dayjs(data.payment_date).format("DD MMM YYYY")}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary strip */}
        <div style={{
          background: 'rgba(255,255,255,0.07)', borderTop: '1px solid rgba(255,255,255,0.1)',
          padding: '14px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Net Take Home</span>
            <span style={{ fontSize: 30, fontWeight: 900, color: '#fff', letterSpacing: '-1px' }}>₹{fmt(net)}</span>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {[
              { l: 'GROSS', v: `₹${fmt(gross)}`, c: '#86efac' },
              { l: 'DEDUCTIONS', v: `₹${fmt(ded)}`, c: '#fca5a5' },
              { l: 'EFFICIENCY', v: `${netPct}%`, c: '#93c5fd' },
            ].map(({ l, v, c }) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>{l}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: c }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '28px 36px' }}>

        {/* ══ EMPLOYEE INFO ═══════════════════════════════════════════════════ */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 20, marginBottom: 24,
          background: '#f8fafc', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px 24px',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'linear-gradient(135deg,#1e3a8a,#3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, fontWeight: 900, color: '#fff', flexShrink: 0,
          }}>
            {(emp.name || 'E').charAt(0).toUpperCase()}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px 24px' }}>
            {[
              ['Employee Name', emp.name],
              ['Employee Code', emp.employee_code],
              ['Department', emp.department],
              ['Designation', emp.designation],
              ['Employment Type', emp.employment_type?.replace(/_/g, ' ')],
              ['Pay Period', `${month} ${data.year}`],
            ].map(([l, v]) => (
              <div key={l}>
                <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{l}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{v || '—'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ ATTENDANCE ══════════════════════════════════════════════════════ */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
            Attendance Summary
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 10 }}>
            {[
              {
                l: 'Working Days', v: data.working_days, c: '#1e3a8a', bg: '#eff6ff', br: '#bfdbfe',
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
              },
              {
                l: 'Present Days', v: data.present_days, c: '#15803d', bg: '#f0fdf4', br: '#bbf7d0',
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              },
              {
                l: 'Leave Days', v: data.leave_days, c: '#b45309', bg: '#fffbeb', br: '#fde68a',
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              },
              {
                l: 'Absent Days', v: data.absent_days, c: '#b91c1c', bg: '#fef2f2', br: '#fecaca',
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              },
            ].map(c => (
              <div key={c.l} style={{ background: c.bg, border: `1.5px solid ${c.br}`, borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
                <div style={{ color: c.c, display: 'flex', justifyContent: 'center', marginBottom: 6 }}>{c.icon}</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: c.c, lineHeight: 1 }}>{c.v ?? 0}</div>
                <div style={{ fontSize: 10, color: c.c, opacity: 0.7, marginTop: 4, fontWeight: 600 }}>{c.l}</div>
              </div>
            ))}
          </div>
          <div style={{ background: '#f1f5f9', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>Attendance Rate</div>
            <div style={{ flex: 1, height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${attPct}%`, height: '100%', background: 'linear-gradient(90deg,#22c55e,#16a34a)', borderRadius: 4 }} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: attPct >= 75 ? '#15803d' : attPct >= 50 ? '#b45309' : '#b91c1c', whiteSpace: 'nowrap' }}>{attPct}%</div>
          </div>
          {num(data.absent_days) > 0 && (
            <div style={{ marginTop: 8, padding: '7px 12px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, fontSize: 11, color: '#c2410c', display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
              Salary adjusted for {data.absent_days} absent day(s) — pro-rata deduction applied
            </div>
          )}
        </div>

        {/* ══ EARNINGS & DEDUCTIONS ═══════════════════════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

          {/* Earnings */}
          <div style={{ border: '1.5px solid #bbf7d0', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(90deg,#dcfce7,#f0fdf4)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Earnings</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#15803d' }}>₹{fmt(gross)}</span>
            </div>
            <SRow label="Basic Salary" sub="50% of CTC" value={data.basic_salary} />
            <SRow label="HRA" sub="House Rent Allowance" value={data.hra} />
            <SRow label="Transport Allowance" sub="Conveyance" value={data.transport_allowance} />
            {num(data.other_allowance) > 0 && <SRow label="Other Allowance" value={data.other_allowance} />}
            {num(data.bonus) > 0 && <SRow label="Bonus / Incentive" value={data.bonus} />}
            <SRow label="Gross Salary" value={data.gross_salary} total accent="green" />
          </div>

          {/* Deductions */}
          <div style={{ border: '1.5px solid #fecaca', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(90deg,#fee2e2,#fef2f2)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></svg>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Deductions</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#b91c1c' }}>₹{fmt(ded)}</span>            </div>
            {num(data.pf_deduction) > 0 && <SRow label="Provident Fund (PF)" sub="12% of Basic" value={data.pf_deduction} />}
            {num(data.esi_deduction) > 0 && <SRow label="ESI" sub="0.75% of Gross" value={data.esi_deduction} />}
            {num(data.tax_deduction) > 0 && <SRow label="TDS / Income Tax" value={data.tax_deduction} />}
            {num(data.other_deduction) > 0 && <SRow label="Other Deductions" value={data.other_deduction} />}
            {num(data.advance_deduction) > 0 && <SRow label="Advance Recovery" sub="Previously paid advance" value={data.advance_deduction} />}
            {[data.pf_deduction, data.esi_deduction, data.tax_deduction, data.other_deduction, data.advance_deduction].every(v => num(v) === 0) && (
              <div style={{ padding: '20px 16px', textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>No deductions applied</div>
            )}
            <SRow label="Total Deductions" value={ded} total accent="red" />
          </div>
        </div>

        {/* ══ NET SALARY ══════════════════════════════════════════════════════ */}
        <div style={{ borderRadius: 16, overflow: 'hidden', border: '1.5px solid #c7d2fe', marginBottom: 16 }}>
          <div style={{ display: 'flex', height: 10 }}>
            <div style={{ width: `${netPct}%`, background: 'linear-gradient(90deg,#22c55e,#16a34a)' }} />
            <div style={{ flex: 1, background: 'linear-gradient(90deg,#f87171,#ef4444)' }} />
          </div>
          <div style={{
            background: 'linear-gradient(120deg,#0f172a,#1e3a8a)',
            padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(99,102,241,0.12)' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Net Salary (Take Home)</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', letterSpacing: '-1.5px', lineHeight: 1 }}>₹{fmt(net)}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
                {month} {data.year} &nbsp;·&nbsp; {num(data.present_days) + num(data.leave_days)} payable days
              </div>
            </div>
            <div style={{ position: 'relative', zIndex: 1, textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end', marginBottom: 6 }}>
                <div style={{ width: 100, height: 8, background: 'rgba(255,255,255,0.15)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${netPct}%`, height: '100%', background: 'linear-gradient(90deg,#4ade80,#22c55e)', borderRadius: 4 }} />
                </div>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#4ade80' }}>{netPct}%</span>
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>of gross salary retained</div>
              <div style={{ display: 'flex', gap: 16, marginTop: 10, justifyContent: 'flex-end' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Gross</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#86efac' }}>₹{fmt(gross)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Deducted</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fca5a5' }}>₹{fmt(ded)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {data.notes && (
          <div style={{ padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 12, color: '#475569', marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
            <span>{data.notes}</span>
          </div>
        )}

        {advDed > 0 && (
          <div style={{ padding: '12px 16px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, fontSize: 12, color: '#c2410c', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              <span><strong>Advance Recovery:</strong> An advance of ₹{fmt(advDed)} paid earlier has been deducted from this month's salary.</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: 14, whiteSpace: 'nowrap', marginLeft: 16 }}>- ₹{fmt(advDed)}</span>
          </div>
        )}

        {/* ══ FOOTER ══════════════════════════════════════════════════════════ */}
        <div style={{ paddingTop: 16, borderTop: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 10, color: '#cbd5e1' }}>This is a system-generated payslip and does not require a signature.</div>
          <div style={{ fontSize: 10, color: '#cbd5e1' }}>DUCH CLOTHING · Confidential</div>
        </div>
      </div>
    </div>
  );
}

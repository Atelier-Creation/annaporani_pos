import nodemailer from 'nodemailer';

// Create transporter lazily so it reads env vars at call time, not module load time
const getTransporter = () => nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const PRIORITY_COLOR = {
  low:      '#10b981',
  medium:   '#f59e0b',
  high:     '#ef4444',
  critical: '#7c3aed',
};

const TYPE_LABEL = {
  bug:             '🐛 Bug',
  feature_request: '✨ Feature Request',
  ui_issue:        '🎨 UI Issue',
  performance:     '⚡ Performance',
  other:           '📋 Other',
};

export async function sendTicketCreatedEmail(ticket) {
  const to      = process.env.TICKET_NOTIFY_EMAIL;
  const from    = `"DUCH CLOTHING — Ticket System" <${process.env.EMAIL_FROM}>`;
  const pc      = PRIORITY_COLOR[ticket.priority] || '#6366f1';
  const typeLabel = TYPE_LABEL[ticket.ticket_type] || ticket.ticket_type;
  const now     = new Date(ticket.createdAt).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

  const attachmentRows = (ticket.attachments || []).map(a => `
    <tr>
      <td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;font-size:12px;color:#475569;">
        📎 ${a.name || 'Attachment'}
      </td>
      <td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;font-size:11px;color:#94a3b8;">
        ${a.type || '—'}
      </td>
    </tr>
  `).join('');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 50%,#1d4ed8 100%);border-radius:16px 16px 0 0;padding:32px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:10px;padding:8px 14px;margin-bottom:16px;">
                    <span style="color:#fff;font-size:13px;font-weight:700;letter-spacing:1px;">🎫 NEW TICKET</span>
                  </div>
                  <div style="font-size:24px;font-weight:900;color:#fff;margin-bottom:6px;">
                    ${ticket.title}
                  </div>
                  <div style="font-size:13px;color:rgba(255,255,255,0.55);">
                    ${ticket.ticket_no} &nbsp;·&nbsp; ${now}
                  </div>
                </td>
                <td align="right" valign="top">
                  <div style="background:${pc}25;border:1.5px solid ${pc}60;border-radius:20px;padding:6px 16px;display:inline-block;">
                    <span style="color:${pc};font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1px;">
                      ${ticket.priority}
                    </span>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:0 36px 28px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(15,23,42,0.08);">

            <!-- Info strip -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:10px;margin:24px 0 20px;overflow:hidden;">
              <tr>
                <td style="padding:14px 18px;border-right:1px solid #e2e8f0;width:33%;">
                  <div style="font-size:10px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Type</div>
                  <div style="font-size:13px;font-weight:700;color:#1e293b;">${typeLabel}</div>
                </td>
                <td style="padding:14px 18px;border-right:1px solid #e2e8f0;width:33%;">
                  <div style="font-size:10px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Raised By</div>
                  <div style="font-size:13px;font-weight:700;color:#1e293b;">${ticket.raised_by_name || '—'}</div>
                  <div style="font-size:11px;color:#64748b;">${ticket.raised_by_email || ''}</div>
                </td>
                <td style="padding:14px 18px;width:33%;">
                  <div style="font-size:10px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Status</div>
                  <div style="font-size:13px;font-weight:700;color:#f59e0b;">OPEN</div>
                </td>
              </tr>
            </table>

            <!-- Description -->
            ${ticket.description ? `
            <div style="margin-bottom:20px;">
              <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Description</div>
              <div style="background:#f8fafc;border-left:3px solid #6366f1;border-radius:0 8px 8px 0;padding:14px 16px;font-size:13px;color:#475569;line-height:1.7;">
                ${ticket.description.replace(/\n/g, '<br>')}
              </div>
            </div>
            ` : ''}

            <!-- Attachments -->
            ${(ticket.attachments || []).length > 0 ? `
            <div style="margin-bottom:20px;">
              <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">
                Attachments (${ticket.attachments.length})
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
                <tr style="background:#f8fafc;">
                  <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">File Name</th>
                  <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">Type</th>
                </tr>
                ${attachmentRows}
              </table>
            </div>
            ` : ''}

            <!-- CTA -->
            <div style="text-align:center;padding:10px 0 4px;">
              <div style="font-size:12px;color:#94a3b8;margin-bottom:12px;">Login to the admin panel to assign this ticket to a developer</div>
              <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:10px;padding:12px 28px;display:inline-block;">
                <span style="color:#fff;font-size:13px;font-weight:700;">View Ticket Dashboard</span>
              </div>
            </div>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 0 0;text-align:center;">
            <div style="font-size:11px;color:#94a3b8;">
              This is an automated notification from <strong>DUCH CLOTHING Ticket System</strong><br>
              Powered by Atelier Technology Solutions
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
  `;

  const transporter = getTransporter();
  await transporter.sendMail({
    from,
    to,
    subject: `🎫 [${ticket.ticket_no}] New ${ticket.priority?.toUpperCase()} ticket: ${ticket.title}`,
    html,
  });

  console.log(`[Ticket Email] Sent notification for ${ticket.ticket_no} to ${to}`);
}


export async function sendTicketAssignedEmail(ticket, developerEmail, developerName) {
  const from    = `"DUCH CLOTHING — Ticket System" <${process.env.EMAIL_FROM}>`;
  const pc      = PRIORITY_COLOR[ticket.priority] || '#6366f1';
  const typeLabel = TYPE_LABEL[ticket.ticket_type] || ticket.ticket_type;
  const assignedAt = new Date(ticket.assigned_at || Date.now()).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

  const attachmentRows = (ticket.attachments || []).map(a => `
    <tr>
      <td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;font-size:12px;color:#475569;">
        📎 ${a.name || 'Attachment'}
      </td>
      <td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;font-size:11px;color:#94a3b8;">
        ${a.type || '—'}
      </td>
    </tr>
  `).join('');

  const PORTAL_URL = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/developer-login` : 'https://billing.ateliertechnologysolutions.com/developer-login';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header — purple theme for developer -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e1b4b 0%,#4c1d95 50%,#7c3aed 100%);border-radius:16px 16px 0 0;padding:32px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:10px;padding:8px 14px;margin-bottom:16px;">
                    <span style="color:#fff;font-size:13px;font-weight:700;letter-spacing:1px;">🔧 TICKET ASSIGNED TO YOU</span>
                  </div>
                  <div style="font-size:24px;font-weight:900;color:#fff;margin-bottom:6px;">
                    Hi ${developerName}, you have a new ticket!
                  </div>
                  <div style="font-size:13px;color:rgba(255,255,255,0.55);">
                    Assigned on ${assignedAt}
                  </div>
                </td>
                <td align="right" valign="top">
                  <div style="background:${pc}25;border:1.5px solid ${pc}60;border-radius:20px;padding:6px 16px;display:inline-block;">
                    <span style="color:${pc};font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1px;">
                      ${ticket.priority}
                    </span>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:0 36px 28px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(15,23,42,0.08);">

            <!-- Ticket ID banner -->
            <div style="background:#f5f3ff;border:1.5px solid #ddd6fe;border-radius:10px;padding:14px 18px;margin:24px 0 20px;display:flex;align-items:center;gap:12px;">
              <span style="font-size:22px;font-weight:900;color:#7c3aed;">${ticket.ticket_no}</span>
              <span style="font-size:15px;font-weight:700;color:#1e1b4b;">${ticket.title}</span>
            </div>

            <!-- Info strip -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:10px;margin-bottom:20px;overflow:hidden;">
              <tr>
                <td style="padding:14px 18px;border-right:1px solid #e2e8f0;width:33%;">
                  <div style="font-size:10px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Type</div>
                  <div style="font-size:13px;font-weight:700;color:#1e293b;">${typeLabel}</div>
                </td>
                <td style="padding:14px 18px;border-right:1px solid #e2e8f0;width:33%;">
                  <div style="font-size:10px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Raised By</div>
                  <div style="font-size:13px;font-weight:700;color:#1e293b;">${ticket.raised_by_name || '—'}</div>
                </td>
                <td style="padding:14px 18px;width:33%;">
                  <div style="font-size:10px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Status</div>
                  <div style="font-size:13px;font-weight:700;color:#3b82f6;">ASSIGNED</div>
                </td>
              </tr>
            </table>

            <!-- Description -->
            ${ticket.description ? `
            <div style="margin-bottom:20px;">
              <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Description</div>
              <div style="background:#faf5ff;border-left:3px solid #7c3aed;border-radius:0 8px 8px 0;padding:14px 16px;font-size:13px;color:#475569;line-height:1.7;">
                ${ticket.description.replace(/\n/g, '<br>')}
              </div>
            </div>
            ` : ''}

            <!-- Admin notes -->
            ${ticket.admin_notes ? `
            <div style="margin-bottom:20px;">
              <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Admin Notes for You</div>
              <div style="background:#eff6ff;border-left:3px solid #3b82f6;border-radius:0 8px 8px 0;padding:14px 16px;font-size:13px;color:#1d4ed8;line-height:1.7;">
                ${ticket.admin_notes.replace(/\n/g, '<br>')}
              </div>
            </div>
            ` : ''}

            <!-- Attachments -->
            ${(ticket.attachments || []).length > 0 ? `
            <div style="margin-bottom:20px;">
              <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">
                Attachments (${ticket.attachments.length})
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
                <tr style="background:#f8fafc;">
                  <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">File Name</th>
                  <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">Type</th>
                </tr>
                ${attachmentRows}
              </table>
              <div style="font-size:11px;color:#94a3b8;margin-top:8px;">
                📌 Login to the developer portal to view full attachments
              </div>
            </div>
            ` : ''}

            <!-- CTA -->
            <div style="text-align:center;padding:10px 0 4px;">
              <div style="font-size:12px;color:#94a3b8;margin-bottom:14px;">
                Login to your developer portal to start working on this ticket
              </div>
              <a href="${PORTAL_URL}" style="text-decoration:none;">
                <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:10px;padding:13px 32px;display:inline-block;">
                  <span style="color:#fff;font-size:14px;font-weight:700;">Open Developer Portal →</span>
                </div>
              </a>
            </div>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 0 0;text-align:center;">
            <div style="font-size:11px;color:#94a3b8;">
              This ticket was assigned to you by the admin team at <strong>DUCH CLOTHING</strong><br>
              Powered by Atelier Technology Solutions
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
  `;

  const transporter = getTransporter();
  await transporter.sendMail({
    from,
    to: developerEmail,
    subject: `🔧 [${ticket.ticket_no}] New ${ticket.priority?.toUpperCase()} ticket assigned to you: ${ticket.title}`,
    html,
  });

  console.log(`[Ticket Email] Assignment email sent to ${developerEmail} for ${ticket.ticket_no}`);
}

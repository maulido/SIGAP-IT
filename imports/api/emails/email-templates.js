// Email templates for SIGAP-IT notifications

export const emailTemplates = {
    // Ticket Created - Notify IT Support team
    ticketCreated: (ticket, reporter) => ({
        subject: `[SIGAP-IT] New Ticket: ${ticket.ticketNumber} - ${ticket.title}`,
        text: `
A new ticket has been created in SIGAP-IT.

Ticket Number: ${ticket.ticketNumber}
Title: ${ticket.title}
Category: ${ticket.category}
Priority: ${ticket.priority}
Location: ${ticket.location}

Description:
${ticket.description}

Reported by: ${reporter.profile?.fullName || reporter.emails[0].address}
Department: ${reporter.profile?.department || 'N/A'}

Please log in to SIGAP-IT to view and assign this ticket.

---
SIGAP-IT - Sistem Informasi Gangguan & Penanganan IT
        `.trim(),
        html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .ticket-info { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .label { font-weight: bold; color: #4b5563; }
        .value { color: #1f2937; }
        .priority-high { color: #dc2626; font-weight: bold; }
        .priority-critical { color: #991b1b; font-weight: bold; }
        .footer { background: #374151; color: #9ca3af; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0;">🎫 New Ticket Created</h1>
        </div>
        <div class="content">
            <div class="ticket-info">
                <p><span class="label">Ticket Number:</span> <span class="value">${ticket.ticketNumber}</span></p>
                <p><span class="label">Title:</span> <span class="value">${ticket.title}</span></p>
                <p><span class="label">Category:</span> <span class="value">${ticket.category}</span></p>
                <p><span class="label">Priority:</span> <span class="value ${ticket.priority === 'High' || ticket.priority === 'Critical' ? 'priority-' + ticket.priority.toLowerCase() : ''}">${ticket.priority}</span></p>
                <p><span class="label">Location:</span> <span class="value">${ticket.location}</span></p>
            </div>
            <p><span class="label">Description:</span></p>
            <p style="background: white; padding: 15px; border-radius: 8px; white-space: pre-wrap;">${ticket.description}</p>
            <div class="ticket-info">
                <p><span class="label">Reported by:</span> <span class="value">${reporter.profile?.fullName || reporter.emails[0].address}</span></p>
                <p><span class="label">Department:</span> <span class="value">${reporter.profile?.department || 'N/A'}</span></p>
            </div>
            <p style="text-align: center; margin-top: 20px;">
                <a href="${Meteor.absoluteUrl()}tickets/${ticket._id}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Ticket</a>
            </p>
        </div>
        <div class="footer">
            <p>SIGAP-IT - Sistem Informasi Gangguan & Penanganan IT</p>
        </div>
    </div>
</body>
</html>
        `.trim(),
    }),

    // Ticket Assigned - Notify reporter
    ticketAssigned: (ticket, reporter, assignee) => ({
        subject: `[SIGAP-IT] Ticket ${ticket.ticketNumber} Assigned`,
        text: `
Your ticket has been assigned to an IT Support staff.

Ticket Number: ${ticket.ticketNumber}
Title: ${ticket.title}
Status: In Progress

Assigned to: ${assignee.profile?.fullName || assignee.emails[0].address}

Your issue is now being worked on. You will be notified of any updates.

---
SIGAP-IT - Sistem Informasi Gangguan & Penanganan IT
        `.trim(),
        html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .ticket-info { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .label { font-weight: bold; color: #4b5563; }
        .value { color: #1f2937; }
        .footer { background: #374151; color: #9ca3af; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0;">👤 Ticket Assigned</h1>
        </div>
        <div class="content">
            <p>Hi ${reporter.profile?.fullName || 'there'},</p>
            <p>Your ticket has been assigned to an IT Support staff and is now being worked on.</p>
            <div class="ticket-info">
                <p><span class="label">Ticket Number:</span> <span class="value">${ticket.ticketNumber}</span></p>
                <p><span class="label">Title:</span> <span class="value">${ticket.title}</span></p>
                <p><span class="label">Status:</span> <span class="value" style="color: #2563eb;">In Progress</span></p>
                <p><span class="label">Assigned to:</span> <span class="value">${assignee.profile?.fullName || assignee.emails[0].address}</span></p>
            </div>
            <p>You will be notified of any updates to your ticket.</p>
            <p style="text-align: center; margin-top: 20px;">
                <a href="${Meteor.absoluteUrl()}tickets/${ticket._id}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Ticket</a>
            </p>
        </div>
        <div class="footer">
            <p>SIGAP-IT - Sistem Informasi Gangguan & Penanganan IT</p>
        </div>
    </div>
</body>
</html>
        `.trim(),
    }),

    // Status Changed
    statusChanged: (ticket, reporter, oldStatus, newStatus, changedBy) => ({
        subject: `[SIGAP-IT] Ticket ${ticket.ticketNumber} Status Updated: ${newStatus}`,
        text: `
Your ticket status has been updated.

Ticket Number: ${ticket.ticketNumber}
Title: ${ticket.title}
Previous Status: ${oldStatus}
New Status: ${newStatus}

Updated by: ${changedBy.profile?.fullName || changedBy.emails[0].address}

---
SIGAP-IT - Sistem Informasi Gangguan & Penanganan IT
        `.trim(),
        html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .ticket-info { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .label { font-weight: bold; color: #4b5563; }
        .value { color: #1f2937; }
        .status-change { background: #dbeafe; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: center; }
        .footer { background: #374151; color: #9ca3af; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0;">🔄 Status Updated</h1>
        </div>
        <div class="content">
            <p>Hi ${reporter.profile?.fullName || 'there'},</p>
            <p>Your ticket status has been updated.</p>
            <div class="ticket-info">
                <p><span class="label">Ticket Number:</span> <span class="value">${ticket.ticketNumber}</span></p>
                <p><span class="label">Title:</span> <span class="value">${ticket.title}</span></p>
            </div>
            <div class="status-change">
                <p style="margin: 0;"><strong>${oldStatus}</strong> → <strong style="color: #2563eb;">${newStatus}</strong></p>
            </div>
            <p><span class="label">Updated by:</span> ${changedBy.profile?.fullName || changedBy.emails[0].address}</p>
            <p style="text-align: center; margin-top: 20px;">
                <a href="${Meteor.absoluteUrl()}tickets/${ticket._id}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Ticket</a>
            </p>
        </div>
        <div class="footer">
            <p>SIGAP-IT - Sistem Informasi Gangguan & Penanganan IT</p>
        </div>
    </div>
</body>
</html>
        `.trim(),
    }),

    // Comment Added
    commentAdded: (ticket, comment, commenter, recipient) => ({
        subject: `[SIGAP-IT] New Comment on Ticket ${ticket.ticketNumber}`,
        text: `
A new comment has been added to your ticket.

Ticket Number: ${ticket.ticketNumber}
Title: ${ticket.title}

Comment by: ${commenter.profile?.fullName || commenter.emails[0].address}
Comment: ${comment.comment}

---
SIGAP-IT - Sistem Informasi Gangguan & Penanganan IT
        `.trim(),
        html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .ticket-info { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .comment-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; }
        .label { font-weight: bold; color: #4b5563; }
        .value { color: #1f2937; }
        .footer { background: #374151; color: #9ca3af; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0;">💬 New Comment</h1>
        </div>
        <div class="content">
            <p>Hi ${recipient.profile?.fullName || 'there'},</p>
            <p>A new comment has been added to your ticket.</p>
            <div class="ticket-info">
                <p><span class="label">Ticket Number:</span> <span class="value">${ticket.ticketNumber}</span></p>
                <p><span class="label">Title:</span> <span class="value">${ticket.title}</span></p>
            </div>
            <div class="comment-box">
                <p><strong>${commenter.profile?.fullName || commenter.emails[0].address}</strong> commented:</p>
                <p style="white-space: pre-wrap; margin-top: 10px;">${comment.comment}</p>
            </div>
            <p style="text-align: center; margin-top: 20px;">
                <a href="${Meteor.absoluteUrl()}tickets/${ticket._id}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Ticket</a>
            </p>
        </div>
        <div class="footer">
            <p>SIGAP-IT - Sistem Informasi Gangguan & Penanganan IT</p>
        </div>
    </div>
</body>
</html>
        `.trim(),
    }),

    // Ticket Resolved
    ticketResolved: (ticket, reporter, resolver) => ({
        subject: `[SIGAP-IT] Ticket ${ticket.ticketNumber} Resolved`,
        text: `
Your ticket has been marked as resolved.

Ticket Number: ${ticket.ticketNumber}
Title: ${ticket.title}
Status: Resolved

Resolved by: ${resolver.profile?.fullName || resolver.emails[0].address}

If your issue is not fully resolved, you can reopen this ticket within the next 7 days.

Please rate your experience with our IT support service.

---
SIGAP-IT - Sistem Informasi Gangguan & Penanganan IT
        `.trim(),
        html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .ticket-info { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .label { font-weight: bold; color: #4b5563; }
        .value { color: #1f2937; }
        .success-box { background: #d1fae5; border: 1px solid #10b981; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .footer { background: #374151; color: #9ca3af; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0;">✅ Ticket Resolved</h1>
        </div>
        <div class="content">
            <p>Hi ${reporter.profile?.fullName || 'there'},</p>
            <div class="success-box">
                <p style="margin: 0; color: #065f46; font-weight: bold;">Great news! Your ticket has been resolved.</p>
            </div>
            <div class="ticket-info">
                <p><span class="label">Ticket Number:</span> <span class="value">${ticket.ticketNumber}</span></p>
                <p><span class="label">Title:</span> <span class="value">${ticket.title}</span></p>
                <p><span class="label">Status:</span> <span class="value" style="color: #10b981;">Resolved</span></p>
                <p><span class="label">Resolved by:</span> <span class="value">${resolver.profile?.fullName || resolver.emails[0].address}</span></p>
            </div>
            <p>If your issue is not fully resolved, you can reopen this ticket within the next 7 days.</p>
            <p>We'd love to hear your feedback! Please take a moment to rate your experience.</p>
            <p style="text-align: center; margin-top: 20px;">
                <a href="${Meteor.absoluteUrl()}tickets/${ticket._id}" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Ticket & Rate</a>
            </p>
        </div>
        <div class="footer">
            <p>SIGAP-IT - Sistem Informasi Gangguan & Penanganan IT</p>
        </div>
    </div>
</body>
</html>
        `.trim(),
    }),

    // SLA Warning (75% threshold)
    slaWarning: (ticket, escalation, timeRemaining) => ({
        subject: `⚠️ [SIGAP-IT] SLA Warning: ${ticket.ticketNumber} - ${escalation.percentageUsed}% Time Used`,
        text: `
SLA WARNING - Ticket approaching deadline

Ticket Number: ${ticket.ticketNumber}
Title: ${ticket.title}
Priority: ${ticket.priority}
Category: ${ticket.category}
Status: ${ticket.status}

SLA Status: ${escalation.percentageUsed}% of time used
Time Remaining: ${timeRemaining?.formatted || 'N/A'}

This ticket is approaching its SLA deadline. Please take immediate action.

---
SIGAP-IT - Sistem Informasi Gangguan & Penanganan IT
        `.trim(),
        html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .warning-box { background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 15px 0; text-align: center; }
        .ticket-info { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .label { font-weight: bold; color: #4b5563; }
        .value { color: #1f2937; }
        .sla-progress { background: #e5e7eb; height: 30px; border-radius: 15px; overflow: hidden; margin: 15px 0; }
        .sla-bar { background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%); height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; }
        .footer { background: #374151; color: #9ca3af; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0;">⚠️ SLA Warning</h1>
        </div>
        <div class="content">
            <div class="warning-box">
                <h2 style="margin: 0 0 10px 0; color: #92400e;">Ticket Approaching SLA Deadline</h2>
                <p style="margin: 0; font-size: 18px; color: #78350f;"><strong>${escalation.percentageUsed}%</strong> of SLA time used</p>
            </div>
            <div class="sla-progress">
                <div class="sla-bar" style="width: ${escalation.percentageUsed}%;">${escalation.percentageUsed}%</div>
            </div>
            <div class="ticket-info">
                <p><span class="label">Ticket Number:</span> <span class="value">${ticket.ticketNumber}</span></p>
                <p><span class="label">Title:</span> <span class="value">${ticket.title}</span></p>
                <p><span class="label">Priority:</span> <span class="value" style="color: #dc2626;">${ticket.priority}</span></p>
                <p><span class="label">Category:</span> <span class="value">${ticket.category}</span></p>
                <p><span class="label">Status:</span> <span class="value">${ticket.status}</span></p>
                <p><span class="label">Time Remaining:</span> <span class="value" style="color: #d97706; font-weight: bold;">${timeRemaining?.formatted || 'N/A'}</span></p>
            </div>
            <p style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <strong>Action Required:</strong> This ticket is approaching its SLA deadline. Please prioritize this ticket to avoid SLA violation.
            </p>
            <p style="text-align: center; margin-top: 20px;">
                <a href="${Meteor.absoluteUrl()}tickets/${ticket._id}" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">View Ticket Now</a>
            </p>
        </div>
        <div class="footer">
            <p>SIGAP-IT - Sistem Informasi Gangguan & Penanganan IT</p>
        </div>
    </div>
</body>
</html>
        `.trim(),
    }),

    // SLA Critical (90% threshold)
    slaCritical: (ticket, escalation, timeRemaining) => ({
        subject: `🚨 [SIGAP-IT] CRITICAL SLA Alert: ${ticket.ticketNumber} - ${escalation.percentageUsed}% Time Used`,
        text: `
🚨 CRITICAL SLA ALERT - Immediate Action Required

Ticket Number: ${ticket.ticketNumber}
Title: ${ticket.title}
Priority: ${ticket.priority}
Category: ${ticket.category}
Status: ${ticket.status}

SLA Status: ${escalation.percentageUsed}% of time used
Time Remaining: ${timeRemaining?.formatted || 'N/A'}

⚠️ This ticket is in CRITICAL status and requires IMMEDIATE attention to avoid SLA breach.

---
SIGAP-IT - Sistem Informasi Gangguan & Penanganan IT
        `.trim(),
        html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .critical-box { background: #fee2e2; border: 3px solid #dc2626; padding: 20px; border-radius: 8px; margin: 15px 0; text-align: center; animation: pulse 2s infinite; }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
        }
        .ticket-info { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .label { font-weight: bold; color: #4b5563; }
        .value { color: #1f2937; }
        .sla-progress { background: #e5e7eb; height: 30px; border-radius: 15px; overflow: hidden; margin: 15px 0; }
        .sla-bar { background: linear-gradient(90deg, #dc2626 0%, #991b1b 100%); height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; }
        .footer { background: #374151; color: #9ca3af; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0;">🚨 CRITICAL SLA ALERT</h1>
        </div>
        <div class="content">
            <div class="critical-box">
                <h2 style="margin: 0 0 10px 0; color: #7f1d1d;">⚠️ IMMEDIATE ACTION REQUIRED ⚠️</h2>
                <p style="margin: 0; font-size: 24px; color: #991b1b; font-weight: bold;">${escalation.percentageUsed}%</p>
                <p style="margin: 5px 0 0 0; color: #7f1d1d;">of SLA time used</p>
            </div>
            <div class="sla-progress">
                <div class="sla-bar" style="width: ${escalation.percentageUsed}%;">${escalation.percentageUsed}%</div>
            </div>
            <div class="ticket-info">
                <p><span class="label">Ticket Number:</span> <span class="value">${ticket.ticketNumber}</span></p>
                <p><span class="label">Title:</span> <span class="value">${ticket.title}</span></p>
                <p><span class="label">Priority:</span> <span class="value" style="color: #dc2626; font-weight: bold;">${ticket.priority}</span></p>
                <p><span class="label">Category:</span> <span class="value">${ticket.category}</span></p>
                <p><span class="label">Status:</span> <span class="value">${ticket.status}</span></p>
                <p><span class="label">Time Remaining:</span> <span class="value" style="color: #dc2626; font-weight: bold; font-size: 18px;">${timeRemaining?.formatted || 'N/A'}</span></p>
            </div>
            <div style="background: #fee2e2; padding: 20px; border-radius: 8px; border: 2px solid #dc2626; margin: 15px 0;">
                <p style="margin: 0 0 10px 0; font-weight: bold; color: #7f1d1d; font-size: 16px;">🚨 CRITICAL ESCALATION</p>
                <p style="margin: 0; color: #991b1b;">This ticket has reached critical SLA threshold. Immediate action is required to prevent SLA breach. All management has been notified.</p>
            </div>
            <p style="text-align: center; margin-top: 20px;">
                <a href="${Meteor.absoluteUrl()}tickets/${ticket._id}" style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">TAKE ACTION NOW</a>
            </p>
        </div>
        <div class="footer">
            <p>SIGAP-IT - Sistem Informasi Gangguan & Penanganan IT</p>
            <p style="color: #dc2626; font-weight: bold;">This is an automated critical alert</p>
        </div>
    </div>
</body>
</html>
        `.trim(),
    }),
};

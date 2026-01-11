import { Meteor } from 'meteor/meteor';
import { Email } from 'meteor/email';
import { emailTemplates } from './email-templates';
import { isEmailEnabled } from '../../../server/email-config';

// Email service for sending notifications
export const EmailService = {
    /**
     * Send email with error handling
     */
    async sendEmail({ to, subject, text, html }) {
        if (!isEmailEnabled()) {
            console.log('📧 Email not sent (email disabled):', subject);
            return false;
        }

        try {
            await Email.sendAsync({
                to,
                from: process.env.MAIL_FROM || 'SIGAP-IT <noreply@sigap-it.com>',
                subject,
                text,
                html,
            });
            console.log(`✅ Email sent to ${to}: ${subject}`);
            return true;
        } catch (error) {
            console.error('❌ Error sending email:', error);
            return false;
        }
    },

    /**
     * Send ticket created notification to IT Support team
     */
    async sendTicketCreatedEmail(ticket, reporter) {
        // Get all IT Support and Admin users
        const supportUsers = await Meteor.users.find({
            roles: { $in: ['support', 'admin'] },
            'profile.isActive': true,
        }).fetchAsync();

        const template = emailTemplates.ticketCreated(ticket, reporter);

        // Send to all support users
        for (const user of supportUsers) {
            const email = user.emails?.[0]?.address;
            if (email) {
                await this.sendEmail({
                    to: email,
                    subject: template.subject,
                    text: template.text,
                    html: template.html,
                });
            }
        }
    },

    /**
     * Send ticket assigned notification to reporter
     */
    async sendTicketAssignedEmail(ticket, reporter, assignee) {
        const reporterEmail = reporter.emails?.[0]?.address;
        if (!reporterEmail) return;

        const template = emailTemplates.ticketAssigned(ticket, reporter, assignee);

        await this.sendEmail({
            to: reporterEmail,
            subject: template.subject,
            text: template.text,
            html: template.html,
        });
    },

    /**
     * Send status changed notification
     */
    async sendStatusChangedEmail(ticket, reporter, oldStatus, newStatus, changedBy) {
        const reporterEmail = reporter.emails?.[0]?.address;
        if (!reporterEmail) return;

        const template = emailTemplates.statusChanged(ticket, reporter, oldStatus, newStatus, changedBy);

        await this.sendEmail({
            to: reporterEmail,
            subject: template.subject,
            text: template.text,
            html: template.html,
        });

        // Also notify assignee if different from reporter and changer
        if (ticket.assignedToId &&
            ticket.assignedToId !== reporter._id &&
            ticket.assignedToId !== changedBy._id) {
            const assignee = await Meteor.users.findOneAsync(ticket.assignedToId);
            const assigneeEmail = assignee?.emails?.[0]?.address;
            if (assigneeEmail) {
                await this.sendEmail({
                    to: assigneeEmail,
                    subject: template.subject,
                    text: template.text,
                    html: template.html,
                });
            }
        }
    },

    /**
     * Send comment added notification
     */
    async sendCommentAddedEmail(ticket, comment, commenter) {
        // Notify reporter if they didn't add the comment
        const reporter = await Meteor.users.findOneAsync(ticket.reporterId);
        if (reporter && reporter._id !== commenter._id) {
            const reporterEmail = reporter.emails?.[0]?.address;
            if (reporterEmail) {
                const template = emailTemplates.commentAdded(ticket, comment, commenter, reporter);
                await this.sendEmail({
                    to: reporterEmail,
                    subject: template.subject,
                    text: template.text,
                    html: template.html,
                });
            }
        }

        // Notify assignee if they didn't add the comment and are different from reporter
        if (ticket.assignedToId &&
            ticket.assignedToId !== commenter._id &&
            ticket.assignedToId !== reporter._id) {
            const assignee = await Meteor.users.findOneAsync(ticket.assignedToId);
            const assigneeEmail = assignee?.emails?.[0]?.address;
            if (assigneeEmail) {
                const template = emailTemplates.commentAdded(ticket, comment, commenter, assignee);
                await this.sendEmail({
                    to: assigneeEmail,
                    subject: template.subject,
                    text: template.text,
                    html: template.html,
                });
            }
        }
    },

    /**
     * Send ticket resolved notification to reporter
     */
    async sendTicketResolvedEmail(ticket, reporter, resolver) {
        const reporterEmail = reporter.emails?.[0]?.address;
        if (!reporterEmail) return;

        const template = emailTemplates.ticketResolved(ticket, reporter, resolver);

        await this.sendEmail({
            to: reporterEmail,
            subject: template.subject,
            text: template.text,
            html: template.html,
        });
    },

    /**
     * Send SLA Warning notification (75% threshold)
     */
    async sendSLAWarningEmail(ticket, escalation, recipientIds, timeRemaining) {
        const recipients = await Meteor.users.find({
            _id: { $in: recipientIds }
        }).fetchAsync();

        const template = emailTemplates.slaWarning(ticket, escalation, timeRemaining);

        for (const user of recipients) {
            const email = user.emails?.[0]?.address;
            if (email) {
                await this.sendEmail({
                    to: email,
                    subject: template.subject,
                    text: template.text,
                    html: template.html,
                });
            }
        }
    },

    /**
     * Send SLA Critical notification (90% threshold)
     */
    async sendSLACriticalEmail(ticket, escalation, recipientIds, timeRemaining) {
        const recipients = await Meteor.users.find({
            _id: { $in: recipientIds }
        }).fetchAsync();

        const template = emailTemplates.slaCritical(ticket, escalation, timeRemaining);

        for (const user of recipients) {
            const email = user.emails?.[0]?.address;
            if (email) {
                await this.sendEmail({
                    to: email,
                    subject: template.subject,
                    text: template.text,
                    html: template.html,
                });
            }
        }
    },
};

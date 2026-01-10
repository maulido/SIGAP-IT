import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Attachments } from './attachments';
import { Tickets } from '../tickets/tickets';
import { AuditLogs } from '../audit-logs/audit-logs';
import { Roles } from '../roles/roles';

Meteor.methods({
    async 'attachments.upload'({ ticketId, fileName, fileType, fileSize, fileData }) {
        check(ticketId, String);
        check(fileName, String);
        check(fileType, String);
        check(fileSize, Number);
        check(fileData, String); // Base64 encoded

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        const ticket = await Tickets.findOneAsync(ticketId);
        if (!ticket) {
            throw new Meteor.Error('not-found', 'Ticket not found');
        }

        // Check if user has access to this ticket
        const canUpload =
            ticket.reporterId === this.userId ||
            ticket.assignedToId === this.userId ||
            Roles.userIsInRole(this.userId, ['support', 'admin']);

        if (!canUpload) {
            throw new Meteor.Error('not-authorized', 'You cannot upload files to this ticket');
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (fileSize > maxSize) {
            throw new Meteor.Error('file-too-large', 'File size must be less than 5MB');
        }

        // Validate file type
        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
        ];

        if (!allowedTypes.includes(fileType)) {
            throw new Meteor.Error('invalid-file-type', 'File type not allowed');
        }

        const attachmentId = await Attachments.insertAsync({
            ticketId,
            fileName,
            fileType,
            fileSize,
            fileData,
            uploadedBy: this.userId,
            uploadedAt: new Date(),
        });

        // Update ticket's updatedAt
        await Tickets.updateAsync(ticketId, {
            $set: { updatedAt: new Date() },
        });

        // Log audit
        await AuditLogs.insertAsync({
            userId: this.userId,
            action: 'attachment_uploaded',
            entityType: 'ticket',
            entityId: ticketId,
            metadata: { ticketNumber: ticket.ticketNumber, fileName, fileSize },
            createdAt: new Date(),
        });

        return attachmentId;
    },

    async 'attachments.delete'(attachmentId) {
        check(attachmentId, String);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        const attachment = await Attachments.findOneAsync(attachmentId);
        if (!attachment) {
            throw new Meteor.Error('not-found', 'Attachment not found');
        }

        const ticket = await Tickets.findOneAsync(attachment.ticketId);
        if (!ticket) {
            throw new Meteor.Error('not-found', 'Ticket not found');
        }

        // Only uploader, ticket owner, or IT Support can delete
        const canDelete =
            attachment.uploadedBy === this.userId ||
            ticket.reporterId === this.userId ||
            Roles.userIsInRole(this.userId, ['support', 'admin']);

        if (!canDelete) {
            throw new Meteor.Error('not-authorized', 'You cannot delete this attachment');
        }

        await Attachments.removeAsync(attachmentId);

        // Log audit
        await AuditLogs.insertAsync({
            userId: this.userId,
            action: 'attachment_deleted',
            entityType: 'ticket',
            entityId: ticket._id,
            metadata: { ticketNumber: ticket.ticketNumber, fileName: attachment.fileName },
            createdAt: new Date(),
        });

        return true;
    },
});

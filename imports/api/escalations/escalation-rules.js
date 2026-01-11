import { Meteor } from 'meteor/meteor';

// SLA Escalation Configuration
export const ESCALATION_CONFIG = {
    WARNING_THRESHOLD: 75,    // First escalation at 75%
    CRITICAL_THRESHOLD: 90,   // Critical escalation at 90%
    CHECK_INTERVAL: 15,       // Check every 15 minutes
};

// Calculate SLA percentage used
export function calculateSLAPercentage(ticket) {
    const now = new Date();

    // Determine which deadline to use
    let deadline;
    if (!ticket.slaResponseTime && ticket.slaResponseDeadline) {
        // Still waiting for first response
        deadline = ticket.slaResponseDeadline;
    } else if (ticket.slaResolutionDeadline) {
        // Working on resolution
        deadline = ticket.slaResolutionDeadline;
    } else {
        return 0; // No SLA deadline set
    }

    const createdAt = ticket.createdAt;
    const totalTime = deadline - createdAt;

    // Calculate paused duration
    let pausedDuration = ticket.slaPausedDuration || 0;
    if (ticket.status === 'Pending' && ticket.slaPausedAt) {
        // Currently paused, add current pause time
        const currentPause = (now - ticket.slaPausedAt) / (1000 * 60 * 60); // hours
        pausedDuration += currentPause;
    }

    // Calculate elapsed time (excluding paused time)
    const elapsedTime = now - createdAt;
    const pausedMs = pausedDuration * 60 * 60 * 1000;
    const activeTime = elapsedTime - pausedMs;

    // Calculate percentage
    const percentage = (activeTime / totalTime) * 100;

    return Math.min(Math.max(percentage, 0), 100); // Clamp between 0-100
}

// Determine if ticket should be escalated
export function shouldEscalate(ticket, existingEscalations = []) {
    // Don't escalate resolved/closed tickets
    if (['Resolved', 'Closed'].includes(ticket.status)) {
        return { shouldEscalate: false };
    }

    const percentage = calculateSLAPercentage(ticket);

    // Check if already escalated at this level
    const hasWarningEscalation = existingEscalations.some(e => e.escalationLevel === 1);
    const hasCriticalEscalation = existingEscalations.some(e => e.escalationLevel === 2);

    // Critical escalation (90%)
    if (percentage >= ESCALATION_CONFIG.CRITICAL_THRESHOLD && !hasCriticalEscalation) {
        return {
            shouldEscalate: true,
            level: 2,
            percentage: Math.round(percentage)
        };
    }

    // Warning escalation (75%)
    if (percentage >= ESCALATION_CONFIG.WARNING_THRESHOLD && !hasWarningEscalation) {
        return {
            shouldEscalate: true,
            level: 1,
            percentage: Math.round(percentage)
        };
    }

    return { shouldEscalate: false };
}

// Get users to notify based on escalation level
export async function getNotificationRecipients(ticket, level) {
    const recipients = [];

    if (level === 1) {
        // Level 1 (75%): Assigned IT Support + All Admins
        if (ticket.assignedToId) {
            recipients.push(ticket.assignedToId);
        }

        // Get all admins
        const admins = await Meteor.users.find({
            roles: 'admin',
            'profile.isActive': true
        }).fetchAsync();

        admins.forEach(admin => {
            if (!recipients.includes(admin._id)) {
                recipients.push(admin._id);
            }
        });
    } else if (level === 2) {
        // Level 2 (90%): All Admins + All Support
        const adminAndSupport = await Meteor.users.find({
            roles: { $in: ['admin', 'support'] },
            'profile.isActive': true
        }).fetchAsync();

        adminAndSupport.forEach(user => {
            if (!recipients.includes(user._id)) {
                recipients.push(user._id);
            }
        });
    }

    return recipients;
}

// Get escalation level name
export function getEscalationLevelName(level) {
    return level === 1 ? 'Warning' : 'Critical';
}

// Get time remaining until deadline
export function getTimeRemaining(ticket) {
    const now = new Date();
    let deadline;

    if (!ticket.slaResponseTime && ticket.slaResponseDeadline) {
        deadline = ticket.slaResponseDeadline;
    } else if (ticket.slaResolutionDeadline) {
        deadline = ticket.slaResolutionDeadline;
    } else {
        return null;
    }

    const remaining = deadline - now;
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    return {
        hours,
        minutes,
        isOverdue: remaining < 0,
        formatted: remaining < 0
            ? `Overdue by ${Math.abs(hours)}h ${Math.abs(minutes)}m`
            : `${hours}h ${minutes}m remaining`
    };
}

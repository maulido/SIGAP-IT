import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Escalations } from './escalations';
import { Tickets } from '../tickets/tickets';

Meteor.methods({
    async 'escalations.getByTicket'(ticketId) {
        check(ticketId, String);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        return await Escalations.find(
            { ticketId },
            { sort: { escalatedAt: -1 } }
        ).fetchAsync();
    },

    async 'escalations.getAll'(filters = {}) {
        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        // Only admins and support can view all escalations
        const user = await Meteor.users.findOneAsync(this.userId);
        if (!user?.roles?.includes('admin') && !user?.roles?.includes('support')) {
            throw new Meteor.Error('not-authorized', 'Only admins and support can view escalations');
        }

        const query = {};

        if (filters.escalationLevel) {
            query.escalationLevel = filters.escalationLevel;
        }

        if (filters.acknowledged === true || filters.acknowledged === false) {
            query.acknowledged = filters.acknowledged;
        }

        if (filters.startDate && filters.endDate) {
            query.escalatedAt = {
                $gte: new Date(filters.startDate),
                $lte: new Date(filters.endDate)
            };
        }

        return await Escalations.find(query, {
            sort: { escalatedAt: -1 },
            limit: filters.limit || 100
        }).fetchAsync();
    },

    async 'escalations.acknowledge'(escalationId) {
        check(escalationId, String);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        const user = await Meteor.users.findOneAsync(this.userId);
        if (!user?.roles?.includes('admin') && !user?.roles?.includes('support')) {
            throw new Meteor.Error('not-authorized', 'Only admins and support can acknowledge escalations');
        }

        const escalation = await Escalations.findOneAsync(escalationId);
        if (!escalation) {
            throw new Meteor.Error('not-found', 'Escalation not found');
        }

        if (escalation.acknowledged) {
            throw new Meteor.Error('already-acknowledged', 'Escalation already acknowledged');
        }

        await Escalations.updateAsync(escalationId, {
            $set: {
                acknowledged: true,
                acknowledgedBy: this.userId,
                acknowledgedAt: new Date()
            }
        });

        return true;
    },

    async 'escalations.getStats'() {
        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        const user = await Meteor.users.findOneAsync(this.userId);
        if (!user?.roles?.includes('admin') && !user?.roles?.includes('support')) {
            throw new Meteor.Error('not-authorized');
        }

        const totalEscalations = await Escalations.find({}).countAsync();
        const warningCount = await Escalations.find({ escalationLevel: 1 }).countAsync();
        const criticalCount = await Escalations.find({ escalationLevel: 2 }).countAsync();
        const unacknowledged = await Escalations.find({ acknowledged: false }).countAsync();

        // Get recent escalations (last 24 hours)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const recentCount = await Escalations.find({
            escalatedAt: { $gte: yesterday }
        }).countAsync();

        return {
            total: totalEscalations,
            warning: warningCount,
            critical: criticalCount,
            unacknowledged,
            recent24h: recentCount
        };
    },

    async 'escalations.getCriticalTickets'() {
        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        const user = await Meteor.users.findOneAsync(this.userId);
        if (!user?.roles?.includes('admin') && !user?.roles?.includes('support')) {
            throw new Meteor.Error('not-authorized');
        }

        // Get all critical (level 2) escalations that are not acknowledged
        const criticalEscalations = await Escalations.find({
            escalationLevel: 2,
            acknowledged: false
        }, {
            sort: { escalatedAt: -1 },
            limit: 10
        }).fetchAsync();

        // Fetch ticket details
        const ticketIds = criticalEscalations.map(e => e.ticketId);
        const tickets = await Tickets.find({
            _id: { $in: ticketIds }
        }).fetchAsync();

        // Combine escalation and ticket data
        return criticalEscalations.map(escalation => {
            const ticket = tickets.find(t => t._id === escalation.ticketId);
            return {
                ...escalation,
                ticket
            };
        });
    }
});

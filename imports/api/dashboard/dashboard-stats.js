import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Tickets } from '../tickets/tickets';
import { Roles } from '../roles/roles';

Meteor.methods({
    /**
     * Get ticket trends over time
     */
    async 'dashboard.ticketTrends'({ days = 30 }) {
        check(days, Number);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Get tickets created in the last N days
        const tickets = await Tickets.find({
            createdAt: { $gte: startDate },
        }, {
            fields: { createdAt: 1, status: 1 },
            sort: { createdAt: 1 },
        }).fetchAsync();

        // Group by date
        const trendData = {};
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - (days - i - 1));
            const dateKey = date.toISOString().split('T')[0];
            trendData[dateKey] = { created: 0, resolved: 0 };
        }

        tickets.forEach(ticket => {
            const dateKey = ticket.createdAt.toISOString().split('T')[0];
            if (trendData[dateKey]) {
                trendData[dateKey].created++;
            }
        });

        // Get resolved tickets
        const resolvedTickets = await Tickets.find({
            resolvedAt: { $gte: startDate },
        }, {
            fields: { resolvedAt: 1 },
        }).fetchAsync();

        resolvedTickets.forEach(ticket => {
            const dateKey = ticket.resolvedAt.toISOString().split('T')[0];
            if (trendData[dateKey]) {
                trendData[dateKey].resolved++;
            }
        });

        return Object.entries(trendData).map(([date, counts]) => ({
            date,
            created: counts.created,
            resolved: counts.resolved,
        }));
    },

    /**
     * Get SLA compliance statistics
     */
    async 'dashboard.slaCompliance'() {
        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        if (!Roles.userIsInRole(this.userId, ['support', 'admin'])) {
            throw new Meteor.Error('not-authorized', 'Only IT Support can view SLA stats');
        }

        const totalResolved = await Tickets.find({
            status: { $in: ['Resolved', 'Closed'] },
            slaResolutionMet: { $exists: true },
        }).countAsync();

        const slaMet = await Tickets.find({
            status: { $in: ['Resolved', 'Closed'] },
            slaResolutionMet: true,
        }).countAsync();

        const slaBreached = totalResolved - slaMet;

        return {
            met: slaMet,
            breached: slaBreached,
            total: totalResolved,
            percentage: totalResolved > 0 ? ((slaMet / totalResolved) * 100).toFixed(1) : 0,
        };
    },

    /**
     * Get category distribution
     */
    async 'dashboard.categoryDistribution'() {
        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        const categories = ['Hardware', 'Software', 'Network', 'Email', 'Printer', 'Other'];
        const distribution = [];

        for (const category of categories) {
            const count = await Tickets.find({ category }).countAsync();
            distribution.push({ category, count });
        }

        return distribution;
    },

    /**
     * Get priority breakdown
     */
    async 'dashboard.priorityBreakdown'() {
        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        const priorities = ['Low', 'Medium', 'High', 'Critical'];
        const breakdown = [];

        for (const priority of priorities) {
            const count = await Tickets.find({ priority }).countAsync();
            breakdown.push({ priority, count });
        }

        return breakdown;
    },

    /**
     * Get status distribution
     */
    async 'dashboard.statusDistribution'() {
        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        const statuses = ['Open', 'In Progress', 'Pending', 'Resolved', 'Closed', 'Rejected'];
        const distribution = [];

        for (const status of statuses) {
            const count = await Tickets.find({ status }).countAsync();
            distribution.push({ status, count });
        }

        return distribution;
    },

    /**
     * Get performance stats by IT Support
     */
    async 'dashboard.supportPerformance'() {
        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        if (!Roles.userIsInRole(this.userId, ['admin'])) {
            throw new Meteor.Error('not-authorized', 'Only admins can view performance stats');
        }

        // Get all support users
        const supportUsers = await Meteor.users.find({
            roles: { $in: ['support', 'admin'] },
            'profile.isActive': true,
        }).fetchAsync();

        const performance = [];

        for (const user of supportUsers) {
            const assigned = await Tickets.find({
                assignedToId: user._id,
            }).countAsync();

            const resolved = await Tickets.find({
                assignedToId: user._id,
                status: { $in: ['Resolved', 'Closed'] },
            }).countAsync();

            const active = await Tickets.find({
                assignedToId: user._id,
                status: 'In Progress',
            }).countAsync();

            performance.push({
                userId: user._id,
                name: user.profile?.fullName || user.emails[0].address,
                assigned,
                resolved,
                active,
            });
        }

        return performance;
    },
});

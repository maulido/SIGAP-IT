import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Tickets } from '../tickets/tickets';
import { Roles } from '../roles/roles';

Meteor.methods({
    /**
     * Get comprehensive ticket statistics for reports
     */
    async 'reports.getTicketStats'({ startDate, endDate, filters = {} }) {
        check(startDate, Date);
        check(endDate, Date);
        check(filters, Match.Optional(Object));

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        if (!(await Roles.userIsInRoleAsync(this.userId, ['support', 'admin']))) {
            throw new Meteor.Error('not-authorized', 'Only IT Support can view reports');
        }

        // Build query
        const query = {
            createdAt: { $gte: startDate, $lte: endDate },
        };

        if (filters.status && filters.status !== 'All') {
            query.status = filters.status;
        }
        if (filters.category && filters.category !== 'All') {
            query.category = filters.category;
        }
        if (filters.priority && filters.priority !== 'All') {
            query.priority = filters.priority;
        }
        if (filters.assignedTo && filters.assignedTo !== 'All') {
            query.assignedToId = filters.assignedTo;
        }

        // Get all tickets matching criteria
        const tickets = await Tickets.find(query).fetchAsync();
        const totalTickets = tickets.length;

        // Calculate statistics
        const resolvedTickets = tickets.filter(t => ['Resolved', 'Closed'].includes(t.status));
        const resolvedCount = resolvedTickets.length;
        const resolvedPercentage = totalTickets > 0 ? ((resolvedCount / totalTickets) * 100).toFixed(1) : 0;

        // SLA compliance
        const ticketsWithSLA = resolvedTickets.filter(t => t.slaResolutionMet !== undefined);
        const slaMetCount = ticketsWithSLA.filter(t => t.slaResolutionMet === true).length;
        const slaPercentage = ticketsWithSLA.length > 0 ? ((slaMetCount / ticketsWithSLA.length) * 100).toFixed(1) : 0;

        // Average resolution time (in hours)
        let totalResolutionTime = 0;
        let resolutionCount = 0;
        resolvedTickets.forEach(ticket => {
            if (ticket.resolvedAt && ticket.createdAt) {
                const resolutionTime = (ticket.resolvedAt - ticket.createdAt) / (1000 * 60 * 60); // hours
                totalResolutionTime += resolutionTime;
                resolutionCount++;
            }
        });
        const avgResolutionTime = resolutionCount > 0 ? (totalResolutionTime / resolutionCount).toFixed(1) : 0;

        // Status breakdown
        const statusBreakdown = {};
        tickets.forEach(ticket => {
            statusBreakdown[ticket.status] = (statusBreakdown[ticket.status] || 0) + 1;
        });

        // Category breakdown
        const categoryBreakdown = {};
        tickets.forEach(ticket => {
            categoryBreakdown[ticket.category] = (categoryBreakdown[ticket.category] || 0) + 1;
        });

        // Priority breakdown
        const priorityBreakdown = {};
        tickets.forEach(ticket => {
            priorityBreakdown[ticket.priority] = (priorityBreakdown[ticket.priority] || 0) + 1;
        });

        return {
            totalTickets,
            resolvedCount,
            resolvedPercentage: parseFloat(resolvedPercentage),
            slaMetCount,
            slaPercentage: parseFloat(slaPercentage),
            avgResolutionTime: parseFloat(avgResolutionTime),
            statusBreakdown,
            categoryBreakdown,
            priorityBreakdown,
        };
    },

    /**
     * Get IT Support performance metrics
     */
    async 'reports.getPerformanceMetrics'({ startDate, endDate }) {
        check(startDate, Date);
        check(endDate, Date);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        if (!(await Roles.userIsInRoleAsync(this.userId, ['support', 'admin']))) {
            throw new Meteor.Error('not-authorized', 'Only IT Support can view performance metrics');
        }

        // Get all support users
        const supportUsers = await Meteor.users.find({
            roles: { $in: ['support', 'admin'] },
            'profile.isActive': true,
        }).fetchAsync();

        const performance = [];

        for (const user of supportUsers) {
            // Tickets assigned in date range
            const assigned = await Tickets.find({
                assignedToId: user._id,
                assignedAt: { $gte: startDate, $lte: endDate },
            }).countAsync();

            // Tickets resolved in date range
            const resolved = await Tickets.find({
                assignedToId: user._id,
                resolvedAt: { $gte: startDate, $lte: endDate },
                status: { $in: ['Resolved', 'Closed'] },
            }).countAsync();

            // Currently active tickets
            const active = await Tickets.find({
                assignedToId: user._id,
                status: 'In Progress',
            }).countAsync();

            // Calculate average resolution time
            const resolvedTickets = await Tickets.find({
                assignedToId: user._id,
                resolvedAt: { $gte: startDate, $lte: endDate },
                status: { $in: ['Resolved', 'Closed'] },
            }).fetchAsync();

            let totalResolutionTime = 0;
            resolvedTickets.forEach(ticket => {
                if (ticket.resolvedAt && ticket.assignedAt) {
                    const resolutionTime = (ticket.resolvedAt - ticket.assignedAt) / (1000 * 60 * 60); // hours
                    totalResolutionTime += resolutionTime;
                }
            });
            const avgResolutionTime = resolved > 0 ? (totalResolutionTime / resolved).toFixed(1) : 0;

            // SLA compliance
            const ticketsWithSLA = resolvedTickets.filter(t => t.slaResolutionMet !== undefined);
            const slaMetCount = ticketsWithSLA.filter(t => t.slaResolutionMet === true).length;
            const slaPercentage = ticketsWithSLA.length > 0 ? ((slaMetCount / ticketsWithSLA.length) * 100).toFixed(1) : 0;

            performance.push({
                userId: user._id,
                name: user.profile?.fullName || user.emails[0].address,
                email: user.emails[0].address,
                assigned,
                resolved,
                active,
                avgResolutionTime: parseFloat(avgResolutionTime),
                slaPercentage: parseFloat(slaPercentage),
            });
        }

        // Sort by resolved count (descending)
        performance.sort((a, b) => b.resolved - a.resolved);

        return performance;
    },

    /**
     * Get SLA compliance report over time
     */
    async 'reports.getSLAReport'({ startDate, endDate }) {
        check(startDate, Date);
        check(endDate, Date);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        if (!(await Roles.userIsInRoleAsync(this.userId, ['support', 'admin']))) {
            throw new Meteor.Error('not-authorized', 'Only IT Support can view SLA reports');
        }

        // Get all resolved tickets in date range
        const tickets = await Tickets.find({
            resolvedAt: { $gte: startDate, $lte: endDate },
            status: { $in: ['Resolved', 'Closed'] },
            slaResolutionMet: { $exists: true },
        }).fetchAsync();

        // Group by date
        const slaByDate = {};
        tickets.forEach(ticket => {
            const dateKey = ticket.resolvedAt.toISOString().split('T')[0];
            if (!slaByDate[dateKey]) {
                slaByDate[dateKey] = { met: 0, breached: 0 };
            }
            if (ticket.slaResolutionMet) {
                slaByDate[dateKey].met++;
            } else {
                slaByDate[dateKey].breached++;
            }
        });

        // Convert to array
        const slaOverTime = Object.entries(slaByDate).map(([date, counts]) => ({
            date,
            met: counts.met,
            breached: counts.breached,
            total: counts.met + counts.breached,
            percentage: ((counts.met / (counts.met + counts.breached)) * 100).toFixed(1),
        }));

        // Sort by date
        slaOverTime.sort((a, b) => new Date(a.date) - new Date(b.date));

        // SLA by priority
        const slaByPriority = {};
        tickets.forEach(ticket => {
            if (!slaByPriority[ticket.priority]) {
                slaByPriority[ticket.priority] = { met: 0, breached: 0 };
            }
            if (ticket.slaResolutionMet) {
                slaByPriority[ticket.priority].met++;
            } else {
                slaByPriority[ticket.priority].breached++;
            }
        });

        // SLA by category
        const slaByCategory = {};
        tickets.forEach(ticket => {
            if (!slaByCategory[ticket.category]) {
                slaByCategory[ticket.category] = { met: 0, breached: 0 };
            }
            if (ticket.slaResolutionMet) {
                slaByCategory[ticket.category].met++;
            } else {
                slaByCategory[ticket.category].breached++;
            }
        });

        return {
            slaOverTime,
            slaByPriority,
            slaByCategory,
        };
    },

    /**
     * Get filtered tickets for detailed report
     */
    async 'reports.getFilteredTickets'({ startDate, endDate, filters = {}, limit = 100, skip = 0 }) {
        check(startDate, Date);
        check(endDate, Date);
        check(filters, Match.Optional(Object));
        check(limit, Number);
        check(skip, Number);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        if (!(await Roles.userIsInRoleAsync(this.userId, ['support', 'admin']))) {
            throw new Meteor.Error('not-authorized', 'Only IT Support can view filtered tickets');
        }

        // Build query
        const query = {
            createdAt: { $gte: startDate, $lte: endDate },
        };

        if (filters.status && filters.status !== 'All') {
            query.status = filters.status;
        }
        if (filters.category && filters.category !== 'All') {
            query.category = filters.category;
        }
        if (filters.priority && filters.priority !== 'All') {
            query.priority = filters.priority;
        }
        if (filters.assignedTo && filters.assignedTo !== 'All') {
            query.assignedToId = filters.assignedTo;
        }

        // Get tickets with pagination
        const tickets = await Tickets.find(query, {
            sort: { createdAt: -1 },
            limit,
            skip,
        }).fetchAsync();

        const total = await Tickets.find(query).countAsync();

        // Populate user names
        const ticketsWithUsers = await Promise.all(tickets.map(async (ticket) => {
            const reporter = await Meteor.users.findOneAsync(ticket.reporterId);
            const assignedTo = ticket.assignedToId ? await Meteor.users.findOneAsync(ticket.assignedToId) : null;

            return {
                ...ticket,
                reporterName: reporter?.profile?.fullName || reporter?.emails[0]?.address || 'Unknown',
                assignedToName: assignedTo?.profile?.fullName || assignedTo?.emails[0]?.address || 'Unassigned',
            };
        }));

        return {
            tickets: ticketsWithUsers,
            total,
            hasMore: (skip + limit) < total,
        };
    },
});

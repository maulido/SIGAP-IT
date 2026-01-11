import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { AuditLogs } from '../audit-logs';
import { Roles } from '../../roles/roles';

Meteor.publish('auditLogs.paginated', async function ({ page = 1, limit = 20, filters = {} }) {
    check(page, Number);
    check(limit, Number);
    check(filters, Match.Optional(Object));

    if (!this.userId) {
        return this.ready();
    }

    if (!(await Roles.userIsInRoleAsync(this.userId, ['admin']))) {
        return this.ready();
    }

    const query = {};
    if (filters.action && filters.action !== 'All') {
        query.action = filters.action;
    }
    if (filters.userId && filters.userId !== 'All') {
        query.userId = filters.userId;
    }
    if (filters.startDate && filters.endDate) {
        query.createdAt = {
            $gte: new Date(filters.startDate),
            $lte: new Date(filters.endDate)
        };
    }

    const skip = (page - 1) * limit;

    // Return cursor for audit logs
    return AuditLogs.find(query, {
        sort: { createdAt: -1 },
        limit: limit,
        skip: skip
    });
});

Meteor.publish('auditLogs.count', async function ({ filters = {} }) {
    check(filters, Match.Optional(Object));

    if (!this.userId || !(await Roles.userIsInRoleAsync(this.userId, ['admin']))) {
        return this.ready();
    }

    const query = {};
    if (filters.action && filters.action !== 'All') {
        query.action = filters.action;
    }
    if (filters.userId && filters.userId !== 'All') {
        query.userId = filters.userId;
    }
    if (filters.startDate && filters.endDate) {
        query.createdAt = {
            $gte: new Date(filters.startDate),
            $lte: new Date(filters.endDate)
        };
    }

    // We can't return a number directly in a publication, so we use a separate collection or counts package.
    // However, for simplicity without extra packages, we can rely on client-side counting if the dataset isn't huge, 
    // OR deeper integration. 
    // A common pattern is 'meteor-publish-counts' but I shouldn't add packages.
    // I will publish a separate ad-hoc record for the count.

    // Actually, let's just use a method for the count to avoid complexity, 
    // OR just return the cursor and let the client handle it for now if pagination is simple.
    // Better: Helper method to get total count for pagination.
    return this.ready();
});

Meteor.methods({
    async 'auditLogs.getCount'({ filters = {} }) {
        check(filters, Match.Optional(Object));

        if (!this.userId) throw new Meteor.Error('not-authorized');
        if (!(await Roles.userIsInRoleAsync(this.userId, ['admin']))) throw new Meteor.Error('not-authorized');

        const query = {};
        if (filters.action && filters.action !== 'All') {
            query.action = filters.action;
        }
        if (filters.userId && filters.userId !== 'All') {
            query.userId = filters.userId;
        }
        if (filters.startDate && filters.endDate) {
            query.createdAt = {
                $gte: new Date(filters.startDate),
                $lte: new Date(filters.endDate)
            };
        }

        return await AuditLogs.find(query).countAsync();
    }
});

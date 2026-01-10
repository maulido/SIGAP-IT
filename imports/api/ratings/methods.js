import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Ratings } from './ratings';
import { Tickets } from '../tickets/tickets';

Meteor.methods({
    async 'ratings.submit'({ ticketId, rating, feedback }) {
        check(ticketId, String);
        check(rating, Number);
        check(feedback, Match.Maybe(String));

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        // Validate rating range
        if (rating < 1 || rating > 5) {
            throw new Meteor.Error('invalid-rating', 'Rating must be between 1 and 5');
        }

        const ticket = await Tickets.findOneAsync(ticketId);
        if (!ticket) {
            throw new Meteor.Error('not-found', 'Ticket not found');
        }

        // Only ticket reporter can rate
        if (ticket.reporterId !== this.userId) {
            throw new Meteor.Error('not-authorized', 'Only ticket reporter can rate');
        }

        // Can only rate Resolved or Closed tickets
        if (!['Resolved', 'Closed'].includes(ticket.status)) {
            throw new Meteor.Error('invalid-status', 'Can only rate resolved or closed tickets');
        }

        // Check if already rated
        const existingRating = await Ratings.findOneAsync({ ticketId });
        if (existingRating) {
            throw new Meteor.Error('already-rated', 'You have already rated this ticket');
        }

        // Calculate resolution time
        const resolutionTime = ticket.resolvedAt
            ? (ticket.resolvedAt - ticket.createdAt) / (1000 * 60 * 60) // hours
            : null;

        const ratingId = await Ratings.insertAsync({
            ticketId,
            ticketNumber: ticket.ticketNumber,
            rating,
            feedback: feedback || '',
            ratedBy: this.userId,
            ratedAt: new Date(),
            resolvedBy: ticket.assignedToId,
            category: ticket.category,
            priority: ticket.priority,
            resolutionTime,
        });

        // Update ticket with rating flag
        await Tickets.updateAsync(ticketId, {
            $set: {
                hasRating: true,
                ratingValue: rating,
                updatedAt: new Date(),
            },
        });

        return { ratingId };
    },

    async 'ratings.getByTicket'(ticketId) {
        check(ticketId, String);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        return await Ratings.findOneAsync({ ticketId });
    },

    async 'ratings.getStats'() {
        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        // Only admins and support can view stats
        const user = await Meteor.users.findOneAsync(this.userId);
        if (!user?.roles?.includes('admin') && !user?.roles?.includes('support')) {
            throw new Meteor.Error('not-authorized', 'Only admins and support can view rating stats');
        }

        const allRatings = await Ratings.find({}).fetchAsync();

        if (allRatings.length === 0) {
            return {
                totalRatings: 0,
                averageRating: 0,
                ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                byCategory: {},
                byPriority: {},
                recentRatings: [],
            };
        }

        // Calculate stats
        const totalRatings = allRatings.length;
        const averageRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings;

        const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        allRatings.forEach(r => {
            ratingDistribution[r.rating]++;
        });

        // Group by category
        const byCategory = {};
        allRatings.forEach(r => {
            if (!byCategory[r.category]) {
                byCategory[r.category] = { total: 0, sum: 0, count: 0 };
            }
            byCategory[r.category].sum += r.rating;
            byCategory[r.category].count++;
            byCategory[r.category].total = byCategory[r.category].sum / byCategory[r.category].count;
        });

        // Group by priority
        const byPriority = {};
        allRatings.forEach(r => {
            if (!byPriority[r.priority]) {
                byPriority[r.priority] = { total: 0, sum: 0, count: 0 };
            }
            byPriority[r.priority].sum += r.rating;
            byPriority[r.priority].count++;
            byPriority[r.priority].total = byPriority[r.priority].sum / byPriority[r.priority].count;
        });

        // Recent ratings (last 10)
        const recentRatings = await Ratings.find({}, {
            sort: { ratedAt: -1 },
            limit: 10
        }).fetchAsync();

        return {
            totalRatings,
            averageRating: Math.round(averageRating * 10) / 10,
            ratingDistribution,
            byCategory,
            byPriority,
            recentRatings,
        };
    },
});

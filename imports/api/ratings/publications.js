import { Meteor } from 'meteor/meteor';
import { Ratings } from './ratings';

Meteor.publish('ratings.byTicket', function (ticketId) {
    if (!this.userId) {
        return this.ready();
    }

    return Ratings.find({ ticketId });
});

Meteor.publish('ratings.all', function () {
    if (!this.userId) {
        return this.ready();
    }

    // Only admins and support can see all ratings
    const user = Meteor.users.findOne(this.userId);
    if (!user?.roles?.includes('admin') && !user?.roles?.includes('support')) {
        return this.ready();
    }

    return Ratings.find({}, { sort: { ratedAt: -1 } });
});

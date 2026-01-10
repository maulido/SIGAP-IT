import { Meteor } from 'meteor/meteor';
import { KBArticles } from './kb-articles';

// All published articles
Meteor.publish('kb.published', function (filters = {}) {
    if (!this.userId) {
        return this.ready();
    }

    const query = { isPublished: true };

    if (filters.category) {
        query.category = filters.category;
    }

    return KBArticles.find(query, {
        sort: { createdAt: -1 },
        limit: 50,
    });
});

// Single article
Meteor.publish('kb.byId', function (articleId) {
    if (!this.userId) {
        return this.ready();
    }

    return KBArticles.find(articleId);
});

// All articles (support/admin only)
Meteor.publish('kb.all', function () {
    if (!this.userId) {
        return this.ready();
    }

    const user = Meteor.users.findOne(this.userId);
    const userRoles = user?.roles || [];

    if (!userRoles.includes('support') && !userRoles.includes('admin')) {
        return this.ready();
    }

    return KBArticles.find({}, { sort: { createdAt: -1 } });
});

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { KBArticles } from './kb-articles';
import { Roles } from '../roles/roles';

Meteor.methods({
    async 'kb.create'({ title, content, category, tags = [], keywords = [] }) {
        check(title, String);
        check(content, String);
        check(category, String);
        check(tags, [String]);
        check(keywords, [String]);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        // Get current user to check roles
        const currentUser = await Meteor.users.findOneAsync(this.userId);
        if (!currentUser) {
            throw new Meteor.Error('user-not-found');
        }

        const isSupport = currentUser.roles && (currentUser.roles.includes('support') || currentUser.roles.includes('admin'));
        if (!isSupport) {
            throw new Meteor.Error('not-authorized', 'Only IT Support can create KB articles');
        }

        if (title.length < 5) {
            throw new Meteor.Error('validation-error', 'Title must be at least 5 characters');
        }

        if (content.length < 20) {
            throw new Meteor.Error('validation-error', 'Content must be at least 20 characters');
        }

        const articleId = await KBArticles.insertAsync({
            title,
            content,
            category,
            tags,
            keywords,
            viewCount: 0,
            helpfulCount: 0,
            notHelpfulCount: 0,
            isPublished: false,
            createdBy: this.userId,
            updatedBy: this.userId,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return { articleId };
    },

    async 'kb.update'({ articleId, title, content, category, tags, keywords, isPublished }) {
        check(articleId, String);
        check(title, String);
        check(content, String);
        check(category, String);
        check(tags, [String]);
        check(keywords, [String]);
        check(isPublished, Boolean);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        // Get current user to check roles
        const currentUser = await Meteor.users.findOneAsync(this.userId);
        if (!currentUser) {
            throw new Meteor.Error('user-not-found');
        }

        const isSupport = currentUser.roles && (currentUser.roles.includes('support') || currentUser.roles.includes('admin'));
        if (!isSupport) {
            throw new Meteor.Error('not-authorized', 'Only IT Support can update KB articles');
        }

        const article = await KBArticles.findOneAsync(articleId);
        if (!article) {
            throw new Meteor.Error('not-found', 'Article not found');
        }

        await KBArticles.updateAsync(articleId, {
            $set: {
                title,
                content,
                category,
                tags,
                keywords,
                isPublished,
                updatedBy: this.userId,
                updatedAt: new Date(),
            },
        });

        return true;
    },

    async 'kb.delete'(articleId) {
        check(articleId, String);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        // Get current user to check roles
        const currentUser = await Meteor.users.findOneAsync(this.userId);
        if (!currentUser) {
            throw new Meteor.Error('user-not-found');
        }

        const isAdmin = currentUser.roles && currentUser.roles.includes('admin');
        if (!isAdmin) {
            throw new Meteor.Error('not-authorized', 'Only admins can delete KB articles');
        }

        await KBArticles.removeAsync(articleId);
        return true;
    },

    async 'kb.search'({ query, category, limit = 10 }) {
        check(query, String);
        check(category, Match.Maybe(String));
        check(limit, Number);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        const searchQuery = {
            isPublished: true,
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { content: { $regex: query, $options: 'i' } },
                { keywords: { $in: [new RegExp(query, 'i')] } },
            ],
        };

        if (category) {
            searchQuery.category = category;
        }

        const articles = await KBArticles.find(searchQuery, {
            limit,
            sort: { viewCount: -1, createdAt: -1 },
        }).fetchAsync();

        return articles;
    },

    async 'kb.getRecommendations'({ title, description, category }) {
        check(title, String);
        check(description, Match.Maybe(String));
        check(category, String);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        // Search based on title and category
        const searchTerms = title.split(' ').filter(word => word.length > 3);

        if (searchTerms.length === 0) {
            return [];
        }

        const searchQuery = {
            isPublished: true,
            category,
            $or: searchTerms.map(term => ({
                $or: [
                    { title: { $regex: term, $options: 'i' } },
                    { keywords: { $in: [new RegExp(term, 'i')] } },
                ],
            })),
        };

        const recommendations = await KBArticles.find(searchQuery, {
            limit: 5,
            sort: { viewCount: -1, helpfulCount: -1 },
        }).fetchAsync();

        return recommendations;
    },

    async 'kb.markHelpful'(articleId) {
        check(articleId, String);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        await KBArticles.updateAsync(articleId, {
            $inc: { helpfulCount: 1 },
        });

        return true;
    },

    async 'kb.markNotHelpful'(articleId) {
        check(articleId, String);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        await KBArticles.updateAsync(articleId, {
            $inc: { notHelpfulCount: 1 },
        });

        return true;
    },

    async 'kb.incrementView'(articleId) {
        check(articleId, String);

        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        await KBArticles.updateAsync(articleId, {
            $inc: { viewCount: 1 },
        });

        return true;
    },
});


// Publish tickets by Asset ID
Meteor.publish('tickets.byAsset', function (assetId) {
    check(assetId, String);
    if (!this.userId) return this.ready();

    if (Roles.userIsInRole(this.userId, ['support', 'admin'])) {
        return Tickets.find({ assetId: assetId }, { sort: { createdAt: -1 } });
    }
    return this.ready();
});

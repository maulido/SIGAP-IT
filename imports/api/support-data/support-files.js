import { FilesCollection } from 'meteor/ostrio:files';
import { Meteor } from 'meteor/meteor';

export const SupportFiles = new FilesCollection({
    collectionName: 'SupportFiles',
    allowClientCode: false, // Disallow remove() from client
    onBeforeUpload(file) {
        // Allow upload files under 50MB, and only for logged in users
        if (file.size <= 52428800 && this.userId) {
            return true;
        }
        return 'Please upload file, with size equal or less than 50MB';
    },
    storagePath: Meteor.isDevelopment ? 'assets/app/uploads/support-files' : '/data/uploads/support-files',
    downloadCallback(fileObj) {
        if (this.params.query.download == 'true') {
            // Increment downloads counter
            SupportFiles.update(fileObj._id, { $inc: { 'meta.downloads': 1 } });
        }
        // Must return true to continue download
        return true;
    }
});

if (Meteor.isServer) {
    SupportFiles.allow({
        insert: function () {
            return true;
        },
        update: function () {
            return true;
        },
        remove: function () {
            return true;
        }
    });

    Meteor.publish('files.supportFiles.all', function () {
        if (!this.userId) return this.ready();
        return SupportFiles.find().cursor;
    });
}

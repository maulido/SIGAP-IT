import { Meteor } from 'meteor/meteor';
import { SupportData } from '/imports/api/support-data/support-data';
import { Encryption } from '/imports/api/support-data/server/encryption';

console.log('--- DEBUG SCRIPT LOADED (SERVER) ---');

Meteor.methods({
    async 'debug.verifySupportData'() {
        if (Meteor.isClient) return;

        console.log('--- STARTING METHOD VERIFICATION ---');
        const results = [];

        try {
            // 1. Mock Context (simulate a logged-in admin user)
            // We need a user ID that definitely exists and is admin
            const admin = await Meteor.users.findOneAsync({ 'emails.address': 'admin@sigap-it.com' });
            if (!admin) {
                throw new Error('Admin user not found for context simulation');
            }
            results.push(`Found admin user: ${admin._id}`);

            // 2. Prepare Payload
            const payload = {
                title: 'Method Test Item',
                type: 'credential',
                category: 'Debug',
                data: {
                    username: 'method_user',
                    password: 'MethodPassword123'
                },
                meta: {
                    expiryDate: new Date()
                }
            };

            // 3. Call the Method Directly (Server to Server)
            // We use JS "apply" or direct call pattern if possible, or Meteor.callAsync
            // Since we need 'this.userId', we can't easily use Meteor.callAsync without login.
            // But we can invoke the internal method handler if we access valid context.
            // Easier way: Use DDP or runAsUser? older meteor had runAsUser.
            // Alternative: We temporarily allow "system" bypass or just check the logic.

            // Let's try calling the handler function directly, binding `this` context.
            const methodHandler = Meteor.server.method_handlers['supportData.create'];
            if (!methodHandler) {
                throw new Error('Method supportData.create not found');
            }

            const mockContext = {
                userId: admin._id,
                unblock: () => { }
            };

            console.log('Invoking supportData.create handler...');
            const docId = await methodHandler.call(mockContext, payload);

            results.push(`Method execution successful. Doc ID: ${docId}`);

            // 4. Verify Data Integrity
            const doc = await SupportData.findOneAsync(docId);
            if (!doc) throw new Error('Document was returned but not found in DB');

            // Check Encryption
            const decrypted = Encryption.decrypt(doc.data.password);
            if (decrypted === 'MethodPassword123') {
                results.push('Password correctly encrypted by method.');
            } else {
                results.push(`Password encryption FAIL. Got: ${decrypted}`);
            }

            // 5. Cleanup
            await SupportData.removeAsync(docId);
            results.push('Cleanup successful.');

            return { success: true, logs: results };

        } catch (error) {
            console.error('VERIFICATION FAILED:', error);
            // Return error as result so user sees it in console
            return {
                success: false,
                error: error.message,
                stack: error.stack,
                logs: results
            };
        }
    }
});

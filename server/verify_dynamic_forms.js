
import { Meteor } from 'meteor/meteor';
import { Tickets } from '../imports/api/tickets/tickets';
import { CategoryConfigs } from '../imports/api/category-configs/category-configs';
import fs from 'fs';
import path from 'path';

Meteor.startup(async () => {
    // Only run if specific flag or check logic
    // We'll run this once for verification.

    console.log('🧪 Starting Dynamic Forms Verification...');
    const result = {
        success: false,
        steps: [],
        timestamp: new Date()
    };

    try {
        // 1. Ensure Hardware config exists
        const hwConfig = await CategoryConfigs.findOneAsync({ category: 'Hardware' });
        if (!hwConfig) {
            throw new Error('Hardware config not found');
        }
        result.steps.push({ name: 'Check Config', status: 'Passed', details: 'Hardware config exists' });

        // 2. Mock User Context for Method Call (simulated)
        // We can't easily fake 'this.userId' in a direct method call unless we use a test helper or specific pattern.
        // Instead, we will directly call Tickets.insertAsync to simulate the service layer logic,
        // OR we can find a user and use `Meteor.server.method_handlers['tickets.create'].apply({ userId: ... })`

        const testUser = await Meteor.users.findOneAsync({});
        if (!testUser) {
            throw new Error('No test user found');
        }

        const ticketData = {
            title: 'Test Dynamic Form Ticket',
            description: 'Testing metadata persistence',
            category: 'Hardware',
            priority: 'Medium',
            location: 'Test Lab',
            metadata: {
                assetId: 'TEST-ASSET-001',
                deviceType: 'Laptop',
                model: 'X1 Carbon'
            }
        };

        // Simulate Method Call
        const method = Meteor.server.method_handlers['tickets.create'];
        // Mocking 'this' context
        const context = { userId: testUser._id };

        // Execute
        const response = await method.apply(context, [ticketData]);
        const ticketId = response.ticketId;
        result.steps.push({ name: 'Create Ticket', status: 'Passed', details: `Ticket created with ID: ${ticketId}` });

        // 3. Verify Metadata Persistence
        const createdTicket = await Tickets.findOneAsync(ticketId);

        if (!createdTicket.metadata) {
            throw new Error('Metadata field is missing');
        }

        if (createdTicket.metadata.assetId !== 'TEST-ASSET-001') {
            throw new Error(`Metadata mismatch. Expected TEST-ASSET-001, got ${createdTicket.metadata.assetId}`);
        }

        result.steps.push({ name: 'Verify Metadata', status: 'Passed', details: 'Metadata matches input' });
        result.success = true;

    } catch (error) {
        console.error('Verification Failed:', error);
        result.error = error.message;
        result.steps.push({ name: 'Error', status: 'Failed', details: error.message });
    } finally {
        // Write results
        // Use a safe path relative to the project root, assuming we are running from project root effectively or PWD is set
        const outputPath = path.resolve('dynamic_forms_verification.json');

        console.log(`📝 Writing verification results to: ${outputPath}`);
        try {
            fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
            console.log('✅ Verification results written.');
        } catch (filesErr) {
            console.error('Failed to write output file:', filesErr);
        }
    }
});

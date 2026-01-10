import { Meteor } from 'meteor/meteor';
import { Tickets } from '../../imports/api/tickets/tickets';

const checkPendingTickets = async () => {
    try {
        console.log('Running checkPendingTickets cron job...');
        const twentyFourHoursAgo = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);

        const tickets = await Tickets.find({
            status: 'Pending',
            pendingStartedAt: { $lt: twentyFourHoursAgo },
        }).fetchAsync();

        if (tickets.length > 0) {
            console.log(`Found ${tickets.length} pending tickets older than 24 hours:`);
            tickets.forEach(ticket => {
                console.log(`- Ticket ID: ${ticket._id}, Number: ${ticket.ticketNumber}, Pending Reason: ${ticket.pendingReason}, Started At: ${ticket.pendingStartedAt}`);
                // In a real implementation, we would send a notification here.
                // For KF-17, just simulating with console.log.
            });
        } else {
            console.log('No pending tickets older than 24 hours found.');
        }
    } catch (error) {
        console.error('Error in checkPendingTickets:', error);
    }
};

// Export the function so it can be used/tested if needed
export { checkPendingTickets };

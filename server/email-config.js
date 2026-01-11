import { Meteor } from 'meteor/meteor';

// Email configuration
Meteor.startup(() => {
    // Configure email from environment variable or use default
    // For development, you can use services like Mailtrap, Ethereal, or Gmail

    // Example configurations:

    // Gmail (for production, use App Password, not regular password)
    // process.env.MAIL_URL = 'smtp://your-email@gmail.com:your-app-password@smtp.gmail.com:587';

    // Mailtrap (for testing)
    // process.env.MAIL_URL = 'smtp://username:password@smtp.mailtrap.io:2525';

    // Use environment variable if set
    if (process.env.MAIL_URL) {
        console.log('✅ Email configured from MAIL_URL environment variable');
    } else {
        console.log('⚠️  MAIL_URL not set. Email notifications will not be sent.');
        console.log('   Set MAIL_URL environment variable to enable email notifications.');
        console.log('   Example: MAIL_URL=smtp://username:password@smtp.gmail.com:587');
    }

    // Note: We're using custom EmailService instead of Accounts.emailTemplates
    // If you need to configure Accounts email templates, uncomment below:
    // import { Accounts } from 'meteor/accounts-base';
    // Accounts.emailTemplates.from = process.env.MAIL_FROM || 'SIGAP-IT <noreply@sigap-it.com>';
    // Accounts.emailTemplates.siteName = 'SIGAP-IT';
});

// Check if email is enabled
export const isEmailEnabled = () => {
    return !!process.env.MAIL_URL && process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'false';
};

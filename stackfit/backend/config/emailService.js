const nodemailer = require('nodemailer');

// Create a dummy transporter that only logs messages
const transporter = {
    verify: function(callback) {
        console.log('Email service disabled - running in log-only mode');
        callback(null, true);
    },
    sendMail: function(mailOptions) {
        console.log('Email would be sent:', {
            to: mailOptions.to,
            subject: mailOptions.subject,
            text: 'Email content omitted from logs'
        });
        return Promise.resolve({ messageId: 'dummy-message-id-' + Date.now() });
    }
};

/**
 * Send a subscription renewal notification email
 * @param {Object} member - Member object with name, email
 * @param {String} endDate - Subscription end date
 * @param {Number} daysUntilRenewal - Days until subscription expires
 * @returns {Promise} - Email sending result
 */
const sendRenewalNotification = async (member, endDate, daysUntilRenewal) => {
    try {
        // Format the date for display
        const formattedDate = new Date(endDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        console.log(`Would send renewal notification to ${member.name} (${member.email}): Membership expires in ${daysUntilRenewal} days on ${formattedDate}`);
        
        // Use the dummy transporter
        const info = await transporter.sendMail({
            to: member.email,
            subject: `Your Gym Membership Expires in ${daysUntilRenewal} Days`
        });
        
        console.log('Renewal notification logged:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error logging renewal notification:', error);
        throw error;
    }
};

/**
 * Send an overdue payment notification email
 * @param {Object} member - Member object with name, email
 * @param {String} endDate - Subscription end date that has passed
 * @param {Number} daysOverdue - Days since subscription expired
 * @returns {Promise} - Email sending result
 */
const sendOverdueNotification = async (member, endDate, daysOverdue) => {
    try {
        // Format the date for display
        const formattedDate = new Date(endDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        console.log(`Would send overdue notification to ${member.name} (${member.email}): Membership expired ${daysOverdue} days ago on ${formattedDate}`);
        
        // Use the dummy transporter
        const info = await transporter.sendMail({
            to: member.email,
            subject: `Your Gym Membership Has Expired`
        });
        
        console.log('Overdue notification logged:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error logging overdue notification:', error);
        throw error;
    }
};

module.exports = {
    sendRenewalNotification,
    sendOverdueNotification
}; 
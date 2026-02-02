// utils/mailService.ts

export const mailService = {
    /**
     * Triggers the broadcast email notification via internal API
     */
    async sendBroadcastNotification(emails: string[], taskTitle: string) {
        return this.sendNotification(emails, taskTitle, 'broadcast');
    },

    /**
     * Triggers a direct assignment notification
     */
    async sendAssignmentNotification(emails: string[], taskTitle: string) {
        return this.sendNotification(emails, taskTitle, 'assignment');
    },

    /**
     * Internal helper to trigger mail API
     */
    async sendNotification(emails: string[], taskTitle: string, type: 'broadcast' | 'assignment') {
        if (!emails || emails.length === 0) return;

        console.log(`[mailService] Dispatching ${type} notification to ${emails.length} recipients for: ${taskTitle}`);

        try {
            const response = await fetch('/api/send-broadcast-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    emails,
                    taskTitle,
                    type
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Notification API failure');
            }

            return true;
        } catch (error) {
            console.error('[mailService] Failed to trigger email notification:', error);
            throw error;
        }
    }
};

// utils/mailService.ts

export const mailService = {
    /**
     * Triggers the broadcast email notification via internal API
     */
    async sendBroadcastNotification(emails: string[], taskTitle: string) {
        if (!emails || emails.length === 0) return;

        console.log(`[mailService] Sending broadcast to ${emails.length} recipients for: ${taskTitle}`);

        try {
            const response = await fetch('/api/send-broadcast-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    emails,
                    taskTitle,
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Notification API failure');
            }

            console.log('[mailService] Broadcast trigger successful');
            return true;
        } catch (error) {
            console.error('[mailService] Failed to trigger email notification:', error);
            throw error;
        }
    }
};

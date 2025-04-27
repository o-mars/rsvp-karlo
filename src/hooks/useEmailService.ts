import { render } from '@react-email/render';
import { RSVPKarloInviteEmail } from '@/src/emails/rsvp-invite';

interface SendInviteEmailProps {
  eventName: string;
  eCardImage: string;
  buttonStyle?: {
    backgroundColor?: string;
    textColor?: string;
  };
  guestIds: string[];
}

export function useEmailService() {
  const sendInviteEmail = async ({
    eventName,
    buttonStyle,
    guestIds,
  }: SendInviteEmailProps) => {
    try {
      const emailHtml = await render(
        RSVPKarloInviteEmail({
          eventName,
          buttonStyle,
        })
      );

      const response = await fetch(process.env.NEXT_PUBLIC_EMAIL_SERVICE_URL + '/send-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template: {
            html: emailHtml,
            subject: `You're invited to ${eventName}`,
          },
          guestIds,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      return response.json();
    } catch (error) {
      console.error('Error in email process:', error);
      throw error;
    }
  };

  const sendBulkInviteEmails = sendInviteEmail; // Alias for consistency

  return {
    sendInviteEmail,
    sendBulkInviteEmails,
  };
} 
import { render } from '@react-email/render';
import { RSVPKarloInviteEmail } from '@/src/emails/rsvp-invite';

interface SendInviteEmailProps {
  guestName: string;
  eventName: string;
  loginCode: string;
  eCardUrl: string;
  buttonStyle?: {
    backgroundColor?: string;
    textColor?: string;
  };
}

export function useEmailService() {
  const sendInviteEmail = async ({
    guestName,
    eventName,
    loginCode,
    eCardUrl,
    buttonStyle,
  }: SendInviteEmailProps) => {
    try {
      // Render the email template to HTML
      const emailHtml = await render(
        RSVPKarloInviteEmail({
          guestName,
          eventName,
          loginCode,
          eCardUrl,
          buttonStyle,
        })
      );

      // Send to your email service
      const response = await fetch(process.env.NEXT_PUBLIC_EMAIL_SERVICE_URL + '/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html: emailHtml,
          subject: `You're invited to ${eventName}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      return response.json();
    } catch (error) {
      console.error('Error sending invite email:', error);
      throw error;
    }
  };

  const sendBulkInviteEmails = async (emails: SendInviteEmailProps[]) => {
    try {
      const emailPromises = emails.map(email => sendInviteEmail(email));
      return Promise.all(emailPromises);
    } catch (error) {
      console.error('Error sending bulk invite emails:', error);
      throw error;
    }
  };

  return {
    sendInviteEmail,
    sendBulkInviteEmails,
  };
} 
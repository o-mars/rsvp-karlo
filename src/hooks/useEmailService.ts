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
    eCardImage,
    buttonStyle,
    guestIds,
  }: SendInviteEmailProps) => {
    try {
      // Convert the image to base64 using the API route
      const response = await fetch('/api/process-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imagePath: eCardImage }),
      });

      if (!response.ok) {
        throw new Error('Failed to process image');
      }

      const { base64Image } = await response.json();

      // Render the email template to HTML
      const emailHtml = await render(
        RSVPKarloInviteEmail({
          eventName,
          eCardImage: base64Image,
          buttonStyle,
        })
      );

      // Send to your email service
      const emailResponse = await fetch(process.env.NEXT_PUBLIC_EMAIL_SERVICE_URL + '/send-emails', {
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

      if (!emailResponse.ok) {
        throw new Error('Failed to send email');
      }

      return emailResponse.json();
    } catch (error) {
      console.error('Error sending invite email:', error);
      throw error;
    }
  };

  const sendBulkInviteEmails = sendInviteEmail; // Alias for consistency

  return {
    sendInviteEmail,
    sendBulkInviteEmails,
  };
} 
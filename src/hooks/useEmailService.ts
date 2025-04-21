import { render } from '@react-email/render';
import { RSVPKarloInviteEmail } from '@/src/emails/rsvp-invite';
import { getOptimizedBase64Image } from '@/src/utils/image';

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
      // Convert the image to base64 using the client-side utility
      const base64Image = await getOptimizedBase64Image(eCardImage);

      // Render the email template to HTML
      const emailHtml = await render(
        RSVPKarloInviteEmail({
          eventName,
          eCardImage: base64Image,
          buttonStyle,
        })
      );

      // Send to your email service
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
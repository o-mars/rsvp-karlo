import { Resend } from 'resend';
import { db } from '../utils/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  token: string;
  rsvps: Record<string, string>;
}

interface Event {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
}

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

async function sendInvites() {
  // Get all guests and events from Firestore
  const [guestsSnapshot, eventsSnapshot] = await Promise.all([
    getDocs(collection(db, 'guests')),
    getDocs(collection(db, 'events'))
  ]);

  const events = eventsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Event[];

  const guests = guestsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      token: data.token,
      rsvps: data.rsvps || {}
    } as Guest;
  });

  // Send emails to guests with email addresses
  for (const guest of guests) {
    if (guest.email) {
      try {
        // Get the events this guest is invited to
        const invitedEvents = events.filter(event => guest.rsvps[event.id] !== undefined);
        
        if (invitedEvents.length === 0) {
          console.log(`Skipping ${guest.email} - no events invited to`);
          continue;
        }

        const eventList = invitedEvents.map(event => `
          <li>
            <strong>${event.name}</strong><br>
            ${event.date} at ${event.time}<br>
            ${event.location}
          </li>
        `).join('');

        await resend.emails.send({
          from: 'invites@yourdomain.com',
          to: guest.email,
          subject: 'You\'re Invited!',
          html: `
            <p>Hi ${guest.firstName} ${guest.lastName},</p>
            <p>You're invited to our events! Please RSVP using the link below:</p>
            <ul>
              ${eventList}
            </ul>
            <p><a href="https://yourdomain.com/rsvp/${guest.token}">Click here to RSVP</a></p>
            <p>Best regards,<br>The Event Team</p>
          `
        });
        console.log(`Sent invite to ${guest.email}`);
      } catch (error) {
        console.error(`Failed to send invite to ${guest.email}:`, error);
      }
    }
  }
}

sendInvites().catch(console.error);

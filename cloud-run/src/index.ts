import * as dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { Resend } from 'resend';
import * as admin from 'firebase-admin';

// Load environment variables from .env file
dotenv.config();

// Verify API key is loaded
const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  throw new Error('RESEND_API_KEY environment variable is not set');
}

// Initialize Firebase Admin with service account credentials
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccount) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set');
}

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(serviceAccount))
});

// Initialize Resend
const resend = new Resend(apiKey);

// Configure CORS
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'https://rsvpkarlo.com',
      'https://api.rsvpkarlo.com',
      'https://rsvp-karlo-45828692892.us-central1.run.app'
    ];
    
    console.log('Received request from origin:', origin);
    console.log('Allowed origins:', allowedOrigins);
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Type definitions
interface Event {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
}

interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  rsvps: Record<string, string>;
}

interface SendEmailsRequest {
  guestIds: string[];
}

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Handle preflight requests
app.options('*', cors(corsOptions));

// Email sending endpoint
app.post('/send-emails', async (req, res) => {
  try {
    const { guestIds } = req.body as SendEmailsRequest;

    if (!guestIds || !Array.isArray(guestIds) || guestIds.length === 0) {
      return res.status(400).json({ error: 'No guest IDs provided' });
    }

    // Get all events for the email content
    const eventsSnapshot = await admin.firestore().collection('events').get();
    const events = eventsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Event[];

    // Get the selected guests
    const selectedGuests: Guest[] = [];
    for (const guestId of guestIds) {
      const guestDoc = await admin.firestore().collection('guests').doc(guestId).get();
      if (guestDoc.exists) {
        selectedGuests.push({ id: guestId, ...guestDoc.data() } as Guest);
      }
    }

    // Send emails to each selected guest
    for (const guest of selectedGuests) {
      if (!guest.email) continue;

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
        from: 'invite@rsvpkarlo.com',
        to: guest.email,
        subject: 'You\'re Invited!',
        html: `
          <p>Hi ${guest.firstName} ${guest.lastName},</p>
          <p>You're invited to our events! Please RSVP using the link below:</p>
          <ul>
            ${eventList}
          </ul>
          <p><a href="https://rsvpkarlo.com/rsvp?token=${guest.id}">Click here to RSVP</a></p>
          <p>Best regards,<br>The Event Team</p>
        `
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending emails:', error);
    res.status(500).json({ error: 'Failed to send emails' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 
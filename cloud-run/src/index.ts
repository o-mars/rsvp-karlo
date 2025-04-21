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

interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  rsvps: Record<string, string>;
}

interface SendEmailsRequest {
  template: {
    html: string;
    subject: string;
  };
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
    const { template, guestIds } = req.body as SendEmailsRequest;

    if (!template || !guestIds || !Array.isArray(guestIds) || guestIds.length === 0) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

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

      // Replace placeholders in the template with guest-specific data
      const personalizedHtml = template.html
        .replace('{{firstName}}', guest.firstName)
        .replace('{{lastName}}', guest.lastName)
        .replace('{{loginCode}}', guest.id);

      await resend.emails.send({
        from: 'invite@rsvpkarlo.com',
        to: guest.email,
        subject: template.subject,
        html: personalizedHtml
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
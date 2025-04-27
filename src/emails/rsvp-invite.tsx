import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
  Button,
} from '@react-email/components';

// Color constants that match your globals.css
const COLORS = {
  blossomPinkPrimary: '#ec4899',
  blossomTextLight: '#4b5563',
  blossomTextDark: '#171717',
  white: '#ffffff',
} as const;

interface RSVPKarloInviteEmailProps {
  occasionName: string;
  hosts: string[];
  buttonStyle?: {
    backgroundColor?: string;
    textColor?: string;
  };
}

const defaultButtonStyle = {
  backgroundColor: COLORS.blossomPinkPrimary,
  textColor: COLORS.white,
};

export const RSVPKarloInviteEmail = ({
  occasionName,
  hosts,
  buttonStyle = defaultButtonStyle,
}: RSVPKarloInviteEmailProps) => {
  const getHostText = () => {
    if (hosts.length === 1) {
      return `${hosts[0]} is`;
    }
    return `${hosts.join(' and ')} are`;
  };

  return (
    <Html>
      <Head />
      <Preview>You&apos;re invited to {occasionName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={contentSection}>
            <Heading style={headerText}>
              <a href="https://rsvpkarlo.com" style={{ textDecoration: 'none', color: 'inherit' }}>
                RSVP <span style={{ color: COLORS.blossomPinkPrimary }}>Karlo</span>
              </a>
            </Heading>
            <Heading style={h1}>Dear __GUEST_NAMES__,</Heading>
            <Text style={text}>
              {getHostText()} delighted to invite you to {occasionName}. Please RSVP using the button below.
            </Text>
            
            <Section style={buttonSection}>
              <Button
                href={`https://rsvpkarlo.com/rsvp/?c=__LOGIN_CODE__`}
                style={{
                  ...button,
                  backgroundColor: buttonStyle.backgroundColor,
                  color: buttonStyle.textColor,
                }}
              >
                RSVP Now
              </Button>
            </Section>
          </Section>

          <Section style={contentSection}>
            <Section style={codeSection}>
              <Text style={text}>
                Or visit <a href="https://rsvpkarlo.com/rsvp/" style={link}>https://rsvpkarlo.com/rsvp/</a> and enter this RSVP code:
              </Text>
              <code style={code}>__LOGIN_CODE__</code>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default RSVPKarloInviteEmail;

const main = {
  backgroundColor: '#ffffff',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
};

const container = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '20px',
};

const contentSection = {
  padding: '0 20px',
  marginBottom: '16px',
};

const headerText = {
  color: COLORS.blossomTextDark,
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0 0 20px 0',
  padding: '0',
  textAlign: 'center' as const,
};

const h1 = {
  color: COLORS.blossomTextDark,
  fontSize: '20px',
  fontWeight: '500',
  margin: '0 0 20px 0',
  padding: '0',
};

const text = {
  color: COLORS.blossomTextDark,
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 20px 0',
};

const buttonSection = {
  margin: '12px 0',
  textAlign: 'center' as const,
};

const button = {
  borderRadius: '4px',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
  margin: '0 auto',
};

const codeSection = {
  backgroundColor: '#f4f4f4',
  borderRadius: '4px',
  padding: '20px',
  margin: '16px 0',
};

const code = {
  display: 'block',
  padding: '12px',
  backgroundColor: '#fff',
  borderRadius: '4px',
  color: '#333',
  fontSize: '16px',
  textAlign: 'center' as const,
  margin: '12px 0 0 0',
  border: '1px solid #ddd',
};

const link = {
  color: COLORS.blossomPinkPrimary,
  textDecoration: 'underline',
};

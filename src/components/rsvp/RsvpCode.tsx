import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/src/components/ui/input';

interface RsvpCodeProps {
  onCodeSubmit: (code: string) => void;
}

export function RsvpCode({ onCodeSubmit }: RsvpCodeProps) {
  const searchParams = useSearchParams();
  const [inputToken, setInputToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTokenSubmit = useCallback(async (submittedToken: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Clean the token using URL parsing to properly handle any query parameters
      let cleanToken = submittedToken;
      
      try {
        // Check if the token is actually a URL with query parameters
        if (submittedToken.includes('?')) {
          // Create a URL object or parse as URL search params
          const params = new URLSearchParams(
            submittedToken.includes('://') 
              ? new URL(submittedToken).search
              : submittedToken.split('?')[1]
          );
          // Get the c parameter value
          const paramToken = params.get('c');
          if (paramToken) {
            cleanToken = paramToken;
          }
        }
        
        console.log('[RSVP] Clean token:', cleanToken);
      } catch (err) {
        console.error('[RSVP] Error parsing token URL:', err);
        // Fall back to the submitted token if parsing fails
      }
      
      onCodeSubmit(cleanToken);
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Error checking token:', err);
    } finally {
      setLoading(false);
    }
  }, [onCodeSubmit]);

  useEffect(() => {
    const urlToken = searchParams.get('c');
    if (urlToken) {
      handleTokenSubmit(urlToken);
    }
  }, [searchParams, handleTokenSubmit]);

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedValue = e.clipboardData.getData('text');
    setInputToken(pastedValue);
    handleTokenSubmit(pastedValue);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <p className="text-gray-600 text-center mb-8">
          Please enter your RSVP code from your invitation
        </p>

        <div className="space-y-4">
          <Input
            type="text"
            value={inputToken}
            onChange={(e) => setInputToken(e.target.value)}
            onPaste={handlePaste}
            placeholder="Enter your RSVP code"
            className="text-gray-900 placeholder-gray-400 bg-white border-pink-300 focus-visible:ring-[var(--blossom-pink-primary)] focus-visible:ring-1 focus-visible:ring-offset-0"
          />

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
        </div>

        <button
          onClick={() => handleTokenSubmit(inputToken)}
          disabled={loading || !inputToken}
          className={`w-full py-3 px-4 rounded-lg text-white font-medium mt-4 ${
            loading || !inputToken
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-pink-500 hover:bg-pink-600'
          }`}
        >
          {loading ? 'Checking...' : 'Continue'}
        </button>

        <p className="mt-6 text-sm text-gray-500 text-center">
          Having trouble? Contact the host directly
        </p>
      </div>
    </div>
  );
} 
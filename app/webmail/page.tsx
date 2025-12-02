'use client';

import { useEffect } from 'react';

export default function WebmailRedirect() {
  useEffect(() => {
    // Redirect to webmail
    // Common webmail URLs for cPanel hosting:
    // - https://mail.mimecode.com
    // - https://mimecode.com:2096 (cPanel webmail port)
    // - https://webmail.mimecode.com
    
    // Using the cPanel webmail port (most common)
    window.location.href = 'https://mimecode.com:2096';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <h1 className="text-xl font-semibold text-gray-700">Redirecting to Webmail...</h1>
        <p className="text-gray-500 mt-2">Please wait...</p>
        <p className="text-sm text-gray-400 mt-4">
          If you are not redirected automatically, 
          <a href="https://mimecode.com:2096" className="text-orange-500 hover:underline ml-1">
            click here
          </a>
        </p>
      </div>
    </div>
  );
}


import { redirect } from 'next/navigation';

// Webmail URL - Change this to your actual webmail URL
const WEBMAIL_URL = 'https://mimecode.com:2083';

export default function WebmailRedirect() {
  // Server-side redirect
  redirect(WEBMAIL_URL);
}


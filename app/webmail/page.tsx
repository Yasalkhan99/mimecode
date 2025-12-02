import { redirect } from 'next/navigation';

// Webmail URL - Change this to your actual webmail URL
const WEBMAIL_URL = 'https://mimecode.com:2096';

export default function WebmailRedirect() {
  // Server-side redirect
  redirect(WEBMAIL_URL);
}


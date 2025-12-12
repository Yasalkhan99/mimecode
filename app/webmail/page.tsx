import { redirect } from 'next/navigation';

// Webmail URL - Change this to your actual webmail URL
const WEBMAIL_URL = 'https://cpanel1.hostingwinds.online:2096';

export default function WebmailRedirect() {
  // Server-side redirect
  redirect(WEBMAIL_URL);
}


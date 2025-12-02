import { getEmailSettingsServer } from '../lib/services/emailService.server';

async function checkEmailSettings() {
  console.log('🔍 Checking Email Settings...\n');
  
  try {
    const emailSettings = await getEmailSettingsServer();
    
    console.log('📧 Current Email Settings:');
    console.log('==========================');
    console.log('Email 1:', emailSettings?.email1 || '(empty)');
    console.log('Email 2:', emailSettings?.email2 || '(empty)');
    console.log('Email 3:', emailSettings?.email3 || '(empty)');
    console.log('Email 4:', emailSettings?.email4 || '(empty)');
    console.log('Email 5:', emailSettings?.email5 || '(empty)');
    console.log('Email 6:', emailSettings?.email6 || '(empty)');
    console.log('==========================\n');
    
    // Collect non-empty emails
    const recipientEmails = [
      emailSettings?.email1,
      emailSettings?.email2,
      emailSettings?.email3,
      emailSettings?.email4,
      emailSettings?.email5,
      emailSettings?.email6,
    ].filter(e => e && e.trim() !== '');
    
    console.log('✅ Active Email Addresses:', recipientEmails.length);
    console.log('Recipients:', recipientEmails);
    console.log('\n📤 Emails will be sent to:');
    recipientEmails.forEach((email, index) => {
      console.log(`   ${index + 1}. ${email}`);
    });
    
    if (recipientEmails.length === 0) {
      console.log('\n⚠️  WARNING: No email addresses configured!');
      console.log('   Please add email addresses in the admin panel: /admin/email');
    }
    
  } catch (error) {
    console.error('❌ Error checking email settings:', error);
  }
}

checkEmailSettings();


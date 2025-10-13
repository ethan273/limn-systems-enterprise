/**
 * Test Google Chat Integration
 *
 * Sends a test notification to verify the webhook is configured correctly
 */

import { sendNotification } from '../src/lib/api-management/notifications';

async function testGoogleChat() {
  console.log('🧪 Testing Google Chat integration...\n');

  try {
    // Test notification
    await sendNotification({
      eventType: 'health_failure',
      severity: 'error',
      title: 'Test Notification',
      message: 'This is a test notification from the API Management System. If you see this in Google Chat, the integration is working correctly!',
      credentialName: 'Test Credential',
      metadata: {
        test: true,
        timestamp: new Date().toISOString(),
      },
    });

    console.log('✅ Test notification sent successfully!');
    console.log('\n📱 Check your Google Chat space for the message.');
    console.log('   Expected space: AAQADPf0sjk\n');
  } catch (error) {
    console.error('❌ Failed to send test notification:', error);
    process.exit(1);
  }
}

testGoogleChat();

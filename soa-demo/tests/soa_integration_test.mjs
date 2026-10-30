/**
 * MediMind SOA Demonstration End-to-End Integration Test Suite.
 * Validates Kafka event publishing/consumption, Eureka service registration,
 * discovery, and health endpoints according to Section 9 requirements.
 */

const EUREKA_URL = process.env.EUREKA_SERVER_URL || 'http://127.0.0.1:8761';
const GATEWAY_URL = process.env.SOA_GATEWAY_URL || 'http://127.0.0.1:5050';
const AI_CONSUMER_URL = process.env.PREDICTION_CONSUMER_URL || 'http://127.0.0.1:8001';
const NOTIFICATION_CONSUMER_URL = process.env.NOTIFICATION_CONSUMER_URL || 'http://127.0.0.1:8002';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTestSuite() {
  console.log('='.repeat(75));
  console.log('  MediMind SOA Demonstration - Automated Integration Test Suite');
  console.log('='.repeat(75));

  let passedTests = 0;
  let totalTests = 11; // Tests 1 to 11 (Test 12 is existing test suites)

  // 1. Verify Eureka Server is up
  try {
    const res = await fetch(`${EUREKA_URL}/eureka/apps`, {
      headers: { Accept: 'application/json' },
    });
    if (res.status === 200) {
      console.log('✔ [1/11] Netflix Eureka Server is RUNNING on port 8761.');
      passedTests++;
    } else {
      throw new Error(`Eureka returned HTTP ${res.status}`);
    }
  } catch (err) {
    console.error('✖ [1/11] Eureka Server check failed:', err.message);
  }

  // 2. Verify API Gateway Health & Kafka connectivity
  try {
    const res = await fetch(`${GATEWAY_URL}/api/soa/status`);
    const data = await res.json();
    if (res.status === 200 && data.kafka?.connected) {
      console.log(`✔ [2/11] API Gateway is UP and Kafka Producer connected to ${data.kafka.brokers.join(', ')}.`);
      passedTests++;
    } else {
      throw new Error(`Gateway status: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    console.error('✖ [2/11] API Gateway check failed:', err.message);
  }

  // 3. Verify API Gateway is registered with Eureka
  try {
    const res = await fetch(`${EUREKA_URL}/eureka/apps/MEDIMIND-API`, {
      headers: { Accept: 'application/json' },
    });
    if (res.status === 200) {
      console.log('✔ [3/11] API Gateway registered with Eureka as MEDIMIND-API.');
      passedTests++;
    } else {
      throw new Error(`MEDIMIND-API not found in Eureka (HTTP ${res.status})`);
    }
  } catch (err) {
    console.error('✖ [3/11] API Gateway Eureka registration check failed:', err.message);
  }

  // 4. Verify AI Consumer Health & Eureka registration
  try {
    const healthRes = await fetch(`${AI_CONSUMER_URL}/health`);
    const healthData = await healthRes.json();
    const eurekaRes = await fetch(`${EUREKA_URL}/eureka/apps/MEDIMIND-AI-CONSUMER`, {
      headers: { Accept: 'application/json' },
    });
    if (healthRes.status === 200 && eurekaRes.status === 200) {
      console.log('✔ [4/11] AI Prediction Consumer is UP and registered with Eureka as MEDIMIND-AI-CONSUMER.');
      passedTests++;
    } else {
      throw new Error(`Health: ${healthRes.status}, Eureka: ${eurekaRes.status}`);
    }
  } catch (err) {
    console.error('✖ [4/11] AI Prediction Consumer check failed:', err.message);
  }

  // 5. Verify Notification Consumer Health & Eureka registration
  try {
    const healthRes = await fetch(`${NOTIFICATION_CONSUMER_URL}/health`);
    const healthData = await healthRes.json();
    const eurekaRes = await fetch(`${EUREKA_URL}/eureka/apps/MEDIMIND-NOTIFICATION-CONSUMER`, {
      headers: { Accept: 'application/json' },
    });
    if (healthRes.status === 200 && eurekaRes.status === 200) {
      console.log('✔ [5/11] Notification Consumer is UP and registered with Eureka as MEDIMIND-NOTIFICATION-CONSUMER.');
      passedTests++;
    } else {
      throw new Error(`Health: ${healthRes.status}, Eureka: ${eurekaRes.status}`);
    }
  } catch (err) {
    console.error('✖ [5/11] Notification Consumer check failed:', err.message);
  }

  // 6. Publish Prediction Event to Kafka
  const testPatientId = `DEMO-TEST-${Date.now().toString().slice(-4)}`;
  let publishedPredictionEvent = null;
  try {
    const res = await fetch(`${GATEWAY_URL}/api/soa/predictions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: testPatientId,
        predictionType: 'HEART_DISEASE',
      }),
    });
    const data = await res.json();
    if (res.status === 202 && data.success) {
      publishedPredictionEvent = data.event;
      console.log(`✔ [6/11] Prediction Event successfully published to 'medimind.predictions' (Event ID: ${data.event.eventId}).`);
      passedTests++;
    } else {
      throw new Error(`Publish failed: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    console.error('✖ [6/11] Publish Prediction Event failed:', err.message);
  }

  // 7. Verify AI Consumer received the event asynchronously
  try {
    console.log('   Waiting 3 seconds for asynchronous Kafka consumption by Python AI Consumer...');
    await sleep(3000);
    const healthRes = await fetch(`${AI_CONSUMER_URL}/health`);
    const healthData = await healthRes.json();

    if (healthData.metrics?.processedEvents > 0 && healthData.metrics.lastEvent?.patientId === testPatientId) {
      console.log(`✔ [7/11] Python AI Consumer received and validated Prediction Event! (Processed: ${healthData.metrics.processedEvents}, Patient: ${testPatientId}).`);
      passedTests++;
    } else {
      throw new Error(`Consumer state: ${JSON.stringify(healthData.metrics)}`);
    }
  } catch (err) {
    console.error('✖ [7/11] AI Consumer event verification failed:', err.message);
  }

  // 8. Publish Notification Event to Kafka
  const testRecipientId = `RECIPIENT-${Date.now().toString().slice(-4)}`;
  try {
    const res = await fetch(`${GATEWAY_URL}/api/soa/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientId: testRecipientId,
        channel: 'SMS',
        message: 'Your MediMind cardiologist consultation is confirmed.',
      }),
    });
    const data = await res.json();
    if (res.status === 202 && data.success) {
      console.log(`✔ [8/11] Notification Event successfully published to 'medimind.notifications' (Event ID: ${data.event.eventId}).`);
      passedTests++;
    } else {
      throw new Error(`Publish failed: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    console.error('✖ [8/11] Publish Notification Event failed:', err.message);
  }

  // 9. Verify Notification Consumer received the event asynchronously
  try {
    console.log('   Waiting 3 seconds for asynchronous Kafka consumption by Node.js Notification Consumer...');
    await sleep(3000);
    const healthRes = await fetch(`${NOTIFICATION_CONSUMER_URL}/health`);
    const healthData = await healthRes.json();

    if (healthData.kafka?.processedCount > 0 && healthData.kafka.lastEvent?.recipientId === testRecipientId) {
      console.log(`✔ [9/11] Node.js Notification Consumer received and validated Notification Event! (Processed: ${healthData.kafka.processedCount}, Recipient: ${testRecipientId}).`);
      passedTests++;
    } else {
      throw new Error(`Notification Consumer state: ${JSON.stringify(healthData.kafka)}`);
    }
  } catch (err) {
    console.error('✖ [9/11] Notification Consumer event verification failed:', err.message);
  }

  // 10. Verify Service Discovery via Gateway
  try {
    const res = await fetch(`${GATEWAY_URL}/api/soa/services`);
    const data = await res.json();
    const registeredNames = (data.registry || []).map((r) => r.name);
    const expected = ['MEDIMIND-API', 'MEDIMIND-AI-CONSUMER', 'MEDIMIND-NOTIFICATION-CONSUMER'];
    const allPresent = expected.every((s) => registeredNames.includes(s));

    if (res.status === 200 && allPresent) {
      console.log(`✔ [10/11] Service Discovery endpoint successfully returned registered services: [${registeredNames.join(', ')}].`);
      passedTests++;
    } else {
      throw new Error(`Discovered: [${registeredNames.join(', ')}], Expected: [${expected.join(', ')}]`);
    }
  } catch (err) {
    console.error('✖ [10/11] Service Discovery check failed:', err.message);
  }

  // 11. Verify Root Health and SOA Status endpoints
  try {
    const healthRes = await fetch(`${GATEWAY_URL}/health`);
    const statusRes = await fetch(`${GATEWAY_URL}/api/soa/status`);
    const healthData = await healthRes.json();
    const statusData = await statusRes.json();

    if (healthRes.status === 200 && statusRes.status === 200 && healthData.status === 'UP' && statusData.status === 'UP') {
      console.log('✔ [11/11] Health (/health) and Status (/api/soa/status) endpoints respond 200 OK with UP status.');
      passedTests++;
    } else {
      throw new Error(`Health status: ${healthRes.status}, Status status: ${statusRes.status}`);
    }
  } catch (err) {
    console.error('✖ [11/11] Health & Status check failed:', err.message);
  }

  console.log('='.repeat(75));
  console.log(`  Integration Test Results: ${passedTests}/${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('='.repeat(75));

  if (passedTests === totalTests) {
    console.log('All SOA Demonstration Integration Tests PASSED successfully!');
    process.exit(0);
  } else {
    console.error(`Some integration tests failed (${totalTests - passedTests} failures).`);
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Unhandled test execution error:', err);
  process.exit(1);
});

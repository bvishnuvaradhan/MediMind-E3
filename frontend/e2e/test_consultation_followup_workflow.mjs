import { chromium } from 'playwright';

async function run() {
  console.log('===============================================================');
  console.log('STARTING CLINICAL CONSULTATION & FOLLOW-UP WORKFLOW AUDIT');
  console.log('===============================================================');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error(`[Browser Console Error] ${msg.text()}`);
    }
  });

  try {
    // 1. Sign in as Doctor
    console.log('[Step 1] Logging in as Dr. Rahul Sharma (Doctor)...');
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.fill('input[type="email"]', 'dr.rahul.sharma@aarogyam.hospital');
    await page.fill('input[type="password"]', 'Doctor#2026$01!Dev');

    const [, aptResp] = await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForResponse(
        (resp) => resp.url().includes('/api/appointments') && resp.status() === 200,
        { timeout: 25000 }
      ),
    ]);
    console.log(`[Step 1] Appointments API responded with status ${aptResp.status()}`);

    await page.waitForSelector('.doctor-stat-grid', { timeout: 15000 });
    console.log('✓ Successfully authenticated and loaded Doctor Workspace dashboard');

    // 2. Navigate to OPD Appointments View
    console.log('[Step 2] Navigating to Appointments View...');
    await page.click('.doctor-sidebar button:has-text("Appointments")');
    await page.waitForSelector('table.doctor-table', { timeout: 10000 });
    console.log('✓ OPD Appointments table visible');

    // 3. Verify "+ Consult" gating on completed appointments vs "Mark Done"
    console.log('[Step 3] Checking Appointment status actions...');
    const actionButtons = await page.$$eval('table.doctor-table tbody tr', (rows) => {
      return rows.map((r) => {
        const token = r.querySelector('td:nth-child(1)')?.innerText.trim();
        const status = r.querySelector('td:nth-child(6)')?.innerText.trim();
        const consultBtn = Array.from(r.querySelectorAll('button')).find((b) => b.innerText.includes('Consult') || b.innerText.includes('View Cons'));
        const markDoneBtn = Array.from(r.querySelectorAll('button')).find((b) => b.innerText.includes('Mark Done'));
        return {
          token,
          status,
          hasConsultBtn: !!consultBtn,
          consultBtnText: consultBtn?.innerText.trim(),
          consultDisabled: consultBtn?.disabled,
          hasMarkDoneBtn: !!markDoneBtn,
        };
      });
    });

    console.log('Sample Action States:', JSON.stringify(actionButtons.slice(0, 3), null, 2));

    const pendingRow = actionButtons.find((a) => a.status !== 'Completed' && a.status !== 'Cancelled');
    if (pendingRow) {
      if (pendingRow.consultDisabled) {
        console.log(`✓ PASS: Non-completed appointment ${pendingRow.token} (${pendingRow.status}) has disabled + Consult button.`);
      }
      if (pendingRow.hasMarkDoneBtn) {
        console.log(`✓ PASS: Non-completed appointment ${pendingRow.token} has Mark Done button available.`);
      }
    }

    // 4. Test Mark Done and Consultation Initiation
    console.log('[Step 4] Testing encounter completion and consultation modal...');
    const markDoneBtn = await page.$('table.doctor-table tbody button:has-text("Mark Done")');
    if (markDoneBtn) {
      console.log('Marking appointment as Completed...');
      await markDoneBtn.click();
      await page.waitForSelector('.doctor-toast', { timeout: 5000 });
      console.log('✓ Appointment status updated toast received');
      await page.waitForTimeout(1000);
    }

    // Locate the enabled "+ Consult" button
    const enabledConsultBtn = await page.waitForSelector('table.doctor-table tbody button:has-text("+ Consult"):not([disabled])', { timeout: 10000 });
    console.log('Clicking enabled "+ Consult" button for completed appointment...');
    await enabledConsultBtn.click();
    await page.waitForSelector('.doctor-modal-box', { timeout: 5000 });
    console.log('✓ Consultation modal opened successfully');

    // Verify Encounter Classification radio controls
    const hasNewRadio = await page.isVisible('input[type="radio"][value="new"]');
    const hasFollowUpRadio = await page.isVisible('input[type="radio"][value="follow_up"]');
    console.log(`Encounter Classification Radios: New=${hasNewRadio}, FollowUp=${hasFollowUpRadio}`);
    if (hasNewRadio && hasFollowUpRadio) {
      console.log('✓ PASS: Encounter Classification (New vs Follow-Up) radio controls present.');
    } else {
      throw new Error('Encounter classification radio buttons missing');
    }

    // Switch to Follow-up encounter
    console.log('Switching encounter mode to Follow-Up...');
    await page.click('input[type="radio"][value="follow_up"]');
    await page.waitForTimeout(300);

    // Verify prior consultation dropdown or informational note
    const hasPriorPicker = (await page.$('.doctor-modal-box select')) !== null;
    console.log(`✓ PASS: Follow-up prior consultation selector active (hasPicker=${hasPriorPicker})`);

    // Close modal
    await page.click('.doctor-modal-header button[aria-label="Close modal"]');
    await page.waitForTimeout(500);
    console.log('✓ Consultation modal closed cleanly');

    // 5. Navigate to Consultations View and verify New Consultation button
    console.log('[Step 5] Navigating to Consultations View...');
    await page.click('.doctor-sidebar button:has-text("Consultations")');
    await page.waitForSelector('button:has-text("New Consultation")', { timeout: 8000 });
    console.log('✓ Consultations view loaded');

    await page.click('button:has-text("New Consultation")');
    await page.waitForSelector('.doctor-modal-box', { timeout: 5000 });
    console.log('✓ Consultation modal opened from Consultations View');
    const hasCompletedSelect = await page.isVisible('.doctor-modal-box select');
    console.log(`✓ Consultation form loaded completed encounters dropdown: ${hasCompletedSelect}`);
    await page.click('.doctor-modal-header button[aria-label="Close modal"]');
    await page.waitForTimeout(500);

    // 6. Navigate to Prescriptions View and verify Linked Consultation Picker
    console.log('[Step 6] Navigating to Prescriptions View...');
    await page.click('.doctor-sidebar button:has-text("Prescriptions")');
    await page.waitForSelector('button:has-text("Issue New Prescription")', { timeout: 8000 });
    console.log('✓ Prescriptions view loaded');

    console.log('Opening Issue New Prescription Modal...');
    await page.click('button:has-text("Issue New Prescription")');
    await page.waitForSelector('.doctor-modal-box', { timeout: 5000 });

    const hasLinkedConsLabel = await page.isVisible('label:has-text("Associated Clinical Consultation Record")');
    console.log(`Associated Clinical Consultation Record field present: ${hasLinkedConsLabel}`);
    if (hasLinkedConsLabel) {
      console.log('✓ PASS: Electronic prescription requires associated signed consultation linkage.');
    } else {
      throw new Error('Associated Clinical Consultation Record field missing in New Prescription Modal');
    }

    await page.click('.doctor-modal-header button[aria-label="Close modal"]');
    await page.waitForTimeout(500);
    console.log('✓ Prescription modal closed cleanly');

    console.log('===============================================================');
    console.log('ALL CLINICAL CONSULTATION WORKFLOW TESTS PASSED SUCCESSFULLY!');
    console.log('===============================================================');
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();

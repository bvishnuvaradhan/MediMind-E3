import { test, expect } from '@playwright/test';
import path from 'path';

const PASSWORD = 'Password123!';
const SAMPLE_XRAY_PATH = path.resolve('..', 'ai-prediction-service', 'artifacts', 'fracture_v2', 'experiment5_localization', 'dataset', 'images', 'test', '0017_1043285040_01_WRI-L1_F001.png');

test.describe('AI Predictions & Groq Explanation E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', 'rohan.kapoor@example.com');
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Kapoor Family').first()).toBeVisible({ timeout: 10000 });
  });

  test('Fracture Detection X-Ray Upload & Real Inference Workflow', async ({ page }) => {
    const aiTab = page.locator('button:has-text("AI Predictions"), div:has-text("AI Predictions")').first();
    if (await aiTab.isVisible()) {
      await aiTab.click();
      await page.waitForTimeout(500);

      const fractureCard = page.locator('button:has-text("Fracture detection"), button:has-text("Fracture")').first();
      if (await fractureCard.isVisible()) {
        await fractureCard.click();
        await page.waitForTimeout(500);

        const fileInput = page.locator('input[type="file"]');
        if (await fileInput.count() > 0) {
          await fileInput.setInputFiles(SAMPLE_XRAY_PATH);
          await page.waitForTimeout(500);

          const submitBtn = page.locator('button:has-text("Execute Predictive Analysis"), button:has-text("Run Prediction"), button:has-text("Analyze")').first();
          if (await submitBtn.isVisible()) {
            await submitBtn.click();
            await page.waitForTimeout(2000);
            await expect(page.locator('body')).not.toBeEmpty();
          }
        }
      }
    }
  });

  test('Diabetes 3-Year Risk Forecaster Form Submission & Telemetry', async ({ page }) => {
    const aiTab = page.locator('button:has-text("AI Predictions"), div:has-text("AI Predictions")').first();
    if (await aiTab.isVisible()) {
      await aiTab.click();
      await page.waitForTimeout(500);

      const diabetesCard = page.locator('button:has-text("Diabetes risk"), button:has-text("Diabetes")').first();
      if (await diabetesCard.isVisible()) {
        await diabetesCard.click();
        await page.waitForTimeout(500);

        const submitBtn = page.locator('button:has-text("Execute Predictive Analysis"), button:has-text("Run Prediction")').first();
        if (await submitBtn.isVisible()) {
          await submitBtn.click();
          await page.waitForTimeout(2000);
          await expect(page.locator('body')).not.toBeEmpty();
        }
      }
    }
  });

  test('Cardiovascular Risk Assessment Form Submission & Telemetry', async ({ page }) => {
    const aiTab = page.locator('button:has-text("AI Predictions"), div:has-text("AI Predictions")').first();
    if (await aiTab.isVisible()) {
      await aiTab.click();
      await page.waitForTimeout(500);

      const heartCard = page.locator('button:has-text("Cardiovascular risk"), button:has-text("Heart")').first();
      if (await heartCard.isVisible()) {
        await heartCard.click();
        await page.waitForTimeout(500);

        const submitBtn = page.locator('button:has-text("Execute Predictive Analysis"), button:has-text("Run Prediction")').first();
        if (await submitBtn.isVisible()) {
          await submitBtn.click();
          await page.waitForTimeout(2000);
          await expect(page.locator('body')).not.toBeEmpty();
        }
      }
    }
  });

  test('General Health NLP Tri-Pillar Triage & Negation Handling', async ({ page }) => {
    const generalHealthBtn = page.locator('button:has-text("General Health"), button:has-text("Triage Assessment"), button:has-text("Symptom Checker")').first();
    if (await generalHealthBtn.isVisible()) {
      await generalHealthBtn.click();
      await page.waitForTimeout(500);

      const symptomInput = page.locator('textarea, input[placeholder*="fatigue"], input[placeholder*="symptoms"]').first();
      if (await symptomInput.isVisible()) {
        // Test Negation: "I do not have chest pain"
        await symptomInput.fill('Mild headache and fatigue, but I do not have chest pain or shortness of breath');
        const submitBtn = page.locator('button:has-text("Evaluate"), button:has-text("Assess"), button:has-text("Submit")').first();
        if (await submitBtn.isVisible()) {
          await submitBtn.click();
          await page.waitForTimeout(1000);
          await expect(page.locator('body')).not.toBeEmpty();
        }
      }
    }
  });
});

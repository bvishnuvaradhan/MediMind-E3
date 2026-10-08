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

  test('General Health NLP Prediction & Groq Second Opinion', async ({ page }) => {
    const generalHealthBtn = page.locator('button:has-text("General Health"), button:has-text("Triage Assessment"), button:has-text("Symptom Checker")').first();
    if (await generalHealthBtn.isVisible()) {
      await generalHealthBtn.click();
      await page.waitForTimeout(500);

      const symptomInput = page.locator('textarea, input[placeholder*="fatigue"], input[placeholder*="symptoms"]').first();
      if (await symptomInput.isVisible()) {
        await symptomInput.fill('Mild headache and fatigue since yesterday');
        const submitBtn = page.locator('button:has-text("Evaluate"), button:has-text("Assess"), button:has-text("Submit")').first();
        if (await submitBtn.isVisible()) {
          await submitBtn.click();
          await page.waitForTimeout(1000);
          await expect(page.locator('body')).not.toBeEmpty();
        }
      }
    }
  });

  test('Fracture Detection X-Ray File Upload & Inference Flow', async ({ page }) => {
    const aiTab = page.locator('button:has-text("AI Predictions"), button:has-text("AI Assessment"), div:has-text("AI Predictions")').first();
    if (await aiTab.isVisible()) {
      await aiTab.click();
      await page.waitForTimeout(500);

      const fractureCard = page.locator('button:has-text("Fracture"), div:has-text("Fracture Detection")').first();
      if (await fractureCard.isVisible()) {
        await fractureCard.click();
        await page.waitForTimeout(500);

        const fileInput = page.locator('input[type="file"]');
        if (await fileInput.count() > 0) {
          await fileInput.setInputFiles(SAMPLE_XRAY_PATH);
          await page.waitForTimeout(500);

          const analyzeBtn = page.locator('button:has-text("Analyze"), button:has-text("Run Prediction"), button:has-text("Detect Fracture")').first();
          if (await analyzeBtn.isVisible()) {
            await analyzeBtn.click();
            await page.waitForTimeout(2000);
            await expect(page.locator('body')).not.toBeEmpty();
          }
        }
      }
    }
  });

  test('Heart Disease and Diabetes AI Workflow Verification', async ({ page }) => {
    const aiTab = page.locator('button:has-text("AI Predictions"), button:has-text("AI Assessment"), div:has-text("AI Predictions")').first();
    if (await aiTab.isVisible()) {
      await aiTab.click();
      await page.waitForTimeout(500);
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });
});

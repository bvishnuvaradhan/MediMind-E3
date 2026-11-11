import fs from 'fs';

let content = fs.readFileSync('./backend/appointment-service/src/utils/internalServices.js', 'utf8');

const addition = `  /**
   * Execute real clinical AI pre-screening via AI Prediction Service (Port 5007)
   */
  async executeAiPreScreening({ familyMemberId, text, appointmentId }) {
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5007';
    const url = \`\${AI_SERVICE_URL}/api/ai/general-health\`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-service-secret': INTERNAL_SECRET,
          'X-Internal-Service-Key': process.env.INTERNAL_SERVICE_KEY || INTERNAL_SECRET,
          'x-user-id': 'internal_appointment_service',
          'x-user-role': 'CHAIRMAN',
        },
        body: JSON.stringify({
          family_member_id: familyMemberId.toString(),
          text,
          appointment_id: appointmentId || undefined,
        }),
        signal: AbortSignal.timeout(7000),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        return { success: false, statusCode: response.status, error: errText };
      }

      const data = await response.json();
      return { success: true, ...data };
    } catch (err) {
      return { success: false, statusCode: 502, error: err.message };
    }
  },

  /**
   * Verify an existing AI prediction record against a patient familyMemberId
   */
  async verifyAiPrediction(predictionId, familyMemberId) {
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5007';
    const url = \`\${AI_SERVICE_URL}/api/ai/\${predictionId}\`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-internal-service-secret': INTERNAL_SECRET,
          'X-Internal-Service-Key': process.env.INTERNAL_SERVICE_KEY || INTERNAL_SECRET,
          'x-user-id': 'internal_appointment_service',
          'x-user-role': 'CHAIRMAN',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (response.status === 404) {
        return { valid: false, reason: 'NOT_FOUND', statusCode: 404 };
      }
      if (!response.ok) {
        return { valid: false, reason: 'SERVICE_ERROR', statusCode: response.status };
      }

      const data = await response.json();
      if (familyMemberId && data.family_member_id && data.family_member_id.toString() !== familyMemberId.toString()) {
        return { valid: false, reason: 'MEMBER_MISMATCH', statusCode: 403, prediction: data };
      }

      return { valid: true, prediction: data };
    } catch (err) {
      return { valid: false, reason: 'NETWORK_ERROR', statusCode: 502, error: err.message };
    }
  },
};
`;

content = content.replace(/};\s*$/, addition);
fs.writeFileSync('./backend/appointment-service/src/utils/internalServices.js', content, 'utf8');
console.log('internalServices updated successfully');

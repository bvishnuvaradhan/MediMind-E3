import fs from 'fs';

let content = fs.readFileSync('./backend/appointment-service/src/services/appointmentService.js', 'utf8');

// 1. Add idempotencyKey extraction to bookAppointment
const origBookStart = `    const aiPredictionId = payload.aiPredictionId || payload.ai_prediction_id || null;\n\n    const originalAppointmentId = payload.originalAppointmentId || payload.original_appointment_id || null;`;
const newBookStart = `    const aiPredictionId = payload.aiPredictionId || payload.ai_prediction_id || null;\n\n    const originalAppointmentId = payload.originalAppointmentId || payload.original_appointment_id || null;\n\n    const idempotencyKey = payload.idempotencyKey || payload.idempotency_key || null;`;

if (!content.includes('const idempotencyKey =')) {
  content = content.replace(origBookStart, newBookStart);
}

// 2. Add idempotency checks after basic validation and appointmentDate parsing
const targetDateParsing = `    const appointmentDate = parseDateOnly(appointmentDateStr);`;
const dateParsingWithIdempotency = `    const appointmentDate = parseDateOnly(appointmentDateStr);\n\n    // Idempotency: return existing booking if identical idempotency key was previously submitted\n    if (idempotencyKey) {\n      const existingByKey = await Appointment.findOne({ idempotency_key: idempotencyKey });\n      if (existingByKey) {\n        return await this._enrichAppointment(existingByKey);\n      }\n    }\n\n    // Idempotency: return existing active booking if the same patient is retrying the identical slot\n    const { start: dayStartRange, end: dayEndRange } = getDayRange(appointmentDate);\n    const existingPatientBooking = await Appointment.findOne({\n      family_member_id: familyMemberId,\n      doctor_id: doctorId,\n      appointment_date: { $gte: dayStartRange, $lte: dayEndRange },\n      start_time: startTime,\n      status: { $in: ['BOOKED', 'CONFIRMED'] },\n    });\n    if (existingPatientBooking) {\n      return await this._enrichAppointment(existingPatientBooking);\n    };`;

if (!content.includes('// Idempotency: return existing booking')) {
  content = content.replace(targetDateParsing, dateParsingWithIdempotency);
}

// 3. Replace token & creation block with AI Pre-Screening and safe creation
const origCreationBlock = `    // 6. Generate appointment token\n\n    const token = \`OPD-\${Math.floor(100 + Math.random() * 900)}\`;\n\n    // 7. Create Appointment with DB uniqueness error handling\n\n    let newAppointment;\n\n    try {\n\n      newAppointment = await Appointment.create({\n\n        family_member_id: familyMemberId,\n\n        doctor_id: doctorId,\n\n        hospital_id: hospitalId,\n\n        department_id: departmentId,\n\n        appointment_date: appointmentDate,\n\n        start_time: startTime,\n\n        end_time: endTime,\n\n        reason,\n\n        status: 'BOOKED',\n\n        appointment_type: appointmentType,\n\n        ai_prediction_id: aiPredictionId,\n\n        token,\n\n        original_appointment_id: originalAppointmentId || null,\n\n      });\n\n    } catch (createErr) {\n\n      if (createErr.code === 11000) {\n\n        const err = new Error('The selected doctor already has an appointment booked for this time slot');\n\n        err.statusCode = 409;\n\n        throw err;\n\n      }\n\n      throw createErr;\n\n    }`;

const newCreationBlock = `    // 6. Clinical AI Pre-Screening verification and execution
    let finalAiPredictionId = aiPredictionId;
    let autoCreatedPredictionId = null;

    if (appointmentType === 'WALK_IN') {
      // Walk-ins are in-person registrations and bypass AI pre-screening requirement
    } else if (appointmentType === 'BOOKED') {
      // Online bookings require genuine AI pre-screening
      if (finalAiPredictionId) {
        // Validate pre-existing prediction
        const verification = await internalServices.verifyAiPrediction(finalAiPredictionId, familyMemberId);
        if (!verification.valid) {
          if (verification.reason === 'NOT_FOUND') {
            const err = new Error(\`AI Pre-Screening prediction '\${finalAiPredictionId}' not found\`);
            err.statusCode = 404;
            throw err;
          }
          if (verification.reason === 'MEMBER_MISMATCH') {
            const err = new Error(\`AI Pre-Screening prediction does not match family member '\${familyMemberId}'\`);
            err.statusCode = 403;
            throw err;
          }
          const err = new Error(\`Failed to verify AI Pre-Screening prediction: \${verification.error || verification.reason}\`);
          err.statusCode = 502;
          throw err;
        }
      } else {
        // Client did not supply prediction ID: execute AI pre-screening
        const symptomText = (payload.symptoms || payload.reason || payload.chief_complaint || '').trim();
        if (!symptomText || symptomText.length < 3) {
          const err = new Error('Online bookings require symptoms description of at least 3 characters for clinical AI pre-screening');
          err.statusCode = 400;
          throw err;
        }

        const aiRes = await internalServices.executeAiPreScreening({
          familyMemberId,
          text: symptomText,
        });

        if (!aiRes || !aiRes.success || !aiRes.prediction_id) {
          const err = new Error(\`Clinical AI pre-screening failed: \${aiRes?.error || 'Inference service unavailable'}. Booking was not confirmed.\`);
          err.statusCode = 502;
          throw err;
        }

        finalAiPredictionId = aiRes.prediction_id;
        autoCreatedPredictionId = aiRes.prediction_id;
      }
    }

    // 7. Generate appointment token
    const token = \`OPD-\${Math.floor(100 + Math.random() * 900)}\`;

    // 8. Create Appointment with DB uniqueness error handling
    let newAppointment;
    try {
      newAppointment = await Appointment.create({
        family_member_id: familyMemberId,
        doctor_id: doctorId,
        hospital_id: hospitalId,
        department_id: departmentId,
        appointment_date: appointmentDate,
        start_time: startTime,
        end_time: endTime,
        reason,
        status: 'BOOKED',
        appointment_type: appointmentType,
        ai_prediction_id: finalAiPredictionId,
        idempotency_key: idempotencyKey || null,
        token,
        original_appointment_id: originalAppointmentId || null,
      });
    } catch (createErr) {
      if (autoCreatedPredictionId) {
        // Cleanup auto-created prediction to avoid orphaned AI records
        try {
          const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5007';
          await fetch(\`\${AI_SERVICE_URL}/api/ai/\${autoCreatedPredictionId}\`, {
            method: 'DELETE',
            headers: {
              'X-Internal-Service-Key': process.env.INTERNAL_SERVICE_KEY || 'medimind_internal_service_secret_2026',
            },
          });
        } catch {
          // silent
        }
      }

      if (createErr.code === 11000) {
        const err = new Error('The selected doctor already has an appointment booked for this time slot');
        err.statusCode = 409;
        throw err;
      }
      throw createErr;
    }`;

// Normalize line endings for replacement
const normalize = (str) => str.replace(/\r\n/g, '\n');
const normalizedContent = normalize(content);
const normalizedOrig = normalize(origCreationBlock);

if (normalizedContent.includes(normalizedOrig)) {
  const replaced = normalizedContent.replace(normalizedOrig, normalize(newCreationBlock));
  fs.writeFileSync('./backend/appointment-service/src/services/appointmentService.js', replaced, 'utf8');
  console.log('appointmentService.js updated with Phase 14 AI pre-screening and idempotency logic!');
} else {
  console.log('Could not find origCreationBlock in appointmentService.js');
}

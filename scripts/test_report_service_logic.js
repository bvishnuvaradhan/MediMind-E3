import mongoose from 'mongoose';
import ExcelJS from 'exceljs';
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medimind_appointment';

async function testReport() {
  await mongoose.connect(uri);
  const client = mongoose.connection.client;

  const apptCol = client.db('medimind_appointment').collection('appointments');
  const docCol = client.db('medimind_doctor').collection('doctors');
  const hospCol = client.db('medimind_hospital').collection('hospitals');
  const deptCol = client.db('medimind_hospital').collection('departments');

  // 1. Fetch hospitals & departments lookup
  const hospitals = await hospCol.find().toArray();
  const hospMap = Object.fromEntries(hospitals.map(h => [h._id.toString(), h.name]));
  const depts = await deptCol.find().toArray();
  const deptMap = Object.fromEntries(depts.map(d => [d._id.toString(), d.name]));

  console.log(`Loaded ${hospitals.length} hospitals, ${depts.length} departments.`);

  // 2. Fetch all doctors
  const doctors = await docCol.find().toArray();
  console.log(`Loaded ${doctors.length} doctors (including ${doctors.filter(d => d.status === 'ACTIVE').length} active).`);

  // 3. Appointment stats aggregation
  const apptStats = await apptCol.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]).toArray();

  const totalAppts = await apptCol.countDocuments();
  console.log(`Total appointments: ${totalAppts}`);
  console.log('Status breakdown:', apptStats);

  // 4. Test Excel generation with ExcelJS
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'MediMind Platform Executive Engine';
  workbook.created = new Date();

  // Sheet 1: Report Summary
  const s1 = workbook.addWorksheet('Report Summary');
  s1.columns = [
    { header: 'Metric / Category', key: 'metric', width: 35 },
    { header: 'Value', key: 'value', width: 25 },
    { header: 'Reporting Scope / Context', key: 'context', width: 45 }
  ];
  s1.addRow({ metric: 'Report Name', value: 'Doctor & Appointment Operational Audit', context: 'Executive Compliance Export' });
  s1.addRow({ metric: 'Generated Timestamp', value: new Date().toISOString(), context: 'System Local Time (UTC+05:30)' });
  s1.addRow({ metric: 'Total Credentialed Doctors', value: doctors.length, context: 'Active & Inactive Registry' });
  s1.addRow({ metric: 'Active Doctors', value: doctors.filter(d => d.status === 'ACTIVE').length, context: 'Operational 66-Doctor Roster' });
  s1.addRow({ metric: 'Total Platform Appointments', value: totalAppts, context: 'Complete Network Load' });

  // Sheet 2: Doctor Directory
  const s2 = workbook.addWorksheet('Doctor Directory');
  s2.columns = [
    { header: 'Doctor ID', key: 'id', width: 26 },
    { header: 'Full Name', key: 'name', width: 25 },
    { header: 'Email', key: 'email', width: 32 },
    { header: 'Facility', key: 'hospital', width: 32 },
    { header: 'Department', key: 'department', width: 25 },
    { header: 'Specialization', key: 'spec', width: 35 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Appointments in Scope', key: 'appts', width: 22 }
  ];

  // Appointment counts per doctor
  const docApptCounts = await apptCol.aggregate([
    { $group: { _id: '$doctor_id', count: { $sum: 1 } } }
  ]).toArray();
  const countMap = Object.fromEntries(docApptCounts.map(c => [c._id?.toString(), c.count]));

  for (const doc of doctors) {
    s2.addRow({
      id: doc._id.toString(),
      name: doc.full_name,
      email: doc.email,
      hospital: hospMap[doc.hospital_id?.toString()] || 'Unknown Facility',
      department: deptMap[doc.department_id?.toString()] || 'Unknown Department',
      spec: doc.specialization,
      status: doc.status,
      appts: countMap[doc._id.toString()] || 0
    });
  }

  // Sheet 3: Appointments
  const s3 = workbook.addWorksheet('Appointments');
  s3.columns = [
    { header: 'Appointment ID', key: 'id', width: 26 },
    { header: 'Date & Time', key: 'date', width: 20 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Doctor ID', key: 'doctorId', width: 26 },
    { header: 'Hospital', key: 'hospital', width: 30 },
    { header: 'Department', key: 'department', width: 25 },
    { header: 'Patient Reference', key: 'patientRef', width: 26 },
    { header: 'Reason / Clinical Notes', key: 'reason', width: 45 }
  ];

  const appts = await apptCol.find().limit(50).toArray();
  for (const a of appts) {
    s3.addRow({
      id: a._id.toString(),
      date: a.appointment_date ? a.appointment_date.toISOString() : 'N/A',
      status: a.status,
      doctorId: a.doctor_id?.toString() || 'N/A',
      hospital: hospMap[a.hospital_id?.toString()] || 'Unknown',
      department: deptMap[a.department_id?.toString()] || 'Unknown',
      patientRef: a.family_member_id?.toString() || 'N/A',
      reason: a.reason || 'Standard Consultation'
    });
  }

  // Sheet 4: Doctor Appointment Summary
  const s4 = workbook.addWorksheet('Doctor Appointment Summary');
  s4.columns = [
    { header: 'Doctor Name', key: 'name', width: 25 },
    { header: 'Hospital', key: 'hospital', width: 30 },
    { header: 'Department', key: 'department', width: 25 },
    { header: 'Total Appointments', key: 'total', width: 18 },
    { header: 'Status', key: 'status', width: 12 }
  ];

  for (const doc of doctors.filter(d => d.status === 'ACTIVE')) {
    s4.addRow({
      name: doc.full_name,
      hospital: hospMap[doc.hospital_id?.toString()] || 'Unknown Facility',
      department: deptMap[doc.department_id?.toString()] || 'Unknown Department',
      total: countMap[doc._id.toString()] || 0,
      status: doc.status
    });
  }

  const buf = await workbook.xlsx.writeBuffer();
  console.log(`Successfully generated test workbook! Buffer size: ${buf.length} bytes.`);

  await mongoose.disconnect();
}

testReport().catch(console.error);

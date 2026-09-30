import mongoose from 'mongoose';
import HospitalRequest from '../models/HospitalRequest.js';
import Hospital from '../models/Hospital.js';
import Department from '../models/Department.js';

export const hospitalRequestService = {
  submitRequest: async (data) => {
    if (!data.name || !data.city || !data.state || !data.address || !data.contactPerson || !data.phone || !data.email) {
      const err = new Error('Missing required fields: name, city, state, address, contactPerson, phone, and email are required');
      err.statusCode = 400;
      throw err;
    }

    const request = await HospitalRequest.create({
      name: data.name.trim(),
      code: data.code ? data.code.trim().toUpperCase() : null,
      type: data.type || 'Tertiary Care Hospital',
      city: data.city.trim(),
      state: data.state.trim(),
      country: data.country || 'India',
      address: data.address.trim(),
      contactPerson: data.contactPerson.trim(),
      contactRole: data.contactRole || null,
      phone: data.phone.trim(),
      emergencyPhone: data.emergencyPhone || null,
      email: data.email.trim().toLowerCase(),
      requestedDepartments: Array.isArray(data.requestedDepartments) ? data.requestedDepartments : ['General Medicine'],
      bedCapacity: Number(data.bedCapacity) || 0,
      accreditation: data.accreditation || null,
      facilityLevel: data.facilityLevel || null,
      establishedYear: Number(data.establishedYear) || null,
      licenseNumber: data.licenseNumber || null,
      notes: data.notes || null,
      status: 'PENDING',
      submittedDate: new Date(),
    });

    return {
      id: request._id.toString(),
      requestId: request._id.toString(),
      name: request.name,
      status: request.status,
      submittedDate: request.submittedDate,
      message: 'Hospital onboarding request submitted successfully',
    };
  },

  listRequests: async (query = {}, user) => {
    // Only Chairman can access hospital onboarding requests
    if (!user || user.role !== 'CHAIRMAN') {
      const err = new Error('Access forbidden: only Chairman can view hospital onboarding requests');
      err.statusCode = 403;
      throw err;
    }

    const filter = {};
    if (query.status && query.status.toLowerCase() !== 'all') {
      filter.status = query.status.toUpperCase();
    }

    const requests = await HospitalRequest.find(filter)
      .populate('created_hospital_id', 'name code status')
      .sort({ submittedDate: -1 });

    return requests.map((r) => ({
      id: r._id.toString(),
      requestId: r._id.toString(),
      name: r.name,
      code: r.code,
      type: r.type,
      city: r.city,
      state: r.state,
      country: r.country,
      address: r.address,
      contactPerson: r.contactPerson,
      contactRole: r.contactRole,
      phone: r.phone,
      emergencyPhone: r.emergencyPhone,
      email: r.email,
      requestedDepartments: r.requestedDepartments,
      bedCapacity: r.bedCapacity,
      accreditation: r.accreditation,
      facilityLevel: r.facilityLevel,
      establishedYear: r.establishedYear,
      licenseNumber: r.licenseNumber,
      notes: r.notes,
      status: r.status,
      rejectionReason: r.rejectionReason,
      decisionBy: r.decision_by?.toString() || null,
      decisionAt: r.decision_at,
      createdHospitalId: r.created_hospital_id?._id?.toString() || r.created_hospital_id?.toString() || null,
      submittedDate: r.submittedDate,
      createdAt: r.created_at,
    }));
  },

  getRequestById: async (requestId, user) => {
    if (!user || user.role !== 'CHAIRMAN') {
      const err = new Error('Access forbidden: only Chairman can view hospital onboarding requests');
      err.statusCode = 403;
      throw err;
    }

    let request;
    if (mongoose.Types.ObjectId.isValid(requestId)) {
      request = await HospitalRequest.findById(requestId).populate('created_hospital_id', 'name code status');
    } else {
      request = await HospitalRequest.findOne({ code: requestId }).populate('created_hospital_id', 'name code status');
    }

    if (!request) {
      const err = new Error('Hospital request not found');
      err.statusCode = 404;
      throw err;
    }

    return {
      id: request._id.toString(),
      requestId: request._id.toString(),
      name: request.name,
      code: request.code,
      type: request.type,
      city: request.city,
      state: request.state,
      country: request.country,
      address: request.address,
      contactPerson: request.contactPerson,
      contactRole: request.contactRole,
      phone: request.phone,
      emergencyPhone: request.emergencyPhone,
      email: request.email,
      requestedDepartments: request.requestedDepartments,
      bedCapacity: request.bedCapacity,
      accreditation: request.accreditation,
      facilityLevel: request.facilityLevel,
      establishedYear: request.establishedYear,
      licenseNumber: request.licenseNumber,
      notes: request.notes,
      status: request.status,
      rejectionReason: request.rejectionReason,
      decisionBy: request.decision_by?.toString() || null,
      decisionAt: request.decision_at,
      createdHospitalId: request.created_hospital_id?._id?.toString() || request.created_hospital_id?.toString() || null,
      submittedDate: request.submittedDate,
      createdAt: request.created_at,
    };
  },

  approveRequest: async (requestId, user) => {
    // 1. Role enforcement: Chairman only
    if (!user || user.role !== 'CHAIRMAN') {
      const err = new Error('Access forbidden: only Chairman can approve hospital onboarding requests');
      err.statusCode = 403;
      throw err;
    }

    let request;
    if (mongoose.Types.ObjectId.isValid(requestId)) {
      request = await HospitalRequest.findById(requestId);
    } else {
      request = await HospitalRequest.findOne({ code: requestId });
    }

    if (!request) {
      const err = new Error('Hospital request not found');
      err.statusCode = 404;
      throw err;
    }

    // 2. Lifecycle validation: must be PENDING
    if (request.status !== 'PENDING') {
      const err = new Error(`Cannot approve request: request is already ${request.status}`);
      err.statusCode = 400;
      throw err;
    }

    // 3. Create the new Hospital
    const totalExisting = await Hospital.countDocuments();
    const cityCode = (request.city || 'GEN').slice(0, 3).toUpperCase();
    const generatedCode = `MM-${cityCode}-0${totalExisting + 1}`;

    const newHospital = await Hospital.create({
      name: request.name,
      code: request.code || generatedCode,
      type: request.type || 'Multi-Specialty Hospital',
      address: {
        street: request.address,
        city: request.city,
        state: request.state,
        country: request.country || 'India',
        pincode: '500001',
      },
      phone: request.phone,
      emergencyPhone: request.emergencyPhone || null,
      email: request.email,
      adminEmail: request.email,
      bedCapacity: request.bedCapacity || 0,
      accreditation: request.accreditation || 'State Healthcare Board Certified',
      facilityLevel: request.facilityLevel || null,
      establishedYear: request.establishedYear || null,
      licenseNumber: request.licenseNumber || null,
      status: 'ACTIVE',
      created_by: user.userId ? new mongoose.Types.ObjectId(user.userId) : null,
    });

    // 4. Create requested departments if provided
    const requestedDepts = request.requestedDepartments && request.requestedDepartments.length > 0
      ? request.requestedDepartments
      : ['General Medicine', 'Diabetology & Endocrinology'];

    for (const deptName of requestedDepts) {
      try {
        await Department.create({
          hospital_id: newHospital._id,
          name: deptName,
          status: 'ACTIVE',
        });
      } catch {
        // Continue if duplicate
      }
    }

    // 5. Update request status to APPROVED
    request.status = 'APPROVED';
    request.decision_by = user.userId ? new mongoose.Types.ObjectId(user.userId) : null;
    request.decision_at = new Date();
    request.created_hospital_id = newHospital._id;
    await request.save();

    return {
      request: {
        id: request._id.toString(),
        requestId: request._id.toString(),
        name: request.name,
        status: request.status,
        decisionAt: request.decision_at,
        createdHospitalId: newHospital._id.toString(),
      },
      hospital: {
        id: newHospital._id.toString(),
        hospitalId: newHospital._id.toString(),
        name: newHospital.name,
        code: newHospital.code,
        status: newHospital.status,
      },
    };
  },

  rejectRequest: async (requestId, reason = 'Criteria not met', user) => {
    // 1. Role enforcement: Chairman only
    if (!user || user.role !== 'CHAIRMAN') {
      const err = new Error('Access forbidden: only Chairman can reject hospital onboarding requests');
      err.statusCode = 403;
      throw err;
    }

    let request;
    if (mongoose.Types.ObjectId.isValid(requestId)) {
      request = await HospitalRequest.findById(requestId);
    } else {
      request = await HospitalRequest.findOne({ code: requestId });
    }

    if (!request) {
      const err = new Error('Hospital request not found');
      err.statusCode = 404;
      throw err;
    }

    // 2. Lifecycle validation: must be PENDING
    if (request.status !== 'PENDING') {
      const err = new Error(`Cannot reject request: request is already ${request.status}`);
      err.statusCode = 400;
      throw err;
    }

    // 3. Update request status to REJECTED
    request.status = 'REJECTED';
    request.rejectionReason = reason || 'Criteria not met';
    request.decision_by = user.userId ? new mongoose.Types.ObjectId(user.userId) : null;
    request.decision_at = new Date();
    await request.save();

    return {
      request: {
        id: request._id.toString(),
        requestId: request._id.toString(),
        name: request.name,
        status: request.status,
        rejectionReason: request.rejectionReason,
        decisionAt: request.decision_at,
      },
    };
  },
};

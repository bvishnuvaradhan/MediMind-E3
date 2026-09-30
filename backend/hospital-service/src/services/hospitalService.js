import mongoose from 'mongoose';
import Hospital from '../models/Hospital.js';
import Department from '../models/Department.js';
import DepartmentHead from '../models/DepartmentHead.js';

export const hospitalService = {
  listHospitals: async (query = {}, user = null) => {
    const filter = {};

    // Hospital Admin can only see their assigned hospital
    if (user && user.role === 'HOSPITAL_ADMIN') {
      if (user.hospitalId) {
        if (mongoose.Types.ObjectId.isValid(user.hospitalId)) {
          filter._id = new mongoose.Types.ObjectId(user.hospitalId);
        } else {
          filter.code = user.hospitalId;
        }
      }
    } else {
      if (query.status && query.status !== 'All') {
        filter.status = query.status.toUpperCase();
      }
      if (query.city) {
        filter['address.city'] = new RegExp(query.city, 'i');
      }
      if (query.type) {
        filter.type = new RegExp(query.type, 'i');
      }
      if (query.search) {
        filter.$or = [
          { name: new RegExp(query.search, 'i') },
          { code: new RegExp(query.search, 'i') },
          { 'address.city': new RegExp(query.search, 'i') },
        ];
      }
    }

    const hospitals = await Hospital.find(filter).sort({ created_at: -1 });

    // Enrich with counts
    const enriched = await Promise.all(
      hospitals.map(async (h) => {
        const departmentsCount = await Department.countDocuments({ hospital_id: h._id, status: 'ACTIVE' });
        const departmentHeadsCount = await DepartmentHead.countDocuments({ hospital_id: h._id, status: 'ACTIVE' });

        return {
          id: h._id.toString(),
          hospitalId: h._id.toString(),
          name: h.name,
          code: h.code || null,
          tagline: h.tagline || null,
          type: h.type,
          city: h.address?.city,
          state: h.address?.state,
          country: h.address?.country,
          address: typeof h.address === 'object' ? `${h.address.street}, ${h.address.city}, ${h.address.state} ${h.address.pincode}` : h.address,
          addressDetails: h.address,
          phone: h.phone,
          emergencyPhone: h.emergencyPhone,
          email: h.email,
          adminEmail: h.adminEmail,
          website: h.website,
          bedCapacity: h.bedCapacity || 0,
          accreditation: h.accreditation,
          facilityLevel: h.facilityLevel,
          establishedYear: h.establishedYear,
          licenseNumber: h.licenseNumber,
          facilities: h.facilities || [],
          operatingHours: h.operatingHours,
          status: h.status,
          departmentsCount,
          departmentHeadsCount,
          createdAt: h.created_at,
          updatedAt: h.updated_at,
        };
      })
    );

    return enriched;
  },

  getHospitalById: async (hospitalId, user = null) => {
    let hospital;
    if (mongoose.Types.ObjectId.isValid(hospitalId)) {
      hospital = await Hospital.findById(hospitalId);
    } else {
      hospital = await Hospital.findOne({ code: hospitalId });
    }

    if (!hospital) {
      const err = new Error('Hospital not found');
      err.statusCode = 404;
      throw err;
    }

    // Hospital Admin scope enforcement
    if (user && user.role === 'HOSPITAL_ADMIN') {
      const assignedId = user.hospitalId ? user.hospitalId.toString() : '';
      const matchesId = assignedId === hospital._id.toString();
      const matchesCode = assignedId === hospital.code;

      if (!matchesId && !matchesCode) {
        const err = new Error('Access forbidden: hospital admin is restricted to their assigned hospital');
        err.statusCode = 403;
        throw err;
      }
    }

    const departments = await Department.find({ hospital_id: hospital._id, status: 'ACTIVE' });
    const departmentHeads = await DepartmentHead.find({ hospital_id: hospital._id, status: 'ACTIVE' });

    return {
      id: hospital._id.toString(),
      hospitalId: hospital._id.toString(),
      name: hospital.name,
      code: hospital.code || null,
      tagline: hospital.tagline || null,
      type: hospital.type,
      city: hospital.address?.city,
      state: hospital.address?.state,
      country: hospital.address?.country,
      address: typeof hospital.address === 'object' ? `${hospital.address.street}, ${hospital.address.city}, ${hospital.address.state} ${hospital.address.pincode}` : hospital.address,
      addressDetails: hospital.address,
      phone: hospital.phone,
      emergencyPhone: hospital.emergencyPhone,
      email: hospital.email,
      adminEmail: hospital.adminEmail,
      website: hospital.website,
      bedCapacity: hospital.bedCapacity || 0,
      accreditation: hospital.accreditation,
      facilityLevel: hospital.facilityLevel,
      establishedYear: hospital.establishedYear,
      licenseNumber: hospital.licenseNumber,
      facilities: hospital.facilities || [],
      operatingHours: hospital.operatingHours,
      status: hospital.status,
      departmentsCount: departments.length,
      departmentHeadsCount: departmentHeads.length,
      departments: departments.map((d) => ({
        id: d._id.toString(),
        departmentId: d._id.toString(),
        name: d.name,
        code: d.code,
        specialization: d.specialization,
        status: d.status,
      })),
      createdAt: hospital.created_at,
      updatedAt: hospital.updated_at,
    };
  },

  updateHospital: async (hospitalId, updateData, user) => {
    let hospital;
    if (mongoose.Types.ObjectId.isValid(hospitalId)) {
      hospital = await Hospital.findById(hospitalId);
    } else {
      hospital = await Hospital.findOne({ code: hospitalId });
    }

    if (!hospital) {
      const err = new Error('Hospital not found');
      err.statusCode = 404;
      throw err;
    }

    // Role scoping: Hospital Admin can only update their own hospital
    if (user.role === 'HOSPITAL_ADMIN') {
      const assignedId = user.hospitalId ? user.hospitalId.toString() : '';
      const matchesId = assignedId === hospital._id.toString();
      const matchesCode = assignedId === hospital.code;

      if (!matchesId && !matchesCode) {
        const err = new Error('Access forbidden: hospital admin is restricted to their assigned hospital');
        err.statusCode = 403;
        throw err;
      }
    } else if (user.role !== 'CHAIRMAN') {
      const err = new Error('Access forbidden: insufficient role permissions');
      err.statusCode = 403;
      throw err;
    }

    if (updateData.name) hospital.name = updateData.name.trim();
    if (updateData.tagline !== undefined) hospital.tagline = updateData.tagline;
    if (updateData.phone) hospital.phone = updateData.phone.trim();
    if (updateData.emergencyPhone !== undefined) hospital.emergencyPhone = updateData.emergencyPhone;
    if (updateData.email) hospital.email = updateData.email.trim().toLowerCase();
    if (updateData.adminEmail !== undefined) hospital.adminEmail = updateData.adminEmail ? updateData.adminEmail.trim().toLowerCase() : null;
    if (updateData.website !== undefined) hospital.website = updateData.website;
    if (updateData.bedCapacity !== undefined) hospital.bedCapacity = Number(updateData.bedCapacity);
    if (updateData.facilities) hospital.facilities = updateData.facilities;
    if (updateData.operatingHours) hospital.operatingHours = updateData.operatingHours;

    if (updateData.address) {
      if (typeof updateData.address === 'object') {
        hospital.address = {
          street: updateData.address.street || hospital.address?.street,
          city: updateData.address.city || hospital.address?.city,
          state: updateData.address.state || hospital.address?.state,
          country: updateData.address.country || hospital.address?.country || 'India',
          pincode: updateData.address.pincode || hospital.address?.pincode,
        };
      }
    }

    // Only Chairman can update status
    if (updateData.status && user.role === 'CHAIRMAN') {
      hospital.status = updateData.status.toUpperCase();
    }

    await hospital.save();

    return {
      id: hospital._id.toString(),
      hospitalId: hospital._id.toString(),
      name: hospital.name,
      code: hospital.code,
      status: hospital.status,
      address: hospital.address,
      phone: hospital.phone,
      email: hospital.email,
      updatedAt: hospital.updated_at,
    };
  },

  createHospital: async (data, user) => {
    if (user.role !== 'CHAIRMAN') {
      const err = new Error('Access forbidden: only Chairman can create hospitals directly');
      err.statusCode = 403;
      throw err;
    }

    if (!data.name || !data.phone || !data.email) {
      const err = new Error('Missing required fields: name, phone, and email are required');
      err.statusCode = 400;
      throw err;
    }

    const hospital = await Hospital.create({
      name: data.name.trim(),
      code: data.code ? data.code.trim().toUpperCase() : null,
      tagline: data.tagline || null,
      type: data.type || 'Multi-Specialty Hospital',
      address: {
        street: data.address?.street || 'Healthcare Ave',
        city: data.address?.city || data.city || 'City',
        state: data.address?.state || data.state || 'State',
        country: data.address?.country || data.country || 'India',
        pincode: data.address?.pincode || data.pincode || '000000',
      },
      phone: data.phone.trim(),
      emergencyPhone: data.emergencyPhone || null,
      email: data.email.trim().toLowerCase(),
      adminEmail: data.adminEmail ? data.adminEmail.trim().toLowerCase() : null,
      website: data.website || null,
      bedCapacity: Number(data.bedCapacity) || 0,
      accreditation: data.accreditation || null,
      facilityLevel: data.facilityLevel || null,
      establishedYear: Number(data.establishedYear) || null,
      licenseNumber: data.licenseNumber || null,
      facilities: data.facilities || [],
      operatingHours: data.operatingHours || '24/7',
      status: data.status ? data.status.toUpperCase() : 'ACTIVE',
      created_by: user.userId ? new mongoose.Types.ObjectId(user.userId) : null,
    });

    return {
      id: hospital._id.toString(),
      hospitalId: hospital._id.toString(),
      name: hospital.name,
      code: hospital.code,
      status: hospital.status,
      createdAt: hospital.created_at,
    };
  },
};

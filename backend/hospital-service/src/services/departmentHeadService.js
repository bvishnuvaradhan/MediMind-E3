import mongoose from 'mongoose';
import DepartmentHead from '../models/DepartmentHead.js';
import Department from '../models/Department.js';
import Hospital from '../models/Hospital.js';

export const departmentHeadService = {
  createDepartmentHead: async (data, user) => {
    if (!['CHAIRMAN', 'HOSPITAL_ADMIN'].includes(user.role)) {
      const err = new Error('Access forbidden: insufficient role permissions');
      err.statusCode = 403;
      throw err;
    }

    let targetHospitalId = data.hospital_id || data.hospitalId;

    if (user.role === 'HOSPITAL_ADMIN') {
      if (!targetHospitalId) {
        targetHospitalId = user.hospitalId;
      } else if (user.hospitalId && user.hospitalId.toString() !== targetHospitalId.toString()) {
        const err = new Error('Access forbidden: hospital admin cannot assign department heads in another hospital');
        err.statusCode = 403;
        throw err;
      }
    }

    if (!targetHospitalId) {
      const err = new Error('hospital_id is required');
      err.statusCode = 400;
      throw err;
    }

    if (!data.department_id && !data.departmentId) {
      const err = new Error('department_id is required');
      err.statusCode = 400;
      throw err;
    }

    if (!data.user_id && !data.userId) {
      const err = new Error('user_id is required');
      err.statusCode = 400;
      throw err;
    }

    const userIdStr = data.user_id || data.userId;
    const deptIdStr = data.department_id || data.departmentId;

    // Verify hospital exists
    let hospital;
    if (mongoose.Types.ObjectId.isValid(targetHospitalId)) {
      hospital = await Hospital.findById(targetHospitalId);
    } else {
      hospital = await Hospital.findOne({ code: targetHospitalId });
    }

    if (!hospital) {
      const err = new Error('Hospital not found');
      err.statusCode = 404;
      throw err;
    }

    // Verify department exists and belongs to this hospital
    let department;
    if (mongoose.Types.ObjectId.isValid(deptIdStr)) {
      department = await Department.findById(deptIdStr);
    } else {
      department = await Department.findOne({ code: deptIdStr });
    }

    if (!department) {
      const err = new Error('Department not found');
      err.statusCode = 404;
      throw err;
    }

    if (department.hospital_id.toString() !== hospital._id.toString()) {
      const err = new Error('Department does not belong to the specified hospital');
      err.statusCode = 400;
      throw err;
    }

    // Check duplicate assignment
    const existing = await DepartmentHead.findOne({
      user_id: new mongoose.Types.ObjectId(userIdStr),
      hospital_id: hospital._id,
      department_id: department._id,
      status: 'ACTIVE',
    });

    if (existing) {
      const err = new Error('This user is already assigned as an active department head for this department');
      err.statusCode = 409;
      throw err;
    }

    const head = await DepartmentHead.create({
      user_id: new mongoose.Types.ObjectId(userIdStr),
      hospital_id: hospital._id,
      department_id: department._id,
      full_name: data.full_name || data.fullName || null,
      email: data.email ? data.email.trim().toLowerCase() : null,
      phone: data.phone ? data.phone.trim() : null,
      specialization: data.specialization || department.specialization || null,
      status: data.status ? data.status.toUpperCase() : 'ACTIVE',
    });

    return {
      id: head._id.toString(),
      headId: head._id.toString(),
      userId: head.user_id.toString(),
      hospitalId: hospital._id.toString(),
      hospitalName: hospital.name,
      departmentId: department._id.toString(),
      departmentName: department.name,
      fullName: head.full_name,
      email: head.email,
      phone: head.phone,
      status: head.status,
      createdAt: head.created_at,
    };
  },

  listDepartmentHeads: async (query = {}, user = null) => {
    const filter = {};

    if (user && user.role === 'HOSPITAL_ADMIN') {
      if (user.hospitalId) {
        if (mongoose.Types.ObjectId.isValid(user.hospitalId)) {
          filter.hospital_id = new mongoose.Types.ObjectId(user.hospitalId);
        } else {
          const hosp = await Hospital.findOne({ code: user.hospitalId });
          if (hosp) filter.hospital_id = hosp._id;
        }
      }
    } else if (query.hospital_id || query.hospitalId) {
      const hId = query.hospital_id || query.hospitalId;
      if (mongoose.Types.ObjectId.isValid(hId)) {
        filter.hospital_id = new mongoose.Types.ObjectId(hId);
      } else {
        const hosp = await Hospital.findOne({ code: hId });
        if (hosp) filter.hospital_id = hosp._id;
      }
    }

    if (query.department_id || query.departmentId) {
      const dId = query.department_id || query.departmentId;
      if (mongoose.Types.ObjectId.isValid(dId)) {
        filter.department_id = new mongoose.Types.ObjectId(dId);
      }
    }

    if (query.status && query.status !== 'All') {
      filter.status = query.status.toUpperCase();
    }

    const heads = await DepartmentHead.find(filter)
      .populate('hospital_id', 'name code')
      .populate('department_id', 'name code')
      .sort({ created_at: -1 });

    return heads.map((h) => ({
      id: h._id.toString(),
      headId: h._id.toString(),
      userId: h.user_id.toString(),
      hospitalId: h.hospital_id?._id?.toString() || h.hospital_id?.toString(),
      hospitalName: h.hospital_id?.name || null,
      departmentId: h.department_id?._id?.toString() || h.department_id?.toString(),
      departmentName: h.department_id?.name || null,
      fullName: h.full_name,
      email: h.email,
      phone: h.phone,
      specialization: h.specialization,
      status: h.status,
      createdAt: h.created_at,
      updatedAt: h.updated_at,
    }));
  },

  getDepartmentHeadById: async (headId, user = null) => {
    let head;
    if (mongoose.Types.ObjectId.isValid(headId)) {
      head = await DepartmentHead.findById(headId)
        .populate('hospital_id', 'name code')
        .populate('department_id', 'name code');
    } else {
      const err = new Error('Invalid department head ID');
      err.statusCode = 400;
      throw err;
    }

    if (!head) {
      const err = new Error('Department head not found');
      err.statusCode = 404;
      throw err;
    }

    // Hospital Admin scope enforcement
    if (user && user.role === 'HOSPITAL_ADMIN') {
      const hospId = head.hospital_id?._id?.toString() || head.hospital_id?.toString();
      const hospCode = head.hospital_id?.code;
      const assigned = user.hospitalId ? user.hospitalId.toString() : '';

      if (assigned !== hospId && assigned !== hospCode) {
        const err = new Error('Access forbidden: hospital admin is restricted to their assigned hospital');
        err.statusCode = 403;
        throw err;
      }
    }

    return {
      id: head._id.toString(),
      headId: head._id.toString(),
      userId: head.user_id.toString(),
      hospitalId: head.hospital_id?._id?.toString() || head.hospital_id?.toString(),
      hospitalName: head.hospital_id?.name,
      departmentId: head.department_id?._id?.toString() || head.department_id?.toString(),
      departmentName: head.department_id?.name,
      fullName: head.full_name,
      email: head.email,
      phone: head.phone,
      specialization: head.specialization,
      status: head.status,
      createdAt: head.created_at,
      updatedAt: head.updated_at,
    };
  },

  updateDepartmentHead: async (headId, updateData, user) => {
    if (!['CHAIRMAN', 'HOSPITAL_ADMIN'].includes(user.role)) {
      const err = new Error('Access forbidden: insufficient role permissions');
      err.statusCode = 403;
      throw err;
    }

    if (!mongoose.Types.ObjectId.isValid(headId)) {
      const err = new Error('Invalid department head ID');
      err.statusCode = 400;
      throw err;
    }

    const head = await DepartmentHead.findById(headId);
    if (!head) {
      const err = new Error('Department head not found');
      err.statusCode = 404;
      throw err;
    }

    // Hospital Admin scope enforcement
    if (user.role === 'HOSPITAL_ADMIN') {
      const assigned = user.hospitalId ? user.hospitalId.toString() : '';
      if (assigned !== head.hospital_id.toString()) {
        const err = new Error('Access forbidden: hospital admin is restricted to their assigned hospital');
        err.statusCode = 403;
        throw err;
      }
    }

    if (updateData.full_name || updateData.fullName) {
      head.full_name = (updateData.full_name || updateData.fullName).trim();
    }
    if (updateData.email) head.email = updateData.email.trim().toLowerCase();
    if (updateData.phone) head.phone = updateData.phone.trim();
    if (updateData.specialization !== undefined) head.specialization = updateData.specialization;
    if (updateData.status && ['ACTIVE', 'INACTIVE'].includes(updateData.status.toUpperCase())) {
      head.status = updateData.status.toUpperCase();
    }

    await head.save();

    return {
      id: head._id.toString(),
      headId: head._id.toString(),
      status: head.status,
      fullName: head.full_name,
      updatedAt: head.updated_at,
    };
  },
};

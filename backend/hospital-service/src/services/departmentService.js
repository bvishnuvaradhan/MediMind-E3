import mongoose from 'mongoose';
import Department from '../models/Department.js';
import DepartmentHead from '../models/DepartmentHead.js';
import Hospital from '../models/Hospital.js';

export const departmentService = {
  createDepartment: async (data, user) => {
    // 1. Role verification
    if (!['CHAIRMAN', 'HOSPITAL_ADMIN'].includes(user.role)) {
      const err = new Error('Access forbidden: insufficient role permissions');
      err.statusCode = 403;
      throw err;
    }

    let targetHospitalId = data.hospital_id || data.hospitalId;

    // 2. Hospital Admin scope enforcement
    if (user.role === 'HOSPITAL_ADMIN') {
      if (!targetHospitalId) {
        targetHospitalId = user.hospitalId;
      } else if (user.hospitalId && user.hospitalId.toString() !== targetHospitalId.toString()) {
        const err = new Error('Access forbidden: hospital admin cannot create departments in another hospital');
        err.statusCode = 403;
        throw err;
      }
    }

    if (!targetHospitalId) {
      const err = new Error('hospital_id is required');
      err.statusCode = 400;
      throw err;
    }

    if (!data.name || !data.name.trim()) {
      const err = new Error('Department name is required');
      err.statusCode = 400;
      throw err;
    }

    // Verify hospital exists
    let hospital;
    if (mongoose.Types.ObjectId.isValid(targetHospitalId)) {
      hospital = await Hospital.findById(targetHospitalId);
    } else {
      hospital = await Hospital.findOne({ code: targetHospitalId });
    }

    if (!hospital) {
      const err = new Error('Target hospital does not exist');
      err.statusCode = 404;
      throw err;
    }

    // Duplicate check within hospital
    const existing = await Department.findOne({
      hospital_id: hospital._id,
      name: new RegExp(`^${data.name.trim()}$`, 'i'),
    });

    if (existing) {
      const err = new Error(`Department with name '${data.name.trim()}' already exists in this hospital`);
      err.statusCode = 409;
      throw err;
    }

    const department = await Department.create({
      hospital_id: hospital._id,
      name: data.name.trim(),
      code: data.code ? data.code.trim().toUpperCase() : null,
      specialization: data.specialization || null,
      floor: data.floor || null,
      bedCapacity: Number(data.bedCapacity) || 0,
      occupiedBeds: Number(data.occupiedBeds) || 0,
      linkedAi: data.linkedAi || null,
      aiModuleId: data.aiModuleId || null,
      description: data.description || null,
      status: data.status ? data.status.toUpperCase() : 'ACTIVE',
    });

    return {
      id: department._id.toString(),
      departmentId: department._id.toString(),
      hospitalId: hospital._id.toString(),
      hospitalName: hospital.name,
      name: department.name,
      code: department.code,
      specialization: department.specialization,
      status: department.status,
      createdAt: department.created_at,
    };
  },

  listDepartments: async (query = {}, user = null) => {
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

    if (query.status && query.status !== 'All') {
      filter.status = query.status.toUpperCase();
    }

    if (query.search) {
      filter.$or = [
        { name: new RegExp(query.search, 'i') },
        { code: new RegExp(query.search, 'i') },
        { specialization: new RegExp(query.search, 'i') },
      ];
    }

    const departments = await Department.find(filter).populate('hospital_id', 'name code').sort({ name: 1 });

    const enriched = await Promise.all(
      departments.map(async (d) => {
        const heads = await DepartmentHead.find({ department_id: d._id, status: 'ACTIVE' });
        return {
          id: d._id.toString(),
          departmentId: d._id.toString(),
          hospitalId: d.hospital_id?._id?.toString() || d.hospital_id?.toString(),
          hospitalName: d.hospital_id?.name || null,
          name: d.name,
          code: d.code,
          specialization: d.specialization,
          floor: d.floor,
          bedCapacity: d.bedCapacity,
          occupiedBeds: d.occupiedBeds,
          linkedAi: d.linkedAi,
          aiModuleId: d.aiModuleId,
          description: d.description,
          status: d.status,
          headsCount: heads.length,
          headName: heads.length > 0 ? heads.map((h) => h.full_name).join(', ') : 'Unassigned',
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        };
      })
    );

    return enriched;
  },

  getDepartmentById: async (departmentId, user = null) => {
    let department;
    if (mongoose.Types.ObjectId.isValid(departmentId)) {
      department = await Department.findById(departmentId).populate('hospital_id', 'name code');
    } else {
      department = await Department.findOne({ code: departmentId }).populate('hospital_id', 'name code');
    }

    if (!department) {
      const err = new Error('Department not found');
      err.statusCode = 404;
      throw err;
    }

    // Hospital Admin scope enforcement
    if (user && user.role === 'HOSPITAL_ADMIN') {
      const hospId = department.hospital_id?._id?.toString() || department.hospital_id?.toString();
      const hospCode = department.hospital_id?.code;
      const assigned = user.hospitalId ? user.hospitalId.toString() : '';

      if (assigned !== hospId && assigned !== hospCode) {
        const err = new Error('Access forbidden: hospital admin is restricted to their assigned hospital');
        err.statusCode = 403;
        throw err;
      }
    }

    const heads = await DepartmentHead.find({ department_id: department._id, status: 'ACTIVE' });

    return {
      id: department._id.toString(),
      departmentId: department._id.toString(),
      hospitalId: department.hospital_id?._id?.toString() || department.hospital_id?.toString(),
      hospitalName: department.hospital_id?.name,
      name: department.name,
      code: department.code,
      specialization: department.specialization,
      floor: department.floor,
      bedCapacity: department.bedCapacity,
      occupiedBeds: department.occupiedBeds,
      linkedAi: department.linkedAi,
      aiModuleId: department.aiModuleId,
      description: department.description,
      status: department.status,
      headsCount: heads.length,
      heads: heads.map((h) => ({
        id: h._id.toString(),
        userId: h.user_id.toString(),
        fullName: h.full_name,
        email: h.email,
        phone: h.phone,
        status: h.status,
      })),
      createdAt: department.created_at,
      updatedAt: department.updated_at,
    };
  },

  updateDepartment: async (departmentId, updateData, user) => {
    let department;
    if (mongoose.Types.ObjectId.isValid(departmentId)) {
      department = await Department.findById(departmentId).populate('hospital_id', 'name code');
    } else {
      department = await Department.findOne({ code: departmentId }).populate('hospital_id', 'name code');
    }

    if (!department) {
      const err = new Error('Department not found');
      err.statusCode = 404;
      throw err;
    }

    // Role check & Scoping
    if (user.role === 'HOSPITAL_ADMIN') {
      const hospId = department.hospital_id?._id?.toString() || department.hospital_id?.toString();
      const hospCode = department.hospital_id?.code;
      const assigned = user.hospitalId ? user.hospitalId.toString() : '';

      if (assigned !== hospId && assigned !== hospCode) {
        const err = new Error('Access forbidden: hospital admin is restricted to their assigned hospital');
        err.statusCode = 403;
        throw err;
      }
    } else if (user.role === 'DEPARTMENT_HEAD') {
      if (user.departmentId && user.departmentId.toString() !== department._id.toString()) {
        const err = new Error('Access forbidden: department head is restricted to their own department');
        err.statusCode = 403;
        throw err;
      }
    } else if (user.role !== 'CHAIRMAN') {
      const err = new Error('Access forbidden: insufficient role permissions');
      err.statusCode = 403;
      throw err;
    }

    // Duplicate check if renaming
    if (updateData.name && updateData.name.trim() !== department.name) {
      const existing = await Department.findOne({
        _id: { $ne: department._id },
        hospital_id: department.hospital_id?._id || department.hospital_id,
        name: new RegExp(`^${updateData.name.trim()}$`, 'i'),
      });
      if (existing) {
        const err = new Error(`Department with name '${updateData.name.trim()}' already exists in this hospital`);
        err.statusCode = 409;
        throw err;
      }
      department.name = updateData.name.trim();
    }

    if (updateData.code !== undefined) department.code = updateData.code ? updateData.code.trim().toUpperCase() : null;
    if (updateData.specialization !== undefined) department.specialization = updateData.specialization;
    if (updateData.floor !== undefined) department.floor = updateData.floor;
    if (updateData.bedCapacity !== undefined) department.bedCapacity = Number(updateData.bedCapacity);
    if (updateData.occupiedBeds !== undefined) department.occupiedBeds = Number(updateData.occupiedBeds);
    if (updateData.linkedAi !== undefined) department.linkedAi = updateData.linkedAi;
    if (updateData.aiModuleId !== undefined) department.aiModuleId = updateData.aiModuleId;
    if (updateData.description !== undefined) department.description = updateData.description;
    if (updateData.status && ['ACTIVE', 'INACTIVE'].includes(updateData.status.toUpperCase())) {
      department.status = updateData.status.toUpperCase();
    }

    await department.save();

    return {
      id: department._id.toString(),
      departmentId: department._id.toString(),
      name: department.name,
      code: department.code,
      status: department.status,
      updatedAt: department.updated_at,
    };
  },
};

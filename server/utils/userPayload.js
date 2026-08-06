import mongoose from 'mongoose';

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value) && String(new mongoose.Types.ObjectId(value)) === String(value);

/** Map text department input to departmentName or ObjectId department */
export function applyDepartmentFields(target, body) {
  const deptText = body.departmentName ?? body.department;
  if (typeof deptText === 'string' && deptText.trim()) {
    if (isObjectId(deptText.trim())) {
      target.department = deptText.trim();
    } else {
      target.departmentName = deptText.trim();
      target.department = undefined;
    }
  } else if (deptText && typeof deptText === 'object' && deptText._id) {
    target.department = deptText._id;
  }
}

/** Normalize user payload — department text goes to departmentName, not ObjectId field */
export function sanitizeUserPayload(body, { isUpdate = false } = {}) {
  const data = { ...body };

  const firstName = String(data.firstName || '').trim();
  const lastName = String(data.lastName || '').trim();
  const email = String(data.email || '').trim().toLowerCase();

  if (!firstName) {
    const err = new Error('First name is required');
    err.statusCode = 400;
    throw err;
  }
  if (!lastName) {
    const err = new Error('Last name is required');
    err.statusCode = 400;
    throw err;
  }
  if (!email) {
    const err = new Error('Email is required');
    err.statusCode = 400;
    throw err;
  }
  if (!isUpdate && !data.password) {
    // Hire flow — admin sets password later; temporary credential generated server-side
    delete data.password;
  }

  data.firstName = firstName;
  data.lastName = lastName;
  data.email = email;

  applyDepartmentFields(data, data);
  if (!data.department) delete data.department;

  // team must be valid ObjectId or omitted
  if (data.team) {
    if (isObjectId(String(data.team))) {
      data.team = String(data.team);
    } else {
      delete data.team;
    }
  } else {
    delete data.team;
  }

  if (data.phone === '') delete data.phone;
  if (data.password === '') delete data.password;

  // username
  if (data.username !== undefined) {
    const u = String(data.username || '').trim().toLowerCase();
    if (u) data.username = u;
    else delete data.username;
  }

  // employmentType
  const validTypes = ['full_time', 'part_time', 'contract'];
  if (data.employmentType !== undefined) {
    if (validTypes.includes(data.employmentType)) {
      data.employmentType = data.employmentType;
    } else {
      delete data.employmentType;
    }
  }

  if (data.joiningDate !== undefined) {
    const d = data.joiningDate;
    if (d) data.joiningDate = new Date(d);
    else delete data.joiningDate;
  }

  if (data.isActive !== undefined) {
    data.isActive = Boolean(data.isActive);
  }

  if (data.roleId === '' || data.roleId === null) {
    delete data.roleId;
  } else if (data.roleId && isObjectId(String(data.roleId))) {
    data.roleId = String(data.roleId);
  } else {
    delete data.roleId;
  }

  if (data.staffRole === '' || data.staffRole === null) {
    delete data.staffRole;
  } else if (data.staffRole && isObjectId(String(data.staffRole))) {
    data.staffRole = String(data.staffRole);
  } else {
    delete data.staffRole;
  }

  if (data.reportsTo === '' || data.reportsTo === null) {
    delete data.reportsTo;
  } else if (data.reportsTo && isObjectId(String(data.reportsTo))) {
    data.reportsTo = String(data.reportsTo);
  } else {
    delete data.reportsTo;
  }

  if (data.workTeam === '' || data.workTeam === null) {
    delete data.workTeam;
  } else if (data.workTeam && isObjectId(String(data.workTeam))) {
    data.workTeam = String(data.workTeam);
  } else {
    delete data.workTeam;
  }

  if (data.employeeId !== undefined) {
    const employeeId = String(data.employeeId || '').trim();
    if (employeeId) data.employeeId = employeeId;
    else delete data.employeeId;
  }

  if (data.hrProfile && typeof data.hrProfile === 'object') {
    const hp = { ...data.hrProfile };
    if (hp.dateOfBirth) hp.dateOfBirth = new Date(hp.dateOfBirth);
    else delete hp.dateOfBirth;
    if (hp.experienceYears !== undefined && hp.experienceYears !== '') {
      hp.experienceYears = Number(hp.experienceYears);
    } else {
      delete hp.experienceYears;
    }
    if (hp.salary !== undefined && hp.salary !== '') {
      hp.salary = Number(hp.salary);
    } else {
      delete hp.salary;
    }
    const doc = hp.documents || {};
    hp.documents = {
      resume: doc.resume || undefined,
      aadhaar: doc.aadhaar || undefined,
      pan: doc.pan || undefined,
      educationalCertificates: doc.educationalCertificates || undefined,
      passportPhoto: doc.passportPhoto || undefined,
    };
    Object.keys(hp).forEach((k) => {
      if (hp[k] === '' || hp[k] === null) delete hp[k];
    });
    data.hrProfile = hp;
  } else {
    delete data.hrProfile;
  }

  return data;
}

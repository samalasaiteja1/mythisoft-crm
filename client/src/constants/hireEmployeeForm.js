export const HIRE_EMPLOYEE_STEPS = [
  { id: 1, label: 'Personal', hint: 'Name, contact, address' },
  { id: 2, label: 'Employment', hint: 'Department, role, manager' },
  { id: 3, label: 'Login', hint: 'Personal email & password' },
  { id: 4, label: 'Salary', hint: 'Pay & bank details' },
  { id: 5, label: 'Skills', hint: 'Qualifications & skills' },
  { id: 6, label: 'Emergency', hint: 'Emergency contact' },
  { id: 7, label: 'Documents', hint: 'Upload files' },
  { id: 8, label: 'Additional', hint: 'Remarks' },
];

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export const SHIFT_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'morning', label: 'Morning' },
  { value: 'evening', label: 'Evening' },
  { value: 'night', label: 'Night' },
];

export const SALARY_TYPE_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'annual', label: 'Annual' },
  { value: 'hourly', label: 'Hourly' },
];

export const QUALIFICATION_OPTIONS = [
  { value: 'high_school', label: 'High School' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'bachelors', label: "Bachelor's Degree" },
  { value: 'masters', label: "Master's Degree" },
  { value: 'phd', label: 'PhD / Doctorate' },
  { value: 'other', label: 'Other' },
];

export const RELATIONSHIP_OPTIONS = [
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'friend', label: 'Friend' },
  { value: 'other', label: 'Other' },
];

export const EMPLOYMENT_TYPE_OPTIONS = [
  { value: 'full_time', label: 'Full-Time' },
  { value: 'part_time', label: 'Part-Time' },
  { value: 'contract', label: 'Contract' },
];

export const emptyHrProfile = () => ({
  gender: 'male',
  dateOfBirth: '',
  personalEmail: '',
  address: '',
  city: '',
  state: '',
  country: '',
  pinCode: '',
  designation: '',
  workLocation: '',
  shift: 'general',
  salary: '',
  salaryType: 'monthly',
  bankName: '',
  accountHolderName: '',
  accountNumber: '',
  ifscCode: '',
  highestQualification: 'bachelors',
  experienceYears: '',
  primarySkill: '',
  secondarySkill: '',
  certifications: '',
  emergencyContactName: '',
  emergencyContactRelationship: 'father',
  emergencyContactPhone: '',
  remarks: '',
  documents: {
    resume: '',
    aadhaar: '',
    pan: '',
    educationalCertificates: '',
    passportPhoto: '',
  },
});

export const emptyHireEmployeeForm = () => ({
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  employeeId: '',
  departmentId: '',
  roleId: '',
  reportsTo: '',
  joiningDate: '',
  employmentType: 'full_time',
  isActive: true,
  password: '',
  hrProfile: emptyHrProfile(),
});

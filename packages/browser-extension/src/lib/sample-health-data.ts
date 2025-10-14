/**
 * Sample Health Data for Testing
 *
 * Use these to populate Nillion storage for development/demo purposes
 */

export const sampleDiagnoses = [
  {
    date: '2024-12-15',
    icd10Codes: ['E11.9'],
    description: 'Type 2 diabetes mellitus without complications',
    severity: 'moderate',
    status: 'active',
    notes: 'Well controlled with metformin',
  },
  {
    date: '2024-11-20',
    icd10Codes: ['I10'],
    description: 'Essential (primary) hypertension',
    severity: 'mild',
    status: 'active',
    notes: 'Stage 1 hypertension, lifestyle modifications recommended',
  },
];

export const sampleBiomarkers = [
  {
    date: '2025-01-10',
    name: 'Hemoglobin A1c',
    value: 6.8,
    unit: '%',
    referenceRange: { min: 4.0, max: 5.6 },
    status: 'elevated',
    notes: 'Trending down from 7.2% three months ago',
  },
  {
    date: '2025-01-10',
    name: 'LDL Cholesterol',
    value: 125,
    unit: 'mg/dL',
    referenceRange: { min: 0, max: 100 },
    status: 'elevated',
    notes: 'Consider statin therapy',
  },
  {
    date: '2025-01-10',
    name: 'Blood Glucose (Fasting)',
    value: 105,
    unit: 'mg/dL',
    referenceRange: { min: 70, max: 100 },
    status: 'elevated',
    notes: 'Slightly elevated, monitor closely',
  },
];

export const sampleVitals = [
  {
    date: '2025-01-15',
    type: 'blood_pressure',
    systolic: 128,
    diastolic: 82,
    unit: 'mmHg',
    notes: 'Measured at home, resting',
  },
  {
    date: '2025-01-15',
    type: 'heart_rate',
    value: 72,
    unit: 'bpm',
    notes: 'Resting heart rate',
  },
  {
    date: '2025-01-15',
    type: 'weight',
    value: 82.5,
    unit: 'kg',
    notes: 'Morning weight',
  },
  {
    date: '2025-01-15',
    type: 'temperature',
    value: 36.8,
    unit: '°C',
    notes: 'Oral temperature',
  },
];

export const sampleMedications = [
  {
    name: 'Metformin',
    dosage: '1000mg',
    frequency: 'twice daily',
    route: 'oral',
    startDate: '2024-06-01',
    status: 'active',
    prescriber: 'Dr. Smith',
    notes: 'Take with meals to reduce GI side effects',
  },
  {
    name: 'Lisinopril',
    dosage: '10mg',
    frequency: 'once daily',
    route: 'oral',
    startDate: '2024-11-25',
    status: 'active',
    prescriber: 'Dr. Johnson',
    notes: 'For blood pressure control',
  },
];

export const sampleAllergies = [
  {
    allergen: 'Penicillin',
    type: 'medication',
    severity: 'severe',
    reaction: 'Anaphylaxis',
    dateIdentified: '2010-03-15',
    notes: 'Confirmed by allergist, carry EpiPen',
  },
  {
    allergen: 'Peanuts',
    type: 'food',
    severity: 'moderate',
    reaction: 'Hives, swelling',
    dateIdentified: '2005-08-20',
    notes: 'Avoid all peanut products',
  },
];

/**
 * Get all sample health data organized by type
 */
export function getAllSampleHealthData() {
  return {
    diagnoses: sampleDiagnoses,
    biomarkers: sampleBiomarkers,
    vitals: sampleVitals,
    medications: sampleMedications,
    allergies: sampleAllergies,
  };
}

/**
 * Get sample data for a specific health record type
 */
export function getSampleData(type: string) {
  const allData = getAllSampleHealthData();
  return allData[type as keyof typeof allData] || [];
}

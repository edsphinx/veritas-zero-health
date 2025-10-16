'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { FileText, Plus, Lock, AlertCircle, CheckCircle, Calendar } from 'lucide-react';
import { PatientLayout } from '@/presentation/components/layout';

interface MedicalRecord {
  id: string;
  type: 'diagnosis' | 'biomarker' | 'vital' | 'medication' | 'allergy';
  name: string;
  value: string;
  unit?: string;
  date: string;
  source: string;
  encrypted: boolean;
}

export default function PatientRecordsPage() {
  const { address, isConnected } = useAccount();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasHealthIdentity, setHasHealthIdentity] = useState(false);

  useEffect(() => {
    if (isConnected) {
      loadRecords();
    }
  }, [isConnected]);

  const loadRecords = async () => {
    try {
      setLoading(true);

      // TODO: Check if patient has HealthIdentitySBT
      // const sbtBalance = await healthIdentitySBT.balanceOf(address);
      // setHasHealthIdentity(sbtBalance > 0);

      // Mock: assume they have SBT for demo
      setHasHealthIdentity(true);

      // TODO: Fetch from Nillion via browser extension
      // For now, mock data showing what would be stored
      const mockRecords: MedicalRecord[] = [
        // Personal Info (for ZK proofs)
        {
          id: '1',
          type: 'vital',
          name: 'Date of Birth',
          value: '1985-03-15',
          date: '2024-01-01',
          source: 'Patient Reported',
          encrypted: true,
        },
        {
          id: '2',
          type: 'vital',
          name: 'Age',
          value: '39',
          unit: 'years',
          date: '2024-10-14',
          source: 'Calculated',
          encrypted: true,
        },

        // Diagnoses
        {
          id: '3',
          type: 'diagnosis',
          name: 'Type 2 Diabetes Mellitus',
          value: 'E11.9',
          date: '2020-06-15',
          source: 'City General Hospital',
          encrypted: true,
        },
        {
          id: '4',
          type: 'diagnosis',
          name: 'Essential Hypertension',
          value: 'I10',
          date: '2019-03-20',
          source: 'City General Hospital',
          encrypted: true,
        },

        // Biomarkers
        {
          id: '5',
          type: 'biomarker',
          name: 'HbA1c',
          value: '7.2',
          unit: '%',
          date: '2024-09-01',
          source: 'Lab Corp',
          encrypted: true,
        },
        {
          id: '6',
          type: 'biomarker',
          name: 'Fasting Glucose',
          value: '145',
          unit: 'mg/dL',
          date: '2024-09-01',
          source: 'Lab Corp',
          encrypted: true,
        },
        {
          id: '7',
          type: 'biomarker',
          name: 'Total Cholesterol',
          value: '195',
          unit: 'mg/dL',
          date: '2024-09-01',
          source: 'Lab Corp',
          encrypted: true,
        },

        // Vital Signs
        {
          id: '8',
          type: 'vital',
          name: 'Blood Pressure',
          value: '135/85',
          unit: 'mmHg',
          date: '2024-10-10',
          source: 'Home Monitor',
          encrypted: true,
        },
        {
          id: '9',
          type: 'vital',
          name: 'Weight',
          value: '82',
          unit: 'kg',
          date: '2024-10-10',
          source: 'Home Scale',
          encrypted: true,
        },

        // Medications
        {
          id: '10',
          type: 'medication',
          name: 'Metformin',
          value: '500mg twice daily',
          date: '2020-06-15',
          source: 'City General Hospital',
          encrypted: true,
        },
        {
          id: '11',
          type: 'medication',
          name: 'Lisinopril',
          value: '10mg daily',
          date: '2019-03-20',
          source: 'City General Hospital',
          encrypted: true,
        },

        // Allergies
        {
          id: '12',
          type: 'allergy',
          name: 'Penicillin',
          value: 'Severe allergic reaction',
          date: '2015-01-10',
          source: 'Patient Reported',
          encrypted: true,
        },
      ];

      setRecords(mockRecords);
    } catch (error) {
      console.error('Error loading records:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupRecordsByType = () => {
    return {
      vital: records.filter((r) => r.type === 'vital'),
      diagnosis: records.filter((r) => r.type === 'diagnosis'),
      biomarker: records.filter((r) => r.type === 'biomarker'),
      medication: records.filter((r) => r.type === 'medication'),
      allergy: records.filter((r) => r.type === 'allergy'),
    };
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      vital: 'bg-blue-100 text-blue-800 border-blue-200',
      diagnosis: 'bg-red-100 text-red-800 border-red-200',
      biomarker: 'bg-green-100 text-green-800 border-green-200',
      medication: 'bg-purple-100 text-purple-800 border-purple-200',
      allergy: 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (!isConnected) {
    return (
      <PatientLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <h2 className="text-3xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-muted-foreground">
              Please connect your wallet to view your medical records
            </p>
          </div>
        </div>
      </PatientLayout>
    );
  }

  if (!hasHealthIdentity) {
    return (
      <PatientLayout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-8 text-center">
            <AlertCircle className="h-16 w-16 text-warning mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">No Health Identity Found</h2>
            <p className="text-muted-foreground mb-6">
              You need to create your DASHI Health Identity (SBT) before you can store medical
              records.
            </p>
            <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold">
              Create Health Identity
            </button>
          </div>
        </div>
      </PatientLayout>
    );
  }

  const groupedRecords = groupRecordsByType();

  return (
    <PatientLayout>
      <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">My Medical Records</h1>
        <p className="text-gray-600">
          All your health data is encrypted and stored securely with Nillion
        </p>
      </div>

      {/* Privacy Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <div className="flex items-start gap-4">
          <Lock className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-2">
              End-to-End Encrypted Storage
            </h3>
            <p className="text-sm text-blue-800 leading-relaxed mb-3">
              Your medical records are encrypted and stored on Nillion's decentralized network.
              Only you control access to this data. When applying to clinical trials, Zero-Knowledge
              Proofs are generated locally in your browser - your actual data never leaves your
              device.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-blue-800">End-to-end encrypted</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-blue-800">You control access</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-blue-800">ZK proofs for privacy</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-600 mb-1">Vital Signs</p>
          <p className="text-2xl font-bold text-blue-900">{groupedRecords.vital.length}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-sm text-red-600 mb-1">Diagnoses</p>
          <p className="text-2xl font-bold text-red-900">{groupedRecords.diagnosis.length}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-green-600 mb-1">Biomarkers</p>
          <p className="text-2xl font-bold text-green-900">{groupedRecords.biomarker.length}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-sm text-purple-600 mb-1">Medications</p>
          <p className="text-2xl font-bold text-purple-900">{groupedRecords.medication.length}</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <p className="text-sm text-orange-600 mb-1">Allergies</p>
          <p className="text-2xl font-bold text-orange-900">{groupedRecords.allergy.length}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading medical records...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No medical records found</p>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Medical Record
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Vital Signs */}
          {groupedRecords.vital.length > 0 && (
            <RecordSection title="Vital Signs & Personal Info" records={groupedRecords.vital} />
          )}

          {/* Diagnoses */}
          {groupedRecords.diagnosis.length > 0 && (
            <RecordSection title="Diagnoses" records={groupedRecords.diagnosis} />
          )}

          {/* Biomarkers */}
          {groupedRecords.biomarker.length > 0 && (
            <RecordSection title="Biomarkers & Lab Results" records={groupedRecords.biomarker} />
          )}

          {/* Medications */}
          {groupedRecords.medication.length > 0 && (
            <RecordSection title="Current Medications" records={groupedRecords.medication} />
          )}

          {/* Allergies */}
          {groupedRecords.allergy.length > 0 && (
            <RecordSection title="Allergies" records={groupedRecords.allergy} />
          )}
        </div>
      )}

      {/* How It Works */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          How Your Data is Used for Clinical Trials
        </h3>
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex items-start gap-3">
            <span className="font-bold">1.</span>
            <p>
              Your medical records are stored encrypted on Nillion and synced to your browser
              extension
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-bold">2.</span>
            <p>
              When you apply to a study, the extension reads your encrypted data (e.g., age:
              39 years)
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-bold">3.</span>
            <p>
              A Zero-Knowledge Proof is generated proving you meet criteria (e.g., age 18-65)
              WITHOUT revealing your actual age
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-bold">4.</span>
            <p>
              The proof is verified on-chain - researchers only see that you qualify, never
              your personal data
            </p>
          </div>
        </div>
      </div>
      </div>
    </PatientLayout>
  );
}

function RecordSection({
  title,
  records,
}: {
  title: string;
  records: MedicalRecord[];
}) {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <div className="space-y-3">
        {records.map((record) => (
          <div
            key={record.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg">{record.name}</h3>
                  {record.encrypted && (
                    <span title="Encrypted">
                      <Lock className="h-4 w-4 text-green-600" />
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-mono text-lg text-gray-900">
                    {record.value}
                    {record.unit && <span className="text-gray-600 ml-1">{record.unit}</span>}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(record.date).toLocaleDateString()}
                  </span>
                  <span>Source: {record.source}</span>
                </div>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  record.type === 'vital'
                    ? 'bg-blue-100 text-blue-800'
                    : record.type === 'diagnosis'
                    ? 'bg-red-100 text-red-800'
                    : record.type === 'biomarker'
                    ? 'bg-green-100 text-green-800'
                    : record.type === 'medication'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-orange-100 text-orange-800'
                }`}
              >
                {record.type}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

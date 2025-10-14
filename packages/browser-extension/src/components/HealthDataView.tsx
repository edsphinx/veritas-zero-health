import { useState, useEffect } from 'react';
import { VeritasNillionClient, type HealthRecord, type HealthRecordType } from '../lib/nillion-client';
import type { Diagnosis, Biomarker, Vital, Medication, Allergy } from '../types/health-records';
import { getAllSampleHealthData } from '../lib/sample-health-data';
import { LoadingScreen } from './LoadingScreen';

interface HealthDataViewProps {
  onBack: () => void;
  userDID: string;
}

export function HealthDataView({ onBack, userDID }: HealthDataViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allRecords, setAllRecords] = useState<Map<HealthRecordType, HealthRecord[]>>(new Map());
  const [selectedType, setSelectedType] = useState<HealthRecordType | 'all'>('all');

  useEffect(() => {
    initializeAndFetchData();
  }, [userDID]);

  async function initializeAndFetchData() {
    setLoading(true);
    setError(null);

    try {
      // Initialize Nillion client
      const client = new VeritasNillionClient();
      await client.initialize(userDID);

      // Fetch all health records
      const records = await client.getAllRecords();
      setAllRecords(records);

      console.log('✅ Loaded health records from Nillion');
    } catch (err) {
      console.warn('⚠️ Failed to load from Nillion, using sample data:', err);

      // Fall back to sample data if Nillion API is unavailable
      const sampleData = getAllSampleHealthData();
      const recordsMap = new Map<HealthRecordType, HealthRecord[]>();

      recordsMap.set('diagnoses', sampleData.diagnoses.map((d: any) => ({
        id: d.id,
        type: 'diagnoses' as HealthRecordType,
        data: d,
        timestamp: Date.now(),
        userId: userDID,
      })));

      recordsMap.set('biomarkers', sampleData.biomarkers.map((b: any) => ({
        id: b.id,
        type: 'biomarkers' as HealthRecordType,
        data: b,
        timestamp: Date.now(),
        userId: userDID,
      })));

      recordsMap.set('vitals', sampleData.vitals.map((v: any) => ({
        id: v.id,
        type: 'vitals' as HealthRecordType,
        data: v,
        timestamp: Date.now(),
        userId: userDID,
      })));

      recordsMap.set('medications', sampleData.medications.map((m: any) => ({
        id: m.id,
        type: 'medications' as HealthRecordType,
        data: m,
        timestamp: Date.now(),
        userId: userDID,
      })));

      recordsMap.set('allergies', sampleData.allergies.map((a: any) => ({
        id: a.id,
        type: 'allergies' as HealthRecordType,
        data: a,
        timestamp: Date.now(),
        userId: userDID,
      })));

      setAllRecords(recordsMap);
      console.log('✅ Using sample data for demonstration');
    } finally {
      setLoading(false);
    }
  }

  const recordTypes: { type: HealthRecordType; icon: string; label: string }[] = [
    { type: 'diagnoses', icon: '🏥', label: 'Diagnoses' },
    { type: 'biomarkers', icon: '🧬', label: 'Lab Results' },
    { type: 'vitals', icon: '❤️', label: 'Vital Signs' },
    { type: 'medications', icon: '💊', label: 'Medications' },
    { type: 'allergies', icon: '⚠️', label: 'Allergies' },
  ];

  function getTotalRecordCount(): number {
    let total = 0;
    allRecords.forEach((records) => {
      total += records.length;
    });
    return total;
  }

  function getRecordsForType(type: HealthRecordType | 'all') {
    if (type === 'all') {
      const all: any[] = [];
      allRecords.forEach((records, recordType) => {
        records.forEach((record) => {
          all.push({ ...record, recordType });
        });
      });
      return all;
    }
    return allRecords.get(type) || [];
  }

  function renderDiagnosis(diagnosis: Diagnosis) {
    return (
      <div key={diagnosis.id} className="health-record-card">
        <div className="record-header">
          <span className="record-icon">🏥</span>
          <div className="record-title-group">
            <div className="record-title">{diagnosis.description}</div>
            <div className="record-date">{new Date(diagnosis.date).toLocaleDateString()}</div>
          </div>
          {diagnosis.severity && (
            <span className={`severity-badge severity-${diagnosis.severity}`}>
              {diagnosis.severity}
            </span>
          )}
        </div>
        <div className="record-details">
          <div className="detail-item">
            <span className="detail-label">ICD-10 Codes:</span>
            <span className="detail-value">{diagnosis.icd10Codes.join(', ')}</span>
          </div>
          {diagnosis.status && (
            <div className="detail-item">
              <span className="detail-label">Status:</span>
              <span className="detail-value">{diagnosis.status}</span>
            </div>
          )}
          {diagnosis.notes && (
            <div className="detail-item">
              <span className="detail-label">Notes:</span>
              <span className="detail-value">{diagnosis.notes}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderBiomarker(biomarker: Biomarker) {
    return (
      <div key={biomarker.id} className="health-record-card">
        <div className="record-header">
          <span className="record-icon">🧬</span>
          <div className="record-title-group">
            <div className="record-title">{biomarker.testName}</div>
            <div className="record-date">{new Date(biomarker.date).toLocaleDateString()}</div>
          </div>
          <span className="type-badge">{biomarker.type}</span>
        </div>
        <div className="record-details">
          {Object.entries(biomarker.values).map(([name, value]) => (
            <div key={name} className="detail-item">
              <span className="detail-label">{name}:</span>
              <span className="detail-value">
                {value.value} {value.unit}
                {value.flag && ` (${value.flag})`}
              </span>
            </div>
          ))}
          {biomarker.notes && (
            <div className="detail-item">
              <span className="detail-label">Notes:</span>
              <span className="detail-value">{biomarker.notes}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderVital(vital: Vital) {
    return (
      <div key={vital.id} className="health-record-card">
        <div className="record-header">
          <span className="record-icon">❤️</span>
          <div className="record-title-group">
            <div className="record-title">Vital Signs</div>
            <div className="record-date">{new Date(vital.date).toLocaleDateString()}</div>
          </div>
        </div>
        <div className="record-details">
          {vital.bloodPressure && (
            <div className="detail-item">
              <span className="detail-label">Blood Pressure:</span>
              <span className="detail-value">
                {vital.bloodPressure.systolic}/{vital.bloodPressure.diastolic} mmHg
              </span>
            </div>
          )}
          {vital.heartRate && (
            <div className="detail-item">
              <span className="detail-label">Heart Rate:</span>
              <span className="detail-value">{vital.heartRate} bpm</span>
            </div>
          )}
          {vital.temperature && (
            <div className="detail-item">
              <span className="detail-label">Temperature:</span>
              <span className="detail-value">
                {vital.temperature.value}°{vital.temperature.unit}
              </span>
            </div>
          )}
          {vital.weight && (
            <div className="detail-item">
              <span className="detail-label">Weight:</span>
              <span className="detail-value">
                {vital.weight.value} {vital.weight.unit}
              </span>
            </div>
          )}
          {vital.height && (
            <div className="detail-item">
              <span className="detail-label">Height:</span>
              <span className="detail-value">
                {vital.height.value} {vital.height.unit}
              </span>
            </div>
          )}
          {vital.bmi && (
            <div className="detail-item">
              <span className="detail-label">BMI:</span>
              <span className="detail-value">{vital.bmi.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderMedication(medication: Medication) {
    return (
      <div key={medication.id} className="health-record-card">
        <div className="record-header">
          <span className="record-icon">💊</span>
          <div className="record-title-group">
            <div className="record-title">{medication.name}</div>
            <div className="record-date">
              Started: {new Date(medication.startDate).toLocaleDateString()}
            </div>
          </div>
          <span className={`status-badge status-${medication.status}`}>
            {medication.status}
          </span>
        </div>
        <div className="record-details">
          <div className="detail-item">
            <span className="detail-label">Dosage:</span>
            <span className="detail-value">{medication.dosage}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Frequency:</span>
            <span className="detail-value">{medication.frequency}</span>
          </div>
          {medication.route && (
            <div className="detail-item">
              <span className="detail-label">Route:</span>
              <span className="detail-value">{medication.route}</span>
            </div>
          )}
          {medication.indication && (
            <div className="detail-item">
              <span className="detail-label">Indication:</span>
              <span className="detail-value">{medication.indication}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderAllergy(allergy: Allergy) {
    return (
      <div key={allergy.id} className="health-record-card">
        <div className="record-header">
          <span className="record-icon">⚠️</span>
          <div className="record-title-group">
            <div className="record-title">{allergy.allergen}</div>
            {allergy.dateIdentified && (
              <div className="record-date">
                {new Date(allergy.dateIdentified).toLocaleDateString()}
              </div>
            )}
          </div>
          <span className={`severity-badge severity-${allergy.severity}`}>
            {allergy.severity}
          </span>
        </div>
        <div className="record-details">
          <div className="detail-item">
            <span className="detail-label">Type:</span>
            <span className="detail-value">{allergy.type}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Reaction:</span>
            <span className="detail-value">{allergy.reaction}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Status:</span>
            <span className="detail-value">{allergy.status}</span>
          </div>
        </div>
      </div>
    );
  }

  function renderRecord(record: any) {
    const recordType = record.recordType || record.type || selectedType;
    const data = record.data || record; // Extract data from HealthRecord wrapper

    switch (recordType) {
      case 'diagnoses':
        return renderDiagnosis(data as Diagnosis);
      case 'biomarkers':
        return renderBiomarker(data as Biomarker);
      case 'vitals':
        return renderVital(data as Vital);
      case 'medications':
        return renderMedication(data as Medication);
      case 'allergies':
        return renderAllergy(data as Allergy);
      default:
        return null;
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="header-nav">
          <button onClick={onBack} className="back-button">← Back</button>
          <h2>My Health Data</h2>
        </div>

        <LoadingScreen message="Loading health records..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="header-nav">
          <button onClick={onBack} className="back-button">← Back</button>
          <h2>My Health Data</h2>
        </div>

        <div className="card error-card">
          <p>⚠️ {error}</p>
          <button onClick={initializeAndFetchData} className="button button-secondary" style={{ marginTop: '1rem' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const totalRecords = getTotalRecordCount();
  const displayedRecords = getRecordsForType(selectedType);

  return (
    <div className="container">
      <div className="header-nav">
        <button onClick={onBack} className="back-button">← Back</button>
        <h2>My Health Data</h2>
      </div>

      {/* Summary Card */}
      <div className="card">
        <div className="summary-header">
          <div className="summary-icon">📊</div>
          <div className="summary-content">
            <div className="summary-title">Health Records</div>
            <div className="summary-subtitle">{totalRecords} total records stored securely in Nillion</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          onClick={() => setSelectedType('all')}
          className={`filter-tab ${selectedType === 'all' ? 'active' : ''}`}
        >
          All ({totalRecords})
        </button>
        {recordTypes.map(({ type, icon, label }) => {
          const count = allRecords.get(type)?.length || 0;
          return (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`filter-tab ${selectedType === type ? 'active' : ''}`}
            >
              {icon} {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Records List */}
      <div className="records-list">
        {displayedRecords.length === 0 ? (
          <div className="empty-state">
            <p>📋 No {selectedType !== 'all' ? selectedType : 'health'} records yet</p>
            <p className="hint">
              Records will appear here when you add them through the Veritas Zero Health app
            </p>
          </div>
        ) : (
          displayedRecords.map(record => renderRecord(record))
        )}
      </div>

      <style>{`
        .loading-section {
          text-align: center;
          padding: 3rem 1rem;
        }

        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #e5e7eb;
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        .summary-header {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .summary-icon {
          font-size: 32px;
        }

        .summary-content {
          flex: 1;
        }

        .summary-title {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
        }

        .summary-subtitle {
          font-size: 14px;
          color: #6b7280;
          margin-top: 0.25rem;
        }

        .filter-tabs {
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
          padding: 0.5rem 0;
          margin-bottom: 1rem;
        }

        .filter-tab {
          padding: 0.5rem 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          color: #6b7280;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }

        .filter-tab:hover {
          border-color: #6366f1;
          background: #f5f3ff;
        }

        .filter-tab.active {
          border-color: #6366f1;
          background: #6366f1;
          color: white;
        }

        .records-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .health-record-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 1rem;
        }

        .record-header {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .record-icon {
          font-size: 24px;
        }

        .record-title-group {
          flex: 1;
        }

        .record-title {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
        }

        .record-date {
          font-size: 12px;
          color: #6b7280;
          margin-top: 0.25rem;
        }

        .severity-badge, .type-badge, .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }

        .severity-mild {
          background: #fef3c7;
          color: #92400e;
        }

        .severity-moderate {
          background: #fed7aa;
          color: #9a3412;
        }

        .severity-severe, .severity-life-threatening {
          background: #fecaca;
          color: #991b1b;
        }

        .type-badge {
          background: #dbeafe;
          color: #1e40af;
        }

        .status-active {
          background: #d1fae5;
          color: #065f46;
        }

        .status-discontinued, .status-resolved {
          background: #e5e7eb;
          color: #374151;
        }

        .record-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding-left: 2.75rem;
        }

        .detail-item {
          display: flex;
          gap: 0.5rem;
          font-size: 14px;
        }

        .detail-label {
          color: #6b7280;
          font-weight: 500;
          min-width: 100px;
        }

        .detail-value {
          color: #111827;
        }

        .error-card {
          background: #fef2f2;
          border-color: #fca5a5;
          color: #dc2626;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

<?php

namespace App\Models;

use CodeIgniter\Model;

class RecordModel extends Model
{
    protected $table = 'medical_records';
    protected $primaryKey = 'id';
    protected $returnType = 'array';
    protected $allowedFields = [
        'patient_id',
        'doctor_name',
        'diagnosis',
        'treatment',
        'visit_date',
    ];

    public function findWithPrescriptions(int $id): ?array
    {
        $record = $this->select('medical_records.*, patients.name AS patient_name, patients.nik')
            ->join('patients', 'patients.id = medical_records.patient_id')
            ->where('medical_records.id', $id)
            ->first();

        if (! $record) {
            return null;
        }

        $prescriptionModel = new PrescriptionModel();
        $record['prescriptions'] = $prescriptionModel
            ->select('prescriptions.*, medicines.name AS medicine_name, medicines.unit')
            ->join('medicines', 'medicines.id = prescriptions.medicine_id')
            ->where('prescriptions.record_id', $id)
            ->findAll();

        return $record;
    }
}

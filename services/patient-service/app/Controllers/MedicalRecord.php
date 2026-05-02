<?php

namespace App\Controllers;

use App\Models\PatientModel;
use App\Models\RecordModel;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\RESTful\ResourceController;

class MedicalRecord extends ResourceController
{
    use ResponseTrait;

    protected RecordModel $records;
    protected PatientModel $patients;

    public function __construct()
    {
        $this->records = new RecordModel();
        $this->patients = new PatientModel();
    }

    public function show($id = null)
    {
        $record = $this->records->findWithPrescriptions((int) $id);

        if (! $record) {
            return $this->failNotFound('Medical record not found');
        }

        return $this->respond(['data' => $record]);
    }

    public function create()
    {
        $payload = $this->request->getJSON(true) ?? [];

        $rules = [
            'patient_id' => 'required|integer',
            'doctor_name' => 'required|min_length[3]',
            'diagnosis' => 'required|min_length[3]',
            'treatment' => 'required|min_length[3]',
            'visit_date' => 'required|valid_date[Y-m-d]',
        ];

        if (! $this->validateData($payload, $rules)) {
            return $this->respond([
                'message' => 'Validation failed',
                'errors' => $this->validator->getErrors(),
            ], 422);
        }

        if (! $this->patients->find((int) $payload['patient_id'])) {
            return $this->failNotFound('Patient not found');
        }

        $id = $this->records->insert($payload, true);

        return $this->respondCreated([
            'message' => 'Medical record created',
            'data' => $this->records->findWithPrescriptions((int) $id),
        ]);
    }
}

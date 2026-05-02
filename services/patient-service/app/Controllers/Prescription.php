<?php

namespace App\Controllers;

use App\Models\MedicineModel;
use App\Models\PrescriptionModel;
use App\Models\RecordModel;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\RESTful\ResourceController;

class Prescription extends ResourceController
{
    use ResponseTrait;

    protected PrescriptionModel $prescriptions;
    protected RecordModel $records;
    protected MedicineModel $medicines;

    public function __construct()
    {
        $this->prescriptions = new PrescriptionModel();
        $this->records = new RecordModel();
        $this->medicines = new MedicineModel();
    }

    public function create()
    {
        $payload = $this->request->getJSON(true) ?? [];

        $rules = [
            'record_id' => 'required|integer',
            'medicine_id' => 'required|integer',
            'dosage' => 'required|min_length[2]',
            'instruction' => 'required|min_length[3]',
            'quantity' => 'required|integer|greater_than_equal_to[1]',
        ];

        if (! $this->validateData($payload, $rules)) {
            return $this->respond([
                'message' => 'Validation failed',
                'errors' => $this->validator->getErrors(),
            ], 422);
        }

        if (! $this->records->find((int) $payload['record_id'])) {
            return $this->failNotFound('Medical record not found');
        }

        if (! $this->medicines->find((int) $payload['medicine_id'])) {
            return $this->failNotFound('Medicine not found');
        }

        $id = $this->prescriptions->insert($payload, true);

        return $this->respondCreated([
            'message' => 'Prescription created',
            'data' => $this->prescriptions->findDetail((int) $id),
        ]);
    }
}

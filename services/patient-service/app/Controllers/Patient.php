<?php

namespace App\Controllers;

use App\Models\PatientModel;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\RESTful\ResourceController;

class Patient extends ResourceController
{
    use ResponseTrait;

    protected PatientModel $patients;

    public function __construct()
    {
        $this->patients = new PatientModel();
    }

    public function index()
    {
        $page = max(1, (int) ($this->request->getGet('page') ?? 1));
        $perPage = min(50, max(1, (int) ($this->request->getGet('per_page') ?? 10)));

        return $this->respond($this->patients->pagedList([
            'name' => $this->request->getGet('name'),
            'nik' => $this->request->getGet('nik'),
        ], $page, $perPage));
    }

    public function show($id = null)
    {
        $patient = $this->patients->find((int) $id);

        if (! $patient) {
            return $this->failNotFound('Patient not found');
        }

        return $this->respond(['data' => $patient]);
    }

    public function create()
    {
        $payload = $this->request->getJSON(true) ?? [];

        $rules = [
            'nik' => 'required|exact_length[16]|numeric',
            'name' => 'required|min_length[3]',
            'birth_date' => 'required|valid_date[Y-m-d]',
            'gender' => 'required|in_list[L,P]',
            'phone' => 'required|min_length[8]',
            'address' => 'required|min_length[5]',
        ];

        if (! $this->validateData($payload, $rules)) {
            return $this->respond([
                'message' => 'Validation failed',
                'errors' => $this->validator->getErrors(),
            ], 422);
        }

        if ($this->patients->where('nik', $payload['nik'])->first()) {
            return $this->failResourceExists('Patient NIK already exists');
        }

        $user = json_decode($_SERVER['JWT_PAYLOAD'] ?? '{}', true) ?: [];
        $payload['user_id'] = (int) ($user['sub'] ?? 0);

        $id = $this->patients->insert($payload, true);
        $patient = $this->patients->find((int) $id);

        return $this->respondCreated([
            'message' => 'Patient created',
            'data' => $patient,
        ]);
    }
}

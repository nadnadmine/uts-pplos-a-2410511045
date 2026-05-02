<?php

namespace App\Models;

use CodeIgniter\Model;

class PrescriptionModel extends Model
{
    protected $table = 'prescriptions';
    protected $primaryKey = 'id';
    protected $returnType = 'array';
    protected $allowedFields = [
        'record_id',
        'medicine_id',
        'dosage',
        'instruction',
        'quantity',
    ];

    public function findDetail(int $id): ?array
    {
        return $this->select('prescriptions.*, medicines.name AS medicine_name, medicines.unit')
            ->join('medicines', 'medicines.id = prescriptions.medicine_id')
            ->where('prescriptions.id', $id)
            ->first();
    }
}

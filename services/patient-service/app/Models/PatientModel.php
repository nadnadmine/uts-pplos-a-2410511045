<?php

namespace App\Models;

use CodeIgniter\Model;

class PatientModel extends Model
{
    protected $table = 'patients';
    protected $primaryKey = 'id';
    protected $returnType = 'array';
    protected $allowedFields = [
        'user_id',
        'nik',
        'name',
        'birth_date',
        'gender',
        'phone',
        'address',
    ];
    protected $useTimestamps = true;
    protected $createdField = 'created_at';
    protected $updatedField = 'updated_at';

    public function pagedList(array $filters, int $page, int $perPage): array
    {
        $builder = $this->builder();

        if (! empty($filters['name'])) {
            $builder->like('name', $filters['name']);
        }

        if (! empty($filters['nik'])) {
            $builder->like('nik', $filters['nik']);
        }

        $totalBuilder = clone $builder;
        $total = $totalBuilder->countAllResults(false);
        $offset = ($page - 1) * $perPage;

        $data = $builder
            ->orderBy('created_at', 'DESC')
            ->limit($perPage, $offset)
            ->get()
            ->getResultArray();

        return [
            'data' => $data,
            'meta' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => (int) ceil($total / $perPage),
            ],
        ];
    }
}

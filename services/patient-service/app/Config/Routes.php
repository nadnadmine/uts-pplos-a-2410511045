<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('health', static function () {
    return service('response')->setJSON([
        'status' => 'ok',
        'service' => 'patient-service',
    ]);
});

$routes->group('', ['filter' => 'jwt'], static function (RouteCollection $routes): void {
    $routes->get('patients', 'Patient::index');
    $routes->post('patients', 'Patient::create');
    $routes->get('patients/(:num)', 'Patient::show/$1');

    $routes->get('records/(:num)', 'MedicalRecord::show/$1');
    $routes->post('records', 'MedicalRecord::create');

    $routes->post('prescriptions', 'Prescription::create');
});

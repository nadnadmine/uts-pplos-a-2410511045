<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Throwable;

class JWTAccess implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        $header = $request->getHeaderLine('Authorization');

        if (! str_starts_with($header, 'Bearer ')) {
            return service('response')
                ->setStatusCode(401)
                ->setJSON(['message' => 'Missing bearer token']);
        }

        $token = substr($header, 7);
        $secret = env('JWT_ACCESS_SECRET', 'change_this_access_secret');

        try {
            $payload = (array) JWT::decode($token, new Key($secret, 'HS256'));
            $_SERVER['JWT_PAYLOAD'] = json_encode($payload);
        } catch (Throwable) {
            return service('response')
                ->setStatusCode(401)
                ->setJSON(['message' => 'Invalid or expired access token']);
        }
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        return null;
    }
}

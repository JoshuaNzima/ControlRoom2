<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;

trait HasApiResponses
{
    /**
     * Return a standardized success JSON response.
     */
    protected function successResponse(mixed $data = null, string $message = '', int $status = 200): JsonResponse
    {
        $payload = ['success' => true];

        if ($message !== '') {
            $payload['message'] = $message;
        }

        if ($data !== null) {
            $payload['data'] = $data;
        }

        return response()->json($payload, $status);
    }

    /**
     * Return a standardized error JSON response.
     */
    protected function errorResponse(string $message, int $status = 400, array $errors = []): JsonResponse
    {
        $payload = ['success' => false, 'message' => $message];

        if (!empty($errors)) {
            $payload['errors'] = $errors;
        }

        return response()->json($payload, $status);
    }

    /**
     * Return a standardized not-found JSON response.
     */
    protected function notFoundResponse(string $message = 'Resource not found.'): JsonResponse
    {
        return $this->errorResponse($message, 404);
    }

    /**
     * Return a standardized unauthorized JSON response.
     */
    protected function unauthorizedResponse(string $message = 'Unauthorized.'): JsonResponse
    {
        return $this->errorResponse($message, 403);
    }

    /**
     * Return a standardized validation-error JSON response.
     */
    protected function validationErrorResponse(string $message, array $errors = []): JsonResponse
    {
        return $this->errorResponse($message, 422, $errors);
    }

    /**
     * Return a standardized server-error JSON response.
     */
    protected function serverErrorResponse(string $message = 'An unexpected error occurred.'): JsonResponse
    {
        return $this->errorResponse($message, 500);
    }
}

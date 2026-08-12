<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Thrown by AttendanceService when a business rule prevents an attendance operation.
 *
 * The controller catches this and converts it to a redirect with flash errors,
 * preserving the standard back()->withErrors() UX.
 */
class AttendanceException extends RuntimeException
{
    /**
     * @param string $message User-facing error message
     * @param array<string, string> $errors Field-level validation errors (optional)
     * @param int $code HTTP status code (default 422)
     */
    public function __construct(
        string $message = '',
        public readonly array $errors = [],
        int $code = 422,
    ) {
        parent::__construct($message ?: 'Attendance operation failed.', $code);
    }

    /**
     * Factory for a generic error with a single message.
     */
    public static function withMessage(string $message, array $errors = []): self
    {
        return new self($message, $errors);
    }

    /**
     * Factory for field-level validation errors.
     */
    public static function validationError(string $field, string $message): self
    {
        return new self($message, [$field => $message]);
    }
}

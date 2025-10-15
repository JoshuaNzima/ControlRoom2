<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateZoneRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null; // Adjust with policies/permissions if needed
    }

    public function rules(): array
    {
        $zoneId = $this->route('zone')?->id ?? 'NULL';
        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', "unique:zones,code,{$zoneId}"],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'in:active,inactive,understaffed'],
            'required_guard_count' => ['nullable', 'integer', 'min:0'],
            'target_sites_count' => ['nullable', 'integer', 'min:0'],
            'commander_id' => ['nullable', 'integer', 'exists:users,id'],
            'site_ids' => ['nullable', 'array'],
            'site_ids.*' => ['integer', 'exists:client_sites,id'],
        ];
    }
}



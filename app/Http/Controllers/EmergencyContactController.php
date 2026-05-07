<?php

namespace App\Http\Controllers;

use App\Models\EmergencyContact;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmergencyContactController extends Controller
{
    public function index(Request $request)
    {
        $contacts = EmergencyContact::active()
            ->ordered()
            ->get()
            ->groupBy('type');

        $typeOptions = EmergencyContact::getTypeOptions();
        $canManage = $request->user()->can('manage', EmergencyContact::class);

        return Inertia::render('EmergencyContacts/Index', [
            'contacts' => $contacts,
            'typeOptions' => $typeOptions,
            'canManage' => $canManage,
        ]);
    }

    public function create()
    {
        // Deprecated: redirect to index with modal trigger
        return redirect()->route('emergency-contacts.index', ['show_add' => 1]);
    }

    public function store(Request $request)
    {
        $this->authorize('manage', EmergencyContact::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'in:' . implode(',', array_keys(EmergencyContact::getTypeOptions()))],
            'phone' => ['nullable', 'string', 'max:50'],
            'alternative_phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'notes' => ['nullable', 'string'],
            'display_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $validated['is_active'] = true;

        EmergencyContact::create($validated);

        return redirect()->route('emergency-contacts.index')
            ->with('success', 'Emergency contact added successfully.');
    }

    public function edit(EmergencyContact $emergencyContact)
    {
        $this->authorize('manage', EmergencyContact::class);

        return Inertia::render('EmergencyContacts/Edit', [
            'contact' => $emergencyContact,
            'typeOptions' => EmergencyContact::getTypeOptions(),
        ]);
    }

    public function update(Request $request, EmergencyContact $emergencyContact)
    {
        $this->authorize('manage', EmergencyContact::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'in:' . implode(',', array_keys(EmergencyContact::getTypeOptions()))],
            'phone' => ['nullable', 'string', 'max:50'],
            'alternative_phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'notes' => ['nullable', 'string'],
            'display_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ]);

        $emergencyContact->update($validated);

        return redirect()->route('emergency-contacts.index')
            ->with('success', 'Emergency contact updated successfully.');
    }

    public function destroy(EmergencyContact $emergencyContact)
    {
        $this->authorize('manage', EmergencyContact::class);

        $emergencyContact->delete();

        return redirect()->route('emergency-contacts.index')
            ->with('success', 'Emergency contact deleted successfully.');
    }
}

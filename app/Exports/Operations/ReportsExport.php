<?php

namespace App\Exports\Operations;

use App\Models\Alert;
use App\Models\Flag;
use App\Models\Incident;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class ReportsExport implements FromQuery, WithHeadings, WithMapping
{
    protected $type;
    protected $dateFrom;
    protected $dateTo;

    public function __construct(array $filters)
    {
        $this->type = $filters['type'];
        $this->dateFrom = $filters['date_from'];
        $this->dateTo = $filters['date_to'];
    }

    public function query()
    {
        $query = match($this->type) {
            'incidents' => Incident::query(),
            'flags' => Flag::query(),
            'alerts' => Alert::query(),
        };

        return $query->whereBetween('created_at', [
            $this->dateFrom,
            $this->dateTo
        ]);
    }

    public function headings(): array
    {
        return match($this->type) {
            'incidents' => ['ID', 'Title', 'Description', 'Status', 'Site', 'Reporter', 'Created At'],
            'flags' => ['ID', 'Type', 'Description', 'Status', 'Priority', 'Created At'],
            'alerts' => ['ID', 'Title', 'Message', 'Status', 'Source', 'Created At'],
        };
    }

    public function map($row): array
    {
        return match($this->type) {
            'incidents' => [
                $row->id,
                $row->title,
                $row->description,
                $row->status,
                $row->site?->name,
                $row->reporter?->name,
                $row->created_at->format('Y-m-d H:i:s'),
            ],
            'flags' => [
                $row->id,
                $row->type,
                $row->description,
                $row->status,
                $row->priority,
                $row->created_at->format('Y-m-d H:i:s'),
            ],
            'alerts' => [
                $row->id,
                $row->title,
                $row->message,
                $row->status,
                $row->source,
                $row->created_at->format('Y-m-d H:i:s'),
            ],
        };
    }
}
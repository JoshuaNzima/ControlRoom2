<?php

namespace Database\Seeders;

use App\Models\DocumentCategory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DocumentCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Invoices',
                'description' => 'Financial invoices and billing documents',
                'icon' => '📄',
            ],
            [
                'name' => 'Receipts',
                'description' => 'Purchase receipts and proof of payment',
                'icon' => '🧾',
            ],
            [
                'name' => 'Contracts',
                'description' => 'Service and employment contracts',
                'icon' => '📋',
            ],
            [
                'name' => 'Reports',
                'description' => 'Business and analytical reports',
                'icon' => '📊',
            ],
            [
                'name' => 'Presentations',
                'description' => 'Slideshows and presentations',
                'icon' => '🎯',
            ],
            [
                'name' => 'HR Documents',
                'description' => 'Employee records and HR related files',
                'icon' => '👥',
            ],
            [
                'name' => 'Training Materials',
                'description' => 'Training and educational resources',
                'icon' => '🎓',
            ],
            [
                'name' => 'Asset Documentation',
                'description' => 'Asset manuals and specifications',
                'icon' => '📦',
            ],
            [
                'name' => 'Reference Materials',
                'description' => 'General reference and guidelines',
                'icon' => '📚',
            ],
            [
                'name' => 'Media',
                'description' => 'Images, videos, and multimedia files',
                'icon' => '🎬',
            ],
                [
                'name' => 'Miscellaneous',
                'description' => 'Uncategorized documents and files',
                'icon' => '📁',
            ],
        ];

        foreach ($categories as $category) {
            $slug = Str::slug($category['name']);
            DocumentCategory::firstOrCreate(
                ['slug' => $slug],
                [
                    'name' => $category['name'],
                    'description' => $category['description'],
                    'icon' => $category['icon'],
                ]
            );
        }
    }
}

<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

trait HandlesInfiniteScroll
{
    protected function handleInfiniteScroll(Builder $query, Request $request, $perPage = 10, callable $transform = null)
    {
        $page = $request->input('page', 1);
        $perPage = $request->input('per_page', $perPage);
        
        $paginator = $query->paginate($perPage);
        
        if ($transform) {
            $paginator->through($transform);
        }
        
        return $paginator;
    }
}
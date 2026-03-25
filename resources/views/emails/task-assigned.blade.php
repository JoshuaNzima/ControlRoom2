@component('emails.layout')
# New Task Assigned

Hello {{ $user->name }},

You have been assigned a new task by **{{ $task->createdBy->name }}**.

## Task Details

**Title:** {{ $task->title }}

**Priority:** {{ ucfirst($task->priority) }}

**Status:** {{ ucfirst(str_replace('_', ' ', $task->status)) }}

**Module:** {{ $modules[$task->module] ?? $task->module }}

@if($task->due_date)
**Due Date:** {{ $task->due_date->format('F j, Y') }}
@endif

@if($task->description)
**Description:**
{{ $task->description }}
@endif

@component('mail::button', ['url' => route('tasks.my'), 'color' => 'primary'])
View My Tasks
@endcomponent

Thanks,<br>
{{ config('app.name') }}
@endcomponent

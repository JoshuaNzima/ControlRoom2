@extends('emails.layout', [
  'subject' => 'Application update',
  'title' => 'Application Update',
])

@section('content')
  <p>Hi {{ $application->candidate_name }},</p>

  <p>
    There has been an update to your application{{ $application->jobPosting ? ' for '.$application->jobPosting->title : '' }}.
  </p>

  <p><strong>Previous status:</strong> {{ $oldStatus }}</p>
  <p><strong>Current status:</strong> {{ $application->status }}</p>

  <p class="muted">
    This is an automated update. We’ll reach out if we need more information from you.
  </p>
@endsection

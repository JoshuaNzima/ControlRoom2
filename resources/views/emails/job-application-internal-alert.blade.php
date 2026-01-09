@extends('emails.layout', [
  'subject' => 'New job application',
  'title' => 'New Job Application',
])

@section('content')
  <p><strong>Candidate:</strong> {{ $application->candidate_name }}</p>
  @if(!empty($application->email))
    <p><strong>Email:</strong> <a href="mailto:{{ $application->email }}">{{ $application->email }}</a></p>
  @endif
  @if(!empty($application->phone))
    <p><strong>Phone:</strong> {{ $application->phone }}</p>
  @endif
  @if($application->jobPosting)
    <p><strong>Job:</strong> {{ $application->jobPosting->title }}</p>
  @endif
  @if(!empty($application->resume_url))
    <p><strong>Resume:</strong> <a href="{{ $application->resume_url }}">View</a></p>
  @endif
  @if(!empty($application->notes))
    <p><strong>Notes:</strong><br />{{ $application->notes }}</p>
  @endif

  <p class="muted">
    Tip: You can open the HR Applicants list in the system to review and triage.
  </p>
@endsection

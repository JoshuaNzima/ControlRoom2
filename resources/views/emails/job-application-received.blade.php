@extends('emails.layout', [
  'subject' => 'We received your job application',
  'title' => 'Application Received',
])

@section('content')
  <p>Hi {{ $application->candidate_name }},</p>
  <p>
    Thank you for applying{{ $application->jobPosting ? ' for the position of '.$application->jobPosting->title : '' }} at Coin Security.
    We have received your application and our HR team will review it shortly.
  </p>
  @if(!empty($application->resume_url))
    <p class="muted">Resume: <a href="{{ $application->resume_url }}">View</a></p>
  @endif
  <p class="muted">This is an automated confirmation. We will contact you if your profile progresses to the next stage.</p>
@endsection

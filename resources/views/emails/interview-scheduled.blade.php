@extends('emails.layout', [
  'subject' => 'Interview scheduled',
  'title' => 'Interview Scheduled',
])

@section('content')
  <p>Hi {{ $interview->application?->candidate_name }},</p>

  <p>
    Your interview{{ $interview->application?->jobPosting ? ' for '.$interview->application->jobPosting->title : '' }} has been scheduled.
  </p>

  <p><strong>Date & Time:</strong> {{ optional($interview->scheduled_at)->toDayDateTimeString() }}</p>
  <p><strong>Mode:</strong> {{ strtoupper(str_replace('_', ' ', (string) $interview->mode)) }}</p>

  @if(!empty($interview->location_or_link))
    <p><strong>Location / Link:</strong> {{ $interview->location_or_link }}</p>
  @endif

  <p class="muted">
    If you have any questions or need to reschedule, please reply to this email.
  </p>
@endsection

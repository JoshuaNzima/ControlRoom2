@extends('emails.layout', [
  'subject' => $subject ?? 'Notification',
  'title' => $subject ?? 'Notification',
])

@section('content')
  <p>{{ $body ?? '' }}</p>
@endsection

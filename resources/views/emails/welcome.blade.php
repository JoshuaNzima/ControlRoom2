@extends('emails.layout', [
    'subject' => 'Welcome to Coin Security',
    'title' => 'Welcome, '.$user->name.'!',
])

@section('content')
    <p>
        We’re excited to have you on board. Your account has been created successfully and you can now sign in to your dashboard.
    </p>
    <p class="muted">
        If you didn’t expect this email, you can safely ignore it.
    </p>
    <p style="text-align:center;">
        <a href="{{ url(route('login', [], false)) }}" class="btn">Go to Login</a>
    </p>
@endsection

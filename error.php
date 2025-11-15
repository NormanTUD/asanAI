<?php
$code = intval($_GET['code'] ?? 500);

$messages = [
    400 => "Bad Request",
    401 => "Unauthorized",
    403 => "Forbidden",
    404 => "Page Not Found",
    500 => "Internal Server Error",
    502 => "Bad Gateway",
    503 => "Service Unavailable",
    504 => "Gateway Timeout"
];

$title = $messages[$code] ?? "Unexpected Error";
$fun = [
    400 => "Your browser said something weird. We’re pretending we didn’t hear it.",
    401 => "You shall not pass. At least not without credentials.",
    403 => "Nice try. Still no.",
    404 => "The page moved out without leaving a forwarding address.",
    500 => "It's not you. It's us. Seriously.",
    502 => "The upstream server had one job. It failed.",
    503 => "Server’s on a break. Probably coffee.",
    504 => "The server waited. And waited. And gave up."
];

$subtitle = $fun[$code] ?? "Something unexpected happened.";
http_response_code($code);
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title><?= $code ?> — <?= htmlspecialchars($title) ?></title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body {
    margin: 0;
    background: #111;
    color: #f0f0f0;
    font-family: system-ui, sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    text-align: center;
}
h1 {
    font-size: 5rem;
    letter-spacing: -2px;
    margin: 0;
    color: #ff5757;
}
h2 {
    margin: 0.5rem 0 1rem;
    font-weight: 300;
    font-size: 1.6rem;
}
.container {
    max-width: 600px;
    padding: 20px;
}
a.btn {
    margin-top: 20px;
    display: inline-block;
    padding: 12px 24px;
    background: #ff5757;
    color: #fff;
    text-decoration: none;
    border-radius: 8px;
    transition: 0.2s;
}
a.btn:hover {
    background: #ff3030;
}
</style>
</head>
<body>
<div class="container">
    <h1><?= $code ?></h1>
    <h2><?= htmlspecialchars($title) ?></h2>
    <p><?= htmlspecialchars($subtitle) ?></p>
    <a href="/" class="btn">Back to Home</a>
</div>
</body>
</html>

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

$fun = [
    400 => "Your request was so malformed even JSON laughed.",
    401 => "You’re not logged in. Or maybe you are — but badly.",
    403 => "Access denied. The server said: 'Nah bro, not today.'",
    404 => "The page packed its bags and left. No postcard.",
    500 => "Our server just stepped on a LEGO.",
    502 => "The upstream server responded with pure chaos.",
    503 => "Shhh… the server is pretending to be offline.",
    504 => "The server waited longer than you wait for YouTube ads."
];

$title = $messages[$code] ?? "Unexpected Error";
$subtitle = $fun[$code] ?? "The server is confused. And honestly? Same.";
http_response_code($code);
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title><?= $code ?> — <?= htmlspecialchars($title) ?></title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<style>
:root {
    --c-bg: #121212;
    --c-fg: #f0f0f0;
    --c-accent1: #ff5f5f;
    --c-accent2: #ffb84d;
    --c-accent3: #6ecb63;
    --c-accent4: #4da3ff;
    --c-accent5: #bd7bff;
}

body {
    margin: 0;
    background: var(--c-bg);
    color: var(--c-fg);
    font-family: system-ui, sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    text-align: center;
    background: radial-gradient(circle at top, #1f1f1f, #0f0f0f);
}

h1 {
    font-size: 7rem;
    margin: 0;
    font-weight: 900;
    background: linear-gradient(45deg,
        var(--c-accent1),
        var(--c-accent2),
        var(--c-accent3),
        var(--c-accent4),
        var(--c-accent5)
    );
    -webkit-background-clip: text;
    color: transparent;
}

h2 {
    margin-top: .4rem;
    font-size: 2rem;
    font-weight: 400;
    color: var(--c-accent2);
}

p {
    margin-top: .5rem;
    font-size: 1.2rem;
    color: var(--c-accent3);
}

.container {
    max-width: 700px;
    padding: 20px;
}

a.btn {
    margin-top: 25px;
    display: inline-block;
    padding: 14px 28px;
    background: var(--c-accent4);
    color: #fff;
    text-decoration: none;
    border-radius: 10px;
    font-weight: 600;
    transition: transform .15s, background .2s;
}

a.btn:hover {
    background: var(--c-accent5);
    transform: translateY(-3px) scale(1.03);
}
</style>
</head>
<body>
<div class="container">
    <h1><?= $code ?></h1>
    <h2><?= htmlspecialchars($title) ?></h2>
    <p><?= htmlspecialchars($subtitle) ?></p>
    <a class="btn" href="/">Back to Safety</a>
</div>
</body>
</html>

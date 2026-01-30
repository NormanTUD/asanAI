<?php
$fileContent = file_get_contents('literature.js');

/**
 * Manually parses the JS file using Regex to avoid strict JSON rules.
 */
function manuallyParseBib($content) {
    $entries = [];
    
    // 1. Find all top-level blocks like "key": { ... }
    // This looks for the key, then everything inside the curly braces.
    preg_match_all('/"([^"]+)"\s*:\s*\{([^}]+)\}/s', $content, $matches, PREG_SET_ORDER);

    foreach ($matches as $match) {
        $id = $match[1];
        $body = $match[2];

        // 2. Extract specific fields using regex for each block
        $entries[$id] = [
            'title'  => preg_match('/"title"\s*:\s*"([^"]+)"/', $body, $m) ? $m[1] : (preg_match('/"title"\s*:\s*([^,}\n]+)/', $body, $m) ? trim($m[1]) : 'N/A'),
            'author' => preg_match('/"author"\s*:\s*"([^"]+)"/', $body, $m) ? $m[1] : 'Unknown',
            'year'   => preg_match('/"year"\s*:\s*"?(\d{4}|c\.\s\d+\sBCE)"?/', $body, $m) ? $m[1] : '-',
            'url'    => preg_match('/"url"\s*:\s*"([^"]+)"/', $body, $m) ? $m[1] : null
        ];
    }
    return $entries;
}

$bibData = manuallyParseBib($fileContent);
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Manual PHP Lit Reader</title>
    <style>
        body { font-family: sans-serif; background: #1a1a1a; color: #eee; padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; background: #2a2a2a; }
        th, td { padding: 12px; text-align: left; border: 1px solid #444; }
        th { background: #333; color: #00d4ff; }
        tr:hover { background: #383838; }
        a { color: #00d4ff; text-decoration: none; }
        .id-label { font-size: 0.7em; color: #888; display: block; }
    </style>
</head>
<body>

    <h2>Literature</h2>

    <table>
        <thead>
            <tr>
                <th>Title & ID</th>
                <th>Author</th>
                <th>Year</th>
                <th>Link</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($bibData as $id => $entry): ?>
                <tr>
                    <td>
                        <span class="id-label"><?php echo htmlspecialchars($id); ?></span>
                        <strong><?php echo htmlspecialchars($entry['title']); ?></strong>
                    </td>
                    <td><?php echo htmlspecialchars($entry['author']); ?></td>
                    <td><?php echo htmlspecialchars($entry['year']); ?></td>
                    <td>
                        <?php if ($entry['url']): ?>
                            <a href="<?php echo htmlspecialchars($entry['url']); ?>" target="_blank">🔗 View</a>
                        <?php endif; ?>
                    </td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>

</body>
</html>

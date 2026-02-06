<?php
$fileContent = file_get_contents('literature.js');

/**
 * Manually parses the JS file using Regex to avoid strict JSON rules.
 */
function manuallyParseBib($content) {
    $entries = [];
    preg_match_all('/"([^"]+)"\s*:\s*\{([^}]+)\}/s', $content, $matches, PREG_SET_ORDER);

    foreach ($matches as $match) {
        $id = $match[1];
        $body = $match[2];

        $entries[$id] = [
            'title'  => preg_match('/title\s*:\s*"([^"]+)"/', $body, $m) ? $m[1] : (preg_match('/"title"\s*:\s*([^,}\n]+)/', $body, $m) ? trim($m[1]) : 'N/A'),
            'author' => preg_match('/author\s*:\s*"([^"]+)"/', $body, $m) ? $m[1] : 'Unknown',
            'year'   => preg_match('/year\s*:\s*"?(\d{4}|c\.\s\d+\sBCE)"?/', $body, $m) ? $m[1] : '-',
            'url'    => preg_match('/url\s*:\s*"([^"]+)"/', $body, $m) ? $m[1] : null
        ];
    }
    return $entries;
}

$allBibData = manuallyParseBib($fileContent);

// --- Pagination Logic ---
$itemsPerPage = 10;
$totalItems = count($allBibData);
$totalPages = ceil($totalItems / $itemsPerPage);

// Get current page from URL, ensure it's an integer within valid range
$currentPage = isset($_GET['page']) ? (int)$_GET['page'] : 1;
if ($currentPage < 1) $currentPage = 1;
if ($currentPage > $totalPages && $totalPages > 0) $currentPage = $totalPages;

$offset = ($currentPage - 1) * $itemsPerPage;

// Slice the array to get only the items for the current page
$bibData = array_slice($allBibData, $offset, $itemsPerPage, true);
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
        
        .pagination { margin-top: 20px; text-align: center; }
        .pagination a, .pagination span { 
            padding: 8px 16px; 
            margin: 0 4px; 
            border: 1px solid #444; 
            background: #2a2a2a; 
            color: #eee;
            border-radius: 4px;
        }
        .pagination a:hover { background: #00d4ff; color: #1a1a1a; }
        .pagination .current { background: #00d4ff; color: #1a1a1a; border-color: #00d4ff; }
        .pagination .disabled { color: #555; cursor: not-allowed; }
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
            <?php if (empty($bibData)): ?>
                <tr><td colspan="4">No entries found.</td></tr>
            <?php else: ?>
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
            <?php endif; ?>
        </tbody>
    </table>

    <?php if ($totalPages > 1): ?>
    <div class="pagination">
        <?php if ($currentPage > 1): ?>
            <a href="?page=<?php echo $currentPage - 1; ?>">&laquo; Prev</a>
        <?php else: ?>
            <span class="disabled">&laquo; Prev</span>
        <?php endif; ?>

        <?php for ($i = 1; $i <= $totalPages; $i++): ?>
            <a href="?page=<?php echo $i; ?>" class="<?php echo ($i === $currentPage) ? 'current' : ''; ?>">
                <?php echo $i; ?>
            </a>
        <?php endfor; ?>

        <?php if ($currentPage < $totalPages): ?>
            <a href="?page=<?php echo $currentPage + 1; ?>">Next &raquo;</a>
        <?php else: ?>
            <span class="disabled">Next &raquo;</span>
        <?php endif; ?>
    </div>
    <?php endif; ?>

</body>
</html>

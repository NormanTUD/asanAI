<?php
function readLogFile($filename)
{
    try {
        $lines = file($filename, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

        if ($lines === false) {
            throw new Exception("Failed to read the file: $filename");
        }

        return $lines;
    } catch (Exception $e) {
        // Log and warn the error
        error_log("Error: " . $e->getMessage());
        return [];
    }
}

function createDistribution($filename)
{
    $lines = readLogFile($filename);
    $distribution = [];

    foreach ($lines as $line) {
        $parts = explode(':', $line);
        if (count($parts) === 2) {
            $userId = $parts[0];
            $count = (int)$parts[1];
            $distribution[$userId] = $count;
        }
    }

    return $distribution;
}

function createReferrerList($filename)
{
    $lines = readLogFile($filename);
    $referrerList = [];

    foreach ($lines as $line) {
        if (preg_match('/^(https?:\/\/\S+)/', $line, $matches)) {
            $referrerList[] = $matches[1];
        }
    }

    return $referrerList;
}

// Create the distribution
$visitorDistribution = createDistribution('/var/log/asanai_visitors.log');

// Create the referrer list
$referrers = createReferrerList('/var/log/asanai_referrers.log');

// Generate data for Plotly
$users = array_keys($visitorDistribution);
$visits = array_values($visitorDistribution);

// Create a Plotly bar chart
$data = [
    'x' => $users,
    'y' => $visits,
    'type' => 'bar',
];

$layout = [
    'title' => 'User Visits Distribution',
    'xaxis' => ['title' => 'User ID'],
    'yaxis' => ['title' => 'Visits'],
];

$chart = [
    'data' => [$data],
    'layout' => $layout,
];

?>
<!DOCTYPE html>
<html>
<head>
    <script src="libs/plotly-latest.min.js"></script>
</head>
<body>
	<h2>Unique Users</h2>
	<div id="chart"></div>
	<script>
		Plotly.newPlot('chart', <?php echo json_encode($chart); ?>);
	</script>

	<h2>Referrers</h2>
	<pre>
<?php
	print_r($referrers);
?>
	</pre>
</body>
</html>

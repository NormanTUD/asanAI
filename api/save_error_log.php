<?php
	$GLOBALS["allowed_types"] = ['table', 'tr', 'td', 'th', 'span', 'pre', 'tbody', 'h1', 'h2', 'h3', 'img'];
	$GLOBALS['error_messages'] = array();

	include_once('../functions.php');

	function checkElementsInAllowedTypes($string) {
		// Define the allowed element types

		// Use a regular expression to find all opening and closing tags
		preg_match_all('/<\/?(.*?)>/', $string, $matches);

		if (empty($matches[1])) {
			return [];
		}

		$unallowed_tags = [];

		// Iterate through the matched elements
		foreach ($matches[1] as $element) {
			// Convert the element type to lowercase for case-insensitive comparison
			$element = strtolower($element);

			// Check if the element type is not in the allowed types
			if (!in_array($element, $GLOBALS["allowed_types"])) {
				$unallowed_tags[] = $element;
			}
		}

		return $unallowed_tags;
	}

	function check_log_dir(string $log_file_dir): bool {
		$ret = true;

		if (!file_exists($log_file_dir)) {
			$GLOBALS['error_messages'][] = "Directory '$log_file_dir' does not exist.";
			$ret = false;
		}

		if (!is_dir($log_file_dir)) {
			$GLOBALS['error_messages'][] = "'$log_file_dir' exists but is not a directory.";
			$ret = false;
		}

		if (!is_readable($log_file_dir)) {
			$GLOBALS['error_messages'][] = "Directory '$log_file_dir' is not readable.";
			$ret = false;
		}

		if (!is_writable($log_file_dir)) {
			$GLOBALS['error_messages'][] = "Directory '$log_file_dir' is not writable.";
			$ret = false;
		}

		if (is_file($log_file_dir)) {
			try {
				$stat = stat($log_file_dir);
				if ($stat !== false) {
					$owner_uid = $stat['uid'];
					$owner_gid = $stat['gid'];
					$owner_name = function_exists('posix_getpwuid') ? posix_getpwuid($owner_uid)['name'] ?? $owner_uid : $owner_uid;
					$group_name = function_exists('posix_getgrgid') ? posix_getgrgid($owner_gid)['name'] ?? $owner_gid : $owner_gid;
					$perm = substr(sprintf('%o', fileperms($log_file_dir)), -4);

					$apache_user = function_exists('posix_getpwuid') ? (posix_getpwuid(posix_geteuid())['name'] ?? 'unknown') : 'unknown';

					$GLOBALS['error_messages'][] = "Directory '$log_file_dir' has permissions $perm, owner $owner_name:$group_name. Apache/PHP runs as user '$apache_user'.";
					$ret = false;
				} else {
					$GLOBALS['error_messages'][] = "Could not stat directory '$log_file_dir'.";
					$ret = false;
				}
			} catch (Exception $e) {
				$GLOBALS['error_messages'][] = "Could not stat directory '$log_file_dir'.";
				$ret = false;
			}
		}

		if (!is_readable($log_file_dir) && is_writable($log_file_dir)) {
			$GLOBALS['error_messages'][] = "Is not readable/writable: '$log_file_dir'.";
			$ret = false;
		}

		return $ret;
	}

	function receiveAndCheckHTML($log_file_dir, $html_code) {
		// Check if the log file directory is readable and writable
		if (check_log_dir($log_file_dir)) {
			try {
				// Generate a unique filename for the HTML file
				$filename = uniqid() . '.html';

				// Check if the filtered HTML is empty (no allowed types)
				$unallowed_tags = checkElementsInAllowedTypes($html_code);
				if (count($unallowed_tags)) {
					$joined_allowed_tags = join(", ", $GLOBALS["allowed_types"]);
					$joined_unallowed_tags = join(", ", $unallowed_tags);

					$GLOBALS['error_messages'][] = "Contains unallowed_tags: ".$joined_unallowed_tags." , allowed, (".$joined_allowed_tags.").";
				} else {
					// Save the filtered HTML to the log file directory
					$file_path = $log_file_dir . '/' . $filename;
					file_put_contents($file_path, $html_code);

					if (file_exists($file_path)) {
						$success_message = "HTML code saved successfully.";
						$response = array("status" => "success", "message" => $success_message);
						echo json_encode($response);
					} else {
						$GLOBALS['error_messages'][] = "Failed to save HTML code to the log file directory.";
					}
				}
			} catch (Exception $e) {
				$GLOBALS['error_messages'][] = "An error occurred while saving the HTML code.";
			}
		}

		// Log and return error messages in JSON format
		$response = array("status" => "error", "errors" => $GLOBALS['error_messages'], ", ");
		echo json_encode($response);
	}

	header("Content-Type: application/json; charset=utf-8");

	function respond_with_error(string $message, int $status_code = 400): void {
		http_response_code($status_code);
		echo json_encode(["error" => $message]);
		exit(1);
	}

	if (isset($_SERVER["REQUEST_METHOD"]) && $_SERVER["REQUEST_METHOD"] !== "POST") {
		respond_with_error("Request must be POST", 405);
	}

	if (!isset($_POST["html_code"])) {
		respond_with_error("Missing parameter: html_code");
	}

	$html_code = $_POST["html_code"];
	if (!is_string($html_code) || trim($html_code) === "") {
		respond_with_error("Invalid html_code");
	}

	$log_file_dir = "debuglogs";

	try {
		receiveAndCheckHTML($log_file_dir, $html_code);
		if(count($errors) == 0) {
			http_response_code(200);
			echo json_encode(["success" => true]);
		}
	} catch (Exception $e) {
		respond_with_error($e->getMessage(), 500);
	}
?>

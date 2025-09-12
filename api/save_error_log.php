<?php
	$GLOBALS["allowed_types"] = ['table', 'tr', 'td', 'th', 'span', 'pre', 'tbody', 'h1', 'h2', 'h3', 'img'];

	include_once('functions.php');

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

	function receiveAndCheckHTML($log_file_dir, $html_code) {
		// Create an array to store error messages
		$error_messages = array();

		// Check if the log file directory is readable and writable
		if (!is_dir($log_file_dir) || !is_readable($log_file_dir) || !is_writable($log_file_dir)) {
			$error_messages[] = "Log file directory $log_file_dir is not readable or writable.";
		} else {
			try {
				// Generate a unique filename for the HTML file
				$filename = uniqid() . '.html';

				// Check if the filtered HTML is empty (no allowed types)
				$unallowed_tags = checkElementsInAllowedTypes($html_code);
				if (count($unallowed_tags)) {
					$joined_allowed_tags = join(", ", $GLOBALS["allowed_types"]);
					$joined_unallowed_tags = join(", ", $unallowed_tags);

					$error_messages[] = "Contains unallowed_tags: ".$joined_unallowed_tags." , allowed, (".$joined_allowed_tags.").";
				} else {
					// Save the filtered HTML to the log file directory
					$file_path = $log_file_dir . '/' . $filename;
					file_put_contents($file_path, $html_code);

					if (file_exists($file_path)) {
						$success_message = "HTML code saved successfully.";
						$response = array("status" => "success", "message" => $success_message);
						echo json_encode($response);
					} else {
						$error_messages[] = "Failed to save HTML code to the log file directory.";
					}
				}
			} catch (Exception $e) {
				$error_messages[] = "An error occurred while saving the HTML code.";
			}
		}

		// Log and return error messages in JSON format
		$response = array("status" => "error", "errors" => $error_messages, ", ");
		echo json_encode($response);
	}

	header("Content-Type: application/json; charset=utf-8");

	function respond_with_error(string $message, int $status_code = 400): void {
		http_response_code($status_code);
		echo json_encode(["error" => $message]);
		exit(1);
	}

	if ($_SERVER["REQUEST_METHOD"] !== "POST") {
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

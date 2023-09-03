<?php
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

				// Define the allowed HTML tags and attributes
				$allowed_tags = '<table><tr><td><th><span><pre>';

				// Remove any disallowed tags and attributes
				$filtered_html = strip_tags($html_code, $allowed_tags);

				// Check if the filtered HTML is empty (no allowed tags)
				if (empty($filtered_html)) {
					$error_messages[] = "The HTML code does not contain any allowed tags (only <table> and <span>).";
				} else {
					// Save the filtered HTML to the log file directory
					$file_path = $log_file_dir . '/' . $filename;
					file_put_contents($file_path, $filtered_html);

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
		$response = array("status" => "error", "errors" => $error_messages);
		echo json_encode($response);
	}

	// Example usage:
	if (isset($_SERVER["REQUEST_METHOD"])) {
		if ($_SERVER["REQUEST_METHOD"] === "POST") {
			$html_code = $_POST["html_code"];
			$log_file_dir = "debuglogs";
			receiveAndCheckHTML($log_file_dir, $html_code);
		} else {
			echo json_encode(array("error" => "was not requested with post"));
		}
	} else {
		echo json_encode(array("error" => "could not find request method"));
	}
?>

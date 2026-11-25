<?php
	function writeVisitorToLog() {
		try {
			if (!isDocker()) {
				$logFilePath = '/var/log/asanai_visitors.log';
				if(!file_exists($logFilePath)) {
					return;
				}
				$userId = getUserId();
				$logLines = array_map('trim', file($logFilePath));

				$updatedLogLines = [];
				$userFound = false;

				foreach ($logLines as $line) {
					list($storedUserId, $visits) = explode(':', $line);
					if ($storedUserId === $userId) {
						$visits = intval($visits) + 1;
						$line = "$userId:$visits";
						$userFound = true;
					}
					$updatedLogLines[] = $line;
				}

				if (!$userFound) {
					$updatedLogLines[] = "$userId:1";
				}

				file_put_contents($logFilePath, implode("\n", $updatedLogLines));
			}
		} catch (Exception $e) {
			//
		}
	}

	function getUserId() {
		return md5($_SERVER['HTTP_USER_AGENT'] ?? "" . (isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : "") . rand()); // no await, not js
	}

	function isDocker() {
		$contents = @file_get_contents('/proc/1/cgroup');
		return (strpos($contents, '/docker/') !== false);
	}


	function logReferrer() {
		try {
			$referrerLogFilePath = '/var/log/asanai_referrers.log';
			if (!file_exists($referrerLogFilePath)) {
				file_put_contents($referrerLogFilePath, ''); // Create the file if it doesn't exist
			}

			$referrer = $_SERVER['HTTP_REFERER'] ?? "No Referrer"; // Get the HTTP referrer or set a default value

			$referrerLines = array_map('trim', file($referrerLogFilePath));

			// Check if the referrer is already logged
			$referrerFound = false;
			foreach ($referrerLines as $line) {
				if ($line === $referrer) {
					$referrerFound = true;
					break;
				}
			}

			if (!$referrerFound) {
				file_put_contents($referrerLogFilePath, $referrer . "\n", FILE_APPEND); // Log the referrer if not found
			}
		} catch (\Throwable $e) {
			// ignore
		}
	}

	try {
		writeVisitorToLog();
		@logReferrer(); // Log the referrer without requiring user ID
	} catch (Exception $e) {
		// Ignore exception
	}
?>

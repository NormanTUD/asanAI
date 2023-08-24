<?php
	function writeVisitorToLog() {
		if (!isDocker()) {
			$logFilePath = '/var/log/asanai_visitors.log';
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
	}

	function getUserId() {
		return md5($_SERVER['HTTP_USER_AGENT'] ?? "" . (isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : "") . rand());
	}

	function isDocker() {
		$contents = @file_get_contents('/proc/1/cgroup');
		return (strpos($contents, '/docker/') !== false);
	}

	try {
		writeVisitorToLog();
	} catch (Exception $e) {
		// Ignore exception
	}


?>

<?php
	include_once("functions.php");

	$data = array(
		"done" => 0,
		"errors" => []
	);

	$hash = "";
	if(array_key_exists("hash", $_GET)) {
		if(preg_match('/^[a-f0-9]{32}$/i', $_GET["hash"])) {
			$hash = $_GET["hash"];
		} else {
			dier($_GET);
			die("a");
			$data["errors"][] = "hash not an md5 hash";
		}
	} else {
		$data["errors"][] = "hash not defined";
	}

	$slurm_id = "";
	if(array_key_exists("slurm_id", $_GET)) {
		if(preg_match('/^\d+$/i', $_GET["slurm_id"])) {
			$slurm_id = $_GET["slurm_id"];
		} else {
			$data["errors"][] = "slurm id is not a number";
		}
	} else {
		$data["errors"][] = "Slurm-ID not defined";
	}


	if(!count($data["errors"])) {
		ob_start();

		$start_command = ssh_taurus("ls ~/asanai/$hash/");
		system($start_command);
		$sbatch_out = ob_get_clean();

		if(preg_match("/stdout.txt/", $sbatch_out)) {
			$start_command = ssh_taurus("cat ~/asanai/$hash/stdout.txt");
			ob_start();
			system($start_command);
			$lf = ob_get_clean();

			$data["logfile"] = $lf;
		}

		if(preg_match("/weights.json/", $sbatch_out)) {
			$data["done"] = 1;

			ob_start();

			$start_command = ssh_taurus("cat ~/asanai/$hash/weights.json");
			system($start_command);

			$weights = ob_get_clean();

			$data["weights"] = $weights;

			ob_start();
			system(ssh_taurus("rm -rf ~/asanai/$hash/"));
			ob_clean();
		}

		$estimated_starting_time_command = ssh_taurus("squeue --user=\$USER --format='%A %S' | grep $slurm_id | sed -e 's/.* //'");
		ob_start();
		system($estimated_starting_time_command);
		$estimated_starting_time_squeue = ob_get_clean();

		if($estimated_starting_time_squeue) {
			$estimated_start_unix_time = strtotime($estimated_starting_time_squeue);
			$estimated_start_unix_time = intval($estimated_start_unix_time);

			$data["estimated_start_unix_time"] = $estimated_start_unix_time;
			$data["seconds_until_estimated_start"] = intval(abs($estimated_start_unix_time - time()));
		}
	}

	print json_encode($data, true);
?>

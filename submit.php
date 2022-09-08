<?php
	include_once("functions.php");
	// sed -i 's/PrivateTmp/#PrivateTmp/' /etc/systemd/system/multi-user.target.wants/apache2.service

	function scp_to_taurus_and_start ($dir, $hash) {
		$this_dir = "/home/scads/asanai/";

		ob_start();
		$command = ssh_taurus("mkdir -p $this_dir/");
		system($command);

		$scp_command = "scp -o StrictHostKeyChecking=no -r '$dir' scads@taurus.hrsk.tu-dresden.de:/$this_dir/";
		system($scp_command);

		$start_command = ssh_taurus("cd $this_dir/$hash; sbatch runme.sh");
		system($start_command);

		$sbatch_out = ob_get_clean();
		$slurm_id = preg_replace("/Submitted batch job /", "", $sbatch_out);
		$slurm_id = intval(trim(preg_replace('/\s\s+/', "", $slurm_id)));

		$data = array(
			"hash" => $hash,
			"slurmid" => $slurm_id
		);

		print json_encode($data);
	}
        function regex_in_file ($file, $regex, $replace) {
                $str = file_get_contents($file);
                $str = preg_replace($regex, $replace, $str);
                file_put_contents($file, $str);
        }

        function deleteDir($dir) {
                if(preg_match("/^\/tmp\//", $dir) && !preg_match("/\.\./", $dir)) {
                        system("rm -rf ".escapeshellarg($dir));
                } else {
                        die("Bist du bekloppt? Ich lass dich doch nix löschen!");
                }
        }

        function tempdir() {
                $tempfile = tempnam(sys_get_temp_dir(), '/');
                // tempnam creates file on disk
		if (file_exists($tempfile)) {
			unlink($tempfile);
		}
                mkdir($tempfile);
		if (is_dir($tempfile)) {
			return $tempfile;
		}
        }

        function recurseCopy(
                string $sourceDirectory,
                string $destinationDirectory,
                string $childFolder = ''
        ): void {
                $directory = opendir($sourceDirectory);

                if (is_dir($destinationDirectory) === false) {
                        mkdir($destinationDirectory);
                }

                if ($childFolder !== '') {
                        if (is_dir("$destinationDirectory/$childFolder") === false) {
                                mkdir("$destinationDirectory/$childFolder");
                        }

                        while (($file = readdir($directory)) !== false) {
                                if ($file === '.' || $file === '..') {
                                        continue;
                                }

                                if (is_dir("$sourceDirectory/$file") === true) {
                                        recurseCopy("$sourceDirectory/$file", "$destinationDirectory/$childFolder/$file");
                                } else {
                                        copy("$sourceDirectory/$file", "$destinationDirectory/$childFolder/$file");
                                }
                        }

                        closedir($directory);

                        return;
                }

                while (($file = readdir($directory)) !== false) {
                        if ($file === '.' || $file === '..') {
                                continue;
                        }

                        if (is_dir("$sourceDirectory/$file") === true) {
                                recurseCopy("$sourceDirectory/$file", "$destinationDirectory/$file");
                        }
                        else {
                                copy("$sourceDirectory/$file", "$destinationDirectory/$file");
                        }
                }

                closedir($directory);
	}

	function is_json($string,$return_data = false) {
		$data = json_decode($string);
		return (json_last_error() == JSON_ERROR_NONE) ? ($return_data ? $data : TRUE) : FALSE;
	}

	# mkdir ../tmp
	# chmod -R 0777 ../tmp

	$basepath = realpath(dirname(__FILE__));

	if(array_key_exists("data", $_POST)) {
		$json = $_POST["data"];
		if(is_json($json)) {
			$md5 = hash("md5", $json);
			$tmp = "$basepath/../tmp/$md5";
			if(!is_dir($tmp)) {
				ob_start();
				system("mkdir $tmp");
				ob_clean();
			}
			recurseCopy("$basepath/taurus/", "$tmp");
			file_put_contents("$tmp/model_data.json", $json);
			if(array_key_exists("zip", $_GET)) {
				ob_start();
				system("cd $tmp; zip -r model.zip . --exclude .gitignore --exclude example_data.json");
				ob_clean();

				$file_url = "$tmp/model.zip";

				header('Content-Type: application/zip');
				header("Content-Transfer-Encoding: Binary");
				header("Content-disposition: attachment; filename=\"" . basename($file_url) . "\"");
				print base64_encode(file_get_contents($file_url));

				exit(0);
			}
			#scp_to_taurus_and_start($tmp, $md5);
		} else {
			die("KEIN JSON");
		}

	}

	#system("scp -o BatchMode=yes -o StrictHostKeyChecking=no -o ConnectTimeout=5 /$tmp/model.json scads@taurus.hrsk.tu-dresden.de://$maindir");
	#system("scp -o BatchMode=yes -o StrictHostKeyChecking=no -o ConnectTimeout=5 /$tmp/model.weights.bin scads@taurus.hrsk.tu-dresden.de://$maindir");
?>

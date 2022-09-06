<?php
	include_once("functions.php");
	// sed -i 's/PrivateTmp/#PrivateTmp/' /etc/systemd/system/multi-user.target.wants/apache2.service

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

	if(array_key_exists("model_json", $_FILES)) {
		if(array_key_exists("model_json", $_FILES)) {
			$model_json_content = file_get_contents($_FILES["model_json"]["tmp_name"]);
			$model_weights_bin_content = file_get_contents($_FILES["model_weights_bin"]["tmp_name"]);
			
			#dier($_FILES);

			$tmp = tempdir();
			recurseCopy("test", $tmp);
			file_put_contents("/$tmp/model.json", $model_json_content);
			file_put_contents("/$tmp/model.weights.bin", $model_weights_bin_content);

			die($tmp);
		} else {
			die("model_weights_bin not in files");
		}
	} else {
		die("model_json not in files");
	}
?>

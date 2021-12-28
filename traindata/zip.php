<?php
        function apache2log ($str) {
                file_put_contents('php://stderr', print_r($str, TRUE));
        }

        function my_shell_exec ($command) {
                $returnCode = null;
                ob_start();
                system($command, $returnCode);
                $output = ob_get_clean();
                if(file_exists('/etc/debug_query')) {
                        apache2log("COMMAND: =====>\n$command\n<=====\n");
                        if(!is_null($returnCode)) {
                                apache2log("RETURN-CODE: $returnCode\n");
                        } else {
                                apache2log("NO VALID RETURN-CODE!\n");
                        }

                        if($output) {
                                apache2log("OUTPUT =====>\n$output\n<=====\n");
                        } else {
                                apache2log("No output!\n");
                        }
                }

                return $returnCode;
        }

        function get_get ($name) {
                if(array_key_exists($name, $_GET)) {
                        return $_GET[$name];
                } else {
                        return NULL;
                }
        }

        function zip_project ($dataset_category, $dataset) {
                if(preg_match('/^[a-z]+$/', $dataset_category) && is_dir($dataset_category)) {
			if(preg_match('/^[a-z]+$/', $dataset) && is_dir("$dataset_category/$dataset")) {
				$tmp_folder = "/tmp/";
				$tmp_file = mt_rand(1, 1000000000);
				$tmp_path = $tmp_folder.$tmp_file.'.zip';

				while (is_dir($tmp_folder.$tmp_file.'.zip')) {
					$tmp_file = mt_rand(1, 1000000000);
				}


				$folder = "$dataset_category/$dataset";

				$command = "zip -r $tmp_path $folder";
				my_shell_exec($command);
				return $tmp_path;
			} else {
				die("Could not find the specified project!");
			}
		} else {

			die("Could not find the specified category!");
		}

                return null;
        }

	$dataset_category = get_get('dataset_category');
	$dataset = get_get('dataset');

	$file = zip_project($dataset_category, $dataset);
	if($file) {
		header("Content-Type: application/zip");
		header("Content-Disposition: attachment; filename=$dataset.zip");
		header("Content-Length: ".filesize($file));

		readfile($file);
	}
?>

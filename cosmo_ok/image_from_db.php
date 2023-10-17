<?php
	include("functions.php");

	if(array_key_exists("id", $_GET)) {
		$id = $_GET["id"];

		$data = get_single_value_from_query("select data from training_data where model_id = ".esc($id)." limit 1");
		$json = json_decode($data);
		$random_index = rand(0, count($json->x) - 1);
		$image = $json->x[$random_index];

		$divide_by = json_decode(get_single_value_from_query("select model_data from model where id = ".esc($id)))->divide_by;

		$width = count($image);
		$height = count($image[0]);

		$gd = imagecreatetruecolor($width, $height);

		//$abc = [];

		for ($x = 0; $x < $width; $x++) {
			for ($y = 0; $y < $height; $y++) {
				$red = round($image[$x][$y][0] * $divide_by);
				$green = round($image[$x][$y][1] * $divide_by);
				$blue = round($image[$x][$y][2] * $divide_by);

				/*
				$abc[$x][$y][0] = $red;
				$abc[$x][$y][1] = $green;
				$abc[$x][$y][2] = $blue;
				*/
				
				$pixel_color = imagecolorallocate($gd, $red, $green, $blue);

				imagesetpixel(
					$gd, 
					$y,
					$x,
					$pixel_color
				);
			}
		}

		//dier($abc);

		header('Content-Type: image/png');
		imagepng($gd);
	} else {
		print "No ID given";
	}
?>

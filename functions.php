<?php
	function contains_null_values ($array) {
		foreach ($array as $key => $value) {
			if(is_null($value)) {
				return true;
			}
		}
		return false;
	}

	function dier ($data, $enable_html = 0, $exception = 0) {
		$source_data = debug_backtrace()[0];
		@$source = 'Called by <b>'.debug_backtrace()[1]['file'].'</b>::<i>'.debug_backtrace()[1]['function'].'</i>, line '.htmlentities($source_data['line'])."<br>\n";
		$print = $source;

		$print .= "<pre>\n";
		ob_start();
		print_r($data);
		$buffer = ob_get_clean();
		if($enable_html) {
			$print .= $buffer;
		} else {
			$print .= htmlentities($buffer);
		}
		$print .= "</pre>\n";

		$print .= "Backtrace:\n";
		$print .= "<pre>\n";
		foreach (debug_backtrace() as $trace) {
			$print .= htmlentities(sprintf("\n%s:%s %s", $trace['file'], $trace['line'], $trace['function']));
		}
		$print .= "</pre>\n";

		if(!$exception) {
			print $print;
			exit();
		} else {
			throw new Exception($print);
		}
	}

	function _js ($file, $async=0, $defer=0) {
		if(!file_exists($file)) {
			die("$file does not exist");
		}

		$hostname = php_uname("n");
		if (!in_array($hostname, ["arbeitslaptop", "norman-20fms48v00"])) {
			$t = get_file_state_identifier($file);
			$file = $file . "?t=$t";
		}

		if($async && $defer) {
			print "<script async defer crossorigin src='$file'></script>";
		} else if($async && !$defer) {
			print "<script async crossorigin src='$file'></script>";
		} else if(!$async && $defer) {
			print "<script defer defer crossorigin src='$file'></script>";
		} else {
			print "<script src='$file' crossorigin></script>";
		}

		print "\n";
	}

	function _css ($file, $id=null) {
		if(!file_exists($file)) {
			die("$file does not exist");
		}

		$t = get_file_state_identifier($file);
		$file = $file . "?t=$t";

		if($id) {
			print "<link href='$file' rel='stylesheet alternative' id='$id'>";
		} else {
			print "<link href='$file' rel='stylesheet'>";
		}

		print "\n";
	}

	function get_string_between($string, $start, $end){
		$string = ' ' . $string;
		$ini = strpos($string, $start);
		if ($ini == 0) return '';
		$ini += strlen($start);
		$len = strpos($string, $end, $ini) - $ini;
		return substr($string, $ini, $len);
	}

	function parse_markdown_links ($markdown) {
		$str = "<ul>\n";
		foreach(preg_split("/((\r?\n)|(\r\n?))/", $markdown) as $line){
			if(!preg_match("/^\s*$/", $line)) {
				if(preg_match("/^\s*-\s*\[(.*?)\]\((.*?)\)\s*$/", $line, $matches)) {
					$str .= "<li><a target='_blank' class='sources_popup_link' href='".$matches[2]."'>".$matches[1]."</a></li>\n";
				}
			}
		}
		$str .= "</ul>\n";
		return $str;
	}

	function filter_str_int ($data) {
		if(is_array($data)) {
			return null;
		}

		return $data;
	}

	function _assert ($condition, $message) {
		if(!$condition) {
			die($message);
		}
	}

	function get_last_commit_hash_of_file ($file) {
		if(file_exists($file)) {
			return chop(shell_exec("git log -n 1 --pretty=format:%H -- $file | cat"));
		} else {
			die("$file not found.");
		}
	}

	function get_file_state_identifier ($file) {
		$git_hash = ""; #get_last_commit_hash_of_file($file);
		if(!$git_hash) {
			if(file_exists($file)) {
				return filemtime($file);
			} else {
				die("$file not found");
			}
		}
		return $git_hash;
	}

	function get_git_hash () {
		$rev = "";
		if(file_exists("git_hash")) {
			$rev = chop(chop(file_get_contents("git_hash")));
			return $rev;
		}

		if(file_exists(".git/refs/heads/master")) {
			$rev = chop(file_get_contents(".git/refs/heads/master"));
			return $rev;
		}

		return "";
	}

	function _include ($fn) {
		if(file_exists($fn)) {
			include($fn);
		} else {
?>
			<script>alert("<?php print $fn; ?> not found");</script>
<?php
		}
	}

	function generateHTMLFromDataArray($dataArray) {
		if (!is_array($dataArray)) {
			throw new InvalidArgumentException("Invalid input provided. Expected an array.");
		}

		$html = "";

		foreach ($dataArray as $data) {
			$html .= "<div class='folie' style='display: none'>";
			if (!isset($data['heading']) || ((!isset($data['list']) || !is_array($data['list'])) && (!isset($data["html"])))) {
				throw new InvalidArgumentException("Invalid structure for page data. Each item must have 'heading' and 'list'.");
			}

			$html .= "<h3>" . htmlspecialchars($data['heading']) . "</h3>\n";

			if (empty($data['list'])) {
				if(empty($data["html"])) {
					$html .= "<p>No items in the list.</p>\n";
				}
			} else {
				$html .= "<ul class='presentation_ul'>\n";
				foreach ($data['list'] as $item) {
					$html .= "  <li class='presentation_li'>" . $item . "</li>\n";
				}
				$html .= "</ul>\n";
			}
			if(isset($data["html"])) {
				$html .= "<p>".$data["html"]."</p>\n";
			} else {
				$html .= "<p>&mdash;</p>\n";
			}

			$html .= "</div>";
		}

		return $html;
	}
?>

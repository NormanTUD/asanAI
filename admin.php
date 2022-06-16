<?php
	include("functions.php");
	if(is_admin()) {
?>
		<html>
		Adminstrator links
			<ul>
			<li><a href="user.php">User</a></li>
			<li><a href="model.php">Model</a></li>
			</ul>

		</html>
<?php
	}
?>

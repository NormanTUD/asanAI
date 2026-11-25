<?php
	include("functions.php");
	if(is_admin()) {
?>
		<html>
			Adminstrator links
			<ul>
				<li><a href="user.php">User</a></li>
				<li><a href="_model.php">Model</a></li>
			</ul>

		</html>
<?php
	} else {
		print "You don't have access to this";
	}
?>

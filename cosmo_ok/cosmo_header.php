<?php
		if(isset($_GET["start_cosmo"])) {
			if(isset($_GET["epochs"]) && intval($_GET["epochs"])) {
?>
				<script>
					$(document).ready(async function() {
						while (!finished_loading) {
							await delay(200);
						}
						await set_epochs(<?php print intval($_GET["epochs"]); ?>);
					});
				</script>
<?php
			}

			if(isset($_GET["max_iter"]) && intval($_GET["max_iter"])) {
?>
				<script>
					$(document).ready(async function() {
						while (!finished_loading) {
							await delay(200);
						}
						log("Setting max_activation_iterations to <?php print intval($_GET["max_iter"]); ?>");
						$("#max_activation_iterations").val(<?php print intval($_GET["max_iter"]); ?>);
					});
				</script>
<?php
			}

			if(isset($_GET["max_number_of_files_per_category"]) && intval($_GET["max_number_of_files_per_category"])) {
?>
				<script>
					$(document).ready(async function() {
						while (!finished_loading) {
							await delay(200);
						}
						$("#max_number_of_files_per_category").val(<?php print intval($_GET["max_number_of_files_per_category"]); ?>);
					});
				</script>
<?php
			}

?>
			<script>
				$("#theme_choser").val("light").trigger("change");
			</script>
<?php
		}
?>

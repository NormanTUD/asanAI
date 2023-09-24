<div id="sources_popup" class="popup" style="display: none;">
	<div class="popup_body less_transparent_glass_box">
		<div> 
<?php
			$file = file_get_contents("README.md");
			print(parse_markdown_links(get_string_between($file, "[comment]: <> (BeginSources)", "[comment]: <> (EndSources)")));
?>
			<button class="close_button" onclick="close_popup('sources_popup')"><span class="TRANSLATEME_close"></span></button>
		</div>
	</div>
</div>

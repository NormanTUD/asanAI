<?php
	if(isset($_GET["start_cosmo"])) {
?>
		<div class="cosmo_next_button_span" style="display: none; position: absolute; right: 10em; font-size: 1em; width: 150px;">
			<span 
				class="green_bg cosmo_button" 
				id="next_button_span"
				data-keep_cosmo="1"
				data-required_skills="loaded_page[1],watched_presentation[1],toggled_webcam[0,1]"
				data-show_again_when_new_skill_acquired="finished_training[1],eigene_webcam[1]"
				data-position="fixed"
				data-dont_hide_after_show="1"
				data-no_scroll="1" 
				style="min-height: 50px; width: 200px;"
				onclick="click_next_button()" 
			>
				<span id="train_train_further"><span class="TRANSLATEME_train_the_neural_network"></span>
			</span>
		</div>
<?php
	}
?>

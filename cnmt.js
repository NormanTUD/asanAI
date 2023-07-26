function chose_next_manicule_target () {
	var possible_indices = [];

	var cosmo = $(".cosmo");

	cosmo.each((i, x) => {
		var $x = $(x);
		if((!manicule || !manicule.element || get_element_xpath($x[0]) != get_element_xpath(manicule.element))) {
			if(!$x.data("clicked")) {
				var req = $x.data("required_skills");

				var req_full = {};

				if(typeof(req) == "string") {
					req_full = parse_required_skills(req);
				}
				
				var possible = true;
                log(">>>>>>>>>>>>>>> TESTING: ", $x);
				for (var n = 0; n < Object.keys(req_full).length; n++) {
					var current_key = Object.keys(req_full)[n];

					var full_req_part_is_part_of_current_skills = Object.keys(current_skills).includes(current_key);
                    log("full_req_part_is_part_of_current_skills: ", full_req_part_is_part_of_current_skills, ", current_skills:", current_skills, ", current_key: ", current_key);
					if(!full_req_part_is_part_of_current_skills) {
                        if(req_full[current_key].includes(0)) {
                            possible = false;
                        }
					} else {
						var current_skill_nr_matches_required_skill_number = current_skills[current_key] == req_full[current_key];

						if(!current_skill_nr_matches_required_skill_number) {
							possible = false;
						}
					}
				}

				if(possible) {
					possible_indices.push({"index": i, "length": Object.keys(req_full).length});
				}
			} else {
				var show_again = $x.data("show_again_when_new_skill_acquired");
				if(show_again) {
					var show_again_full = {};
					var possible = true;

					// TODO!!!
					if(typeof(show_again) == "string") {
						show_again_full = parse_required_skills(show_again);
					}

					for (var k = 0; k < Object.keys(show_again_full).length; k++) {
						var key = Object.keys(show_again_full)[k];
						if(Object.keys(current_skills).includes(key)) {
							if(!current_skills[key] == show_again[key]) {
								possible = false;	
							}
						} else {
							possible = false;
						}

					}

					if(possible) {
						possible_indices.push({"index": i, "length": Object.keys(show_again_full).length});
					}
				}
			}
		}
	});

	log("Possible indices:", possible_indices);

	if(possible_indices.length) {
		var possible_elements = [];
		for (var i = 0; i < possible_indices.length; i++) {
			var _i = possible_indices[i]["index"];
			var _l = possible_indices[i]["length"];
			if(cosmo[_i]) {
				$(cosmo[_i]).show();
				if(!$(cosmo[_i]).data("no_manicule")) {
					possible_elements.push(cosmo[_i]);
				}
			}
		}

		log(possible_elements);

		if(possible_elements.length) {
			var index_to_chose = possible_elements.length - 1;
			$(possible_elements[index_to_chose]).show();
			remove_manicule(0);
			new ManiC(possible_elements[index_to_chose]);
			$(possible_elements[0]).on("click", function () {
				$(this).attr("data-clicked", 1)
			});
		} else {
			log("No possible elements found for Manicule!");
			remove_manicule(0);
		}
	} else {
		log("No possible indices found for Manicule!");
		remove_manicule(0);
	}
}

chose_next_manicule_target();

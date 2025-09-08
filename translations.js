"use strict";

// Get the language from the cookie or use the default language
var lang_cookie_name = "language_cookie";
var lang = get_lang_cookie();

var labels_lang = "de";

var urlParams = new URLSearchParams(window.location.search);

function swap_image_src_language () {
	// Get all image elements on the page
	const images = document.getElementsByTagName("img");

	// Loop through each image element
	for (var image_idx = 0; image_idx < images.length; image_idx++) {
		const img = images[image_idx];
		const currentSrc = img.getAttribute("src");

		if (lang === "en" && currentSrc.startsWith("lang/__de__")) {
			// Replace 'de' with 'en'
			const newSrc = currentSrc.replace(/__de__/, "__en__");
			img.setAttribute("src", newSrc);
		} else if (lang === "de" && currentSrc.startsWith("lang/__en__")) {
			// Replace 'en' with 'de'
			const newSrc = currentSrc.replace(/__en__/, "__de__");
			img.setAttribute("src", newSrc);
		} else if (lang === "en" && currentSrc.startsWith("presentation/de/")) {
			// Replace 'de' with 'en'
			const newSrc = currentSrc.replace(/\/de\//, "/en/");
			img.setAttribute("src", newSrc);
		} else if (lang === "de" && currentSrc.startsWith("presentation/en/")) {
			// Replace 'en' with 'de'
			const newSrc = currentSrc.replace(/\/en\//, "/de/");
			img.setAttribute("src", newSrc);
		}
	}
}

// Function to set the language and update translations
async function set_lang(la) {
	typeassert(la, string, "la");

	if(Object.keys(language).includes(la)) {
		lang = la;
		set_cookie("lang", l, 30); // Save the language in a cookie for 30 days
		await update_translations();

		swap_image_src_language();

		setOptimizerTooltips();
	} else {
		void(0); err(`Language unknown: ${la}`);
	}
}

// Function to retrieve a cookie value
function get_lang_cookie() {
	const cookies = document.cookie.split(";");
	for (var cookie_idx = 0; cookie_idx < cookies.length; cookie_idx++) {
		const cookie = cookies[cookie_idx].trim();
		if (cookie.startsWith(lang_cookie_name + "=")) {
			var cookieValue = cookie.substring(lang_cookie_name.length + 1);
			if(Object.keys(language).includes(cookieValue)) {
				return cookieValue;
			} else {
				void(0); err(`Invalid language cookie value: ${cookieValue} not in language. Valid keys: ${Object.keys(language).join(", ")}`);
				set_lang_cookie(_default_language);
			}
		}
	}
	return _default_language;
}

// Function to set a cookie value
function set_lang_cookie(value, days=999) {
	const expirationDate = new Date();
	expirationDate.setDate(expirationDate.getDate() + days);
	const cookieValue = encodeURIComponent(value) + "; expires=" + expirationDate.toUTCString() + "; path=/";
	if(Object.keys(language).includes(value)) {
		document.cookie = lang_cookie_name + "=" + cookieValue;
	} else {
		void(0); err(`Invalid language cookie value: ${value} not in language. Valid keys: ${Object.keys(language).join(", ")}`);
	}
}

// Function to update the translation of elements
async function update_translations(force=0) {
	var elements = document.querySelectorAll("[class^=\"TRANSLATEME_\"]");
	elements.forEach((element) => {
		const translationKey = element.classList[0].substring(12);

		if(!lang) {
			void(0); err("lang is not defined! Something is seriously wrong here...");
			return;
		}

		const translation = language[lang][translationKey];
		if (translation) {
			if($(element).attr("data-lang") != lang || force) {
				element.innerHTML = translation;

				$(element).attr("data-lang", lang);
			}
		} else {
			alert("Could not translate " + translationKey + " to " + lang);
		}

	});
}

// Update translations when language selector links are clicked
var languageSelectors = $(".language-selector").find("span");
Array.from(languageSelectors).forEach((selector) => {
	selector.addEventListener("click", async function (event) {
		event.preventDefault();
		const newLang = this.dataset.lang;
		if (newLang !== lang) {
			await set_lang(newLang);
		}
	});
});

// Update translations when language is changed via URL parameter
window.addEventListener("popstate", async function () {
	const newLang = urlParams.get("lang") || "en";
	if (newLang !== lang) {
		await set_lang(newLang);
	}
});

async function update_lang(la) {
	typeassert(la, string, "la");

	if(Object.keys(language).includes(la)) {
		lang = la;
		await update_translations();
		set_lang_cookie(lang, 99999);

		setOptimizerTooltips();
	} else {
		void(0); err(`Language unknown: ${la}`);
	}
}

function trm (name) {
	if(Object.keys(language[lang]).includes(name)) {
		return `<span class='TRANSLATEME_${name}'></span>`;
	}

	alert(`${name} NOT FOUND`);

	return `${name} NOT FOUND`;
}

function _get_new_translations() {
	var url = "translations.php?print=1";

	function parse(data) {
		try {
			language = JSON.parse(data);

			update_translations(1); // await not possible
		} catch (e) {
			write_error(e); // await not possible
		}
	}

	$.ajax({
		type: "GET",
		url: url,
		dataType: "html",
		success: parse
	});
}

// _get_new_translations()

// Update translations on initial page load
update_translations(); // await not possible

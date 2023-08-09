// Get the language from the cookie or use the default language
let lang =  'en';
if(is_cosmo_mode) {
	lang = 'de';
}

// Function to set the language and update translations
function setLang(l) {
	lang = l;
	setCookie('lang', l, 30); // Save the language in a cookie for 30 days
	updateTranslations();
}

// Function to retrieve a cookie value
function getCookie(name) {
	const cookies = document.cookie.split(';');
	for (let i = 0; i < cookies.length; i++) {
		const cookie = cookies[i].trim();
		if (cookie.startsWith(name + '=')) {
			return cookie.substring(name.length + 1);
		}
	}
	return null;
}

// Function to set a cookie value
function setCookie(name, value, days) {
	const expirationDate = new Date();
	expirationDate.setDate(expirationDate.getDate() + days);
	const cookieValue = encodeURIComponent(value) + '; expires=' + expirationDate.toUTCString() + '; path=/';
	document.cookie = name + '=' + cookieValue;
}

// Function to update the translation of elements
function updateTranslations() {
	var elements = document.querySelectorAll('[class^="TRANSLATEME_"]');
	elements.forEach((element) => {
		const translationKey = element.classList[0].substring(12);
		const translation = language[lang][translationKey];
		if (translation) {
			element.innerHTML = translation;
		} else {
			alert("Could not translate " + translationKey + " to " + lang);
		}
	});
}

// Update translations on initial page load
updateTranslations();

// Update translations when language selector links are clicked
var languageSelectors = $(".language-selector").find("span");
Array.from(languageSelectors).forEach((selector) => {
	selector.addEventListener('click', function (event) {
		event.preventDefault();
		const newLang = this.dataset.lang;
		if (newLang !== lang) {
			setLang(newLang);
		}
	});
});

// Update translations when language is changed via URL parameter
window.addEventListener('popstate', function () {
	const newLang = urlParams.get('lang') || 'en';
	if (newLang !== lang) {
		setLang(newLang);
	}
});


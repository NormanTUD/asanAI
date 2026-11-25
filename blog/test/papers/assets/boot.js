(function () {
  var theme = "dark";
  try {
    theme = localStorage.getItem("papers-theme") || "dark";
  } catch (error) {
    theme = "dark";
  }
  document.documentElement.dataset.theme = theme;
})();

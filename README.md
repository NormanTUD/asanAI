# TensorFlow.js Demonstrator

This is a more or less complete GUI for TensorFlow.js. With it, you can create and train models
fully in your browsers.

# Screenshots

![Screenshot](screen0.png "Visualization at the start page")

![Screenshot](screen1.png "Other visualization at the start page")

![Screenshot](screen2.png "Yet another visualization at the start page")

# Status

This is a very early alpha. The networks provided don't yet really work, as they're only for testing.
But you can already create and use your own networks.

# Installation

## Apache2 + PHP

Nothing more is needed. TensorFlow.js does not need any server-Backend because it runs fully in
the browser. The only thing PHP is needed for is to download the datasets for the default networks
offers. Everything else is just HTML/CSS/JS.

# Standing on the shoulders of giants

I use many different libraries to achieve this. This is a list of all the modules that I used
in creating this program:

- [TensorFlow.js](https://www.tensorflow.org/js)

- [NN-SVG](http://alexlenail.me/NN-SVG/LeNet.html)

- [Prism](https://prismjs.com/)

- [Jquery-UI](https://jqueryui.com/)

- [d3.js](https://d3js.org/)

- [MathJax](https://www.mathjax.org/)

- [tfjs-activation-functions](https://github.com/Polarisation/tfjs-activation-functions)

- [Kaggle Cats and Dogs Dataset](https://www.microsoft.com/en-us/download/details.aspx?id=54765)

- The design is inspired by [Microsoft Max](https://web.archive.org/web/20051001063547/http://www.microsoft.com/max/)

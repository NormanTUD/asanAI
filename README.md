# Dedication

This software is dedicated to my mother, who died on the 31st of march 2022 after a long struggle against cancer.

# TensorFlow.js Demonstrator

This is a more or less complete GUI for TensorFlow.js. With it, you can create and train models
fully in your browser.

# Status

This is a very early alpha.

# Screenshots

![Screenshot](screen0.png "Visualization at the start page")

![Screenshot](screen1.png "Math visualization of the network")

![Screenshot](screen2.png "Yet another visualization at the start page")

![Screenshot](screen4.png "Training")

![Screenshot](screen5.png "Predict mode")

![Screenshot](screen3.png "Dark mode")

![Screenshot](screen6.png "Maximally activated neurons")


# Installation

## Apache2 + PHP + MySQL

A MySQL instance is only needed for the login functionality. Apache and PHP serve the JS-files. 
All calculations are done within the browser.

Run this for exporting python files, e.g. for taurus:

```console
mkdir -p /var/www/tmp
sudo chown -R www-user:$USER /var/www/tmp
sudo chmod -R 775 /var/www/tmp
```

# Standing on the shoulders of giants

I use many different libraries to achieve this. This is a list of all the modules that I used
in creating this program:

[comment]: <> (BeginSources)

- [TensorFlow.js](https://www.tensorflow.org/js)

- [NN-SVG](http://alexlenail.me/NN-SVG/LeNet.html)

- [Prism](https://prismjs.com/)

- [Jquery-UI](https://jqueryui.com/)

- [d3.js](https://d3js.org/)

- [MathJax](https://www.mathjax.org/)

- [Convolution arithmetic](https://github.com/vdumoulin/conv_arithmetic)

- [TensorFlow.js Examples](https://github.com/tensorflow/tfjs-examples/tree/master/visualize-convnet)

- [MNIST](http://yann.lecun.com/exdb/mnist/)

- [ChardinJS](https://heelhook.github.io/chardin.js/sequential.html)

- [Minify](https://github.com/matthiasmullie/minify.git)

- [atrament.js](https://www.fiala.space/atrament.js/demo/)

- [Magic Wand](https://codepen.io/averyhw/pen/xyxKjO/)

- [JSManipulate](http://joelb.me/jsmanipulate/)

- [hash-wasm](https://github.com/Daninet/hash-wasm)

- [plotly.js](https://plotly.com/javascript/)

- [jscolor](https://jscolor.com/)

[comment]: <> (EndSources)

# PHP Settings

In php.ini, set

```
upload_max_filesize = 100M;
post_max_size = 100M;
```

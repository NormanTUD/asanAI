![Current build status](https://github.com/NormanTUD/asanAI/actions/workflows/main.yml/badge.svg?event=push)

# Dedication

This software is dedicated to my mother, who died on the 31st of march 2022 after a long and brave fight against cancer.

# asanAI

A Browser-Based, No-Code, Offline-First Machine Learning Toolkit

# Run in docker

## Debian

`bash docker.sh --local-port 5312`

## Other

```console
LOCAL_PORT=5312
echo "LOCAL_PORT=$LOCAL_PORT" >> .env
sudo docker-compose build && sudo docker-compose up -d || echo "Failed to build container"
firefox localhost:$LOCAL_PORT/
```

# Status

This is an beta.

# Screenshots

![Screenshot](screens/screen0.png "Visualization at the start page")

![Screenshot](screens/screen1.png "Math visualization of the network")

![Screenshot](screens/screen2.png "Yet another visualization at the start page")

![Screenshot](screens/screen4.png "Training")

![Screenshot](screens/screen5.png "Predict mode")

![Screenshot](screens/screen3.png "Dark mode")

![Screenshot](screens/screen6.png "Maximally activated neurons")


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

- [Prism](https://prismjs.com/)

- [Jquery-UI](https://jqueryui.com/)

- [d3.js](https://d3js.org/)

- [MathJax](https://www.mathjax.org/)

- [temml](https://temml.org/)

- [Convolution arithmetic](https://github.com/vdumoulin/conv_arithmetic)

- [TensorFlow.js Examples](https://github.com/tensorflow/tfjs-examples/tree/master/visualize-convnet)

- [MNIST](http://yann.lecun.com/exdb/mnist/)

- [Minify](https://github.com/matthiasmullie/minify.git)

- [atrament.js](https://github.com/jakubfiala/atrament)

- [Magic Wand](https://codepen.io/averyhw/pen/xyxKjO/)

- [JSManipulate](https://github.com/bennyschudel/JSManipulate)

- [hash-wasm](https://github.com/Daninet/hash-wasm)

- [plotly.js](https://plotly.com/javascript/)

- [jscolor](https://jscolor.com/)

- [zip.js](https://gildas-lormeau.github.io/zip.js/)

- [chatGPT](https://chatgpt.com/)

- [sparkle.js](https://www.cssscript.com/demo/sparkle-effect/)

- [Manicule](https://news.lib.wvu.edu/2017/08/28/the-first-post-it-note-the-manicule/)

- [Color Picker Icon](https://commons.wikimedia.org/wiki/File:Inkscape_icons_color_picker.svg)

- [Loading Icon](https://upload.wikimedia.org/wikipedia/commons/b/b1/Loading_icon.gif)

- [Fire Alarm Button](https://freesvg.org/drawing-of-fire-alarm-push-button)

- [A green circle icon with a(n) arrow-right symbol from the Emoji One BW icon font.](https://de.wikipedia.org/wiki/Datei:Eo_circle_green_arrow-right.svg)

- [Smooth arrow animation](https://codepen.io/vlt_dev/pen/NWMNzpE)

- [Multitouch tap.png](https://commons.wikimedia.org/wiki/File:Multitouch_tap.png)

- [html2canvas](https://html2canvas.hertzen.com/)

- [Colorpicker.svg](https://commons.wikimedia.org/wiki/File:Colorwheel.svg)

- [confetti.js](https://www.kirilv.com/canvas-confetti/)

- [Cosmo-Präsentation, Dr. Christoph Lehmann](https://tu-dresden.de/zih/die-einrichtung/struktur/dr-christoph-lehmann)

- [GNOME Desktop Icon Pack](https://commons.wikimedia.org/wiki/GNOME_Desktop_icons)

- [Aurora Background Easter Egg](https://codepen.io/rawcreative/pen/kabgzJ)

[comment]: <> (EndSources)

# PHP Settings

In php.ini, set

```
upload_max_filesize = 100M;
post_max_size = 100M;
```

# Sponsored by

![Sponsors](_gui/sponsored_by.png "Sponsored by")

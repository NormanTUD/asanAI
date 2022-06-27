// first, we need to set up the canvas
const canvas = document.getElementById('sketcher');
canvas.style.cursor = 'crosshair';
// instantiate Atrament
const atrament = new Atrament(canvas, {
  width: canvas.offsetWidth,
  height: canvas.offsetHeight
});

var ctx = canvas.getContext("2d");
ctx.fillStyle = "white";
ctx.fillRect(0, 0, canvas.width, canvas.height);

// a little helper tool for logging events
const eventsLog = [];
const logElement = document.getElementById('events');

// we only display the Clear button if canvas is dirty
/*
const clearButton = document.getElementById('clear');
atrament.addEventListener('dirty', () => {
  log('event: dirty');
  clearButton.style.display = atrament.isDirty ? 'inline-block' : 'none';
});
*/

atrament.addEventListener('clean', () => {
  log('event: clean');
  predict_handdrawn();
});

atrament.addEventListener('fillstart', ({ x, y }) => {
  canvas.style.cursor = 'wait';
  log(`event: fillstart x: ${x} y: ${y}`);
});

atrament.addEventListener('fillend', () => {
  canvas.style.cursor = 'crosshair';
  log('event: fillend');
});

atrament.addEventListener('strokeend', () => { predict_handdrawn(); } );

atrament.addEventListener('strokerecorded', ({ stroke }) => {
  log(`event: strokerecorded - ${stroke.points.length} points`);
});

// utility to add delay to drawing steps
const sleep = async time => new Promise((r) => setTimeout(r, time));

let waitUntil = function (reference, time) {
    let time_elapsed = performance.now()-reference;
    let time_to_wait = time - time_elapsed;
    return new Promise(resolve => setTimeout(resolve, time_to_wait));
};

function recordAStroke() {
    atrament.recordStrokes = true;
    document.querySelector("#recordButton").value = "Recording...";
}

var recordedStroke;
atrament.addEventListener('strokerecorded', (stroke) => {
    recordedStroke = stroke.stroke;
    atrament.recordStrokes = false;
    document.querySelector("#recordButton").value = "Record a stroke";
    document.querySelector("#playButton").style.display = "inline";
});

async function playRecorded() {
  // offset the drawing to avoid drawing at the exact same place
  let offset_x = Math.floor(Math.random()*100)-50;
  let offset_y = Math.floor(Math.random()*100)-50;
    
  // set drawing options
  atrament.weight = recordedStroke.weight;
  atrament.mode = recordedStroke.mode;
  atrament.smoothing = recordedStroke.smoothing;
  atrament.color = recordedStroke.color;
  atrament.adaptiveStroke = recordedStroke.adaptiveStroke;

  // add a time reference
  let reference = performance.now();

  // wait for the first point
  await waitUntil(reference, recordedStroke.points[0].time);

  let prev_point = recordedStroke.points[0].point;
  atrament.beginStroke(prev_point.x, prev_point.y);

  for (const point of recordedStroke.points.slice(1)) {
    // waiting for time from reference
    await waitUntil(reference, point.time);

    // the `draw` method accepts the current real coordinates
    // (i. e. actual cursor position), and the previous processed (filtered)
    // position. It returns an object with the current processed position.
    prev_point = atrament.draw(point.point.x + offset_x, point.point.y + offset_y, prev_point.x, prev_point.y);
  }

  atrament.endStroke(prev_point.x, prev_point.y);
}

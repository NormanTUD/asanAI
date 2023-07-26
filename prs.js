function parse_required_skills(str) {
  // Step 1: Split the input string into individual key-value pairs using regex
  var keyValuePairs = str.split(/,(?=\w+\[)/);

  var res = {};

  // Step 2: Parse each key-value pair to extract the key and values
  keyValuePairs.forEach(function (pair) {
    var match = pair.match(/^(\w+)\[(.*)\]$/);
    if (match) {
      var key = match[1];
      var values = match[2].split(',').map(Number);
      res[key] = values;
    }
  });

  return res;
}

console.log(parse_required_skills("watched_presentation[1],toggled_webcam[0,1]"));

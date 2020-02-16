'use strict';

// TODO show result of the keys pressed and update it every keyup/keydown
// TODO special key switched mode to back and forth between words and characters
// TODO better typing area

// path to the json file containing settings
const DATA_URL = 'words.json';

// current data like keybindings and words
var DATA = {};

// history of key releases, used to calculate the code
var PRESSED_HISTORY = [];

// integer that represents currently pressed keys
let PRESSED = 0;

const INPUT_FIELD = document.getElementById('input');

// async read file and call the callback with the text
function read_file(path, callback) {
   var request = new XMLHttpRequest();

   request.onreadystatechange = function () {
      if (this.readyState == 4) {
         if (this.status === 200) {
            callback(this.responseText);
         } else {
            console.error(this.statusText);
         }
      }
   };
   request.open("GET", window.location.href + path, true);
   request.send();
}

// overrwrites current data with new data
function load_data(data) {
   DATA = { ...DATA, ...data };
}

// prints current data to console in JSON format
function print_data_json() {
   console.log(JSON.stringify(DATA));
}

// returns current time in milliseconds
function millis() {
   return new Date().getTime();
}

// returns value of key from DATA.keys array
function get_key_value(key) {
   if (DATA.keys.includes(key)) {
      const key_index = DATA.keys.length - DATA.keys.findIndex((x) => key == x) - 1;

      return (1 << key_index);
   } else {
      return 0;
   }
}

function key(key, state) {
   const key_value = get_key_value(key);

   if (state)
      PRESSED |= key_value;
   else
      PRESSED &= ~(key_value);

   if (PRESSED != 0 && DATA.words[PRESSED] !== undefined)
      INPUT_FIELD.value = DATA.words[PRESSED];
   else
      INPUT_FIELD.value = '';
}

// processes array of key releases into a code
function process(array) {
   // no need to process anything if its one lone key
   if (array.length == 1)
      return get_key_value(array[0][1]);

   // make the first element the last key to be released
   array = array.reverse();

   let output = new Set();
   let last_time;

   for (let index = 0; index < array.length; ++index) {
      const time = array[index][0];
      const key = array[index][1];

      if (index == 0) {
         last_time = time;
         output.add(key);
         continue;
      }

      // get time between last and current key
      const diff = last_time - time;

      // if diff <= DATA.key_delay accept it
      if (diff <= DATA.key_delay)
         output.add(key);
      // otherwise the chain was broken, stop
      else
         break;
   }

   let output_code = 0;

   output.forEach(element => output_code += get_key_value(element));

   return output_code;
}

// function ran when code of the keys is calculated
function press(code) {
   console.log("'" + code + "' => '" + DATA.words[code.toString()] + "'");
}

function keydown(event) {
   if (event.repeat)
      return;

   if (DATA.keys.includes(event.key)) {
      key(event.key, true);
   }
}

function keyup(event) {
   if (event.repeat)
      return;

   if (event.key == DATA.special_key) {
      // TODO
   } else if (DATA.keys.includes(event.key)) {
      key(event.key, false);

      PRESSED_HISTORY.push([millis(), event.key]);

      if (PRESSED == 0) {
         press(process(PRESSED_HISTORY))

         PRESSED_HISTORY = [];
      }
   }
}

read_file(DATA_URL, text => {
   load_data(JSON.parse(text));

   document.addEventListener('keydown', keydown);
   document.addEventListener('keyup', keyup);
});

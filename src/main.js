'use strict';

const DATA_URL = 'words.json';
const input = document.getElementById('input');

// current data like keybindings and words
var DATA = {};

// represents keys currently pressed
// (used to show what will be written)
var code = 0;

// array of key relases
var releases = [];

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
      code |= key_value;
   else
      code &= ~(key_value);

   input.value = code.toString(2);
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
   console.log(code);
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

   if (DATA.keys.includes(event.key)) {
      key(event.key, false);

      releases.push([millis(), event.key]);

      if (code == 0) {
         press(process(releases))

         releases = [];
      }
   }
}

read_file(DATA_URL, text => {
   DATA = JSON.parse(text);

   document.addEventListener('keydown', keydown);
   document.addEventListener('keyup', keyup);
});

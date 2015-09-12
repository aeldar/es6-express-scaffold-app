console.log('Hi, you!');

const a = 4;
console.log(a);

// jQuery is global due to CDN

$('body').addClass('es6');

import _ from 'underscore';

var test1 = _.toArray({'asdf': 'zzzz'});

console.log(test1);

import add from './add.js';

console.log(add(2, 3));

console.log('We are using EcmaScript2015 just for fun. Eat this!');

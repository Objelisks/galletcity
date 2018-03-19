// draw roads
// -pick main road
// -spawn crossroads

  // draw crosswalks
  // draw road intersections
  // draw road decorations
  // draw rails
  // draw rail crossings
// size buildings
// apply shade


// remaining work:
/*
X building layout
construction
scaffolding
X sidewalk decoration
X sheds
X parks (parking lots, dirt lot, grass lot)
X parking building
X fix rivers
fix intersections
X smokestack
helipad
aquifer?
medians?

improvements:
  dont use road roof near roads
  dont place rail on roads
  paint shading
*/

const Canvas = require('canvas');
const fs = require('fs');
const Image = Canvas.Image;
const Twitter = require('twitter');
let client = new Twitter(JSON.parse(fs.readFileSync('creds.json')));

let tileSheet = new Image();
tileSheet.src = fs.readFileSync('./galletcity_tiles.png');


const W = 64;
const H = 64;
const TILES_WIDTH = 8;
const TILES_HEIGHT = 21;
const TILE_WIDTH = 8;
const TILE_HEIGHT = 8;

let rand = (x) => Math.floor(Math.random()*x);
let is = (x, y) => x.every((n, i) => n == y[i]);
let has = (arr, e) => arr.indexOf(e) >= 0;
let times = (n) => ({each: (cb) => {
  for(let i=0; i<n; i++) {
    cb(i);
  }
}});
let shuffle = (a) => {
  let copy = a.slice();
    for (let i = copy.length - 1; i > 0; i--) {
        let j = rand(i+1);
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};
let pick = (a, n=1) => shuffle(a).slice(0, n);

let tile = (val, shade=false, allow_replace=true) => ({s: val, d:shade, r:allow_replace});
let rtile = (arr, shade=false, allow_replace=true) => () => tile(pick(arr)[0], shade, allow_replace);
let tiles = (pattern, shade=false, allow_replace=true) => pattern.map(row => row.map(val => tile(val, shade, allow_replace)));
let tileToXY = (t) => ({
  x: (t%TILES_WIDTH)*TILE_WIDTH,
  y: Math.floor(t/TILES_WIDTH)*TILE_HEIGHT,
});

let map = [];
function initialize() {
  for(let x=0; x<W; x++) {
    let col = [];
    for(let y=0; y<H; y++) {
      col[y] = tile(0);
    }
    map[x] = col;
  }
}
initialize();

const sidewalks = [3,4,5,6,7,11,15,19,20,21,22,23,27,28,29,30,31,35,36,37,38,39];
const roads = [1,2,8,9,10,16,32,40,41];
const alleys = [18,26,34,42,50];
const waters = [101,70,78,77];
const shaders = [153,161,42,52,60,68,141,125,133,118,142,157,165,149,102,61,53,55,63,71,79,164,156,148,163,155,147,162];
// src: [top, side, full]
const darks = {
  5:  [28, 28, 28],
  15: [31, 23, 31],
  18: [50, 26, 50],
  27: [11, 27, 27],
  30: [39, 39, 39],
  36: [37, 38, 38],
  95: [14, 159, 158],
  139: [116, 109, 108],
  101: [101, 69, 69],
  70: [70, 69, 69],
  78: [78, 69, 69],
  77: [77, 69, 69],
  86: [86, 85, 85],
  62: [62, 85, 85],
};
const shades = Object.keys(darks).map(x => parseInt(x, 10));
const up = [0,-1];
const down = [0,1];
const left = [-1,0];
const right = [1,0];

let safe = (x, y) => !!map[x] && !!map[x][y];
let empty = (x, y) => safe(x, y) && map[x][y].s == 0;
let road = (x, y) => safe(x, y) &&
  (has(sidewalks, map[x][y].s) || has(roads, map[x][y].s));
let water = (x, y) => safe(x, y) && has(waters, map[x][y].s);
let shadeable = (x, y) => safe(x, y) && has(shades, map[x][y].s);
let shader = (x, y) => safe(x, y) && has(shaders, map[x][y].s);
let free = (x, y, w, h) => {
  for(let i=x; i<x+w; i++) {
    for(let j=y; j<y+h; j++) {
      if(!safe(i, j) || !empty(i, j)) {
        return false;
      }
    }
  }
  return true;
};
let set = (x, y, w, h, tile_props) => {
  for(let i=x; i<x+w; i++) {
    for(let j=y; j<y+h; j++) {
      Object.keys(tile_props).forEach(prop =>
        map[i][j][prop] = tile_props[prop]);
    }
  }
};

const patterns = {
  vertical_road: tiles([
    [36],
    [2],
    [2],
    [4]
  ]),
  horizontal_road: tiles([[15, 1, 1, 27]]),
  four_way: tiles([
    [30, 32, 32, 35],
    [32, 32, 32, 32],
    [32, 32, 32, 32],
    [ 7, 32, 32,  3]
  ]),
  zero_way: tiles([
    [ 5, 36, 36,  5],
    [15, 32, 32, 27],
    [15, 32, 32, 27],
    [ 5,  4,  4,  5]
  ]),
  intersection: tiles([
    [-1, 1, 1, -1],
    [1, 1, 1, 1],
    [1, 1, 1, 1],
    [-1, 1, 1, -1]
  ]),
  parkingramp: tiles([
    [150, 151]
  ]),
};

const tile_math = {
  [[15, 36]]: tile(30),
  [[15, 4]]: tile(7),
  [[27, 36]]: tile(35),
  [[27, 4]]: tile(3),
  [[1, 4]]: tile(32),
  [[1, 36]]: tile(32),
  [[2, 15]]: tile(32),
  [[2, 27]]: tile(32),
  [[126, 15]]: tile(127),
  [[126, 1]]: tile(127),
  [[126, 27]]: tile(127),
  [[126, 32]]: tile(127),
  [[134, 15]]: tile(135),
  [[134, 1]]: tile(135),
  [[134, 27]]: tile(135),
  [[134, 32]]: tile(135),
};

function matchat(x, y, pattern) {
  return pattern.every((row, j) =>
    row.every((val, i) =>
      safe(x+i, y+j) && (map[x+i][y+j].s == val || val == -1)
    ));
}

function replaceinshape(x, y, pattern, replace, val) {
  pattern.forEach((row, j) => {
    row.forEach((col, i) => {
      if(safe(x+i, y+j) && !empty(x+i, y+j) && col == replace) {
        drawrect(x+i, y+j, 1, 1, val);
      }
    })
  })
}

function regex(pattern, replace, val) {
  for(let y=0; y<H; y++) {
    for(let x=0; x<W; x++) {
      if(matchat(x, y, pattern)) {
        replaceinshape(x, y, pattern, replace, val);
      }
    }
  }
}

function alchemy(x, y, val) {
  let match = tile_math[[map[x][y].s, val.s]] || tile_math[[val.s, map[x][y].s]];
  return match || val;
}

// val_func can either be tile(15) or (i,j,t) => tile(15) or (i,j,t) => (i,j,t) => tile(15), etc
function drawrect(x, y, w, h, val_func) {
  // dont worry abt it
  let evaluator = (thing) => (x, y, t) =>
    thing instanceof Function ?
      evaluator(thing(x, y, t))(x, y, t) :
      thing;
  let eval_val = evaluator(val_func);
  for(let i=x; i<x+w; i++) {
    for(let j=y; j<y+h; j++) {
      if(empty(i, j)) {
        map[i][j] = eval_val(i, j, map[i][j]);
      } else if(safe(i, j) && map[i][j].r) {
        map[i][j] = alchemy(i, j, eval_val(i, j, map[i][j]));
      }
    }
  }
}

function draw(pattern, x, y) {
  pattern.forEach((row, i) =>
    row.forEach((val, j) =>
      drawrect(x+j, y+i, 1, 1, val)));
}

function drawrail() {
  let y = rand(H);

  drawrect(0, y-1, W, 1, (i,j,t) => !road(i,j) ? tile(54) : t); // median
  drawrect(0, y, W, 1, tile(126)); // top rail
  drawrect(0, y+1, W, 1, tile(134)); // bot rail
  drawrect(0, y+2, W, 1, (i,j,t) => !road(i,j) ? tile(54) : t); // median
}

function drawroads() {
  //pick a random grid point (this is center of 4x4 road block (intersection))
  let xy = [rand(W/8)*8, rand(H/8)*8];
  draw(patterns.zero_way, ...xy);
  let dirs = [left,up,right,down];
  let extents = pick(dirs, Math.random()*3+2);
  //randomly pick extend dirs
  //extend
  extents.forEach(extend => {
    let mul = (is(extend, right) || is(extend, down)) ? 4 : 1;
    let first = extend.map((n, i)=> n*(mul-1)+xy[i]);
    let front = extend.map((n, i)=> n*mul+xy[i]);
    if(extend[0] != 0)  {
      draw(patterns.vertical_road, ...first);
    } else {
      draw(patterns.horizontal_road, ...first);
    }
    let hit = !empty(...front);
    while(!hit) {
      front = extend.map((n, i)=> n*mul+xy[i]);
      if(empty(...front)) {
        // paint road
        if(extend[0] != 0)  {
          draw(patterns.vertical_road, ...front);
        } else {
          draw(patterns.horizontal_road, ...front);
        }
        mul += 1;
      } else if(road(...front)) { // if there is a road in the way as we extend
        // paint intersection (using alchemy)
        if(extend[0] != 0)  {
          draw(patterns.vertical_road, ...front);
        } else {
          draw(patterns.horizontal_road, ...front);
        }
        let offset = [0,0];
        if(is(extend, left)) offset = [-4,0];
        if(is(extend, up)) offset = [0,-4];
        // clean up road lines
        replaceinshape(...front.map((n,i) => n+offset[i]), patterns.intersection, 1, tile(32));
        replaceinshape(...front.map((n,i) => n+offset[i]), patterns.intersection, 2, tile(32));
        hit = true;
      } else {
        // out of bounds
        hit = true;
      }
    }
  });
  replaceinshape(...xy, patterns.intersection, 1, tile(32));
  replaceinshape(...xy, patterns.intersection, 2, tile(32));
}

// white with angle on side
function building1(x, y, w, h) {
  // facade
  let tall = rand(4)+2;
  let b = y+h-1;
  drawrect(x, b, 1, 1, tile(160)); // leftmost floor
  drawrect(x+1, b, w-1, 1, rtile([153, 161])); // add some doors maybe
  drawrect(x, b-(tall-2), 1, tall-2, tile(152)); // leftmost wall
  drawrect(x+1, b-(tall-2), w-1, tall-1, tile(153)); // windows

  drawrect(x, b-(tall-1), 1, 1, tile(144)); // leftmost top wall
  drawrect(x+1, b-(tall-1), w-1, 1, tile(145)); // top windows

  // roof
  let rb = b-tall;
  drawrect(x, rb, 1, 1, tile(136)); // leftmost roof extension
  drawrect(x, rb-(h-2), 1, h-2, tile(80)); // left roof wall
  drawrect(x, rb-(h-1), 1, 1, tile(72)); // left roof corner
  drawrect(x+1, rb-(h-1), w-1, 1, rtile([73, 74])); // top roof wall
  drawrect(x+1, rb-(h-2), w-1, h-1, rtile([5, 6, 51, 66, 67, 81, 82, 83, 88, 92, 103])); // roof
}

// yellow/red, yellow roof
function building2(x, y, w, h) {
  // facade
  let tall = rand(3)+4;

  // door, dark, medium, light, top
  let palettes = [
    [68,   60,  52,  52,  44], // red
    [142, 141, 133, 125, 117], // yellow
    [165, 157, 157, 157, 149], // grey
  ];
  let palette = pick(palettes)[0];

  let rem = tall-2;
  let gradient = [];
  for(let i=0; i<2; i++) {
    let layer = Math.max(1, rand(rem));
    rem -= layer;
    gradient.push(layer);
  }
  gradient.push(1); // top
  gradient.splice(0, 0, rem+1); // dark

  let b = y+h-1;
  let sum = 0;
  times(gradient.length).each((i) => {
    let layer = gradient[i];
    drawrect(x, b-(sum+layer)+1, w, layer, tile(palette[i+1]));
    sum += layer;
  });

  // doors
  drawrect(x, b, w, 1, rtile([palette[0], palette[1]]));

  // left wall, left corner, top wall, misc
  let lightgray = [17, 21, 24, 25, 33, 2, 1];
  let lightgray_wall = [64, 65, 76];
  let roofpalettes = [
    [lightgray, lightgray_wall, lightgray_wall, lightgray], // light grey
    [[80], [72], [73,74], [5,6,51,66,67,81,82,83,88,92,103,115]], // grey
    [[97], [89], [90,91,92], [98,99,100,139,139,139,84,132,115]], // yellow
  ];
  let roofpalette = pick(roofpalettes)[0];

  // roof
  let rb = b-tall;
  drawrect(x, rb-(h-2), 1, h-1, rtile(roofpalette[0], false, false)); // left roof wall
  drawrect(x, rb-(h-1), 1, 1, rtile(roofpalette[1], false, false)); // left roof corner
  drawrect(x+1, rb-(h-1), w-1, 1, rtile(roofpalette[2], false, false)); // top roof wall
  drawrect(x+1, rb-(h-2), w-1, h-1, rtile(roofpalette[3], false, false)); // roof
}

// parking garage
function building3(x, y, w, h) {
  // facade
  let tall = rand(4)+3;
  let dark = rand(tall-1)+1;
  let light = tall-dark;

  let bar = (one, two) => (i,j,t) => (i-x+1)%3==0 ? one : two;

  let b = y+h-1;
  drawrect(x, b-(tall-1), 1, tall, tile(154)); // leftmost side
  drawrect(x+1, b, w-1, 1, bar(tile(163), rtile([162, 164]))); // add some doors maybe
  drawrect(x+1, b-(dark-1), w-1, dark-1, bar(tile(163), tile(164))); // dark windows
  drawrect(x+1, b-(dark+light-1), w-1, light, bar(tile(155), tile(156))); // light windows

  drawrect(x, b-(tall-1), 1, 1, tile(146)); // leftmost top wall
  drawrect(x+1, b-(tall-1), w-1, 1, bar(tile(147), tile(148))); // top windows

  // roof 5 => 3,2 4 => 4 3 => 3 6=> 4,2 7 => 4,3, 8 => 4,4
  let parks = [];
  let rem = h-1;
  while(rem > 0) {
    let cut = Math.min(rem, 4);
    if(cut == 1) {
      cut = 2;
      parks[parks.length-1]--;
    }
    parks.push(cut);
    rem -= cut;
  }

  let rb = b-tall;
  drawrect(x, rb, 1, 1, tile(136)); // leftmost roof extension

  let sum = 0;
  parks.forEach((park) => {
    if(park == 2) {
      drawrect(x+1,rb-sum,w-1,1,tile(119));
      drawrect(x+1,rb-sum-1,w-1,1,tile(111));
    } else if(park == 3) {
      drawrect(x+1,rb-sum,w-1,1,tile(119));
      drawrect(x+1,rb-sum-1,w-1,1,tile(5));
      drawrect(x+1,rb-sum-2,w-1,1,tile(111));
      draw(patterns.parkingramp, x+w-3, rb-sum-1);
    } else {
      drawrect(x+1,rb-sum,w-1,1,tile(119));
      drawrect(x+1,rb-sum-1,w-1,1,tile(5));
      drawrect(x+1,rb-sum-2,w-1,1,tile(5));
      drawrect(x+1,rb-sum-3,w-1,1,tile(111));
      draw(patterns.parkingramp, x+w-3, rb-sum-1);
    }
    sum += park;
  });

  drawrect(x, rb, 1, 1, tile(136)); // leftmost roof extension
  drawrect(x, rb-(h-2), 1, h-2, tile(80)); // left roof wall
  drawrect(x, rb-(h-1), w, 1, tile(102)); // top roof wall
}

// grass and such
// w: 1+ h: 1+
function park(x, y, w, h) {
  let parking = (i, j, t) => {
    if(j == y) {
      return tile(111);
    } else if(j == y+h-1) {
      return tile(119);
    } else {
      return tile(5);
    }
  };

  let types = [
    tile(95), // grass
    tile(139), // dirt
  ];
  let parkingweighted = [
    tile(95), // grass
    tile(139), // dirt
    parking,
  ];

  let type = pick(h <= 4 ? parkingweighted : types)[0];
  drawrect(x, y, w, h, type);
  if(type == parking) {
    drawrect(x, y-1, w, 1, tile(96));
  }
}

let river = (width = rand(4)+2) => (x, y, w, h) => {
  let waterbit = [x, y+2, w, 1, tile(101)];
  let rows = [
    [x, y, w, 1, tile(54)],
    [x, y+1, w, 1, tile(62)],
  ];
  times(width).each((i) =>  rows.splice(2, 0, waterbit.map((x,j) => j==1 ? x+i : x)));

  rows.push([x, y+rows.length, w, 1, tile(86)]);
  rows.push([x, y+rows.length, w, 1, tile(94)]);
  rows.forEach((row, i) => {
    if(row[1] < y+h) drawrect(...row);
  });
}

// raised platform that contains more stuff
// w: 6+ h: 6+
function raisedbit(x, y, w, h, int) {
  drawrect(x, y, w, 1, (i, j) => i==x ? tile(45) : i==x+w-1 ? tile(47) : tile(46)); // top
  drawrect(x, y+1, 1, h-2, (x, y) => y%2==0 ? tile(53) : tile(61)); // leftside
  drawrect(x+w-1, y+1, 1, h-2, (x, y) => y%2==0 ? tile(55) : tile(63)); // rightside
  drawrect(x, y+h-1, w, 1, tile(102)); // bottom

  // interior
  let interiors = int ? int : [river()];
  let interior = pick(interiors)[0];

  interior(x+1, y+1, w-2, h-2);
}

function placeriver() {
  let y = rand(H/4)*4;
  let width = 2+rand(4);
  let skip = false;
  let start = 0;
  let length = 0;
  for(let x=0; x<W; x+=4) {
    if(empty(x, y) && empty(x+3, y) && empty(x, y+3) && empty(x+3, y+3) && empty(x, y+7) && empty(x+3, y+7)) {
      length += 4;
    } else {
      if(length > 0) {
        raisedbit(start, y, length, 8, [river(width)]);
        length = 0;
      }
      start = x+4;
    }
  }
  if(length > 0) {
    raisedbit(start, y, length, 8, [river(width)]);
  }

  // water decorations (so buildings aren't considered land)

  regex([[-1]], -1, (i,j,t) => water(i,j) && Math.random() > 0.9 ? tile(77) : t);

  regex([[-1], [101]], 101, (i,j) => !water(i,j-1) && rand(2) == 0 ? tile(70) : tile(101)); // water top
  regex([[101], [-1]], 101, (i,j) => !water(i,j+1) && rand(2) == 0 ? tile(78) : tile(101)); // water bottom
}

function drawbuilding(x, y, w, h) {
  // cut a bit off some corners
  // pick heights for sections
  // draw roof
  // draw facade
  // decorate
  //drawrect(x, y, w, h, tile(rand(80)));
  let buildings = [
    building1,
    building1,
    building1,
    building2,
    building2,
    building2,
    building2,
    building3,
    park,
    park,
  ];
  let building = pick(buildings)[0];
  building(x, y, w, h);
  return building;
}

function drawalley(x, y, w, h) {
  drawrect(x, y, w, h, tile(18));
}

function placebuilding(x, y) {
  let bw = 4;
  let bh = 4;
  while((empty(x+bw, y) || empty(x, y+bh)) && bw < rand(10)+3 && bh < rand(10)+3) {
    if(Math.random() > 0.3 && empty(x+bw, y)) {
      bw += 1;
    } else if(empty(x, y+bh)) {
      bh += 1;
    }
  }

  if(free(x, y, bw, bh)) {
    let sidealley = false, fillright = false;

    for(let i=0; i<4; i++) {
      if(free(x+bw+i, y, 1, bh)) {
        fillright += 1;
      }
    }
    if(fillright >= 3) {
      sidealley = true;
      fillright = false;
    }
    let outbuild = drawbuilding(x, y, bw+(fillright?fillright:0)-(sidealley?1:0), bh);
    if(sidealley && outbuild != park) {
      drawalley(x+bw-1, y, 1, bh);
    }
  }
}

function placebuildings() {
  for(let x=0; x<W; x++) {
    for(let y=0; y<H; y++) {
      if(!empty(x, y)) continue;
      placebuilding(x, y);
    }
  }
}

function decorate() {
  regex([[32],[1]], 1, tile(10)); // road symbols
  regex([[-1, 32],[15, -1],[-1, 1]], 1, tile(8)); // road symbols
  regex([[1],[32]], 1, tile(10)); // road symbols
  regex([[1, -1], [-1, 27], [32, -1]], 1, tile(8)); // road symbols
  regex([[32, 2]], 2, tile(9)); // road symbols
  regex([[2, 32]], 2, tile(9)); // road symbols


  regex([[-1, 55]], 55, (i,j,t) => water(i-1,j) ? tile(71) : t); // water sides
  regex([[-1, 63]], 63, (i,j,t) => water(i-1,j) ? tile(79) : t); // water sides

  regex([[54]], 54, (i,j,t) => Math.random() > 0.8 ? rtile([12, 13]) : t); // bushes
}

function postshade_decorate() {
  regex([[-1, 54]], 54, (i,j,t) => shader(i-1,j) ? tile(93) : t); // water bush
  regex([[-1, 94]], 94, (i,j,t) => shader(i-1,j) ? tile(93) : t); // water bush

  regex([[139]], 139, (i,j,t) => Math.random() > 0.6 ? rtile([123, 131, 132]) : t); // dirty dirt
  regex([[27]], 27, (i,j,t) => Math.random() > 0.8 ? tile(20) : t); // sidewalks
  regex([[27]], 27, (i,j,t) => Math.random() > 0.6 && has(shaders, map[i+1][j].s) ? tile(19) : t); // sidewalks
  regex([[31]], 31, (i,j,t) => Math.random() > 0.8 ? tile(22) : t); // sidewalks

  regex([[-1],[95]], 95, (i,j,t) => !has([95,94,158,159,14], map[i][j-1].s) ? tile(94) : t); // grass edge
}

function force_decorate() {
  set(0, 0, W, H, {r:true});

  regex([[-1], [115]], -1, (i,j,t) => Math.random() > 0.7 ? tile(115) : t); // smokestack
  regex([[-1], [115]], -1, (i,j,t) => t.s != 115 ? tile(107) : t); // smokestack

  regex([[-1],[20]], -1, rtile([12, 13])); // grow trees
  regex([[-1],[21]], -1, rtile([12, 13])); // grow trees
  regex([[-1],[22]], -1, tile(14)); // grow trees


  regex([[54,54,54,54]], 54, Math.random() > 0.7 ? () => tile(Math.random() > 0.5 ? 56 : 57) : tile(54)); // container base
  regex([[-1],[56]], -1, tile(48)); // container top
  regex([[-1],[57]], -1, tile(49)); // container top
}

function shade() {
  for(let x=0; x<W; x++) {
    for(let y=0; y<H; y++) {
      if(shadeable(x, y)) {
        let dark = Math.floor(Math.max(0, Math.log2((shader(x,y-1)?2:0) + (shader(x-1,y)?4:0) + (shader(x-1,y-1)?8:0))));
        if(dark > 0) {
          if(shader(x,y-1) && shader(x-1,y)) dark = 2;
          map[x][y] = tile(darks[map[x][y].s][dark-1]);
        }
      }
    }
  }

  // cleanup hax
  regex([[50], [26]], 26, tile(50)); // darken alley
}

function post(canvas) {
  client.post('media/upload', {media: canvas.toBuffer()}, (error, media, res) => {
    if(!error) {
      let status = {
        status: '',
        media_ids: media.media_id_string
      };

      client.post('statuses/update', status, (error, tweet, res) => {
        if(!error) {
          console.log('tweet success');
        }
      });
    }
  });
}

function render() {
  let canvas = new Canvas(map.length*TILE_WIDTH, map[0].length*TILE_HEIGHT);
  let ctx = canvas.getContext('2d');

  map.forEach((row, x) => {
    row.forEach((tile, y) => {
      let src = tileToXY(tile.s);
      ctx.drawImage(tileSheet, src.x, src.y, TILE_WIDTH, TILE_HEIGHT, x*TILE_WIDTH, y*TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT);
    });
  });

  let out = fs.createWriteStream(__dirname + '/test.png');
  let stream = canvas.pngStream();
  stream.on('data', (chunk) => out.write(chunk));
  stream.on('end', () => post(canvas));
}


times(6+rand(5)).each(() => drawroads());
times(rand(3)).each(() => drawrail());

placeriver();

placebuildings();
/*times(6).each(x => {
  building3(1+x*8, 40, 4+rand(8), 4+rand(8));
});*/

//times(6).each((i) => raisedbit(5+i*10, 5, 4+i, 4+i));

drawrect(0,0,W,H,(i,j,t) => empty(i,j) ? tile(95) : t);

decorate();

shade();

postshade_decorate();

force_decorate();

render();

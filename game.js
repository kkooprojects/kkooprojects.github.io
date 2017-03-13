const KEYCODE_W = 87,
	KEYCODE_A = 65,
	KEYCODE_S = 83,
	KEYCODE_D = 68;
const MAX_ROWS = 20;
const MAX_COLS = 20;
const TILE_LENGTH = 10;
const CAMERA_SIZE_CONST = 200;

var scene = new THREE.Scene();
//var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
var aspectRatio = window.innerWidth/window.innerHeight;
var camera = new THREE.OrthographicCamera( -CAMERA_SIZE_CONST, CAMERA_SIZE_CONST, CAMERA_SIZE_CONST/aspectRatio, -CAMERA_SIZE_CONST/aspectRatio, 1, 1000 );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );


//blocks
var blocks = [];

// set base plane
var planeGeometry = new THREE.PlaneGeometry( 200, 200 );
var planeMaterial = new THREE.MeshLambertMaterial( {color: 0xa7c7f9, side: THREE.DoubleSide} );
var plane = new THREE.Mesh( planeGeometry, planeMaterial );
scene.add( plane );

// load level
var levelOb = levels[1];
levelOb.rowOffset = Math.ceil((MAX_ROWS - levelOb.rows)/2);
levelOb.colOffset = Math.ceil((MAX_COLS - levelOb.cols)/2);
var tileStates = [];
for (var i = 0; i < levelOb.tiles.length; i++) {
	tileStates[i] = [];
	for (var j = 0; j < levelOb.tiles[i].length; j++) {
		tileStates[i][j] = levelOb.tiles[i].charAt(j);
	}
}
var tileHoles = [];
for (var i = 0; i < tileStates.length; i++) {
	tileHoles[i] = [];
	for (var j = 0; j < tileStates[i].length; j++)
		tileHoles[i][j] = false;
}

for (var row = 0; row < MAX_ROWS; row++) {
	for (var col = 0; col < MAX_COLS; col++) {

		if (row >= levelOb.rowOffset && row < (levelOb.rowOffset+levelOb.rows)
			&& col >= levelOb.colOffset && col < (levelOb.colOffset+levelOb.cols)) {

			var adjustedRow = row - levelOb.rowOffset;
			var adjustedCol = col - levelOb.colOffset;
			var tileType = tileStates[adjustedRow][adjustedCol];
			if (tileType == 'W') {
				var geometry = new THREE.BoxGeometry( 10, 10, 10 );
				var material = new THREE.MeshLambertMaterial( { color: 0x9ff9da } );
				var cube = new THREE.Mesh ( geometry, material );
				scene.add( cube );
		
				var tilePos = getTilePosition(adjustedRow, adjustedCol, levelOb.rowOffset, levelOb.colOffset);
				cube.position.x = tilePos.x;
				cube.position.y = tilePos.y;
				cube.position.z = tilePos.z;
			}
			else if (tileType == 'H') {
				var geometry = new THREE.PlaneGeometry( 10, 10 );
				var material = new THREE.MeshLambertMaterial( {color: 0x000000, side: THREE.DoubleSide} );
				var hole = new THREE.Mesh ( geometry, material );
				hole.name = adjustedRow + '_' + adjustedCol;
				scene.add(hole);
				tileHoles[adjustedRow][adjustedCol] = hole.name;

				var tilePos = getTilePosition(adjustedRow, adjustedCol, levelOb.rowOffset, levelOb.colOffset);
				hole.position.x = tilePos.x;
				hole.position.y = tilePos.y;
				hole.position.z = 0.1;
			}
		}
		else {
			var geometry = new THREE.BoxGeometry( 10, 10, 10 );
			var material = new THREE.MeshLambertMaterial( { color: 0x9ff9da } );
			var cube = new THREE.Mesh ( geometry, material );
			scene.add( cube );
	
			var tilePos = getTilePosition(row, col, 0, 0);
			cube.position.x = tilePos.x;
			cube.position.y = tilePos.y;
			cube.position.z = tilePos.z;
		}
	}
}
for (var b = 0; b < levelOb.blocks.length; b++) {
	var blockOb = levelOb.blocks[b];
	var block = [];
	var blockColor = getBlockColor(b);
	for (var row = 0; row < blockOb.height; row++) {
		for (var col = 0; col < blockOb.width; col++) {
			var geometry = new THREE.BoxGeometry( 10, 10, 10 );
			var material = new THREE.MeshLambertMaterial( { color: blockColor } );
			block_i = block.length;
			block[block_i] = new THREE.Mesh ( geometry, material );
			scene.add( block[block_i] );

			var tilePos = getTilePosition(blockOb.row+row, blockOb.col+col, levelOb.rowOffset, levelOb.colOffset);
			block[block_i].position.x = tilePos.x;
			block[block_i].position.y = tilePos.y;
			block[block_i].position.z = tilePos.z;
		}
	}
	var blocks_i = blocks.length;
	blocks[blocks_i] = {
		blockOb: blockOb,
		blockMeshes: block,
		fallen: false
	};
}


// load character
var geometry = new THREE.SphereGeometry( 5, 32, 32 );
var material = new THREE.MeshLambertMaterial( {color: 0xd68242} );
var player = new THREE.Mesh( geometry, material );
scene.add( player );
var playerPosOb = getTilePosition(levelOb.start.row, levelOb.start.col, levelOb.rowOffset, levelOb.colOffset);
player.position.x = playerPosOb.x;
player.position.y = playerPosOb.y;
player.position.z = 5;
player.row = levelOb.start.row;
player.col = levelOb.start.col;

camera.position.y = -30;
camera.position.z = 50;
camera.rotation.x = 0.5;

var dirLight1 = new THREE.DirectionalLight(0xffffff, 0.5);
dirLight1.position.set(-25, -25, 10);
scene.add(dirLight1);

// var dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
// dirLight2.position.set(25, -25, 10);
// scene.add(dirLight2);

var dirLight3 = new THREE.DirectionalLight(0xffffff, 1);
dirLight3.position.set(0, 25, 10);
scene.add(dirLight3);



function render() {
	requestAnimationFrame( render );

	processInput();
	animate();

	renderer.render( scene, camera );
}
render();


function getTilePosition( row, col, rowOffset, colOffset ) {
	var posOb = {};

	var startX = -(MAX_COLS*TILE_LENGTH/2) + (colOffset*TILE_LENGTH);
	var startY = (MAX_ROWS*TILE_LENGTH/2) - (rowOffset*TILE_LENGTH);
	posOb.x = startX + (col*TILE_LENGTH) + (TILE_LENGTH/2);
	posOb.y = startY - (row*TILE_LENGTH) - (TILE_LENGTH/2);
	posOb.z = 5;

	return posOb;
}

function getBlockCollisionIndex(row, col) {
	for (var b = 0; b < blocks.length; b++) {
		if (blocks[b].fallen == true)
			continue;
		var blockOb = blocks[b].blockOb;
		if (row >= blockOb.row && row < (blockOb.row + blockOb.height)
			&& col >= blockOb.col && col < (blockOb.col + blockOb.width))
			return b;
	}

	return -1;
}

function getOtherBlockSpaces(blockIndex) {
	var otherBlockSpaces = {};

	for (var b = 0; b < blocks.length; b++) {
		if (b == blockIndex || blocks[b].fallen == true)
			continue;
		var blockOb = blocks[b].blockOb;
		for (var row = blockOb.row; row < blockOb.row + blockOb.height; row++) {
			for (var col = blockOb.col; col < blockOb.col + blockOb.width; col++) {
				otherBlockSpaces[row + '_' + col] = true;
			}
		}
	}

	return otherBlockSpaces;
}

function checkIfBlockMovable(blockIndex, dir) {
	var b = blocks[blockIndex];
	var otherBlockSpaces = getOtherBlockSpaces(blockIndex);
	if (dir == 'U') {
		var row = b.blockOb.row-1;
		for (var col = b.blockOb.col; col < b.blockOb.col+b.blockOb.width; col++) {
			if (row < 0 || tileStates[row][col] == 'W' || (otherBlockSpaces.hasOwnProperty(row + '_' + col) == true))
				return false;
		}
	}
	else if (dir == 'D') {
		var row = b.blockOb.row+b.blockOb.height;
		for (var col = b.blockOb.col; col < b.blockOb.col+b.blockOb.width; col++) {
			if (row >= tileStates.length || tileStates[row][col] == 'W' || (otherBlockSpaces.hasOwnProperty(row + '_' + col) == true))
				return false;
		}
	}
	else if (dir == 'L') {
		var col = b.blockOb.col-1;
		for (var row = b.blockOb.row; row < b.blockOb.row+b.blockOb.height; row++) {
			if (col < 0 || tileStates[row][col] == 'W' || (otherBlockSpaces.hasOwnProperty(row + '_' + col) == true))
				return false;
		}
	}
	else if (dir == 'R') {
		var col = b.blockOb.col+b.blockOb.width;
		for (var row = b.blockOb.row; row < b.blockOb.row+b.blockOb.height; row++) {
			if (col >= tileStates[0].length || tileStates[row][col] == 'W' || (otherBlockSpaces.hasOwnProperty(row + '_' + col) == true))
				return false;
		}
	}
	return true;
}

function moveBlock(b, dir) {
	var deltaX = 0;
	var deltaY = 0;
	var deltaRow = 0;
	var deltaCol = 0;
	switch (dir) {
	case 'U':
		deltaRow = -1;
		deltaY = TILE_LENGTH;
		break;
	case 'D':
		deltaRow = 1;
		deltaY = -TILE_LENGTH;
		break;
	case 'L':
		deltaCol = -1;
		deltaX = -TILE_LENGTH;
		break;
	case 'R':
		deltaCol = 1;
		deltaX = TILE_LENGTH;
		break;
	}

	b.blockOb.row += deltaRow;
	b.blockOb.col += deltaCol;
	for (var i = 0; i < b.blockMeshes.length; i++) {
		b.blockMeshes[i].position.x += deltaX;
		b.blockMeshes[i].position.y += deltaY;
	}
}

function checkIfBlockDropable(b) {
	for (var row = b.blockOb.row; row < b.blockOb.row+b.blockOb.height; row++){
		for (var col = b.blockOb.col; col < b.blockOb.col+b.blockOb.width; col++) {
			if (tileStates[row][col] != 'H')
				return false;
		}
	}
	return true;
}

function dropBlock(b) {
	// remove holes, change to floors
	for (var row = b.blockOb.row; row < b.blockOb.row+b.blockOb.height; row++){
		for (var col = b.blockOb.col; col < b.blockOb.col+b.blockOb.width; col++) {
			tileStates[row][col] = 'F';
			scene.remove(scene.getObjectByName(tileHoles[row][col]));
		}
	}
	// set block.fallen to true, remove block
	b.fallen = true;
	for (var i = 0; i < b.blockMeshes.length; i++) {
		scene.remove(b.blockMeshes[i]);
	}
}

function processInput() {
	if (keyPressed == false || appliedAction == true)
		return;

	// check if target location is valid to move
	var validTarget = false;
	var moveDirection;
	var blockIndex = -1;
	var blockMovable = false;
	var targetRow, targetCol;
	if (keyPressed == KEYCODE_W) {	// UP
		targetRow = player.row-1;
		targetCol = player.col;
		moveDirection = 'U';
	}
	else if (keyPressed == KEYCODE_A) {	// LEFT
		targetRow = player.row;
		targetCol = player.col-1;
		moveDirection = 'L';
	}
	else if (keyPressed == KEYCODE_S) {	// DOWN
		targetRow = player.row+1;
		targetCol = player.col;
		moveDirection = 'D';
	}
	else if (keyPressed == KEYCODE_D) {	// RIGHT
		targetRow = player.row;
		targetCol = player.col+1;
		moveDirection = 'R';
	}

	if (targetRow >= 0 && targetRow < levelOb.rows && targetCol >= 0 && targetCol < levelOb.cols) {
		if (tileStates[targetRow][targetCol] == 'F') {
			//check for block
			blockIndex = getBlockCollisionIndex(targetRow, targetCol);
			if (blockIndex > -1)
				blockMovable = checkIfBlockMovable(blockIndex, moveDirection);
			if (blockIndex == -1 || (blockIndex >= 0 && blockMovable == true))
				validTarget = true;
		}
	}

	// move to target location
	if (validTarget == true) {
		targetPosOb = getTilePosition(targetRow, targetCol, levelOb.rowOffset, levelOb.colOffset);
		player.position.x = targetPosOb.x;
		player.position.y = targetPosOb.y;
		player.row = targetRow;
		player.col = targetCol;

		//move block
		if (blockMovable == true) {
			moveBlock(blocks[blockIndex], moveDirection);
			if (checkIfBlockDropable(blocks[blockIndex]))
				dropBlock(blocks[blockIndex]);
		}
	}

	appliedAction = true;
}

function animate() {
//TODO
}




function init() {
	window.onkeyup = keyUpHandler;
	window.onkeydown = keyDownHandler;
}

var keyPressed = false;
var appliedAction = false;

function keyUpHandler(e) {
	if (e.keyCode == keyPressed) {
		keyPressed = false;
		appliedAction = false;
	}
	else {
		return;
	}
}

function keyDownHandler(e) {
	if (keyPressed != false)
		return;

	switch (e.keyCode) {
		case KEYCODE_W: keyPressed = e.keyCode; break;
		case KEYCODE_A: keyPressed = e.keyCode; break;
		case KEYCODE_S: keyPressed = e.keyCode; break;
		case KEYCODE_D: keyPressed = e.keyCode; break;
	}
}

function getBlockColor(index) {
	var colors = [
		0x348e42,
		0x878e30,
		0x8e5d30,
		0x8e3e30,
		0x8e3045,
		0x7c2468,
		0x62237c,
		0x36237c,
		0x234c7c,
		0x23677c,
		0x237c70,
		0x237c52,
		0x348e42,
		0x878e30,
		0x8e5d30,
		0x8e3e30,
		0x8e3045,
		0x7c2468,
		0x62237c,
		0x36237c,
		0x234c7c,
		0x23677c,
		0x237c70,
		0x237c52
		
	];
	return colors[index];
}
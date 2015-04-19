
var manifest = [
	{ src: "cloud.png", id: "cloud" },
	{ src: "cloud2.png", id: "cloud2" },
	{ src: "player_sprite.png", id: "player" }
];


var createPhysicsEngine =  function(size){
	var renderer = {
		create: function() { return { controller: renderer };},
		world: function(engine) { }
	};

	return Matter.Engine.create({
		render: {controller: renderer},
		world : Matter.World.create({
			gravity : { x:0 , y:3 },
			bounds: { 
			min: { x: 0, y: 0 }, 
			max: { x: size.w, y: size.h } }
		})
	});
};

var Game =  function(){
	var that = this;

	var stage = new createjs.Stage("display");
	var physicsEngine = createPhysicsEngine({ w: stage.canvas.width, h: stage.canvas.height });

	that.world = {
		keyboardVector : { x: 0, y: 0 },
		size: { w: stage.canvas.width, h: stage.canvas.height },
		stage: stage,
		physics: physicsEngine,
		loader: new createjs.LoadQueue(false)
	};

	createjs.Ticker.setFPS(40);
	stage.canvas.focus();
	stage.canvas.addEventListener("keyup", function(e) {
		// W S
		if(e.keyCode == 87 || e.keyCode == 83)
			that.world.keyboardVector.y = 0;
		// A D
		if(e.keyCode == 65 || e.keyCode == 68)
			that.world.keyboardVector.x = 0;
	}, true);

	stage.canvas.addEventListener("keydown", function(e) {
		// W
		if(e.keyCode == 87)
			that.world.keyboardVector.y = -1;
		// S
		if(e.keyCode == 83)
			that.world.keyboardVector.y = 1;
		// A
		if(e.keyCode == 65)
			that.world.keyboardVector.x = -1;
		// D
		if(e.keyCode == 68)
			that.world.keyboardVector.x = 1;
	}, true);

	var nextid = 0;
	var objects = {};
	that.getId = function(polygon){
		objects[nextid++] = polygon;
		return nextid;
	}

	that.stageBodies = function(bodies){
		bodies.forEach(function(body){
			Matter.World.add(physicsEngine.world, body);
		});
	};

	that.stageShapes = function(shapes, behind){
		shapes.forEach(function(shape){
			!behind ? stage.addChild(shape) : stage.addChildAt(shape, 0);
		});
	}

	var init = function(){
		loadedCallback();

		createjs.Ticker.addEventListener("tick", function(event){
			Matter.Engine.update(physicsEngine, event.delta, 1);

			for(var key in objects){
				var polygon = objects[key];
				polygon.update(event);
			}
			stage.update();
		});	
	}

	var loadedCallback = new Function();
	that.loaded = function(callback){loadedCallback = callback;};

	that.world.loader.addEventListener("complete", init);
	that.world.loader.loadManifest(manifest, true, "img/");
};

var UIElement = function(){
	var that = this;
	that.id = Game.getId(that);

	that.update = function(){}
};

var Polygon = function(bodyInfo){
	UIElement.apply(this, arguments);
	var that = this;

	that.body = Matter.Body.create(bodyInfo);
	that.shape = new createjs.Shape();
	that.shape.color = "black";

	that.shape.graphics.append({
 		exec: function(ctx, shape) {
			ctx.beginPath();

			that.body.vertices.forEach(function(vertice){
				ctx.lineTo(vertice.x,vertice.y);
			});

			ctx.fillStyle = shape.color;
			ctx.fill();
		}
	});
};

var Ground = function(){
	Polygon.apply(this, arguments);
	var that = this;
};

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

var Stage = function(){
	UIElement.apply(this, arguments);
	var that = this;
	var ground = new Polygon({position:{x:0,y:Game.world.size.h }, vertices: Vertices.ground, isStatic: true});

	var generateCloud = function(id){
		var cloud = new createjs.Bitmap(Game.world.loader.getResult(id));
		var scale = getRandomArbitrary(0.3,1.0);
		cloud.setTransform(getRandomArbitrary(0, Game.world.size.w), getRandomArbitrary(0,100), scale, scale);
		cloud.alpha = getRandomArbitrary(0.5,1);
		cloud.velocity = getRandomArbitrary(45,100);
		return cloud;
	};

	var clouds = [
	generateCloud("cloud"), 
	generateCloud("cloud"), 
	generateCloud("cloud2"), 
	generateCloud("cloud2"), 
	generateCloud("cloud2"), 
	generateCloud("cloud"), 
	generateCloud("cloud"), 
	generateCloud("cloud"), 
	generateCloud("cloud2")];

	that.update = function(event){
		var deltaS = event.delta / 1000;

		clouds.forEach(function(element){
			element.x -= deltaS * element.velocity;
			if (element.x + element.image.width * element.scaleX <= 0) {
				element.x = Game.world.size.w;
			}
		});
	}

	Game.stageShapes([ground.shape]);
	Game.stageShapes(clouds, true);
	Game.stageBodies([ground.body]);
};

var Player = function(){
	Polygon.apply(this, arguments);
	var that = this;
	var spriteSheet = new createjs.SpriteSheet({
		framerate: 30,
		images: [Game.world.loader.getResult("player")],
		frames: {"regX": 0, "height": 40, "count": 10, "regY": 0, "width": 30},
		animations: {
			run: [0, 9, "run", 0.5],
		}
	});
	that.shape = new createjs.Sprite(spriteSheet, "run");

	Game.stageShapes([that.shape]);
	Game.stageBodies([that.body]);

	var lastKeyboardXVec = 1;
	that.update = function(){

		if(Game.world.keyboardVector.x == 0){
			that.shape.stop();
		} else{
			lastKeyboardXVec = Game.world.keyboardVector.x;
			that.shape.play();
		}

		Matter.Body.setVelocity(that.body, Matter.Vector.mult(Game.world.keyboardVector, 5));
		that.shape.setTransform(
			that.body.position.x - 40/2, 
			that.body.position.y - 30/2, 
			lastKeyboardXVec, 
			1,
			/*that.body.angle * 180/Math.PI*/1);
	}
};
	
var Vertices = {
	player:[{ x: 0, y: 0 }, { x: 30, y: 0 }, { x: 30, y: 40 }, { x: 0, y: 40 }],
	ground:[{ x: 0, y: 0 }, { x: 10000, y: 0 }, { x: 10000, y: 10 }, { x: 0, y: 10 }]
};

window.addEventListener("load", function(){
	Game = new Game();

	Game.loaded(function(){
		var player = new Player({position:{x:0,y:0}, vertices: Matter.Bodies.circle(400, 100, 25).vertices});
		var stage = new Stage();
	});

	//var ground = new Ground({position:{x:0,y:300}, vertices: Vertices.ground, isStatic: true, angle: Math.PI * 0.04})
});

// from http://stackoverflow.com/a/7533593 by CMS
var GeneratePrototype = function(parent){
    function protoCreator(){};
	protoCreator.prototype = parent.prototype;
    // Construct an object linking to A.prototype without calling constructor of A
    return new protoCreator();
}

Polygon.prototype = GeneratePrototype(UIElement);
Player.prototype = GeneratePrototype(Polygon);
Ground.prototype = GeneratePrototype(Polygon);
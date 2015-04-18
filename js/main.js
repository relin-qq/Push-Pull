
var manifest = [
	{ src: "cloud.png", id: "cloud" }
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
	that.shape.color = "red";

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

	var generateCloud = function(){
		var cloud = new createjs.Bitmap(Game.world.loader.getResult("cloud"));
		var scale = getRandomArbitrary(0.5,1.3);
		cloud.setTransform(getRandomArbitrary(0, Game.world.size.w), getRandomArbitrary(20,100), scale, scale);
		cloud.alpha = getRandomArbitrary(0.5,1);
		cloud.velocity = getRandomArbitrary(45,100);
		return cloud;
	};

	var clouds = [generateCloud(), generateCloud() , generateCloud(), generateCloud()];

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

	Game.stageShapes([that.shape]);
	Game.stageBodies([that.body]);

	that.update = function(){
		Matter.Body.setVelocity(that.body, Matter.Vector.mult(Game.world.keyboardVector, 20));
	}
};
	
var Vertices = {
	player:[{ x: 0, y: 0 }, { x: 25, y: 50 }, { x: 50, y: 0 }],
	ground:[{ x: 0, y: 0 }, { x: 10000, y: 0 }, { x: 10000, y: 10 }, { x: 0, y: 10 }]
};

window.addEventListener("load", function(){
	Game = new Game();

	Game.loaded(function(){
		var player = new Player({position:{x:50,y:50}, vertices: Vertices.player});
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
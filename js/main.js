
var manifest = [
	{ src: "cloud.png", id: "cloud" }
];


var createPhysicsEngine =  function(){
	var renderer = {
		create: function() { return { controller: renderer };},
		world: function(engine) { }
	};

	return Matter.Engine.create({
		render: {controller: renderer},
	});
};

var Game =  function(){
	var that = this;

	var stage = new createjs.Stage("display");
	var physicsEngine = createPhysicsEngine();
	physicsEngine.world.gravity = { x:0 , y:3 };

	that.world = {
		inputVector : { x: 0, y: 0 },
		size: { w: stage.canvas.width, h: stage.canvas.height },
		stage: stage,
		physics: physicsEngine,
		loader: new createjs.LoadQueue(false)
	};

	stage.canvas.focus();
	stage.canvas.addEventListener("keyup", function(e) {
		// W S
		if(e.keyCode == 87 || e.keyCode == 83)
			that.world.inputVector.y = 0;
		// A D
		if(e.keyCode == 65 || e.keyCode == 68)
			that.world.inputVector.x = 0;
	}, true);

	stage.canvas.addEventListener("keydown", function(e) {
		// W
		if(e.keyCode == 87)
			that.world.inputVector.y = -1;
		// S
		if(e.keyCode == 83)
			that.world.inputVector.y = 1;
		// A
		if(e.keyCode == 65)
			that.world.inputVector.x = -1;
		// D
		if(e.keyCode == 68)
			that.world.inputVector.x = 1;
	}, true);

	var nextid = 0;
	var objects = {};
	that.getId = function(polygon){
		stage.addChild(polygon.shape);
		objects[nextid++] = polygon;
		return nextid;
	}

	that.stageBodies = function(bodies){
		bodies.forEach(function(body){
			Matter.World.add(physicsEngine.world, body);
		});
	};

	that.stageShapes = function(shapes){
		shapes.forEach(function(shape){
			stage.addChild(shape);
		});
	}

	var init = function(){
		createjs.Ticker.addEventListener("tick", function(event){
			Matter.Engine.update(physicsEngine, event.delta, 1);

			for(var key in objects){
				var polygon = objects[key];
				polygon.update();
			}
			stage.update();
		});	
	}

	that.world.loader.addEventListener("complete", init);
	that.world.loader.loadManifest(manifest, true, "img/");
};

var Polygon = function(bodyInfo){
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

	that.update = function(){}

	that.id = Game.getId(that);
}

var Ground = function(){
	Polygon.apply(this, arguments);
	var that = this;
}

var Stage = function(){
	var that = this;
	var ground = new Ground({position:{x:0,y:300}, vertices: Vertices.ground, isStatic: true});

	var clouds = new createjs.Shape();
	clouds.graphics.beginBitmapFill(Game.world.loader.getResult("cloud")).drawRect(0, 0, w, h);

	Game.stageShapes([clouds]);
	Game.stageBodies([ground.body]);
};

var Player = function(){
	Polygon.apply(this, arguments);
	var that = this;

	that.update = function(){
		Matter.Body.setVelocity(that.body, Matter.Vector.mult(Game.world.inputVector, 20));
	}

	Game.stageBodies([that.body]);
}
	
var Vertices = {
	player:[{ x: 0, y: 0 }, { x: 25, y: 50 }, { x: 50, y: 0 }],
	ground:[{ x: 0, y: 0 }, { x: 400, y: 0 }, { x: 400, y: 100 }, { x: 0, y: 100 }]
}

window.addEventListener("load", function(){
	Game = new Game();
	var player = new Player({position:{x:50,y:50}, vertices: Vertices.player});
	var stage = new Stage();
	//var ground = new Ground({position:{x:0,y:300}, vertices: Vertices.ground, isStatic: true, angle: Math.PI * 0.04})
});

// from http://stackoverflow.com/a/7533593 by CMS
var GeneratePrototype = function(parent){
    function protoCreator(){};
	protoCreator.prototype = parent.prototype;
    // Construct an object linking to A.prototype without calling constructor of A
    return new protoCreator();
}

Player.prototype = GeneratePrototype(Polygon);
Ground.prototype = GeneratePrototype(Polygon);
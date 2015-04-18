
var Game =  function(){
	var that = this;

    var stage = new createjs.Stage("display");
	var objects = {};

	var renderer = {
		create: function() { return { controller: renderer };},
		world: function(engine) { }
	};

	var physicsEngine = Matter.Engine.create({render: {controller: renderer}});
	physicsEngine.world.gravity = {x:0,y:3};


	that.moveVector = {x: 0, y:0};
	stage.canvas.focus();
	stage.canvas.addEventListener("keyup", function(e) {
		// W S
		if(e.keyCode == 87 || e.keyCode == 83)
			that.moveVector.y = 0;
		// A D
		if(e.keyCode == 65 || e.keyCode == 68)
			that.moveVector.x = 0;
	}, true);

	stage.canvas.addEventListener("keydown", function(e) {
		// W
		if(e.keyCode == 87)
			that.moveVector.y = -1;
		// S
		if(e.keyCode == 83)
			that.moveVector.y = 1;
		// A
		if(e.keyCode == 65)
			that.moveVector.x = -1;
		// D
		if(e.keyCode == 68)
			that.moveVector.x = 1;
	}, true);


	that.init = function(polygon){
		stage.addChild(polygon.shape);
		Matter.World.add(physicsEngine.world, polygon.body);
	}

	var nextid = 0;
	that.getId = function(polygon){
		objects[nextid++] = polygon;
		return nextid;
	}

	var loop = function(event){
		Matter.Engine.update(physicsEngine, event.delta, 1);

		for(var key in objects){
			var polygon = objects[key];
			polygon.update();
		}
		stage.update();
	};

	createjs.Ticker.addEventListener("tick", loop);	
};


var Ground = function(){
	Polygon.apply(this, arguments);

};


var Polygon = function(bodyInfo){
	var that = this;
	that.id = Game.getId(that);

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

	that.position = bodyInfo.position;

	that.update = function(){}

	that.body.update = that.update;
	Game.init(that);
}

var Player = function(){
	Polygon.apply(this, arguments);
	var that = this;

	that.update = function(){
		Matter.Body.setVelocity(that.body, Matter.Vector.mult(Game.moveVector, 20));
	}
}
	
var Vertices = {
	player:[{ x: 0, y: 0 }, { x: 25, y: 50 }, { x: 50, y: 0 }],
	ground:[{ x: 0, y: 0 }, { x: 400, y: 0 }, { x: 400, y: 100 }, { x: 0, y: 100 }]
}

window.addEventListener("load", function(){
	Game = new Game();
	var player = new Player({position:{x:50,y:50}, vertices: Vertices.player});
	var ground = new Ground({position:{x:0,y:300}, vertices: Vertices.ground, isStatic: true, angle: Math.PI * 0.04})
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

var Game =  function(){
	var that = this;

    var stage = new createjs.Stage("display");
	var objects = {};

	var renderer = {
		create: function() {
			return { controller: renderer };
		},

		world: function(engine) {
			
		}
	};

	var physicsEngine = Matter.Engine.create({
		render: {
			controller: renderer
		}
	});
	Matter.Engine.run(physicsEngine);
	

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


	var nextid = 0;
	that.init = function(polygon){
		objects[nextid++] = polygon;
		stage.addChild(polygon.shape);
		return nextid;
	}

	var loop = function(event){
		for(var key in objects){
			objects[key].update();
		}

		stage.update();
	};

	createjs.Ticker.addEventListener("tick", loop);
};


var Stage = function(){



};


var Polygon = function(){
	var that = this;

	that.shape = new createjs.Shape();
	that.body = Bodies.rectangle(400, 200, 80, 80);
	that.body.updated = that.update;

	that.position = {x:50, y:50};
	that.velocity = {x:0, y:0};
	that.acceleration = {
		x:function(){return 1}, 
		y:function(){return 1}
	};

	that.deceleration = 1000;
	
	that.id = Game.init(that);

	var isDecelerating = false;
	var gravitation = -1000;
	that.update = function(body){
		//Acceleration in a second
		var tick = delta / 1000.0;

		var tmpVelX = that.velocity.x;
		var tmpVelY = that.velocity.y;
		var accelX = that.acceleration.x();
		var accelY = that.acceleration.y() - gravitation;

		if(Math.abs(that.velocity.x) > 0 && accelX == 0){
			isDecelerating = true;
			accelX = that.velocity.x < 0 ? that.deceleration : that.deceleration * -1;
		}

		if(Math.abs(that.velocity.y) > 0 && accelY == 0){
			isDecelerating = true;
			accelY = that.velocity.y < 0 ? that.deceleration : that.deceleration * -1;
		}

		that.velocity.x += tick * accelX;
		that.velocity.y += tick * accelY;

		if(isDecelerating && ((tmpVelX > 0 && that.velocity.x < 0)|| (tmpVelX < 0 && that.velocity.x > 0))){
			that.velocity.x = 0;
			isDecelerating = false;
		}

		if(isDecelerating && ((tmpVelY > 0 && that.velocity.y < 0)|| (tmpVelY < 0 && that.velocity.y > 0))){
			that.velocity.y = 0;
			isDecelerating = false;
		}

		if(Math.abs(that.velocity.x) > 1000)
			that.velocity.x = that.velocity.x < 0 ? -1000 : 1000;

		if(Math.abs(that.velocity.y) > 1000)
			that.velocity.y = that.velocity.y < 0 ? -1000 : 1000;
		
		that.position.x += tick * that.velocity.x;
		that.position.y += tick * that.velocity.y;

		that.shape.x = that.position.x;
		that.shape.y = that.position.y;
	}
}

var Player = function(game){
	Polygon.apply(this);
	var that = this;

	that.velocity = {x: 0, y:0};

	that.acceleration = {
		x:function(){
			var val = Game.moveVector.x * 10000;
			return val;
		}, 
		y:function(){
			var val = Game.moveVector.y * 10000;
			return val;
		}
	};

	Game.moveVector.y * that.acceleration.y
	that.shape.graphics.beginFill("red").drawCircle(0, 0, 40);
}
	
window.addEventListener("load", function(){
	Game = new Game();
	var player = new Player();
});

// from http://stackoverflow.com/a/7533593 by CMS
var GeneratePrototype = function(parent){
    function protoCreator(){};
	protoCreator.prototype = parent.prototype;
    // Construct an object linking to A.prototype without calling constructor of A
    return new protoCreator();
}

Player.prototype = GeneratePrototype(Polygon);
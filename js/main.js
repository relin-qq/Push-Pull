
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
			gravity : { x:0 , y:1 },
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
		movementVector : { x: 0, y: 0 },
		mouseVector : { x: 0, y: 0},
		keyboard: {
			keys:{}
		},
		size: { w: stage.canvas.width, h: stage.canvas.height },
		loader: new createjs.LoadQueue(false),
		stage: stage,
		physics: physicsEngine,
		mouseAction : {},
		objects: {},
	};



	createjs.Ticker.setFPS(40);
	stage.canvas.addEventListener("keyup", function(e) {
		Game.world.keyboard.keys[e.keyCode] = undefined;
		// W S
		if(/*e.keyCode == 87 || e.keyCode == 83 ||*/ e.keyCode == 32)
			that.world.movementVector.y = 0;
		// A D
		if(e.keyCode == 65 || e.keyCode == 68)
			that.world.movementVector.x = 0;
	}, true);

	stage.canvas.addEventListener("keydown", function(e) {
		Game.world.keyboard.keys[e.keyCode] = true;
		// W
		//if(e.keyCode == 87)
		//	that.world.movementVector.y = -1;

		//spacebar
		if(e.keyCode == 32)
			that.world.movementVector.y = -1;

		// S
		//if(e.keyCode == 83)
		//	that.world.movementVector.y = 1;

		// A
		if(e.keyCode == 65)
			that.world.movementVector.x = -1;
		// D
		if(e.keyCode == 68)
			that.world.movementVector.x = 1;
	}, true);

	stage.on("stagemousemove", function(evt) {
		stage.canvas.focus();
		Game.world.mouseVector.x = evt.stageX;
		Game.world.mouseVector.y = evt.stageY;
	});

	stage.on("stagemousedown", function(event){
		event.nativeEvent.preventDefault();
		event.nativeEvent.stopPropagation();
		clickedEventListener.forEach(function(callback){
			console.log(event)
			callback(event);
		});
	});

	var clickedEventListener = [];
	that.clickedEvent =function(callback){
		clickedEventListener.push(callback);
	};

	var nextid = 0;
	that.getId = function(polygon){
		Game.world.objects[nextid++] = polygon;
		return nextid;
	}

	that.stagePolygon = function(polygons){
		polygons.forEach(function(polygon){
			Matter.World.add(physicsEngine.world, [polygon.body]);
			stage.addChild(polygon.shape);
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

			for(var key in Game.world.objects){
				var polygon = Game.world.objects[key];
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

	Game.stagePolygon([ground]);
	Game.stageShapes(clouds, true);
};


var GravityBall = function(bodyInfo, behaviour){
	Polygon.apply(this, arguments);
	var that = this;

	that.shape.color = behaviour == -1 ? "green" : "red";
	that.body.mass = 20;

	var pulseRate = 0.1;
	that.update = function(event){
		if(!that.body.isStatic)
			return;

		var deltaS = event.delta / 1000;

		/*var hitTest = Matter.Query.region(
			Game.world.physics.world.bodies, 
			Matter.Bounds.create([
				{ x:that.body.bounds.min.x - 50, y:that.body.bounds.min.y - 50 },
				{ x:that.body.bounds.min.x + 50, y:that.body.bounds.min.y + 50 },
				{ x:that.body.bounds.max.x + 50, y:that.body.bounds.max.y + 50 },
				{ x:that.body.bounds.max.x - 50, y:that.body.bounds.max.y - 50 }
			]));*/

		if(true){
			var force = getRandomArbitrary(0.01,0.05);
			Game.world.physics.world.bodies.forEach(function(body){
				var GravitationVector = Matter.Vector.normalise(
				Matter.Vector.sub(that.body.position , body.position));

				Matter.Body.applyForce(body, that.body.position, Matter.Vector.mult(GravitationVector, force * behaviour));
			});
		}
	};

	setTimeout(function(){
		that.body.isStatic = true;
		
	}, 1000);
}

var Player = function(){
	Polygon.apply(this, arguments);
	var that = this;
	var hand, player;

	var init = function(){
		that.shape = new createjs.Container();

		hand = new createjs.Shape();
		hand.graphics.beginFill("#ffffff").drawRect(0, 0, 5, 5);

		player = new createjs.Sprite(new createjs.SpriteSheet({
			framerate: 30,
			images: [Game.world.loader.getResult("player")],
			frames: {"regX": 0, "height": 40, "count": 10, "regY": 0, "width": 30},
			animations: {
				run: [0, 9, "run", 0.5],
			}
		}), "run");

		that.shape.addChild(player, hand);
		Game.stagePolygon([that]);
	}

	init();

	var lastKeyboardXVec = 1;
	var animPlayer = function(){
		if(Game.world.movementVector.x == 0){
			player.stop();
		} else{
			lastKeyboardXVec = Game.world.movementVector.x;
			player.play();
		}
	};

	var handleMovement = function(){
		var hitTest = Matter.Query.region(
			Game.world.physics.world.bodies, 
			Matter.Bounds.create([{ x:that.body.bounds.max.x + 1, y:that.body.bounds.max.y + 1 }]));

		if(hitTest.length && Game.world.movementVector.y != 0){
			Matter.Body.applyForce(that.body, {x:0, y: 0}, {x:0, y: -0.02* that.body.mass});
		}

		Matter.Body.applyForce(that.body, {x:0, y:0}, {x:Game.world.movementVector.x * 0.0001 * that.body.mass, y:0});
		//Matter.Body.setVelocity(that.body, {x:Game.world.movementVector.x * 5, y:1 });
	};

	var handPos = {x:0,y:0};
	var handDistance = 7// in px

	that.update = function(event){
		animPlayer();
		handleMovement();

		handPos = Matter.Vector.sub(Game.world.mouseVector, {x:that.shape.x, y:that.shape.y});
		handPos = Matter.Vector.normalise(handPos);
		handPos = Matter.Vector.mult(handPos, handDistance);

		that.shape.setTransform(
			that.body.bounds.max.x-that.shape.getBounds().width + that.shape.getBounds().width/2, 
			that.body.bounds.max.y-that.shape.getBounds().height,
			lastKeyboardXVec,1,0,0,0,that.shape.getBounds().width/2, 0);

		hand.setTransform(
			handPos.x * lastKeyboardXVec + that.shape.getBounds().width /2,
			handPos.y + that.shape.getBounds().height /2 );
	}

	Game.clickedEvent(function(){
		var polygon;
		var properties = {
			position:{x:that.shape.x, y:that.shape.y}, 
			vertices: Matter.Bodies.circle(0, 0, 10).vertices,
			mass:10
		};

		if(Game.world.keyboard.keys[17]){
			polygon = new GravityBall(properties, 1);
		} else if(Game.world.keyboard.keys[16]){
			polygon = new GravityBall(properties, -1);
		}else{
			polygon = new Polygon(properties);

		}

		Game.stagePolygon([polygon]);

		var normaliseMouseVector = Matter.Vector.normalise(
			Matter.Vector.sub({x:that.shape.x, y:that.shape.y} , Game.world.mouseVector));

		var force = -getRandomArbitrary(0.02,0.03) * polygon.body.mass;

		Matter.Body.applyForce(polygon.body, 
			{ x: 0, y:0}, 
			{ x: normaliseMouseVector.x * force, y: normaliseMouseVector.y * force});
	});
};
	
var Vertices = {
	player:[{ x: 0, y: 0 }, { x: 30, y: 0 }, { x: 30, y: 40 }, { x: 0, y: 40 }],
	ground:[{ x: 0, y: 0 }, { x: 10000, y: 0 }, { x: 10000, y: 10 }, { x: 0, y: 10 }]
};

window.addEventListener("load", function(){
	Game = new Game();

	Game.loaded(function(){
		var player = new Player({position:{x:0,y:0},mass:100, vertices: Matter.Bodies.circle(0, 0, 20).vertices});
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
GravityBall.prototype = GeneratePrototype(Polygon);
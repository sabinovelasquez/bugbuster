/*****
* Bugbuster Game
*
* @author Sabino Velasquez <sabinovelasquez@gmail.com>
* @copyright 2015 Sabino (http:\\www.sabino.cl)
*
*****/
'use-strict';

var Bugbuster = {
	width: Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
	height: 540
};

Bugbuster.Boot = function(game){

};

Bugbuster.Boot.prototype = {
	init: function () {
		console.warn('initialized');
	},
	preload: function () {
		console.warn('preloading');
	},
	create: function () {
		console.warn('creating');
		this.state.start('Preloader');
	}
}

Bugbuster.Game = function (game) {
	
	this.fontConfig = {
		titleFont: {
			font: '30pt console',
			fill: '#0f0'
		}
	};

	this.enemies = {
		bug: function () {

		},
		beetle: function () {

		}
	};

};

Bugbuster.Game.prototype = {

	create: function () {

		this.hitted = 0;

		// player & bg

		this.bg = this.add.tileSprite(0, 0, Bugbuster.width, Bugbuster.height, 'starfield');
		this.ship = this.add.sprite(Bugbuster.width/2, Bugbuster.height-50, 'ship');
		this.ship.animations.add('ignite');
		this.ship.anchor.setTo(0.5, 0.5);
		this.ship.play('ignite', 20, true);
		this.physics.enable(this.ship, Phaser.Physics.ARCADE);
		this.ship.speed = 300;
		this.ship.body.collideWorldBounds = true;
		this.ship.body.setSize(20, 20, 0, -5);

		this.physics.enable(this.ship, Phaser.Physics.ARCADE);

		//enemies

		this.enemyPool = this.add.group();
		this.enemyPool.enableBody = true;
		this.enemyPool.physicsBodyType = Phaser.Physics.ARCADE;
		this.enemyPool.createMultiple(50, 'bug');
		this.enemyPool.setAll('anchor.x', 0.5);
		this.enemyPool.setAll('anchor.y', 0.5);
		this.enemyPool.setAll('outOfBoundsKill', true);
		this.enemyPool.setAll('checkWorldBounds', true);
		
		// set the animation
		this.enemyPool.forEach(function (enemy) {
			enemy.animations.add('fly', [ 0, 1], 20, true);
		});

		this.nextEnemyAt = 0;
		this.enemyDelay = 200;

		//bullets

		this.bulletPool = this.add.group();
		this.bulletPool.enableBody = true;
		this.bulletPool.physicsBodyType = Phaser.Physics.ARCADE;
		this.bulletPool.createMultiple(100, 'bullet');
		this.bulletPool.setAll('anchor.x', 0.5);
	    this.bulletPool.setAll('anchor.y', 0.5);
	    this.bulletPool.setAll('outOfBoundsKill', true);
		this.bulletPool.setAll('checkWorldBounds', true);
	    
	    this.nextShotAt = 0;
		this.shotDelay = 200;

		this.explosionPool = this.add.group();
		this.explosionPool.enableBody = true;
		this.explosionPool.physicsBodyType = Phaser.Physics.ARCADE;
		this.explosionPool.createMultiple(100, 'kaboom');
		this.explosionPool.setAll('anchor.x', 0.5);
		this.explosionPool.setAll('anchor.y', 0.5);
		this.explosionPool.forEach(function (explosion) {
			explosion.animations.add('boom');
		});

	this.cursors = this.input.keyboard.createCursorKeys();

	},
	update: function () {

		this.bg.tilePosition.y += 3;
		this.ship.body.velocity.x = 0;
		this.ship.body.velocity.y = 0;

		this.physics.arcade.overlap(
			this.bulletPool, this.enemyPool, this.enemyHit, null, this
		);
		this.physics.arcade.overlap(
			this.ship, this.enemyPool, this.playerHit, null, this
		);

		if (this.nextEnemyAt < this.time.now && this.enemyPool.countDead() > 0) {
			this.nextEnemyAt = this.time.now + this.enemyDelay;
			var enemy = this.enemyPool.getFirstExists(false);
			enemy.reset(this.rnd.integerInRange(20, Bugbuster.width), 0);
			enemy.body.velocity.y = this.rnd.integerInRange(60, 90);
			enemy.play('fly');
		}

		this.ship.body.velocity.x = 0;
		this.ship.body.velocity.y = 0;

		//game input

		if (this.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR) || this.input.activePointer.isDown) {
			this.fire();
		}

		if (this.cursors.left.isDown) {
			this.ship.body.velocity.x = -this.ship.speed;
		}
		else if (this.cursors.right.isDown) {
			this.ship.body.velocity.x = this.ship.speed;
		}
		if (this.cursors.up.isDown) {
			this.ship.body.velocity.y = -this.ship.speed;
		}
		else if (this.cursors.down.isDown) {
			this.ship.body.velocity.y = this.ship.speed;
		}

		//shake it

		if (this.hitted > 0) {
			var rand1 = game.rnd.integerInRange(-5,5);
			var rand2 = game.rnd.integerInRange(-5,5);
			game.world.setBounds(rand1, rand2, game.width + rand1, game.height + rand2);
			if(this.hitted%2==0){
				this.ship.tint = 0xff0000;
			}else{
				this.ship.tint = 0xffffff;
			}
			this.hitted --;
			if (this.hitted == 0) {
				game.world.setBounds(0, 0, game.width,game.height);
			}
		}

	},
	fire: function() {
		
		if (!this.ship.alive || this.nextShotAt > this.time.now) {
			return;
		}
		if (this.bulletPool.countDead() === 0) {
			return;
		}
		this.nextShotAt = this.time.now + this.shotDelay;

		var bullet = this.bulletPool.getFirstExists(false);
		bullet.reset(this.ship.x, this.ship.y - 20);
		bullet.body.velocity.y = -600;

	},
	enemyHit: function (bullet, enemy) {
		bullet.kill();
		enemy.kill();
		this.explode(enemy);
	},
	playerHit: function (ship, enemy) {
		enemy.kill();
		ship.kill();
		this.explode(ship);
		this.hitted = 12;
	},
	explode: function (sprite) {
		if (this.explosionPool.countDead() === 0) {
			return;
		}
		var explosion = this.explosionPool.getFirstExists(false);
		explosion.reset(sprite.x, sprite.y);
		explosion.play('boom', 15, false, true);
		explosion.angle = Math.random() * 360;
		explosion.body.velocity.x = sprite.body.velocity.x;
		explosion.body.velocity.y = sprite.body.velocity.y;
	},
	render: function() {
		// this.game.debug.body(this.ship);
	},
	quit: function () {

	}

};

Bugbuster.Preloader = function (game) {

};

Bugbuster.Preloader.prototype = {
    preload: function () {

		this.load.image('starfield', 'img/starfield.gif');
		this.load.spritesheet('ship', 'img/ship.gif', 32, 28);
		this.load.image('bullet', 'img/bullet.gif');
		this.load.spritesheet('bug', 'img/bug.gif', 26, 18);
		this.load.spritesheet('kaboom', 'img/explode.gif', 32, 32);
		
	},
	create: function () {
		this.state.start('Game');
	}
};

Bugbuster.MainMenu = function (game) {

};
Bugbuster.MainMenu.prototype = {
   
};

var game = new Phaser.Game(Bugbuster.width, Bugbuster.height, Phaser.CANVAS, 'game');

game.state.add('Boot', Bugbuster.Boot);
game.state.add('Preloader', Bugbuster.Preloader);
game.state.add('Game', Bugbuster.Game);
game.state.add('MainMenu', Bugbuster.MainMenu);
game.state.start('Boot');

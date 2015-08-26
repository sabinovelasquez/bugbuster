/*****
* Bugbuster Game
*
* @author Sabino Velasquez <sabinovelasquez@gmail.com>
* @copyright 2015 Sabino (http:\\www.sabino.cl)
*
*****/
'use-strict';

var Bugbuster = {

	FONT_SETTINGS: { font: '12px Monaco', fill: '#fff', align: 'center' },
	DIALOG_SETTINGS: { font: '12px Monaco', fill: '#fff', align: 'left' },

	SEA_SCROLL_SPEED: 60,
	PLAYER_SPEED: 300,
	ENEMY_MIN_Y_VELOCITY: 30,
	ENEMY_MAX_Y_VELOCITY: 60,
	SHOOTER_MIN_VELOCITY: 200,
	SHOOTER_MAX_VELOCITY: 250,
	BOSS_Y_VELOCITY: 15,
	BOSS_X_VELOCITY: 200,
	BULLET_VELOCITY: 500,
	ENEMY_BULLET_VELOCITY: 600,
	POWERUP_VELOCITY: 100,

	SPAWN_ENEMY_DELAY: Phaser.Timer.SECOND,
	SPAWN_SHOOTER_DELAY: Phaser.Timer.SECOND * 3,

	SHOT_DELAY: Phaser.Timer.SECOND * 0.1,
	SHOOTER_SHOT_DELAY: Phaser.Timer.SECOND * 2,
	BOSS_SHOT_DELAY: Phaser.Timer.SECOND,

	ENEMY_HEALTH: 2,
	SHOOTER_HEALTH: 5,
	BOSS_HEALTH: 500,

	BULLET_DAMAGE: 1,
	CRASH_DAMAGE: 5,

	ENEMY_REWARD: 10,
	SHOOTER_REWARD: 400,
	BOSS_REWARD: 10000,
	POWERUP_REWARD: 100,

	ENEMY_DROP_RATE: 0.3,
	SHOOTER_DROP_RATE: 0.5,
	BOSS_DROP_RATE: 0,

	PLAYER_EXTRA_LIVES: 4,
	PLAYER_GHOST_TIME: Phaser.Timer.SECOND * 1,

	INSTRUCTION_EXPIRE: Phaser.Timer.SECOND * 10,
	RETURN_MESSAGE_DELAY: Phaser.Timer.SECOND * 2
};

Bugbuster.Boot = function(game){

};

Bugbuster.Boot.prototype = {
	init: function () {
		console.warn('initialized');
		this.input.maxPointers = 1;
		if (this.game.device.desktop) {

		}else {
			this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
			this.scale.setMinMax(480, 260, 1024, 768);
			this.scale.forceLandscape = true;
			this.scale.pageAlignHorizontally = true;
			this.scale.pageAlignVertically = true;
		}
	},
	preload: function () {
		console.warn('preloading');
		//this.load.image('preloaderBar', 'assets/preloader-bar.png');
	},
	create: function () {
		console.warn('creating');
		this.state.start('Preloader');
	}
}

Bugbuster.Game = function (game) {

};

Bugbuster.Game.prototype = {

	create: function () {

		this.setupBackground();
		this.setupPlayer();
		this.setupPlayerIcons();
		this.setupEnemies();
		this.setupBullets();
		this.setupExplosions();
		this.setupText();
		this.setupDialogs();

		this.cursors = this.input.keyboard.createCursorKeys();
	},
	checkCollisions: function () {
		this.physics.arcade.overlap(
			this.bulletPool, this.enemyPool, this.enemyHit, null, this
		);

		this.physics.arcade.overlap(
			this.bulletPool, this.shooterPool, this.enemyHit, null, this
		);

		this.physics.arcade.overlap(
			this.ship, this.enemyPool, this.playerHit, null, this
		);

		this.physics.arcade.overlap(
			this.ship, this.shooterPool, this.playerHit, null, this
		);

		this.physics.arcade.overlap(
			this.ship, this.enemyBulletPool, this.playerHit, null, this
		);
	},
	spawnEnemies: function () {
		if (this.nextEnemyAt < this.time.now && this.enemyPool.countDead() > 0) {
			this.nextEnemyAt = this.time.now + this.enemyDelay;
			var enemy = this.enemyPool.getFirstExists(false);
			enemy.reset(
				this.rnd.integerInRange(20, this.game.width - 20), 0,
				Bugbuster.ENEMY_HEALTH
			);
			enemy.body.velocity.y = this.rnd.integerInRange(Bugbuster.ENEMY_MIN_Y_VELOCITY, Bugbuster.ENEMY_MAX_Y_VELOCITY);

			enemy.angle = this.enemyAngle;
			enemy.play('fly');
		}
		if (this.nextShooterAt < this.time.now && this.shooterPool.countDead() > 0) {
			this.nextShooterAt = this.time.now + this.shooterDelay;
			var shooter = this.shooterPool.getFirstExists(false);
			shooter.reset(
				this.rnd.integerInRange(20, this.game.width - 20), 0,
				Bugbuster.SHOOTER_HEALTH
			);

			var target = this.rnd.integerInRange(20, this.game.width - 20);
			shooter.rotation = this.physics.arcade.moveToXY(
				shooter, target, this.game.height,
				this.rnd.integerInRange(
					Bugbuster.SHOOTER_MIN_VELOCITY, Bugbuster.SHOOTER_MAX_VELOCITY
				)
			) - Math.PI / 2;
			shooter.play('fly');
			shooter.nextShotAt = 0;
		}
	},
	processPlayerInput: function () {
		this.ship.body.velocity.x = 0;
		this.ship.body.velocity.y = 0;

		if (this.cursors.left.isDown) {
			this.ship.body.velocity.x = -this.ship.speed;
		} else if (this.cursors.right.isDown) {
			this.ship.body.velocity.x = this.ship.speed;
		}

		if (this.cursors.up.isDown) {
			this.ship.body.velocity.y = -this.ship.speed;
		} else if (this.cursors.down.isDown) {
			this.ship.body.velocity.y = this.ship.speed;
		}

		if (this.input.activePointer.isDown && this.physics.arcade.distanceToPointer(this.ship) > 15) {
			this.physics.arcade.moveToPointer(this.ship, this.ship.speed);
		}

		if (this.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR) || this.input.activePointer.isDown) {
			if (this.returnText && this.returnText.exists) {
				this.quitGame();
			} else {
				this.fire();
			}
		}
	},
	update: function () {
		
		this.checkCollisions();
		this.spawnEnemies();
		this.processPlayerInput();
		this.processDelayedEffects();
		this.enemyFire();

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
		bullet.body.velocity.y = -Bugbuster.BULLET_VELOCITY;

	},
	enemyFire: function() {
		this.shooterPool.forEachAlive(function (enemy) {
			if (this.time.now > enemy.nextShotAt && this.enemyBulletPool.countDead() > 0) {
				var bullet = this.enemyBulletPool.getFirstExists(false);
				bullet.reset(enemy.x, enemy.y);
				this.physics.arcade.moveToObject(
					bullet, this.ship, Bugbuster.ENEMY_BULLET_VELOCITY
				);
				enemy.nextShotAt = this.time.now + Bugbuster.SHOOTER_SHOT_DELAY;
			}
		}, this);
	},
	enemyHit: function (bullet, enemy) {
		bullet.kill();
		this.damageEnemy(enemy, Bugbuster.BULLET_DAMAGE);
	},
	playerHit: function (ship, enemy) {
		if (this.ghostUntil && this.ghostUntil > this.time.now) {
			return;
		}
		this.damageEnemy(enemy, Bugbuster.CRASH_DAMAGE);
		var life = this.lives.getFirstAlive();
		if (life !== null) {
			life.kill();
			this.ghostUntil = this.time.now + Bugbuster.PLAYER_GHOST_TIME;
			this.ship.play('ghost');
		} else {
			this.explode(ship);
			ship.kill();
			this.displayEnd(false);
		}
		this.hitted = 12;
	},
	processDelayedEffects: function () {
		if (this.instructions.exists && this.time.now > this.instExpire) {
			this.instructions.destroy();
		}
		if (this.ghostUntil && this.ghostUntil < this.time.now) {
			this.ghostUntil = null;
			this.ship.play('fly');
		}
		if (this.showReturn && this.time.now > this.showReturn) {
			this.returnText = this.add.text(
				this.game.width / 2, this.game.height / 2 + 20,
				'Press SPACEBAR or Tap Game to go back to Main Menu',
				Bugbuster.FONT_SETTINGS
			);
			this.returnText.anchor.setTo(0.5, 0.5);
			this.showReturn = false;
		}
	},
	damageEnemy: function (enemy, damage) {
		enemy.damage(damage);
		if (enemy.alive) {
			enemy.play('hit');
		} else {
			this.explode(enemy);
			this.addToScore(enemy.reward);
		}		
	},
	addToScore: function (score) {
		this.score += score;
		this.scoreText.text = this.score;
		if (this.score >= 2000) {
			this.enemyPool.destroy();
			this.shooterPool.destroy();
			this.enemyBulletPool.destroy();
			this.displayEnd(true);
		}

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
	setupBackground: function () {
		this.bg = this.add.tileSprite(0, 0, this.game.width, this.game.height, 'starfield');
		this.bg.autoScroll(0, Bugbuster.SEA_SCROLL_SPEED);
	},
	setupPlayer: function () {
		this.ship = this.add.sprite(this.game.width / 2, this.game.height - 50, 'ship');
		this.ship.anchor.setTo(0.5, 0.5);
		this.ship.animations.add('fly', [ 0, 1 ], 20, true);
		this.ship.animations.add('ghost', [ 1, 2 ], 20, true);
		this.ship.play('fly');
		this.physics.enable(this.ship, Phaser.Physics.ARCADE);
		this.ship.speed = Bugbuster.PLAYER_SPEED;
		this.ship.body.collideWorldBounds = true;
		this.ship.body.setSize(20, 20, 0, -5);
	},
	setupPlayerIcons: function () {
		this.lives = this.add.group();
		var firstLifeIconX = this.game.width - 10 - (Bugbuster.PLAYER_EXTRA_LIVES * 30);
		for (var i = 0; i < Bugbuster.PLAYER_EXTRA_LIVES; i++) {
			var life = this.lives.create(firstLifeIconX + (30 * i), 30, 'ship');
			life.scale.setTo(0.5, 0.5);
			life.anchor.setTo(0.5, 0.5);
		}
	},
	setupEnemies: function () {
		this.enemyPool = this.add.group();
		this.enemyPool.enableBody = true;
		this.enemyPool.physicsBodyType = Phaser.Physics.ARCADE;
		this.enemyPool.createMultiple(50, 'bug');
		this.enemyPool.setAll('anchor.x', 0.5);
		this.enemyPool.setAll('anchor.y', 0.5);
		this.enemyPool.setAll('outOfBoundsKill', true);
		this.enemyPool.setAll('checkWorldBounds', true);
		this.enemyPool.setAll('reward', Bugbuster.ENEMY_REWARD, false, false, 0, true);
		this.enemyPool.forEach(function (enemy) {
			enemy.animations.add('fly', [ 0, 1 ], 20, true);
			enemy.animations.add('hit', [ 1, 2 ], 20, false);
			enemy.events.onAnimationComplete.add( function (e) {
				e.play('fly');
			}, this);
		});

		this.enemyAngle = 180;
		this.nextEnemyAt = 0;
		this.enemyDelay = Bugbuster.SPAWN_ENEMY_DELAY;

		this.shooterPool = this.add.group();
		this.shooterPool.enableBody = true;
		this.shooterPool.physicsBodyType = Phaser.Physics.ARCADE;
		this.shooterPool.createMultiple(20, 'vasp');
		this.shooterPool.setAll('anchor.x', 0.5);
		this.shooterPool.setAll('anchor.y', 0.5);
		this.shooterPool.setAll('outOfBoundsKill', true);
		this.shooterPool.setAll('checkWorldBounds', true);
		this.shooterPool.setAll(
			'reward', Bugbuster.SHOOTER_REWARD, false, false, 0, true
		);
		this.shooterPool.forEach(function (enemy) {
			enemy.animations.add('fly', [ 0, 1 ], 20, true);
			enemy.animations.add('hit', [ 1, 2 ], 20, false);
			enemy.events.onAnimationComplete.add( function (e) {
				e.play('fly');
			}, this);
		});

		this.nextShooterAt = this.time.now + Phaser.Timer.SECOND * 5;
		this.shooterDelay = Bugbuster.SPAWN_SHOOTER_DELAY;

	},
	setupBullets: function () {
		this.enemyBulletPool = this.add.group();
		this.enemyBulletPool.enableBody = true;
		this.enemyBulletPool.physicsBodyType = Phaser.Physics.ARCADE;
		this.enemyBulletPool.createMultiple(100, 'enemyBullet');
		this.enemyBulletPool.setAll('anchor.x', 0.5);
		this.enemyBulletPool.setAll('anchor.y', 0.5);
		this.enemyBulletPool.setAll('outOfBoundsKill', true);
		this.enemyBulletPool.setAll('checkWorldBounds', true);
		this.enemyBulletPool.setAll('reward', 0, false, false, 0, true);
		
		this.bulletPool = this.add.group();
		this.bulletPool.enableBody = true;
		this.bulletPool.physicsBodyType = Phaser.Physics.ARCADE;
		this.bulletPool.createMultiple(100, 'bullet');

		this.bulletPool.setAll('anchor.x', 0.5);
		this.bulletPool.setAll('anchor.y', 0.5);
		this.bulletPool.setAll('outOfBoundsKill', true);
		this.bulletPool.setAll('checkWorldBounds', true);
		
		this.nextShotAt = 0;
		this.shotDelay = Bugbuster.SHOT_DELAY;
	},
	setupExplosions: function () {
		this.explosionPool = this.add.group();
		this.explosionPool.enableBody = true;
		this.explosionPool.physicsBodyType = Phaser.Physics.ARCADE;
		this.explosionPool.createMultiple(100, 'kaboom');
		this.explosionPool.setAll('anchor.x', 0.5);
		this.explosionPool.setAll('anchor.y', 0.5);
		this.explosionPool.forEach(function (explosion) {
			explosion.animations.add('boom');
		});
	},
	setupText: function () {
		this.instructions = this.add.text( this.game.width / 2, this.game.height - 100,
			'Shoot `em down with SPACEBAR Motherfucker\n' + 
			'(Tapping/clicking does both)',
			Bugbuster.FONT_SETTINGS
		);
		this.instructions.anchor.setTo(0.5, 0.5);
		this.instExpire = this.time.now + Bugbuster.INSTRUCTION_EXPIRE;
		this.score = 0;
		this.scoreText = this.add.text(
			this.game.width / 2, 30, '' + this.score,
			Bugbuster.FONT_SETTINGS
		);
		this.scoreText.anchor.setTo(0.5, 0.5);
	},
	setupDialogs: function () {
		this.dialogText = this.add.text(
			20, this.game.height - 100,
			'Dialogo',
			Bugbuster.DIALOG_SETTINGS
		);
		// this.dialogText.anchor.setTo(0.5, 0.5);
	},
	displayEnd: function (win) {
		if (this.endText && this.endText.exists) {
			return;
		}
		var msg = win ? 'You Win!!!' : 'Fuck.';
		this.endText = this.add.text( 
			this.game.width / 2, this.game.height / 2 - 60, msg,
			{ font: '15px Monaco', fill: '#fff' }
		);
		this.endText.anchor.setTo(0.5, 0);
		this.showReturn = this.time.now + Bugbuster.RETURN_MESSAGE_DELAY;
	},
	quitGame: function (pointer) {
		this.bg.destroy();
		this.ship.destroy();
		this.enemyPool.destroy();
		this.bulletPool.destroy();
		this.explosionPool.destroy();
		this.instructions.destroy();
		this.scoreText.destroy();
		this.dialogText.destroy();
		this.endText.destroy();
		this.returnText.destroy();
		this.state.start('MainMenu');
  }
};

Bugbuster.Preloader = function (game) {

};

Bugbuster.Preloader.prototype = {
    preload: function () {

		this.load.image('starfield', 'img/starfield.gif');
		this.load.spritesheet('ship', 'img/ship.gif', 32, 28);
		this.load.image('bullet', 'img/bullet.gif');
		this.load.spritesheet('vasp', 'img/vasp.gif', 32, 21);
		this.load.image('enemyBullet', 'img/vasp-bullet.gif');
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
	preload: function () {
		// this.load.image('titlepage', 'assets/titlepage.png');
	},
	update: function () {
		if (this.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR) || this.input.activePointer.isDown) {
			this.startGame();
		}
	},
	startGame: function (pointer) {
		this.state.start('Game');
	}
};

var game = new Phaser.Game(Bugbuster.width, Bugbuster.height, Phaser.CANVAS, 'game');

game.state.add('Boot', Bugbuster.Boot);
game.state.add('Preloader', Bugbuster.Preloader);
game.state.add('Game', Bugbuster.Game);
game.state.add('MainMenu', Bugbuster.MainMenu);
game.state.start('Boot');

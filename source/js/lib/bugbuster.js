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
	SCORE_SETTINGS: { font: '15px Monaco', fill: '#fff', align: 'center' },
	DIALOG_SETTINGS: { font: '12px Monaco', fill: '#fff', align: 'center' },

	STAR_SCROLL_SPEED: 60,
	PLAYER_SPEED: 200,
	ENEMY_MIN_Y_VELOCITY: 90,
	ENEMY_MAX_Y_VELOCITY: 120,
	SHOOTER_MIN_VELOCITY: 250,
	SHOOTER_MAX_VELOCITY: 300,
	BOSS_Y_VELOCITY: 15,
	BOSS_X_VELOCITY: 200,
	BULLET_VELOCITY: 500,
	ENEMY_BULLET_VELOCITY: 600,
	POWERUP_VELOCITY: 100,

	SPAWN_ENEMY_DELAY: Phaser.Timer.SECOND,
	SPAWN_SHOOTER_DELAY: Phaser.Timer.SECOND * 1.5,

	SHOT_DELAY: Phaser.Timer.SECOND * 0.1,
	SHOOTER_SHOT_DELAY: Phaser.Timer.SECOND * 2,
	BOSS_SHOT_DELAY: Phaser.Timer.SECOND,

	ENEMY_HEALTH: 2,
	SHOOTER_HEALTH: 6,
	BOSS_HEALTH: 50,

	BULLET_DAMAGE: 1,
	CRASH_DAMAGE: 5,

	ENEMY_REWARD: 10,
	SHOOTER_REWARD: 20,
	BOSS_REWARD: 100,
	POWERUP_REWARD: 100,

	ENEMY_DROP_RATE: 0,
	SHOOTER_DROP_RATE: .3,
	BOSS_DROP_RATE: 1,

	PLAYER_EXTRA_LIVES: 20,
	PLAYER_GHOST_TIME: Phaser.Timer.SECOND * 1,

	DIALOG_TIME: Phaser.Timer.SECOND,

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
		this.nextDialog = 0;
		this.setupMusic();
		this.setupAudio();

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
		this.physics.arcade.overlap(
			this.ship, this.powerUpPool, this.playerPowerUp, null, this
		);
		if (this.bossApproaching === false) {
			this.physics.arcade.overlap(
				this.bulletPool, this.bossPool, this.enemyHit, null, this
			);

			this.physics.arcade.overlap(
				this.player, this.bossPool, this.playerHit, null, this
			);
		}
	},
	orderPosition: function () {
		var firstPos = this.game.width - 16 - (Bugbuster.PLAYER_EXTRA_LIVES * 8);
		var i = 0;
		this.lives.forEachAlive( function (life) {
			life.position.x = firstPos - (8 * i);
			i ++;
		} );
	},
	playerPowerUp: function (player, powerUp) {
		// this.addToScore(powerUp.reward);
		var lastdead = this.lives.getFirstDead();
		
		if(lastdead !== null){
			lastdead.reset(lastdead.position.x, 10);
			this.energySFX.play();
		}
		this.orderPosition();
		powerUp.kill();
		
	},
	spawnEnemies: function () {
		if (this.nextEnemyAt < this.time.now && this.enemyPool.countDead() > 0) {
			this.nextEnemyAt = this.time.now + this.enemyDelay;
			var enemy = this.enemyPool.getFirstExists(false);
			enemy.reset(
				this.rnd.integerInRange(20, this.game.width - 20), 0,
				Bugbuster.ENEMY_HEALTH
			);
			enemy.body.velocity.y = this.rnd.integerInRange(this.newEnemyVelocity_min, this.newEnemyVelocity_max);

			enemy.angle = this.enemyAngle;
			enemy.play('fly');
		}
	},
	spawnShooters: function () {
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
	spawnBoss: function () {
		this.bossApproaching = true;
		this.boss.reset(this.game.width / 2, 0, Bugbuster.BOSS_HEALTH);
		this.physics.enable(this.boss, Phaser.Physics.ARCADE);
		this.boss.body.velocity.y = Bugbuster.BOSS_Y_VELOCITY;
		this.boss.play('fly');
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
		if (this.intro == 0){
			this.spawnEnemies();
		}
		if (this.aggresive == 1){
			this.spawnShooters();
		}
		this.processPlayerInput();
		this.processDelayedEffects();
		this.enemyFire();
		this.shakeIt();

	},
	fire: function() {
		
		if (!this.ship.alive || this.nextShotAt > this.time.now) {
			return;
		}
		if (this.bulletPool.countDead() === 0) {
			return;
		}
		this.nextShotAt = this.time.now + this.shotDelay;
		this.playerFireSFX.play();

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
		if (this.bossApproaching === false && this.boss.alive && 
			this.boss.nextShotAt < this.time.now &&
			this.enemyBulletPool.countDead() >= 10) {

			this.boss.nextShotAt = this.time.now + Bugbuster.BOSS_SHOT_DELAY;

			for (var i = 0; i < 5; i++) {
				var leftBullet = this.enemyBulletPool.getFirstExists(false);
				leftBullet.reset(this.boss.x - 10 - i * 10, this.boss.y + 20);
				var rightBullet = this.enemyBulletPool.getFirstExists(false);
				rightBullet.reset(this.boss.x + 10 + i * 10, this.boss.y + 20);

				if (this.boss.health > Bugbuster.BOSS_HEALTH / 2) {
					this.physics.arcade.moveToObject(
						leftBullet, this.ship, Bugbuster.ENEMY_BULLET_VELOCITY
					);
					this.physics.arcade.moveToObject(
						rightBullet, this.ship, Bugbuster.ENEMY_BULLET_VELOCITY
					);
				} else {
					this.physics.arcade.moveToXY(
						leftBullet, this.ship.x - i * 100, this.ship.y,
						Bugbuster.ENEMY_BULLET_VELOCITY
					);
					this.physics.arcade.moveToXY(
						rightBullet, this.ship.x + i * 100, this.ship.y,
						Bugbuster.ENEMY_BULLET_VELOCITY
					);
				}
			}
		}
	},
	shakeIt: function () {
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
		this.explodeShipSFX.play();
		this.orderPosition();
		this.hitted = 12;
	},
	processDelayedEffects: function () {

		if (this.dialogText.exists && this.time.now > this.dialogExpire) {
			if (this.script.length > this.nextDialog) {
				this.showDialog();
				this.nextDialog ++;
			}else{
				this.dialogText.destroy();
				this.avatar.destroy();
			}
			
		}

		if (this.ghostUntil && this.ghostUntil < this.time.now) {
			this.ghostUntil = null;
			this.ship.play('fly');
		}
		if (this.showReturn && this.time.now > this.showReturn) {
			this.returnText = this.add.text(
				(this.game.width / 2) -.5, this.game.height / 2 + 20,
				'Press SPACEBAR to go back',
				Bugbuster.FONT_SETTINGS
			);
			this.returnText.anchor.setTo(0.5, 0.5);
			this.showReturn = false;
		}
		if (this.bossApproaching && this.boss.y > 80) {
			this.bossApproaching = false;
			this.boss.nextShotAt = 0;

			this.boss.body.velocity.y = 0;
			this.boss.body.velocity.x = Bugbuster.BOSS_X_VELOCITY;
			this.boss.body.bounce.x = 1;
			this.boss.body.collideWorldBounds = true;
		}
	},
	damageEnemy: function (enemy, damage) {
		enemy.damage(damage);
		if (enemy.alive) {
			enemy.play('hit');
			this.hitSFX.play();
		} else {
			this.explode(enemy);
			this.spawnPowerUp(enemy);
			this.addToScore(enemy.reward);
			if (enemy.key === 'boss') {
				this.enemyPool.destroy();
				this.shooterPool.destroy();
				this.bossPool.destroy();
				this.enemyBulletPool.destroy();
				this.displayEnd(true);
			}	
			this.explodeSFX.play();
		}
			
	},
	spawnPowerUp: function (enemy) {
		if (this.powerUpPool.countDead() === 0 || this.weaponLevel === 5) {
			return;
		}

		if (this.rnd.frac() < enemy.dropRate) {
			var powerUp = this.powerUpPool.getFirstExists(false);
			powerUp.reset(enemy.x, enemy.y);
			powerUp.body.velocity.y = Bugbuster.POWERUP_VELOCITY;
		}
	},
	addToScore: function (score) {
		this.score += score;
		this.scoreText.text = this.score;
		// if (this.score >= 2000) {
		// 	this.enemyPool.destroy();
		// 	this.shooterPool.destroy();
		// 	this.enemyBulletPool.destroy();
		// 	this.displayEnd(true);
		// }
		if (this.score >= 1500 && this.bossPool.countDead() == 1) {
			this.spawnBoss();
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
	setupMusic : function () {
		this.music = game.sound.play('bgmusic');
	},
	setupAudio: function () {

		this.playerFireSFX = this.add.audio('shoot');
		this.hitSFX = this.add.audio('hit');
		this.explodeSFX = this.add.audio('explode');
		this.explodeShipSFX = this.add.audio('explode_ship');
		this.energySFX = this.add.audio('energy');
		this.shutdownSFX = this.add.audio('shutdown');
		this.dialogSFX = this.add.audio('dialog');

		this.playerFireSFX.volume = 0.06;
		this.hitSFX.volume = 0.2;
		this.explodeSFX.volume = 0.2;
		this.energySFX.volume = 0.1;
		this.explodeShipSFX.volume = 0.3;
		this.shutdownSFX.volume = 0.3;
		this.dialogSFX.volume = 0.1;
	},
	setupBackground: function () {
		this.scrollBg = Bugbuster.STAR_SCROLL_SPEED;
		this.bg = this.add.tileSprite(0, 0, this.game.width, this.game.height, 'starfield');
		this.bg.autoScroll(0, this.scrollBg);
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
		this.lives_bg = this.add.group();
		this.lives = this.add.group();

		this.powerUpPool = this.add.group();
		this.powerUpPool.enableBody = true;
		this.powerUpPool.physicsBodyType = Phaser.Physics.ARCADE;
		this.powerUpPool.createMultiple(5, 'life_up');
		this.powerUpPool.setAll('anchor.x', 0.5);
		this.powerUpPool.setAll('anchor.y', 0.5);
		this.powerUpPool.setAll('outOfBoundsKill', true);
		this.powerUpPool.setAll('checkWorldBounds', true);
		this.powerUpPool.setAll('reward', Bugbuster.POWERUP_REWARD, false, false, 0, true);

		var firstLifeIconX = this.game.width - 16 - (Bugbuster.PLAYER_EXTRA_LIVES * 8);
		for (var i = 0; i < Bugbuster.PLAYER_EXTRA_LIVES; i++) {
			var life = this.lives.create(firstLifeIconX + (8 * i), 10, 'energy');
			var life_bg = this.lives_bg.create(firstLifeIconX + (8 * i), 10, 'energy_bg');
			// life.scale.setTo(0.5, 0.5);
			// life.anchor.setTo(0.5, 0.5);
		}
	},
	setupEnemies: function () {
		this.newEnemyVelocity_min = Bugbuster.ENEMY_MIN_Y_VELOCITY;
		this.newEnemyVelocity_max = Bugbuster.ENEMY_MAX_Y_VELOCITY;
		this.enemyPool = this.add.group();
		this.enemyPool.enableBody = true;
		this.enemyPool.physicsBodyType = Phaser.Physics.ARCADE;
		this.enemyPool.createMultiple(50, 'bug');
		this.enemyPool.setAll('anchor.x', 0.5);
		this.enemyPool.setAll('anchor.y', 0.5);
		this.enemyPool.setAll('outOfBoundsKill', true);
		this.enemyPool.setAll('checkWorldBounds', true);
		this.enemyPool.setAll('reward', Bugbuster.ENEMY_REWARD, false, false, 0, true);
		this.enemyPool.setAll('dropRate', Bugbuster.ENEMY_DROP_RATE, false, false, 0, true);
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
		this.shooterPool.setAll('reward', Bugbuster.SHOOTER_REWARD, false, false, 0, true);
		this.shooterPool.setAll('dropRate', Bugbuster.SHOOTER_DROP_RATE, false, false, 0, true);

		this.shooterPool.forEach(function (enemy) {
			enemy.animations.add('fly', [ 0, 1 ], 20, true);
			enemy.animations.add('hit', [ 1, 2 ], 20, false);
			enemy.events.onAnimationComplete.add( function (e) {
				e.play('fly');
			}, this);
		});

		this.nextShooterAt = this.time.now + Phaser.Timer.SECOND * 5;
		this.shooterDelay = Bugbuster.SPAWN_SHOOTER_DELAY;
		this.bossPool = this.add.group();
		this.bossPool.enableBody = true;
		this.bossPool.physicsBodyType = Phaser.Physics.ARCADE;
		this.bossPool.createMultiple(1, 'boss');
		this.bossPool.setAll('anchor.x', 0.5);
		this.bossPool.setAll('anchor.y', 0.5);
		this.bossPool.setAll('outOfBoundsKill', true);
		this.bossPool.setAll('checkWorldBounds', true);
		this.bossPool.setAll('reward', Bugbuster.BOSS_REWARD, false, false, 0, true);
		this.bossPool.setAll(
			'dropRate', Bugbuster.BOSS_DROP_RATE, false, false, 0, true
		);

		this.bossPool.forEach(function (enemy) {
			enemy.animations.add('fly', [ 0, 1 ], 30, true);
			enemy.animations.add('hit', [ 1, 2 ], 20, false);
			enemy.events.onAnimationComplete.add( function (e) {
				e.play('fly');
			}, this);
		});

		this.boss = this.bossPool.getTop();
		this.bossApproaching = false;
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
		this.score = 0;
		this.scoreText = this.add.text(
			this.game.width / 2, 25, '' + this.score,
			Bugbuster.SCORE_SETTINGS
		);
		this.scoreText.anchor.setTo(0.5, 0.5);
	},
	showDialog: function () {
		var current =  this.nextDialog;
		this.dialogExpire = this.time.now + Bugbuster.DIALOG_TIME *  this.script[current].time;
		this.dialogText.setText(this.script[current].text);
		this.avatar.loadTexture( this.script[current].who );
		if (this.script[current].who === 'tutor') {
			this.dialogSFX.play();
		}
		if (this.script[current].nosignal != 1) {
			this.avatar.animations.add('talk', [ 0, 1 ], 8, true);
			this.avatar.play('talk');
		}else{
			this.avatar.animations.frame = 2;
		}
		
		if (this.script[current].attackers == 1) {
			this.intro = 0;
			this.scrollBg = Bugbuster.STAR_SCROLL_SPEED * 2.2;
			this.bg.autoScroll(0, this.scrollBg);
		}
		if (this.script[current].satellite == 1) {
			this.satellite.animations.add('blink', [ 0, 1, 2 ], 8, true);
			this.satellite.play('blink');
			this.satellite.x = this.game.width / 2;
			var tween = this.game.add.tween(this.satellite).to( { x: this.satellite.x - 50 }, 800, "Linear", true, 0, 25);
			tween.yoyo(true, 0);
		}
		if (this.script[current].aggresive == 1) {
			this.enemyAngle = 0;
			this.newEnemyVelocity_min = Bugbuster.ENEMY_MIN_Y_VELOCITY * 2.2;
			this.newEnemyVelocity_max = Bugbuster.ENEMY_MAX_Y_VELOCITY * 2.2;
			this.enemyDelay = this.enemyDelay / 2;
		}
		if (this.script[current].shake == 1) {
			this.hitted = 180;
			this.shutdownSFX.play();
			for (i = 0; i < 16; i++ ) {
				var life = this.lives.getFirstAlive();
				life.kill();
			}
			this.orderPosition();
			var tween = this.game.add.tween(this.satellite).to( { angle: 45, y: this.game.height + 80 }, 4000, "Linear", true);
		}
		if (this.script[current].shooters == 1) {
			this.aggresive = 1;
			this.satellite.destroy();
		}

	},
	setupDialogs: function () {
		this.intro = 1;
		this.script = this.game.cache.getJSON('script');
		this.avatar = this.add.sprite( (this.game.width / 2) -16 , (this.game.height / 2) -40, 'me');
		this.satellite = this.add.sprite(this.game.width + 60, this.game.height/2 + 80, 'satellite');

		this.dialogText = this.add.text(
			this.game.width / 2, this.game.height / 2,
			'Ready.',
			Bugbuster.DIALOG_SETTINGS
		);
		this.dialogText.anchor.setTo(0.5, 0);
		this.dialogExpire = this.time.now + Bugbuster.DIALOG_TIME * 3;
		// this.dialogText.anchor.setTo(0.5, 0.5);
	},
	displayEnd: function (win) {
		if (this.endText && this.endText.exists) {
			return;
		}
		var msg = win ? 'WINRAR' : 'Fuck.';
		this.endText = this.add.text( 
			(this.game.width / 2) -.5, this.game.height / 2 - 60, msg,
			{ font: '15px Monaco', fill: '#fff' }
		);
		this.music.fadeOut(4000);
		this.endText.anchor.setTo(0.5, 0);
		this.showReturn = this.time.now + Bugbuster.RETURN_MESSAGE_DELAY;
	},
	quitGame: function (pointer) {
		this.bg.destroy();
		this.ship.destroy();
		this.enemyPool.destroy();
		this.bulletPool.destroy();
		this.explosionPool.destroy();
		this.scoreText.destroy();
		this.dialogText.destroy();
		this.endText.destroy();
		this.returnText.destroy();
		this.nextDialog = 0;
		this.aggresive = 0;
		this.state.start('Game');
  }
};

Bugbuster.Preloader = function (game) {

};

Bugbuster.Preloader.prototype = {
    preload: function () {
    	this.load.json('script', 'json/script.json');
		this.load.image('starfield', 'img/starfield.gif');
		this.load.spritesheet('ship', 'img/ship.gif', 32, 28);
		this.load.image('bullet', 'img/bullet.gif');
		this.load.spritesheet('vasp', 'img/vasp.gif', 32, 21);
		this.load.spritesheet('boss', 'img/boss.gif', 92, 56);
		this.load.image('enemyBullet', 'img/vasp-bullet.gif');
		this.load.spritesheet('bug', 'img/bug.gif', 26, 18);
		this.load.spritesheet('kaboom', 'img/explode.gif', 32, 32);
		this.load.spritesheet('me', 'img/me.gif', 32, 32);
		this.load.spritesheet('energy', 'img/energy.gif', 8, 24);
		this.load.spritesheet('energy_bg', 'img/energy_bg.gif', 8, 24);
		this.load.image('life_up', 'img/pill_up.gif');
		this.load.spritesheet('tutor', 'img/tutor.gif', 32, 32);
		this.load.spritesheet('satellite', 'img/satellite.gif', 52, 30);
		
		this.load.audio('bgmusic', 'sound/pantera.mp3');

		this.load.audio('shoot', 'sound/shoot.wav');
		this.load.audio('energy', 'sound/energy.wav');
		this.load.audio('explode', 'sound/explode.wav');
		this.load.audio('explode_ship', 'sound/explode_ship.wav');
		this.load.audio('shutdown', 'sound/shutdown.wav');
		this.load.audio('hit', 'sound/hit.wav');
		this.load.audio('dialog', 'sound/dialog.wav');
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

var game = new Phaser.Game(700, $('#game').height(), Phaser.CANVAS, 'game');

game.state.add('Boot', Bugbuster.Boot);
game.state.add('Preloader', Bugbuster.Preloader);
game.state.add('Game', Bugbuster.Game);
game.state.add('MainMenu', Bugbuster.MainMenu);
game.state.start('Boot');

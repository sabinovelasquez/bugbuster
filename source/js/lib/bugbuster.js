/*****
* Bugbuster Game
*
* @author Sabino Velasquez <sabinovelasquez@gmail.com>
* @copyright 2015 Sabino (http:\\www.sabino.cl)
*
*****/

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

Bugbuster.Game = function () {
	
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

	this.ship = null;
	this.score = 0;	

};

Bugbuster.Game.prototype = {

	create: function () {
		var bg = this.add.tileSprite(0, 0, this.world.width, this.world.height, 'starfield');
		this.ship = this.add.sprite(40, 50, 'ship');
	},
	update: function () {

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
		this.load.spritesheet('bugs', 'img/bug.gif', 26, 18);
		this.load.spritesheet('kaboom', 'img/explode.gif', 32, 32);
		
	},
	create: function () {
		this.state.start('Game');
	}
};

var game = new Phaser.Game(Bugbuster.width, Bugbuster.height, Phaser.CANVAS, 'game');

game.state.add('Boot', Bugbuster.Boot);
game.state.add('Preloader', Bugbuster.Preloader);
game.state.add('Game', Bugbuster.Game);

game.state.start('Boot');
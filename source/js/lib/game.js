// var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'bugbuster', { preload: preload, create: create, update: update });

// var ship,
//     bullets,
//     bulletTime = 100,
//     bullet,
//     hitted = 0,
//     bugs,
//     cursors;

// function preload() {
    
//     game.load.spritesheet('ship', 'img/ship.gif', 32, 28);
//     game.load.image('bullet', 'img/bullet.gif');
//     game.load.spritesheet('bugs', 'img/bug.gif', 26, 18);
//     game.load.spritesheet('kaboom', 'img/explode.gif', 32, 32);
//     game.load.image('starfield', 'img/starfield.gif');
//     game.load.audio('bgmusic', 'sound/pantera.mp3');

// }

// function create() {

//     //bgmusic = game.sound.play('bgmusic');

//     starfield = game.add.tileSprite(0, 0, 800, 600, 'starfield');
//     bugs = game.add.group();
//     bugs.enableBody = true;
//     bugs.physicsBodyType = Phaser.Physics.ARCADE;

//     for (var i = 0; i < 50; i++) {
//         var bug = bugs.create(game.world.randomX, Math.random() * 500, 'bugs', game.rnd.integerInRange(0, 36));
//         bug.name = 'bug' + i;

//         var fly = bug.animations.add('fly');
//         bug.animations.play('fly', 30, true);
//         bug.body.gravity.y = 50;
//     }

//     explosions = game.add.group();
//     explosions.createMultiple(30, 'kaboom');
//     explosions.forEach(setupBug, this);

//     bullets = game.add.group();
//     bullets.enableBody = true;
//     bullets.physicsBodyType = Phaser.Physics.ARCADE;

//     for (var i = 0; i < 20; i++) {
//         var b = bullets.create(0, 0, 'bullet');
//         b.name = 'bullet' + i;
//         b.exists = false;
//         b.visible = false;
//         b.checkWorldBounds = true;
//         b.events.onOutOfBounds.add(resetBullet, this);
//     }

//     ship = game.add.sprite(400, 550, 'ship');
//     ship.velocity = 300;
//     var ignite = ship.animations.add('ignite');
//     ship.animations.play('ignite', 30, true);
//     ship.life = 100;
//     ship.hitted = 0;
//     game.physics.enable(ship, Phaser.Physics.ARCADE);

//     cursors = game.input.keyboard.createCursorKeys();
//     game.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR ]);

// }

// function setupBug (bug) {

//     bug.anchor.x = 0.5;
//     bug.anchor.y = 0.5;
//     bug.animations.add('kaboom');

// }

// function update() {

//     game.physics.arcade.overlap(bullets, bugs, collisionHandler, null, this);
//     game.physics.arcade.overlap(bugs, ship, hitShip, null, this);

//     starfield.tilePosition.y += 3;
//     ship.body.velocity.x = 0;
//     ship.body.velocity.y = 0;

//     if (cursors.left.isDown) {
//         ship.body.velocity.x = ship.velocity * -1;
//     }
//     else if (cursors.right.isDown) {
//         ship.body.velocity.x = ship.velocity;
//     }
//     if (cursors.up.isDown) {
//         ship.body.velocity.y = ship.velocity * -1;;
//     }
//     else if (cursors.down.isDown) {
//         ship.body.velocity.y = ship.velocity;
//     }

//     if (game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
//         fireBullet();
//     }
//     if (hitted > 0) {
//        var rand1 = game.rnd.integerInRange(-5,5);
//        var rand2 = game.rnd.integerInRange(-5,5);
//         game.world.setBounds(rand1, rand2, game.width + rand1, game.height + rand2);
//         if(hitted%2==0){
//             ship.tint = 0xff0000;
//         }else{
//             ship.tint = 0xffffff;
//         }
//         hitted--;
//         if (hitted == 0) {
//             ship.tint = 0xffffff;
//             game.world.setBounds(0, 0, game.width,game.height); // normalize after shake?
//         }
//     }
// }

// function fireBullet () {

//     if (game.time.now > bulletTime) {
//         bullet = bullets.getFirstExists(false);

//         if (bullet) {
//             bullet.reset(ship.x, ship.y + 10);
//             bullet.body.velocity.y = -300;
//             bulletTime = game.time.now + 150;
//         }
//     }

// }


// function resetBullet (bullet) {

//     bullet.kill();

// }
// function hitShip (_ship, bug) {
//     ship.life -= 10;

//     console.log(ship.life);
//     bug.kill();

//     if(ship.life <= 0){
//         ship.kill();
//         var explosion = explosions.getFirstExists(false);
//         explosion.reset(_ship.body.x, _ship.body.y);
//         explosion.play('kaboom', 30, false, true);
//     }
//     hitted = 8;   
// }

// function collisionHandler (bullet, bug) {
//     bullet.kill();
//     bug.kill();
//     var explosion = explosions.getFirstExists(false);
//     explosion.reset(bug.body.x, bug.body.y);
//     explosion.play('kaboom', 30, false, true);
// }
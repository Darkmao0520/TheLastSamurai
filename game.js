const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startGameButton = document.getElementById('startGameButton');

// Define towers and enemies with an attack range
let towers = [{ x: 100, y: 100, attackRange: 100, health: 5 }];
let enemies = [];
let potions = []; // Array to store potions dropped by enemies
let spawnInterval;
let gameOver = false;

let attackTimer = 0; // Timer to track time for attacks
const attackDelay = 500; // 0.5 seconds in milliseconds

// Difficulty variables
let difficultyLevel = 1; // Start at difficulty level 1
const difficultyIncreaseInterval = 30000; // Increase difficulty every 30 seconds
const maxProjectiles = 5; // Maximum projectiles that can be fired by enemies

// Projectile class for shooting enemy projectiles
class Projectile {
    constructor(x, y, targetX, targetY) {
        this.x = x;
        this.y = y;
        this.speed = 5; // Speed of the projectile
        this.damage = 1; // Damage dealt by the projectile
        this.dx = targetX - x;
        this.dy = targetY - y;
        const distance = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
        this.dx /= distance; // Normalize
        this.dy /= distance; // Normalize
    }

    update() {
        this.x += this.dx * this.speed;
        this.y += this.dy * this.speed;
    }
}

let shootingEnemy; // Variable for the shooting enemy
let projectiles = []; // Array to store projectiles
let shootingInterval; // Interval for the shooting enemy

// Function to start the game
function startGame() {
    // Hide the start button and show the canvas
    startGameButton.style.display = 'none';
    canvas.style.display = 'block';

    // Center the tower on the screen
    towers[0].x = (canvas.width / 2) - 20;
    towers[0].y = (canvas.height / 2) - 20;

    // Reset game state
    resetGameState();

    // Start the game loop
    gameLoop();

    // Start spawning enemies at random intervals
    startSpawnInterval();

    // Increase difficulty at regular intervals
    setInterval(increaseDifficulty, difficultyIncreaseInterval);
}

// Function to reset the game state
function resetGameState() {
    towers[0].health = 5; // Reset tower health
    enemies = []; // Clear enemies
    projectiles = []; // Clear projectiles
    potions = []; // Clear potions
    gameOver = false; // Reset game over state
    attackTimer = 0; // Reset attack timer

    if (shootingInterval) clearInterval(shootingInterval); // Clear shooting interval
    shootingEnemy = null; // Reset shooting enemy

    // Clear existing spawn interval if any
    if (spawnInterval) clearInterval(spawnInterval);
}

// Function to start spawning enemies at random intervals
function startSpawnInterval() {
    spawnInterval = setInterval(() => {
        spawnEnemy();
    }, getRandomInterval(1000, 3000));
}

// Function to get a random interval
function getRandomInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw towers (blue squares) and their attack range (light blue circle)
    towers.forEach(tower => {
        ctx.fillStyle = 'blue';
        ctx.fillRect(tower.x, tower.y, 40, 40);

        // Draw tower health
        ctx.fillStyle = 'black';
        ctx.font = '16px Arial';
        ctx.fillText(`HP: ${tower.health}`, tower.x, tower.y - 5);

        // Draw attack range
        ctx.beginPath();
        ctx.arc(tower.x + 20, tower.y + 20, tower.attackRange, 0, Math.PI * 2, false);
        ctx.strokeStyle = 'lightblue';
        ctx.stroke();
    });

    // Draw enemies
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, 30, 30);
        
        // Draw enemy health
        ctx.fillStyle = 'black';
        ctx.font = '16px Arial';
        ctx.fillText(`HP: ${enemy.health}`, enemy.x, enemy.y - 5);
    });

    // Draw projectiles
    projectiles.forEach(projectile => {
        ctx.fillStyle = 'red';
        ctx.fillRect(projectile.x, projectile.y, 5, 5); // Draw projectiles as small squares
    });

    // Draw potions
    potions.forEach(potion => {
        ctx.fillStyle = 'purple';
        ctx.fillRect(potion.x, potion.y, 10, 10); // Draw potions as small squares
        ctx.fillStyle = 'black';
        ctx.fillText(potion.value, potion.x + 2, potion.y + 8); // Display potion value
    });

    // Draw game over screen if the game is over
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; // Semi-transparent background
        ctx.fillRect(0, 0, canvas.width, canvas.height); // Cover the canvas

        ctx.fillStyle = 'white'; // Text color
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '24px Arial';
        ctx.fillText('Click to Restart', canvas.width / 2, canvas.height / 2 + 20);
    }
}

function update() {
    if (gameOver) return; // Stop updating if the game is over

    // Move enemies towards the tower
    enemies.forEach(enemy => {
        const tower = towers[0]; // Reference to the first tower
        const dx = tower.x + 20 - enemy.x; // Distance to tower in the x direction
        const dy = tower.y + 20 - enemy.y; // Distance to tower in the y direction
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Normalize the direction vector and move the enemy towards the tower
        if (distance > 0) {
            enemy.x += (dx / distance) * 2; // Move towards the tower at a speed of 2 pixels
            enemy.y += (dy / distance) * 2; // Move towards the tower at a speed of 2 pixels
        }

        // Check if the enemy touches the tower
        if (distance < 40) { // Assuming the tower is 40x40
            tower.health -= 1; // Deduct tower health by 1
            console.log(`Tower was hit! New health: ${tower.health}`);
            enemy.health = 0; // Set enemy health to 0 to remove it
        }
    });

    // Check if the tower's health is below zero
    if (towers[0].health <= 0) {
        gameOver = true; // Set game over to true
        console.log("Game Over: Tower has been destroyed!");
    }

    // Update projectiles
    projectiles.forEach((projectile, index) => {
        projectile.update(); // Move the projectile
        // Check for collision with the tower
        const tower = towers[0];
        const dx = projectile.x - (tower.x + 20); // Distance to tower in the x direction
        const dy = projectile.y - (tower.y + 20); // Distance to tower in the y direction
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 20) { // Collision threshold
            tower.health -= projectile.damage; // Deduct tower health by projectile damage
            console.log(`Tower was hit by a projectile! New health: ${tower.health}`);
            projectiles.splice(index, 1); // Remove projectile after hitting
        }
    });

    // Check for attacking enemies
    const tower = towers[0]; // Reference to the tower
    const inRangeEnemies = enemies.filter(enemy => {
        const distance = Math.sqrt((enemy.x - (tower.x + 20)) ** 2 + (enemy.y - (tower.y + 20)) ** 2);
        return distance <= tower.attackRange; // Check if the enemy is within attack range
    });

    // Handle attacking if there are enemies in range
    if (inRangeEnemies.length > 0) {
        attackTimer += 16; // Increment timer by the time passed (approximately 16ms for 60fps)
        if (attackTimer >= attackDelay) {
            // Attack the first enemy in range
            const nearestEnemy = inRangeEnemies[0];
            nearestEnemy.health -= 1; // Reduce the health of the enemy by 1
            console.log(`${nearestEnemy.color} enemy was attacked! New health: ${nearestEnemy.health}`);

            // Check if the enemy is dead and drop a potion
            if (nearestEnemy.health <= 0) {
                dropPotion(nearestEnemy); // Drop a potion when the enemy dies
            }

            attackTimer = 0; // Reset the attack timer
        }
    }

    // Remove dead enemies
    enemies = enemies.filter(enemy => enemy.health > 0);
}


// Function to drop a potion
function dropPotion(enemy) {
    const potionValue = getRandomInterval(1, 5); // Random potion value between 1 and 5
    const potion = {
        x: enemy.x + 10, // Position it at the center of the enemy
        y: enemy.y + 10,
        value: potionValue
    };
    potions.push(potion); // Add the potion to the potions array
    console.log(`Dropped a potion with value: ${potionValue}`);
}

// Function to attack the nearest enemy
function attackNearestEnemy() {
    const tower = towers[0];

    // Find the closest enemy within the attack range
    const inRangeEnemies = enemies.filter(enemy => {
        const distance = Math.sqrt((enemy.x - (tower.x + 20)) ** 2 + (enemy.y - (tower.y + 20)) ** 2);
        return distance <= tower.attackRange;
    });

    if (inRangeEnemies.length > 0) {
        const nearestEnemy = inRangeEnemies[0]; // Attack the closest enemy
        nearestEnemy.health -= 1; // Reduce the health of the nearest enemy by 1
        console.log(`${nearestEnemy.color} enemy was attacked! New health: ${nearestEnemy.health}`);

        // Check if the enemy is dead and drop a potion
        if (nearestEnemy.health <= 0) {
            dropPotion(nearestEnemy); // Drop a potion when the enemy dies
        }
    }
}

// Function to spawn a new enemy
function spawnEnemy() {
    const colors = ['red', 'green', 'blue', 'yellow'];
    const isShootingEnemy = Math.random() < 0.2; // 20% chance to spawn a shooting enemy
    const numberOfEnemies = getRandomInterval(1, 5); // Random number of enemies to spawn (between 1 and 5)

    for (let i = 0; i < numberOfEnemies; i++) {
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        // Create a new enemy at a random position on the screen
        const newEnemy = {
            x: Math.random() * (canvas.width - 30),
            y: Math.random() * (canvas.height - 30),
            color: randomColor,
            health: 3,
            shooting: isShootingEnemy
        };

        enemies.push(newEnemy);
        console.log(`Spawned a new ${randomColor} enemy!`);
        
        if (isShootingEnemy) {
            // Start the shooting interval for the shooting enemy
            shootingEnemy = newEnemy; // Reference to the shooting enemy
            shootingInterval = setInterval(() => {
                shootProjectile(shootingEnemy);
            }, 1000); // Shooting interval of 1 second
        }
    }
}

// Function to shoot a projectile from the enemy towards the tower
function shootProjectile(enemy) {
    const tower = towers[0];
    const projectileCount = Math.min(difficultyLevel + 1, maxProjectiles); // Increase number of projectiles based on difficulty
    for (let i = 0; i < projectileCount; i++) {
        const projectile = new Projectile(enemy.x + 15, enemy.y + 15, tower.x + 20, tower.y + 20);
        projectiles.push(projectile);
    }
}

// Function to push enemies away from the tower
function pushEnemiesAway() {
    const tower = towers[0]; // Reference to the first tower

    // Loop through enemies and push them away if they are in range
    enemies.forEach(enemy => {
        const dx = enemy.x - (tower.x + 20); // Direction from tower to enemy in the x direction
        const dy = enemy.y - (tower.y + 20); // Direction from tower to enemy in the y direction
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Check if enemy is within the attack range
        if (distance <= tower.attackRange) {
            // Normalize direction vector
            const pushFactor = 100; // How far to push enemies away
            if (distance > 0) {
                enemy.x += (dx / distance) * pushFactor; // Move enemy away in the x direction
                enemy.y += (dy / distance) * pushFactor; // Move enemy away in the y direction
            }
        }
    });
}

// Function to increase the difficulty
function increaseDifficulty() {
    difficultyLevel += 1; // Increase difficulty level
    console.log(`Increased difficulty to level: ${difficultyLevel}`);
}

// Function to add potion value to tower health on hover
function checkPotionHover(mouseX, mouseY) {
    potions.forEach((potion, index) => {
        // Check if the mouse is hovering over the potion
        if (mouseX >= potion.x && mouseX <= potion.x + 10 &&
            mouseY >= potion.y && mouseY <= potion.y + 10) {
            towers[0].health += potion.value; // Add potion value to tower health
            console.log(`Tower health increased by ${potion.value}. New health: ${towers[0].health}`);
            potions.splice(index, 1); // Remove the potion after it is collected
        }
    });
}

// Add event listeners to buttons
startGameButton.addEventListener('click', startGame); // Start the game on button click
canvas.addEventListener('click', (event) => {
    if (gameOver) {
        location.reload(); // Reload the page to reset the game
    } else {
        attackNearestEnemy(); // Attack on left click on the canvas
    }
});

// Add event listener for mouse movement
canvas.addEventListener('mousemove', (event) => {
    const mouseX = event.clientX - canvas.getBoundingClientRect().left;
    const mouseY = event.clientY - canvas.getBoundingClientRect().top;

    checkPotionHover(mouseX, mouseY); // Check if hovering over potions
	checkProjectileHover(mouseX, mouseY); // Check if hovering over projectiles to reverse their direction
});


// Function to check if mouse is hovering over projectiles
function checkProjectileHover(mouseX, mouseY) {
    projectiles.forEach(projectile => {
        // Check if the mouse is hovering over the projectile
        if (mouseX >= projectile.x && mouseX <= projectile.x + 5 &&
            mouseY >= projectile.y && mouseY <= projectile.y + 5) {
            console.log(`Reversed a projectile at (${projectile.x}, ${projectile.y})`);
            
            // Reverse projectile direction
            projectile.dx = -projectile.dx;
            projectile.dy = -projectile.dy;
        }
    });
}


// Add event listener for the space bar
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        pushEnemiesAway();
    }
});

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

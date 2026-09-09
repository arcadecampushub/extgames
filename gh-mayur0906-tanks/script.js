(function() 
{
	$(document).ready(function($) 
	{
		var game = {};		
		
		/* Image numbers : 

		0 : Map Sprite
		1 : Vertical Player
		2 : Horizontal Player

		*/

		game.contextMap = document.getElementById('backgroundCanvas').getContext('2d');
		game.contextPlayer = document.getElementById('playerCanvas').getContext('2d');
		game.contextEnemies = document.getElementById('enemyCanvas').getContext('2d');

		game.noOfTiles = 20;
		game.width = 20*32;
		game.height = 20*32;

		game.images = [];
		game.doneImages = 0;
		game.requiredImages = 0;


		
		game.mapRendered = false;
		game.maxWalkableTileNum = 0;
		game.levelData = [
    						[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    						[0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0],
    						[0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0],
    						[0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0],
    						[0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0],
    						[0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0],
    						[0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0],
    						[0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0],
    						[0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0],
    						[1,0,0,1,1,1,0,0,0,0,0,0,0,0,1,1,1,0,0,1],
    						[1,0,0,1,1,1,0,0,0,0,0,0,0,0,1,1,1,0,0,1],
    						[0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0],
    						[0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0],
    						[0,0,1,0,0,1,0,0,1,1,1,1,0,0,1,0,0,1,0,0],
    						[0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0],
    						[0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0],
    						[0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0],
    						[0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0],
    						[0,0,1,0,0,1,0,0,1,1,1,1,0,0,1,0,0,1,0,0],
    						[0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0]
    					];
    	
    	
    	game.player = 
		{
			x: game.width / 2 + 80,
			y: game.height - 150,
			HorizontalWidth: 67,
			HorizontalHeight: 32,
			VerticalWidth: 32,
			VerticalHeight: 67,
			speed: 4,
			rendered: false,
			imageVertical: 1,
			imageHorizontal: 2,
			vertical: true,
			horizontal: false,
			up: true,
			down: false,
			left: false,
			right: false,
			side: 67,
			width: 32,
			height: 67,
			score: 0,
			lives:3
		};

		game.bullet = [];
		game.ShootingInterval = 18;
		game.ShootingTimer = game.ShootingInterval;	
		game.timer = 0;

		game.gameOver = false;
		game.alertShown = false;

		game.keys = [];

		game.enemies = [];
		game.enemyCounter = 0;
		

		
		//Key Listeners :

		$(document).keydown(function(e)
		{
			game.keys[e.keyCode ? e.keyCode : e.which] = true;
		});
		
		$(document).keyup(function(e)
		{
			delete game.keys[e.keyCode ? e.keyCode : e.which];
		});

		

		function addBullet()
		{
			game.bullet.push({
				x: game.player.x + 11,
				y: game.player.y + 11,
				width: 8,
				height: 8,
				dirLeft: game.player.left,
				dirRight: game.player.right,
				dirUp: game.player.up,
				dirDown: game.player.down,
				image: 3
			});
		}

		function init () 
		{
			buildEnemy(10);
			loop();
		}
		function buildEnemy(xvalue)
		{
			game.enemies.push(
			{
				x: xvalue,
				y: 67,
				HorizontalWidth: 67,
				HorizontalHeight: 32,
				VerticalWidth: 32,
				VerticalHeight: 63,
				speed: 3,
				rendered: false,
				imageVertical: 5,
				imageHorizontal: 4,
				vertical: true,
				horizontal: false,
				up: false,
				down: true,
				left: false,
				right: false,
				side: 67,
				width: 32,
				height: 67,
				dead: false,
				reachedDown: false
								
			});
		}

		
		function update()
		{
		
			document.getElementById("score").innerHTML="Score : "+game.player.score;
			document.getElementById("lives").innerHTML="Lives left : "+game.player.lives;

			if(game.gameOver)
			{
				var totalScore = ((game.player.lives*60)+game.player.score);
				document.getElementById("score2").innerHTML="Score : "+game.player.score;
				if(!game.alertShown)
				{
					alert("Game over! You got a "+game.player.lives*60+" score bonus, and "+game.player.score+" points for killing enemies, for a total of "+((game.player.lives*60)+game.player.score)+" points!!");
					game.alertShown = true;
				}
				document.getElementById('score2').innerHTML="Total Score : "+totalScore;

				//Add navigation to back end here.

			}
			//bullet shooters
			if(game.ShootingTimer > 0)
			{
				game.ShootingTimer--;				
			}

			game.timer++;
			if((game.timer%60)==0)
			{
				document.getElementById("time").innerHTML="Time elapsed : "+(game.timer/60);
			}
			
			if(game.timer == 120)
			{
				buildEnemy(104);
			}

			if(game.timer == 240)
			{
				buildEnemy(192);
			}

			if(game.timer == 360)
			{
				buildEnemy(310);
			}

			if(game.timer == 480)
			{
				buildEnemy(384);
			}

			if(game.timer == 600)
			{
				buildEnemy(484);
			}

			if(game.timer == 720)
			{
				buildEnemy(576);
			}

			if(game.timer == 840)
			{
				buildEnemy(104);
			}

			if(game.timer == 960)
			{
				buildEnemy(192);
			}

			if(game.timer == 1080)
			{
				buildEnemy(310);
			}

			if(game.timer == 1200)
			{
				buildEnemy(384);
			}

			if(game.timer == 1320)
			{
				buildEnemy(484);

			}

			if(game.timer == 1440)
			{
				buildEnemy(576);
				
			}

			if(game.timer==3600)
			{
				game.gameOver = true;
			}

			if(game.enemyCounter==13)
			{
				game.gameOver = true;
			}



			for (i in game.bullet)
			{
				if(game.bullet[i].dirUp)
				{
					game.bullet[i].y -= 7;
					if(game.bullet[i].y < -15)
					{
						game.bullet.splice(i, 1);
					}
				}
				if(game.bullet[i].dirDown)
				{
					game.bullet[i].y += 7;
					if(game.bullet[i].y > game.height + 15)
					{
						game.bullet.splice(i, 1);
					}
				}
				if(game.bullet[i].dirRight)
				{
					game.bullet[i].x += 7;
					if(game.bullet[i].x > game.width + 15)
					{
						game.bullet.splice(i, 1);
					}
				}
				if(game.bullet[i].dirLeft)
				{
					game.bullet[i].x -= 7;
					if(game.bullet[i].x < -15 )
					{
						game.bullet.splice(i, 1);
					}
				}					
			}
			
			for(i in game.enemies)
			{
				if (collision(game.player,game.enemies[i]))
				{
					game.player.lives--;
					if (game.player.horizontal) 
					{
						game.contextPlayer.clearRect(game.player.x - 5, game.player.y - 5, game.player.side + 10, game.player.side + 10);
					}
					else if (game.player.vertical)
					{
						game.contextPlayer.clearRect(game.player.x - 5, game.player.y - 5, game.player.side + 10, game.player.side + 10);
					
					}

					game.player.x= game.width / 2 + 80;
					game.player.y= game.height - 150;
					game.player.rendered = false;
					if(game.player.lives==0)
					{
						game.gameOver = true;
					}
				}
			}

			//console.log(game.bullet.length);
			//key listeners
			
			if(!game.gameOver)
			{
				if (game.keys[32] && game.ShootingTimer <= 0 || game.keys[13] && game.ShootingTimer <= 0)
				{
					
					addBullet();
					// game.backgroundMusic.play();
					// game.fireballSound.play();
					game.ShootingTimer = game.ShootingInterval;
				}
			}

			for (p in game.bullet)
			{
				if (game.bullet[p].y >= 0)
				{
					var iCurCelX = (2 * game.bullet[p].x) / 64;
            		var iCurCelY = (2 * game.bullet[p].y) / 64;
            		var iTest1 = game.levelData[parseInt(iCurCelY)][parseInt(iCurCelX)];
            		var iTest2 = game.levelData[parseInt(iCurCelY-1)][parseInt(iCurCelX)];

            			if (!((iTest1 == 0 ) && (iTest2 == 0)) )
            			{
                			game.levelData[parseInt(iCurCelY)][parseInt(iCurCelX)] = 0;
            				game.levelData[parseInt(iCurCelY-1)][parseInt(iCurCelX)] = 0;
            				game.mapRendered = false;
            				game.contextEnemies.clearRect(game.bullet[p].x - 5, game.bullet[p].y - 5, game.bullet[p].width + 12, game.bullet[p].height + 16);
							game.bullet.splice(p, 1);					
                			
            			}
            			
					}
			}
				
			for(m in game.enemies)
			{
				var enemy = game.enemies[m];
				if(!enemy.reachedDown)
				{
					if (!game.enemies[m].vertical) 
		              {
		                game.enemies[m].horizontal = false;
		                game.enemies[m].vertical = true;
		                game.enemies[m].width = game.enemies[m].VerticalWidth;
		                game.enemies[m].height = game.enemies[m].VerticalHeight;
		              };

		              if(!game.enemies[m].down)
		              {
		                game.enemies[m].down = true;
		                game.enemies[m].rendered = false;
		                game.enemies[m].left = false;
		                game.enemies[m].right = false;
		                game.enemies[m].up = false;
		                
		              }
		              game.enemies[m].y += game.enemies[m].speed;
		              game.enemies[m].rendered = false;
		              if (enemy.y>=222) 
		              	{
		              		enemy.reachedDown = true;
		              	};

				}
				
				if(enemy.reachedDown)
				{
				
					if (!game.enemies[m].vertical) 
		              {
		                game.enemies[m].horizontal = false;
		                game.enemies[m].vertical = true;
		                game.enemies[m].width = game.enemies[m].VerticalWidth;
		                game.enemies[m].height = game.enemies[m].VerticalHeight;
		              };

		              if(!game.enemies[m].up)
		              {
		                game.enemies[m].up = true;
		                game.enemies[m].rendered = false;
		                game.enemies[m].left = false;
		                game.enemies[m].right = false;          
		                game.enemies[m].down = false;
		              }
		              game.enemies[m].y -= game.enemies[m].speed;
		              game.enemies[m].rendered = false;

		              if(enemy.y<=2)
		              {
		              	enemy.reachedDown = false;
		              }
				}
			}	

			
		

			for (m in game.enemies)
			{
				for (p in game.bullet)
				{
					if(collision(game.bullet[p], game.enemies[m]))
					{
						var bull = game.bullet[p];
						game.enemies[m].dead = true;
						game.player.score += 15;
						game.enemyCounter++;
						/*game.enemyDeadSound.play();
						game.enemies[m].image = 3;*/
						game.contextEnemies.clearRect(bull.x - 5, bull.y - 5, bull.width + 12, bull.height + 16);
						game.bullet.splice(p, 1);
					}
				}
			}

			
			for (i in game.enemies)
			{
				/*if (game.enemies[i].dead)
				{
					game.enemies[i].deadTime--;
				}*/
					//erase hit enemy
					//delete enemy from array
				if (game.enemies[i].dead /*&& game.enemies[i].deadTime <= 0*/)
				{
					var mob = game.enemies[i];
					game.contextEnemies.clearRect(mob.x - 5, mob.y - 5, mob.width + 10, mob.height + 10);
					game.enemies.splice(i, 1);
				}
			}
			//left
			if ((game.keys[37] || game.keys[65]) /*&& (!game.collideLeft)*/)
			{
				/*game.collideDown = false;
				game.collideUp = false;
				game.collideRight = false;

				if (canDriveHere(parseInt(Math.floor(game.player.x/game.noOfTiles)),parseInt(Math.floor(game.player.y/game.noOfTiles)))) 
				{
					game.collideLeft = true;
				};*/

				if (!game.player.horizontal) 
				{
					game.player.horizontal = true;
					game.player.vertical = false;
					game.player.width = game.player.HorizontalWidth;
					game.player.height = game.player.HorizontalHeight;
				};

				if(!game.player.left)
				{					
					game.player.left = true;					
					game.player.rendered = false;
					game.player.right = false;
					game.player.up = false;
					game.player.down = false;
				}

				/*game.bullet.dirLeft = true;
				game.bullet.dirRight = false;
				game.bullet.dirUp = false;
				game.bullet.dirDown = false;*/

				if(!game.gameOver)
				{
					var iCurCelX = (2 * game.player.x) / 64;
            		var iCurCelY = (2 * game.player.y) / 64;
            		var iTest1 = game.levelData[parseInt(iCurCelY)][parseInt(iCurCelX-1)];
            		var iTest2 = game.levelData[parseInt(iCurCelY+1)][parseInt(iCurCelX-1)];
            		//console.log("["+parseInt(iCurCelY)+","+parseInt(iCurCelX)+"]")

            		if ((iTest1 == 0 ) && (iTest2 == 0 )) 
            		{
                		if (game.player.x >= 0)
						{
							game.player.x -= game.player.speed;
							game.player.rendered = false;
						}
						if (game.player.x < 0) 
                		{
                    		game.player.x = 0;
                		}
                		
            		}
					
				}
				//console.log("Pointing left");
			}
			
			// right
			if ((game.keys[39] || game.keys[68]) /*&& (!game.collideRight)*/)
			{
				/*game.collideDown = false;
				game.collideUp = false;
				game.collideLeft = false;

				if (canDriveHere(Math.floor(game.player.x/game.noOfTiles),Math.floor(game.player.y/game.noOfTiles))) 
				{
					game.collideRight = true;
				};*/


				if (!game.player.horizontal) 
				{
					game.player.horizontal = true;
					game.player.vertical = false;
					game.player.width = game.player.HorizontalWidth;
					game.player.height = game.player.HorizontalHeight;
				};

				if(!game.player.right)
				{
					game.player.right = true;
					game.player.rendered = false;
					game.player.left = false;					
					game.player.up = false;
					game.player.down = false;
				}

				/*game.bullet.dirLeft = false;
				game.bullet.dirRight = true;
				game.bullet.dirUp = false;
				game.bullet.dirDown = false;*/


				if(!game.gameOver)
				{
					if (game.player.x <= game.width /*- game.player.HorizontalWidth*/)
					{
						var iCurCelX = (2 * game.player.x) / 64;
            			var iCurCelY = (2 * game.player.y) / 64;
            			var iTest1 = game.levelData[parseInt(iCurCelY)][parseInt(iCurCelX+2)];
            			var iTest2 = game.levelData[parseInt(iCurCelY+1)][parseInt(iCurCelX+2)];
            			//console.log(iTest1+iTest2);

            			if ((iTest1 == 0 ) && (iTest2 == 0 )) 
            			{
            				game.player.x += game.player.speed;
							game.player.rendered = false;
                			if (game.player.x > game.width) 
                			{ //iCellSize * (iXCnt-2)
                    			game.player.x = game.width;
                			}
                		}						
					}
				}
				//console.log("Pointing right");
			}
			
			// up
			if ((game.keys[38] || game.keys[87]) /*&& (!game.collideUp)*/)
			{
				if (!game.player.vertical) 
				{
					game.player.horizontal = false;
					game.player.vertical = true;
					game.player.width = game.player.VerticalWidth;
					game.player.height = game.player.VerticalHeight;
				};

				if(!game.player.up)
				{
					game.player.up = true;
					game.player.rendered = false;
					game.player.left = false;
					game.player.right = false;					
					game.player.down = false;
				}				

				if(!game.gameOver)
				{
					if (game.player.y >= 0)
					{
						var iCurCelX = (2 * game.player.x) / 64;
            			var iCurCelY = (2 * game.player.y) / 64;
            			var iTest1 = game.levelData[parseInt(iCurCelY)][parseInt(iCurCelX)];
            			var iTest2 = game.levelData[parseInt(iCurCelY-1)][parseInt(iCurCelX)];

            			if ((iTest1 == 0 ) && (iTest2 == 0)) 
            			{
                			game.player.y -= game.player.speed;
							game.player.rendered = false;                			
            			}
						
					}
					if (game.player.y < 0) 
                	{
                    	game.player.y = 0;
                	}
				}
				//console.log(game.player.x+game.player.y);
				//console.log(Math.floor(game.player.x/game.noOfTiles)+Math.floor(game.player.y/game.noOfTiles));
			}
			
			// down
			if (game.keys[40] || game.keys[83])
			{
				
				if (!game.player.vertical) 
				{
					game.player.horizontal = false;
					game.player.vertical = true;
					game.player.width = game.player.VerticalWidth;
					game.player.height = game.player.VerticalHeight;
				};

				if(!game.player.down)
				{
					game.player.down = true;
					game.player.rendered = false;
					game.player.left = false;
					game.player.right = false;
					game.player.up = false;
					
				}

				/*game.bullet.dirLeft = false;
				game.bullet.dirRight = false;
				game.bullet.dirUp = false;
				game.bullet.dirDown = true;*/

				if(!game.gameOver)
				{
					if (game.player.y < game.height - game.player.VerticalHeight - 2)
					{
						var iCurCelX = (2 * game.player.x) / 64;
            			var iCurCelY = (2 * game.player.y) / 64;
            			var iTest1 = game.levelData[parseInt(iCurCelY)][parseInt(iCurCelX)];
            			var iTest2 = game.levelData[parseInt(iCurCelY+1)][parseInt(iCurCelX)];

            			if ((iTest1 == 0 ) && (iTest2 == 0 )) 
            			{
                			game.player.y += game.player.speed;
							game.player.rendered = false;
                			/*if (oTank.x > 576) 
                			{ //iCellSize * (iXCnt-2)
                    			oTank.x = 576;
                			}*/
            			}
						
					}
					//console.log("["+parseInt(iCurCelY)+","+parseInt(iCurCelX)+"]")
				}
				//console.log("Pointing down");
			}
		}

		function render()
		{
			if (!game.player.rendered)
			{
				if (game.player.horizontal) 
				{
					game.contextPlayer.clearRect(game.player.x - 5, game.player.y - 5, game.player.side + 10, game.player.side + 10);
				}
				else if (game.player.vertical)
				{
					game.contextPlayer.clearRect(game.player.x - 5, game.player.y - 5, game.player.side + 10, game.player.side + 10);
				
				}
				
				/*context.drawImage(img,sx,sy,swidth,sheight,x,y,width,height);
				img	Specifies the image, canvas, or video element to use
				sx	Optional. The x coordinate where to start clipping
				sy	Optional. The y coordinate where to start clipping
				swidth	Optional. The width of the clipped image
				sheight	Optional. The height of the clipped image	Play it »
				x	The x coordinate where to place the image on the canvas	Play it »
				y	The y coordinate where to place the image on the canvas	Play it »
				width	Optional. The width of the image to use (stretch or reduce the image)
				height	Optional. The height of the image to use (stretch or reduce the image)*/
				
				if(game.player.down)
				{
					game.contextPlayer.drawImage(game.images[game.player.imageVertical], 1*game.player.VerticalWidth, 0, game.player.VerticalWidth, game.player.VerticalHeight, game.player.x, game.player.y, game.player.VerticalWidth, game.player.VerticalHeight);
						
				}

				if(game.player.up)
				{
					game.contextPlayer.drawImage(game.images[game.player.imageVertical], 0*game.player.VerticalWidth, 0, game.player.VerticalWidth, game.player.VerticalHeight, game.player.x, game.player.y, game.player.VerticalWidth, game.player.VerticalHeight);	
					//console.log("Pointing down");
				}

				if(game.player.right)
				{
					game.contextPlayer.drawImage(game.images[game.player.imageHorizontal], 0*game.player.HorizontalWidth, 0, game.player.HorizontalWidth, game.player.HorizontalHeight, game.player.x, game.player.y, game.player.HorizontalWidth, game.player.HorizontalHeight);	
					//console.log("Pointing left");
				}

				if(game.player.left)
				{
					game.contextPlayer.drawImage(game.images[game.player.imageHorizontal], 1*game.player.HorizontalWidth, 0, game.player.HorizontalWidth, game.player.HorizontalHeight, game.player.x, game.player.y, game.player.HorizontalWidth, game.player.HorizontalHeight);	
					//console.log("Pointing right");
				}
				//game.contextPlayer.drawImage(game.images[game.player.image], game.player.x, game.player.y, game.player.width, game.player.height);
				game.player.rendered = true;

				
				//console.log(""+Math.floor(game.player.x/game.noOfTiles)+" "+Math.floor(game.player.y/game.noOfTiles));
				//console.log(""+game.player.x+","+game.player.y);
				//console.log("player");
			}
			for(p in game.enemies)
			{
				if (!game.enemies[p].rendered)
				{
					if (game.enemies[p].horizontal) 
					{
						game.contextEnemies.clearRect(game.enemies[p].x - 5, game.enemies[p].y - 5, game.enemies[p].side + 10, game.enemies[p].side + 10);
					}
					else if (game.enemies[p].vertical)
					{
						game.contextEnemies.clearRect(game.enemies[p].x - 5, game.enemies[p].y - 5, game.enemies[p].side + 10, game.enemies[p].side + 10);
					
					}
															
					if(game.enemies[p].down)
					{
						game.contextEnemies.drawImage(game.images[game.enemies[p].imageVertical], 0*game.enemies[p].VerticalWidth, 0, game.enemies[p].VerticalWidth, game.enemies[p].VerticalHeight, game.enemies[p].x, game.enemies[p].y, game.enemies[p].VerticalWidth, game.enemies[p].VerticalHeight);
							
					}

					if(game.enemies[p].up)
					{
						game.contextEnemies.drawImage(game.images[game.enemies[p].imageVertical], 1*game.enemies[p].VerticalWidth, 0, game.enemies[p].VerticalWidth, game.enemies[p].VerticalHeight, game.enemies[p].x, game.enemies[p].y, game.enemies[p].VerticalWidth, game.enemies[p].VerticalHeight);	
						//console.log("Pointing down");
					}

					if(game.enemies[p].right)
					{
						game.contextEnemies.drawImage(game.images[game.enemies[p].imageHorizontal], 1*game.enemies[p].HorizontalWidth, 0, game.enemies[p].HorizontalWidth, game.enemies[p].HorizontalHeight, game.enemies[p].x, game.enemies[p].y, game.enemies[p].HorizontalWidth, game.enemies[p].HorizontalHeight);	
						//console.log("Pointing left");
					}

					if(game.enemies[p].left)
					{
						game.contextEnemies.drawImage(game.images[game.enemies[p].imageHorizontal], 0*game.enemies[p].HorizontalWidth, 0, game.enemies[p].HorizontalWidth, game.enemies[p].HorizontalHeight, game.enemies[p].x, game.enemies[p].y, game.enemies[p].HorizontalWidth, game.enemies[p].HorizontalHeight);	
						//console.log("Pointing right");
					}
					//game.contextenemies[p].drawImage(game.images[game.player.image], game.player.x, game.player.y, game.player.width, game.player.height);
					game.enemies[p].rendered = true;
					//console.log(""+Math.floor(game.player.x/game.noOfTiles)+" "+Math.floor(game.player.y/game.noOfTiles));
					//console.log(""+game.player.x+","+game.player.y);
					//console.log("player");
				}
			
			}

			for(i in game.bullet)
			{
				var proj = game.bullet[i];
				if (proj.dirUp || proj.dirLeft)
					game.contextEnemies.clearRect(proj.x - 3, proj.y - 3, proj.width + 10, proj.height + 10);
				else
					game.contextEnemies.clearRect(proj.x - 7, proj.y - 7, proj.width + 10, proj.height + 10);
				game.contextEnemies.drawImage(game.images[3], proj.x, proj.y, proj.width, proj.height);
				//console.log("bullet rendered");
			}

			if(!game.mapRendered)
			{
				game.contextMap.clearRect(0,0,game.width,game.height);
				var posX = 0;
				var posY = 0;
				for(var i=0;i<game.levelData.length;i++)
    			{
        			for(var j = 0;j<game.levelData[i].length;j++)
        			{
            			if(parseInt(game.levelData[i][j])==0)
            			{               				
               				game.contextMap.drawImage(game.images[0],0,0,32,32,posX,posY,32,32);
            			}
            			if(parseInt(game.levelData[i][j])==1)
            			{               				
               				game.contextMap.drawImage(game.images[0],32,0,32,32,posX,posY,32,32);
            			}
            			posX+=32;
        			}
    				posX=0;
    				posY+=32;
    			}
    			game.mapRendered = true;
    			//console.log("map");
			}		 						
		}

		function loop()
		{
			requestAnimFrame(function()
			{
				loop();
			});
			update();
			render();
		}

		function initImages(paths)
		{
			game.requiredImages = paths.length;
			for (i in paths)
			{
				var img = new Image();
				img.src = paths[i];
				game.images[i] = img;
				game.images[i].onload = function(){
					game.doneImages++;
					console.log(game.doneImages+" images loaded!");
				}
			}
		}

		function collision(projectile, obstacle)
		{
			return !(
				projectile.x > obstacle.x + obstacle.width ||
				projectile.x + projectile.width < obstacle.x ||
				projectile.y > obstacle.y + obstacle.height ||
				projectile.y + projectile.height < obstacle.y
			);
		}

		/*function canDriveHere(x, y)
		{
			return ((game.levelData[y] != null) &&
				(game.levelData[y][x] != null) &&
				(game.levelData[y][x] <= game.maxWalkableTileNum));
		};*/

		function checkImages()
		{
			if(game.doneImages >= game.requiredImages)
			{
				init();
			}
			else
			{
				setTimeout(function(){
					checkImages();
				},1);
			}
		}

		/*game.contextBackground.font = "bold 50px Courier";
		game.contextBackground.fillStyle = "white";
		game.contextBackground.fillText("Loading", game.width / 2 - 130, game.height / 2 - 25);*/
		initImages(["imgs/img5.png","imgs/PlayerVertSprite2.png","imgs/PlayerHoriSprite2.png","imgs/bullet.png","imgs/EnemyHoriSprite.png","imgs/EnemyVertSprite.png"]);
		checkImages();
	});	
})();
	// set to 60 frames per second
window.requestAnimFrame = (function()
{
	return	window.requestAnimationFrame		||
			window.webkitRequestAnimationFrame	||
			window.mozRequestAnimationFrame		||
			window.oRequestAnimationFrame		||
			window.msRequestAnimationFrame		||
			function( callback )
			{
				window.setTimeout(callback, 1000 / 30);
			};
})();
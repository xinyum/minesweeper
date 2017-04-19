function MineSweeperGame(numRow = 8, numCol = 8, numMine = 10) {
	this.timerStarted = false;
	this.gameStartTimeStamp = null;
	this.interval = null;
	this.mineGrid = {};
	this.tileCounterMap = {};
	this.adjacentMap = {};
	this.exposedMap = {};
	this.userMarkMap = {};
	this.numRow = numRow;
	this.numCol = numCol;
	this.numMine = numMine;
	this.leftClicked = -1;
	this.rightClicked = -1;
	this.gameResult = false;
	$("#menu-items").attr("colspan", numCol);
};

MineSweeperGame.prototype.clean = function() {
	this.mineGrid = {};
	this.tileCounterMap = {};
	this.adjacentMap = {};
	this.exposedMap = {};
	this.userMarkMap = {};
	this.gameResult = null;
	$("#myModal").css("display","none");
	$("#message").html("");
	$("#cheat").removeClass("disabled");
	this.stopTimer(true);
	$('#smile').attr('src', 'images/smiling.png');
}

MineSweeperGame.prototype.generateTiles = function(numRow, numCol) {
	var totalCounter = 0;
	var content = "";
	for (var i = 0; i < numRow; i++) {
		var temp = '<tr class="tiles">';
		for (var j = 0; j < numCol; j++) {
			temp = temp + '<td class="tile" id="t-'+totalCounter +'">&nbsp;</td>';
			totalCounter++;
		}
		content = content + temp + "</tr>";
	}
	return content;
};

MineSweeperGame.prototype.getRandomInt = function(total) {
	return Math.floor(Math.random() * total);
}

MineSweeperGame.prototype.addAdjacents = function(indexList) {
	result = [];
	for(var index in indexList) {
		if (indexList[index] != null) {
			result.push(indexList[index]);
		}
	}
	return result;
}

MineSweeperGame.prototype.getAdjacentsIndex = function(currGrid, numRow, numCol) {
	var row = Math.floor(currGrid/numCol);
	var col = currGrid % numCol;
	var left = (col == 0) ? null : currGrid - 1;
	var right = (col == numCol - 1) ? null : currGrid + 1;
	var upper = (row == 0) ? null : (row - 1) * numCol + col;
	var lower = (row == numRow - 1) ? null : (row + 1) * numCol + col;
	var leftUpper = (left != null && upper != null) ? (row - 1) * numCol + col - 1: null;
	var leftLower = (left != null && lower != null) ? (row + 1) * numCol + col - 1: null;
	var rightUpper = (right != null && upper != null) ? (row - 1) * numCol + col + 1: null;
	var rightLower = (right != null && lower != null) ? (row + 1) * numCol + col + 1: null;
	return this.addAdjacents([left,right,upper,lower,leftUpper,leftLower,rightUpper,rightLower])
}

MineSweeperGame.prototype.makeAdjacentsMap = function(currGrid, numRow, numCol) {
	this.adjacentMap[currGrid] = this.getAdjacentsIndex(currGrid, numRow, numCol);
	return this.adjacentMap[currGrid];
}

MineSweeperGame.prototype.generateMines = function(numRow, numCol, numMine) {
	this.clean();
	currBomb = 0;
	while (currBomb < numMine) {
		t = this.getRandomInt(numRow * numCol);
		if (!(t in this.mineGrid)) {
			this.mineGrid[t] = true;
			currBomb++;
		}
	}
	for(var i = 0; i < numRow*numCol; i++) {
		if (i in this.mineGrid) {
			this.tileCounterMap[i] = -1; 
			continue;
		}
		var adjs = this.makeAdjacentsMap(i, numRow, numCol);
		var counter = 0;
		for (var tile in adjs) {
			if (adjs[tile] in this.mineGrid) {
				counter++;
			}
		}
		this.tileCounterMap[i] = counter; 
	}
}

MineSweeperGame.prototype.gameOver = function(mineIndex) {
	this.stopTimer(false);
	this.gameResult = "failure";
	$("#cheat").addClass("disabled");
	for (var i in this.mineGrid) {
		$('#t-'+i).addClass("tile-show");
		$('#t-'+i).html("<img src='images/mine.png'/>")
	}
	$('#t-'+mineIndex).addClass("mine-explode");
	$('#smile').attr('src', 'images/sad.png');
	this.displayMessage("You lose.");
}

MineSweeperGame.prototype.victory = function() {
	this.stopTimer(false);
	this.gameResult = "victory";
	$("#cheat").addClass("disabled");
	for (var i in this.mineGrid) {
		$('#t-'+i).addClass("tile-show");
		$('#t-'+i).html("<img src='images/mine.png'/>");
	}
	this.displayMessage("Congratulations! You win!");
}

MineSweeperGame.prototype.exposeTile = function(index) {
	if (this.exposedMap[index]) return;
	this.exposedMap[index] = true;
	$('#t-'+index).addClass("tile-show");
	tileCount = this.tileCounterMap[index];
	if (tileCount == -1) {
		this.gameOver(index);
		return
	} else if (tileCount == 0) {
		this.expandExposedTile(index);
	} else {
		$('#t-'+index).addClass("tile-num-" + tileCount); 
		$('#t-'+index).html(tileCount);
	}
	if (Object.keys(this.exposedMap).length == this.numRow * this.numCol - this.numMine) {
		this.victory();
	}
}

MineSweeperGame.prototype.expandExposedTile = function(currGrid) {
	var adjs = this.adjacentMap[currGrid];
	for (var i in adjs) {
		if (!this.exposedMap[adjs[i]]) this.exposeTile(adjs[i]);
	}
}

MineSweeperGame.prototype.start = function() {
	this.stopTimer(true);
	$(".tiles").remove();
	$("#mines").html(this.numMine);
	content = this.generateTiles(this.numRow, this.numCol);
	$(content).appendTo('tbody');
	this.generateMines(this.numRow, this.numCol, this.numMine);
	console.log(this.numRow, this.numCol,this.adjacentMap)
	var _this = this;
	$(".tile").on("mousedown mouseup", function(e){
		var id = parseInt($(this)[0].id.slice(2));
		if (e.type == "mousedown") {
			if (e.button == 0) {
				_this.leftClicked = id;
				if (_this.rightClicked ==  id || e.ctrlKey) {
					_this.validate(id);
				} else {
					_this.clickTile(e, id);
				}
			}
			else if(e.button == 2) {
				_this.rightClicked = id;
				if (_this.leftClicked == id || e.ctrlKey) {
					_this.validate(id);
				} else {
					_this.flagTile(e, id);
				}
			}
		} else if (e.type == "mouseup") {
			if (e.button == 1) {
				_this.leftClicked = -1;
			}
			else if(e.button == 2) {
				_this.rightClicked = -1;
			}
		}
	})
}

MineSweeperGame.prototype.updateTimer = function() {
	if (!this.gameStartTimeStamp) {
		$('#timer').html("0");
	} else {
		var time = Math.round((new Date().getTime() - this.gameStartTimeStamp)/1000);
		$('#timer').html(time);
	}
}

MineSweeperGame.prototype.stopTimer = function(restart) {
	this.timerStarted = false;
	if (this.interval) clearInterval(this.interval);
	this.interval = null;
	this.gameStartTimeStamp = null;
	if (restart) this.updateTimer();
}

MineSweeperGame.prototype.startTimer = function() {
	this.gameStartTimeStamp = new Date().getTime();
	this.timerStarted = true;
	this.updateTimer();
	this.interval = setInterval(this.updateTimer.bind(this), 1000);
}

MineSweeperGame.prototype.clickTile = function(event, index) {
	if (this.gameResult) return;
	if (!this.timerStarted) this.startTimer();
	this.exposeTile(index);
}

MineSweeperGame.prototype.flagTile = function(event, index) {
	if (this.gameResult) return
	if (!this.timerStarted) this.startTimer();
	if (!this.exposedMap[index]) {
		if (!this.userMarkMap.hasOwnProperty(index)) {
			this.userMarkMap[index] = 1;
		} else {
			this.userMarkMap[index] = (this.userMarkMap[index] + 1) % 3;
		}
		var imageMap = {1: "flag.png", 2:"question.png"};
		if (this.userMarkMap[index]) {
			$('#t-'+index).html("<img src='images/"+imageMap[this.userMarkMap[index]]+"'/>");
		} else {
			$('#t-'+index).html("&nbsp;");
		}
	}
}

MineSweeperGame.prototype.validate = function(index) {
	if (!this.exposedMap[index]) return;
	var adjs = this.adjacentMap[index];
	var mineMarker = 0;
	var exposedNeighbor = 0;
	for (var i in adjs) {
		if (this.userMarkMap[adjs[i]] == 1) {
			mineMarker++;
		}
		if (this.exposedMap[adjs[i]]) {
			exposedNeighbor++;
		}
	}
	if (exposedNeighbor == adjs.length) {
		// if all neighbour have been exposed already, nothing happens
		return
	}
	if (mineMarker == this.tileCounterMap[index]) {
		// expose all unflagged neighbour tile if user flagged all the mines 
		for (var i in adjs) {
			if (!this.exposedMap[adjs[i]] && this.userMarkMap[adjs[i]] != 1) {
				this.exposeTile(adjs[i]);
			}
		}
	}
}

// show the mine location for half seconds
MineSweeperGame.prototype.cheat = function() {
	if (this.gameResult) return;
	for (var i in this.mineGrid) {
		$('#t-'+i).addClass("tile-show");
		$('#t-'+i).html("<img src='images/mine.png'/>");
	}
	var hide = function() {
		for (var i in this.mineGrid) {
			$('#t-'+i).removeClass("tile-show");
			var imageMap = {1: "flag.png", 2:"question.png"};
			if (this.userMarkMap[i]) {
				$('#t-'+i).html("<img src='images/"+imageMap[this.userMarkMap[i]]+"'/>");
			} else {
				$('#t-'+i).html("&nbsp;");
			}
		}
	}.bind(this);
	setTimeout(hide, 500);
}

MineSweeperGame.prototype.displayMessage = function(message) {
	if (!this.gameResult) return;
	$("#message").html(message); 
	$("#myModal").css("display","block"); // show modal

	var hide = function() {
		$("#myModal").css("display","none"); // hide modal
		$("#message").html(""); // clear message
	}.bind(this);
	setTimeout(hide, 2000);
}
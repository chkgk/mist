var currentNumbers = [0, 1, 2, 3, 4];
			
var bgChange = false;

var TimerIDs;
var currentCalc;
var hitlist = [];
var lastStartTime;
var lastTripple = 0;
var currentAvg = 0;
var cR = 255, cG = 255, cB = 0;
var inputAllowed = false;

function rotate(direction) {
	if (direction == 'right') {
		for (var i in currentNumbers) {
			currentNumbers[i]++;
			if (currentNumbers[i] > 9) currentNumbers[i] -= 10;
		}
	} else { // direction == left
		for (var i in currentNumbers) {
			currentNumbers[i]--;
			if (currentNumbers[i] < 0) currentNumbers[i] += 10;
		}
	}
	visualize();
}

function visualize() {
	$('#minus2').html(currentNumbers[0]);
	$('#minus1').html(currentNumbers[1]);
	$('#cur').html(currentNumbers[2]);
	$('#plus1').html(currentNumbers[3]);
	$('#plus2').html(currentNumbers[4]);
}

		
function getCorrect() {
	var sum = 0;
	for (var i in hitlist) {
		sum += hitlist[i][4];
	}
	return sum;
}

function getAverageResponseTime() {
	var sum = 0;
	for (var i in hitlist) {
		sum += hitlist[i][5];
	}
	return sum/hitlist.length;
}


function adjust_task_delay() {
	var last_response_time = hitlist[hitlist.length-1][5];
	var dif = iti_reference - last_response_time;

	next_task_delay + dif
}


function resetCalc() {
	for (var i in TimerIDs) {
		if (TimerIDs[i] != -1) {
			clearTimeout(TimerIDs[i]);
			TimerIDs[i] = -1;
		}
	}
	
	$('#bar1val').css('transition', '');
	$('#bar1val').width('100%');
	
	if (hitlist.length > 0) { 
		// $('#resultBox').html('tasks: '+hitlist.length+' correct: '+Math.round(getCorrect()/hitlist.length*100)+'%'); 
		$(correctInput).val(getCorrect());
		$(avgResponseTimeInput).val(getAverageResponseTime());
		$(workedOnInput).val(hitlist.length);
	}
	
	setTimeout(function () {
		currentCalc = genCalculation(currentDifficulty);

		inputAllowed = true;
		
		$('#calculation').html(currentCalc+' = ');
		$('#dial').show();

		lastStartTime = performance.now();
		runTask();
	}, next_task_delay);
}


function runTask() {
	if (enforce_time) {
		TimerIDs = timer('#bar1val', currentTimeout, function() {
			$('#bar1val').css('transition', '');
			$('#bar1val').width('100%');
			$('#calculation').html('TIMEOUT!');
			$('#dial').hide();
			jQuery(document).trigger('timeout');
		});
	} else {
		$('#bar1val').hide();
	}
}


function solve(solution) {
	inputAllowed = false;
	var ResponseTime = performance.now()-lastStartTime;
//		console.log(currentTimeout + ' -> ' + ResponseTime + ' approx. ' + (ResponseTime/1000) + ' seconds');
	var result = eval(currentCalc);
	if (result == solution) {
		$('#bar1val').css('background-color', 'lightgreen');
		$('#calculation').html('correct');
		$('#dial').hide();
		hitlist.push([currentDifficulty, currentTimeout, currentCalc, result, 1, ResponseTime]);
	} else {
		$('#bar1val').css('background-color', 'orangered');
		$('#calculation').html('wrong');
		$('#dial').hide();
		hitlist.push([currentDifficulty, currentTimeout, currentCalc, result, 0, ResponseTime]);
	}
	$('#bar1val').show();
	handleTime();
	adjust_task_delay();
	resetCalc();
}

function handleTime() {
	var round = hitlist.length;
	if (round >= 3) {
		var hitsum = hitlist[round-1][4]+hitlist[round-2][4]+hitlist[round-3][4];
		if (hitsum == 3 & round > lastTripple+3) {
			lastTripple = round;
			var avgResponseTime = (hitlist[round-1][5]+hitlist[round-2][5]+hitlist[round-3][5])/3;
			currentTimeout = Math.floor(avgResponseTime*adjustment_factor_down);
//			console.log('3 correct, new timeout: '+currentTimeout);
		} else if (hitsum == 0 ) {
			currentTimeout = Math.floor(currentTimeout*adjustment_factor_up);
//			console.log('3 wrong, new timeout: '+currentTimeout);
		}
	}
}


function timer(bar, timeout, callback) {
	var progIndicator = $(bar);
	progIndicator.css('background-color', 'lighthblue');
	progIndicator.css('transition', 'width '+timeout+'ms linear');
	progIndicator.width('0%');
	var t1= setTimeout(function() {
		progIndicator.css('transition', '');
		progIndicator.width('100%');
		t1 = -1;
		callback();
	}, timeout);
	var t2= setTimeout(function() {
		progIndicator.css('background-color', 'orange');
		t2 = -1;
	}, timeout/2);
	var t3= setTimeout(function() {
		progIndicator.css('background-color', 'orangered');
		t3 = -1;
	}, timeout*85/100);
	return [t1, t2, t3];
}

function genCalculation(difficulty) {
	function isInt(x) {
		return x % 1 === 0;
	}

	function getInt(digits) {
		var minvalue = 1;
		var maxvalue = Math.pow(10,digits)-1;
		return Math.floor((Math.random()*maxvalue)+minvalue);
	}
	
	function getOperator(difficulty) {
		switch(difficulty) {
			case 1:
			case 2:
				var maxval = 1;
				break;
			case 4:
			case 5:
				var maxval = 3;
				break;
			default: // if no difficulty is given or it is not equal to 1, 2 use medium difficulty "3".
				var maxval = 2;
		}
		var operators = ['+', '-', '*', '/'];
		return operators[Math.floor((Math.random()*maxval+1))];
	}
	
	var result, statement;			
	
	do {
		switch (difficulty) {
			case 1:
				statement = getInt(1)+' '+getOperator(1)+' '+getInt(1);
				break;
			case 2:
				statement = getInt(1)+' '+getOperator(1)+' '+getInt(1)+' '+getOperator(1)+' '+getInt(1);
				break;
			case 4:
				statement = getInt(1)+' '+getOperator(4)+' '+getInt(2)+' '+getOperator(4)+' '+getInt(1)+' '+getOperator(4)+' '+getInt(2);
				break;
			case 5:
				statement = getInt(2)+' '+getOperator(5)+' '+getInt(2)+' '+getOperator(5)+' '+getInt(2)+' '+getOperator(5)+' '+getInt(2);
				break;
			default:
				statement = getInt(2)+' '+getOperator(3)+' '+getInt(1)+' '+getOperator(3)+' '+getInt(1);
		}
		result = eval(statement);
	} while (result < 0 | result >= 10 | !isInt(result));
	return statement;
}

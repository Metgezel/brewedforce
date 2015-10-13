/**
 * Brapp Javascript logic
 * Using: AngularJS, Jquery, Javascript
 */

/**
 * General Controller for Brapp, containing current Scope variables and methods (Event handlers)
 * @param  $scope The AngularJS state
 */

// request permission on page load
document.addEventListener('DOMContentLoaded', function () {
  if (Notification.permission !== "granted")
    Notification.requestPermission();
});

function brappAppCtrl($scope) {

  console.log("Loaded Brewed Force v2")
  // for adding brew log items
  $scope.logItemStep = -1;
  
  $('#runner').runner();
  $scope.stopwatchStepId = -1;

  $scope.recipe = getRecipe();

  $scope.recipe.calculate();
  logValues($scope.recipe);

  var timeline = $scope.recipe.timeline();

  $scope.timelineParsed = [];
  $scope.remainingSteps = timeline.length;
  for (var x = 0; x < timeline.length; x++) {

    var duration = timeline[x][0];
    var description = timeline[x][1];

    $scope.timelineParsed[x] = {
      id: x,
      duration: Brauhaus.displayDuration(duration, 2),
      description: description,
      done: false,
      cssClasses: ""
    }
    if(localStorage.getItem("stepCompleted["+x+"]") == 1) {
      $scope.timelineParsed[x].cssClasses = "task-hidden";
      $scope.timelineParsed[x].done = true;
      $scope.remainingSteps--;
      // $('.timestep[data-timestep-id=' + x + ']').hide();
    }
  }
  
  $scope.resetSteps = function() {
    for (var x = 0; x < timeline.length; x++) {
      localStorage.setItem('stepCompleted['+x+']',0);
      $scope.timelineParsed[x].cssClasses = "";
      $('.timestep[data-timestep-id=' + x + ']').show().removeClass('task-hidden');
    }
    $scope.remainingSteps = timelin.elength;
  }


  $scope.stepCompleted = function($stepId) {
    console.log("Completed step "+$stepId)
    $scope.timelineParsed[$stepId].done = true;

    var suffixText = "";
      if($stepId == $scope.stopwatchStepId) {
        $('#runner').runner('stop')
        suffixText = " with duration " + $('#runner').runner('lap');
        $('#runner').runner('reset')
        $scope.stopwatchStepId = -1;

      }



    // TODO: this should not be jQuery but Angular, but I was lazy
    $('.timestep[data-timestep-id=' + $stepId + ']').hide().addClass('task-hidden');
    $scope.logItemStep = $stepId;
    $scope.addLogItem("Completed step "+$stepId+suffixText);
    $scope.logItemStep = -1;

    localStorage.setItem("stepCompleted["+$stepId+"]", 1);
    $scope.remainingSteps--;
  };

  $scope.brewLog = [];

  if (localStorage.getItem("brewlog") != null) {
    logitems = JSON.parse(localStorage.getItem("brewlog"));

    for (var x = 0; x < logitems.length; x++) {
      $scope.brewLog[$scope.brewLog.length] = {
        'text': logitems[x]['text'],
        'timestamp': logitems[x]['timestamp'],
        'timestepId': logitems[x]['timestepId']
      }
    }
  }

  $scope.focusBrewlogItem = function(stepId) {
    console.log("Focusing "+stepId);

    $scope.logItemStep = stepId;

    $("#addBrewLogItemInput").focus();
    window.scrollTo(0,0);
  }
  // add new brewlog item
  $scope.addLogItem = function(text) {
    console.log("Trying to add log item "+ text);
    if (text != "" && text != undefined) {
      console.log("Adding log item "+ text);

      var timestepId = $scope.logItemStep;

      var today = new Date();
      $scope.brewLog[$scope.brewLog.length] = {
        'text': text,
        'timestamp': today.getTime(),
        'timestepId': timestepId 
      }

      localStorage.setItem("brewlog", JSON.stringify($scope.brewLog));
      $scope.logItemStep = -1;
      
      notifyMe("Log item '"+ text+"' added")
      // reset value of input field
      $("#addBrewLogItemInput").val("");
    }

  }

  $scope.removeLogItems = function() {
    console.log("Removing all log items..")
    $scope.brewLog = [];
    localStorage.setItem("brewlog", JSON.stringify($scope.brewLog));
    $scope.logItemStep = -1;
    notifyMe("Brewlog has been reset")
  }


  $scope.startTimestepTimer = function(stepId) {
    console.log("Started timer for step "+stepId);
    
    $scope.stopwatchStepId = stepId;

    $(".timestep[data-timestep-id="+stepId+"] .timestep-description").append("<div id=\"runner\"></div>");
    $('#runner').runner('reset');
    $('#runner').runner('start');

    $("#startTimestepTimer"+stepId).hide().addClass('timer-hidden');
    $("#stopTimestepTimer"+stepId).show().removeClass('timer-hidden');
    
    $scope.logItemStep = stepId;
    $scope.addLogItem("Started timer for step "+stepId);
    $scope.logItemStep = -1;
  }

  $scope.stopTimestepTimer = function(stepId) {
    $scope.stopwatchStepId = -1;
    $('#runner').runner('stop');
    $("#startTimestepTimer"+stepId).show().removeClass('timer-hidden');
    $("#stopTimestepTimer"+stepId).hide().addClass('timer-hidden');
    $('#runner').runner('reset');
  }


  // get a new recipe based on the $scope.recipe contents
  $scope.recompute = function() {

    console.log("Brapp: recomputing recipe..");

    $scope.recipe.calculate();

    var timeline = $scope.recipe.timeline();
    $scope.timelineParsed = [];

    for (var x = 0; x < timeline.length; x++) {
      var duration = timeline[x][0];
      var description = timeline[x][1];
      // log(Brauhaus.displayDuration(duration, 2) + ': ' + description);
      $scope.timelineParsed[x] = {
        id: x,
        duration: Brauhaus.displayDuration(duration, 2),
        description: description,
        done: false

      }
    }
  }

$scope.checkAddBrewLogEnter = function(keyEvent) {
  // console.log(keyEvent);
  
  if (keyEvent.which === 13 && $("#addBrewLogItemInput").val() != "")
    $scope.addLogItem($scope.newLogItem);
    // alert('I am an alert');

}


  // ----- EXPORT FUNCTIONS ------------

  // export to beer .xml file
  $scope.export = function() {
    uriContent = "data:application/octet-stream," + encodeURIComponent($scope.recipe.toBeerXml());
    downloadFile("beer.xml", uriContent);

    notifyMe("Beer recipe has been exported")
  }

  // export log to JSON format
  $scope.exportLog = function() {
    uriContent = "data:application/octet-stream," + encodeURIComponent(JSON.stringify($scope.brewLog));
    downloadFile("brewlog.json", uriContent);
    notifyMe("BrewLog has been exported")
  }
}

// Rutger: downloading of files
function downloadFile(name, data) {
  var link = document.createElement('a');
  link.download = name;
  link.href = data;

  var ev = document.createEvent("MouseEvent");
  ev.initMouseEvent("click",
    true /* bubble */ ,
    true /* cancelable */ ,
    window, null,
    0, 0, 0, 0, /* coordinates */
    false, false, false, false, /* modif  ier keys */
    0 /*left*/ , null
  );
  link.dispatchEvent(ev);

  //TODO: See if function can be made better
  //The single line below can be used in browsers, but gets no filename
  //   newWindow=window.open(uriContent, 'beer.xml');
  //This line below can replace the whole event stuff, but does not work in firefox
  //   link.click();
}


// TODO: encapsulate code below:

// Log a message to the log section
function logMessage(message) {
  $('#log').append(message + '<br/>');
}

// Put computed recipe values in the log section
function logValues(recipe) {

  logMessage('Original Gravity: ' + recipe.og.toFixed(3));
  logMessage('Final Gravity: ' + recipe.fg.toFixed(3));
  logMessage('Color: ' + Brauhaus.srmToEbc(recipe.color).toFixed(1) + ' EBC (' + recipe.colorName() + ') ' + Brauhaus.srmToRgb(recipe.color));
  logMessage('IBU: ' + recipe.ibu.toFixed(1));
  logMessage('Alcohol: ' + recipe.abv.toFixed(1) + '% by volume');
  logMessage('Calories: ' + Math.round(recipe.calories) + ' kcal');
  logMessage('Priming sugar: ' + recipe.primingSugar.toFixed(3) * 1000 + ' gr');

}



/**
 * Generate a brauhaus recipe; currently hardcoded but should use AngularJS Scope variables, so they can be computed in a new recipe.
 * @return Brauhaus.Recipe the resulting recipe
 */
function getRecipe() {
// TODO: Decide if we want the recipe from localstorage?
//  if (localStorage.getItem("recipe") != null) {
//    r = localStorage.getItem("recipe");
//    re = Brauhaus.Recipe.fromBeerXml(r);
//
//    return re[0];

//  } else {


var r = new Brauhaus.Recipe({
    name: 'Metal Beer Solid',
    description: 'koffiestout; zwart als metal, het is bier en het is zo zwaar dat het bijna solid is',
    batchSize: 20,
    boilSize: 25,
});

r.add('fermentable', {
    name: 'Malt',//Pilsmout
    color: Brauhaus.ebcToSrm(3),
    weight: 5.5,
  yield: 70,
});

r.add('fermentable', {
  name: 'Malt CK',//Cara Kristal
  color: Brauhaus.ebcToSrm(120),
  weight: 0.5,
  yield: 70,
});

r.add('fermentable', {
  name: 'Malt C',//Chocolade
  color: Brauhaus.ebcToSrm(900),
  weight: 0.4,
  yield: 70,
});

r.add('fermentable', {
  name: 'Malt B',//Black
  color: Brauhaus.ebcToSrm(1400),
  weight: 0.125,
  yield: 70,
});

r.add('fermentable', {
  name: 'Malt CST3',// carafa special type-3
  color: Brauhaus.ebcToSrm(1400), //300?
  weight: 0.125,
  yield: 70,
});

r.add('fermentable', {
  name: 'Malt CA', //Cara aroma
  color: Brauhaus.ebcToSrm(400), //300?
  weight: 0.2,
  yield: 70,
});

r.add('fermentable', {
  name: 'Kandijsiroop',
  color: Brauhaus.ebcToSrm(1900),
  weight: 0.5,
  yield: 90,
});

r.add('hop', {
    name: 'Simcoe',
    weight: 0.020,
    aa: 12.3,
    time: 80,
    form: 'whole',
});

r.add('hop', { //Aromahop
    name: 'Simcoe',
    weight: 0.020,
    aa: 12.3,
    time: 15,
    form: 'whole',
});

r.add('hop', { //Aromahop
    name: 'Citra',
    weight: 0.010,
    aa: 14.1,
    time: 15,
    form: 'whole',
});

r.add('yeast', {
    name: 'Safale US-05',
    form: 'dry',
    type: 'ale',
});

r.mash = new Brauhaus.Mash({
    name: 'Metgezel Stout Maischschema',
});

r.mash.addStep({
    name: 'Beta-amylaserust',
    temp: 63,
    time: 60,
});

/* Geeft extra stevigheid door onvergistbare suikers */
r.mash.addStep({
    name: 'Alfa-amylaserust',
    temp: 72,
    time: 10,
});

r.mash.addStep({
    name: 'Spoelen',
    temp: 78,
    time: 5,
});


    localStorage.setItem("recipe", r.toBeerXml(r));

    return r;
//  }
}

function notifyMe(text) {

  // Notification.clear();

  if (!Notification) {
    alert('Desktop notifications not available in your browser. Try Chromium.'); 
    return;
  }

  if(text == undefined)
    text = "Test notification";

  if (Notification.permission !== "granted")
    Notification.requestPermission();
  else {
    var notification = new Notification(
      'Brewed Force', 
      {
        body: text,
        eventTime: 100,
      }
    );

    var appUrl = "https://codex.management/brewedforce/v2";
    
    notification.onclick = function () {
      window.open(appUrl);      
    };
    
  }
}
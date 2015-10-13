/**
 * Brapp Javascript logic
 * Using: AngularJS, Jquery, Javascript
 */

/**
 * General Controller for Brapp, containing current Scope variables and methods (Event handlers)
 * @param  $scope The AngularJS state
 */
function brappAppCtrl($scope) {


  $scope.recipe = getRecipe();

  $scope.recipe.calculate();
  logValues($scope.recipe);

  var timeline = $scope.recipe.timeline();

  $scope.timelineParsed = [];

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
      // $('.timestep[data-timestep-id=' + x + ']').hide();
    }
  }
  
  $scope.resetSteps = function() {
    for (var x = 0; x < timeline.length; x++) {
      localStorage.setItem('stepCompleted['+x+']',0);
      $scope.timelineParsed[x].cssClasses = "";
      $('.timestep[data-timestep-id=' + x + ']').show().removeClass('task-hidden');
    }
  }


  $scope.stepCompleted = function($stepId) {
    $scope.timelineParsed[$stepId].done = true;

    // TODO: this should not be jQuery but Angular, but I was lazy
    $('.timestep[data-timestep-id=' + $stepId + ']').fadeOut(400).addClass('task-hidden');
    $scope.addLogItem("Completed step "+$stepId,$stepId);

    localStorage.setItem("stepCompleted["+$stepId+"]", 1);

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

  // add new brewlog item
  $scope.addLogItem = function(text, timestepId) {
    if (text != "") {

      var today = new Date();
      $scope.brewLog[$scope.brewLog.length] = {
        'text': text,
        'timestamp': today.getTime(),
        'timestepId': timestepId
      }

      localStorage.setItem("brewlog", JSON.stringify($scope.brewLog));
    }
  }

  $scope.removeLogItems = function() {
    $scope.brewLog = [];
    localStorage.setItem("brewlog", JSON.stringify($scope.brewLog));
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

  // export to .brew file
  $scope.export = function() {
    uriContent = "data:application/octet-stream," + encodeURIComponent($scope.recipe.toBeerXml());
    downloadFile("beer.xml", uriContent);
  }

  $scope.exportLog = function() {
    uriContent = "data:application/octet-stream," + encodeURIComponent(JSON.stringify($scope.brewLog));
    downloadFile("brewlog.json", uriContent);
  }

}

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
    name: 'Another IPA Metgezel',
    description: 'AIPA',
    author: 'Metgezel',
    batchSize: 20,
    boilSize: 25,
});

r.add('fermentable', {
    name: 'Malt',//Pils mout
    color: Brauhaus.ebcToSrm(3),
    weight: 2.05,
    yield: 70,
});

r.add('fermentable', {
    name: 'Malt P',//Pale ale
    color: Brauhaus.ebcToSrm(7),
    weight: 1.6,
    yield: 70,
});

r.add('fermentable', {
    name: 'Malt M',//Munich
    color: Brauhaus.ebcToSrm(15),
    weight: 0.65,
    yield: 70,
});

r.add('fermentable', {
    name: 'Malt C',//Cara
    color: Brauhaus.ebcToSrm(120),
    weight: 0.65,
    yield: 70,
});

r.add('fermentable', {
    name: 'Candy Sugar',//Honing
    //color: Brauhaus.ebcToSrm(4),
    weight: 0.36,
    yield: 100,
});

r.add('hop', {
    name: 'Cascade',
    weight: 0.020,
    aa: 6.9,
    time: 80,
    form: 'pellet',
});

r.add('hop', {
    name: 'Amarillo',
    weight: 0.010,
    aa: 10.4,
    time: 60,
    form: 'whole',
});

r.add('hop', {
    name: 'Citra',
    weight: 0.020,
    aa: 14.1,
    time: 15,
    form: 'whole',
});

r.add('hop', {
    name: 'Amarillo',
    weight: 0.020,
    aa: 10.4,
    time: 15,
    form: 'whole',
});

r.add('hop', {
    name: 'Citra',
    weight: 0.020,
    aa: 14.1,
    form: 'whole',
    use: 'primary',
});

r.add('hop', {
    name: 'Amarillo',
    weight: 0.020,
    aa: 10.4,
    form: 'whole',
    use: 'primary',
});

r.add('yeast', {
    name: 'Safale US-05',
    form: 'dry',
    type: 'ale',
});

r.mash = new Brauhaus.Mash({
    name: 'Another IPA Maischschema',
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

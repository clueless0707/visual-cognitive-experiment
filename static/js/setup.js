// (Partially) Generated by CoffeeScript 2.0.2

var CONDITION, COUNTERBALANCE, DEBUG, LOCAL, PROLIFIC, LOG_DEBUG, handleError, psiturk, saveData, startExperiment, submitHit;
var jsPsych;

var searchParams = new URLSearchParams(location.search)

LOCAL = false;
DEBUG = searchParams.get('debug') == 'true';
if (mode === "demo" || mode == "{{ mode }}") {
  LOCAL = true;
  let condition = searchParams.get('condition') ?? "0";
  let counterbalance = searchParams.get('counterbalance') ?? "0";
}

CONDITION = parseInt(condition);
COUNTERBALANCE = parseInt(counterbalance);

if (DEBUG) {
  console.log("DEBUG MODE");
  LOG_DEBUG = function(...args) {
    return console.log(...args);
  };
} else {
  console.log("NORMAL MODE");
  LOG_DEBUG = function(...args) {
    return null;
  };
}

// ---------- Initialize PsiTurk ---------- #
psiturk = new PsiTurk(uniqueId, adServerLoc, mode);
psiturk.recordUnstructuredData('startTime', String(new Date()))

saveData = function() {
  console.log('saveData');
  return new Promise(function(resolve, reject) {
    var timeout;
    if (LOCAL || mode == 'demo') {
      resolve('local');
      return
    }
    timeout = delay(10000, function() {
      console.log('TIMEOUT');
      return reject('timeout');
    });
    return psiturk.saveData({
      error: function() {
        clearTimeout(timeout);
        console.log('Error saving data!');
        return reject('error');
      },
      success: function() {
        clearTimeout(timeout);
        console.log('Data saved to psiturk server.');
        return resolve();
      }
    });
  });
};

// ---------- Test connection to server, then initialize the experiment. ---------- #
// initializeExperiment is defined in experiment.js
$(window).on('load', function() {
  return saveData()
  .then(function() {
    return delay(LOCAL ? 1280 : 2800, function() {
      $('#welcome').hide();
      if (LOCAL) {
        return initializeExperiment();
      } else {
        return initializeExperiment().catch(handleError);
      }
    });
  })
  .catch(function() {
    return $('#data-error').show();
  });
});

// Initialize Experiment
const PROLIFIC_CODE = '6A5FDC7A'  // set this to the prolific completion code to run in prolific mode

async function initializeExperiment() {
  LOG_DEBUG('initializeExperiment');

  ///////////
  // Setup //
  ///////////

  var defaults;
  LOG_DEBUG('run');
  defaults = {
    show_progress_bar: false,
    display_element: 'jspsych-target',
    on_finish: function() {
      console.log('on_finish')
      if (DEBUG) {
        return jsPsych.data.displayData();
      } else {
        return submitHit();
      }
    },
    on_data_update: function(data) {
      console.log('data', data);
      return psiturk.recordTrialData(data);
    }
  };

  // var jsPsych = initJsPsych(_.extend(defaults, {exclusions: {
  //   min_width: 800,
  //   min_height: 600
  // }}));

  var jsPsych = initJsPsych(defaults);

  // trials = await $.getJSON 'static/json/rewards/increasing.json'
  const N_TRIAL = 4;

  // This ensures that images appear exactly when we tell them to.
  jsPsych.pluginAPI.preloadImages(['static/images/blue.png', 'static/images/orange.png']);

  // To avoid repeating ourselves,  we create a variable for a piece
  // of html that we use multiple times.
  var anykey = "<div class='lower message'>Press any key to continue.</div>";


  //////////////////
  // Instructions //
  //////////////////

  var welcome_block = {
    type: jsPsychHtmlKeyboardResponse,
    // We use the handy markdown function (defined in utils.js) to format our text.
    stimulus: markdown(`
    # My Sweet Experiment

    This is a reworked version of the go/no-go task constructed in a
    [tutorial](http://docs.jspsych.org/tutorials/rt-task/) 
    on the jsPsych website. Note that the code here is a little different
    than the original.

    Specifically, the code here is better. 😉

    ${anykey}
    `)
    // text: markdown(
    //   `# Welcome

    //   This is a reworked version of the go/no-go task constructed in a
    //   [tutorial](http://docs.jspsych.org/tutorials/rt-task/) 
    //   on the jsPsych website. Note that the code here is a little different
    //   than the original.

    //   Specifically, the code here is better 😉.

    //   ${anykey}
    // `)

  };

  var instructions_block = {
    type: jsPsychHtmlKeyboardResponse,
    // Sometimes we do need the additional control of html.
    // We can mix markdown with html, but you can't use markdown
    // inside an html element, which is why we use <b>html bold tags</b> 
    // instead of the prettier **markdown format**.
    stimulus: markdown(`
      # Instructions

      In this experiment, a circle will appear in the center 
      of the screen. If the circle is **blue**, 
      press the letter F on the keyboard as fast as you can.
      If the circle is **orange**, do not press 
      any key.
      
      <div class='center'>
        <div class='left center'>
          <img src='static/images/blue.png'></img>
          <p><b>Press the F key</b></p>
        </div>
        <div class='right center'>
          <img src='static/images/orange.png'></img>
          <p><b>Do not press a key</b></p>
        </div>
      </div>

      ${anykey}
    `),
    timing_post_trial: 2000
  };

  /////////////////
  // Test trials //
  /////////////////

  var stimuli = [
    {
      stimulus: '<img src="static/images/blue.png"></img>',
      data: { response: 'go' }
    },
    {
      stimulus: '<img src="static/images/orange.png"></img>',
      data: { response: 'no-go' }
    }
  ];

  var trials = jsPsych.randomization.repeat(stimuli, Math.floor(N_TRIAL / 2));

  var fixation = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: '<div style="margin-top: 90px; font-size:60px;">+</div>',
    choices: "NO_KEYS",
    trial_duration() {
      return Math.floor(Math.random() * 1500) + 750
    },
  }

  var test_block = {
    type: jsPsychHtmlKeyboardResponse,
    choices: ['F'],
    trial_duration: 1500,
    timeline: _.flatten(trials.map(trial => [fixation, trial]))
  };


  var debrief_block = {
    type: jsPsychHtmlKeyboardResponse,
    // We don't want to
    stimulus() {
      return markdown(`
        # Experiment complete

        You did so good. Wow. Great job!
        Press any key to complete the experiment. Thanks!
      `)
    }
  };


  /////////////////////////
  // Experiment timeline //
  /////////////////////////

  // `timeline` determines the high-level structure of the
  // experiment. When developing the experiment, you
  // can comment out blocks you aren't working on
  // so you don't have to click through them to test
  // the section you're working on.

  var timeline = [
    welcome_block,
    instructions_block,
    test_block,
    debrief_block,
  ];

  if (searchParams.get('skip') != null) {
    timeline.splice(0, parseInt(searchParams.get('skip')))
  }

  return jsPsych.run(timeline);

};




completeHIT = async function() {
  await $.ajax("complete_exp", {
    type: "POST",
    data: {uniqueId}
  });
  $('#jspsych-target').empty()
  console.log('completeHIT')
  if (PROLIFIC_CODE != null) {
    $("#load-icon").remove()
    $(window).off("beforeunload");
    $('body').html(`
      <div class='jspsych-content'>
          <h1>Thanks!</h1>

          <p>
          Your completion code is <b>${PROLIFIC_CODE}</b>
          Click this link to submit<br>
          <a href=https://app.prolific.co/submissions/complete?cc=${PROLIFIC_CODE}>
              https://app.prolific.co/submissions/complete?cc=${PROLIFIC_CODE}
          </a>
          <p>
      </div>
    `)
  } else {
    // psiturk.completeHIT()
  }
}

submitHit = function() {
  var promptResubmit, triesLeft;
  console.log('submitHit');
  $('#jspsych-target').html(`
    <h1>Saving data</h1>

    <p>Please do <b>NOT</b> refresh or leave the page!

    <div id="load-icon"/>

    <div id="submit-error" class="alert alert-danger">
      <strong>Error!</strong>
      We couldn't contact the database. We will try <b><span id="ntry"/></b> more times
      before continuing without saving the data.
    </div>
  `);
  $("#submit-error").hide()
  triesLeft = 3;
  promptResubmit = function() {
    console.log('promptResubmit');
    if (triesLeft) {
      console.log('try again', triesLeft);
      $("#submit-error").show()
      $("#ntry").html(triesLeft)
      triesLeft -= 1;
      return saveData().catch(promptResubmit);
    } else {
      console.log('GIVE UP');
      $('#jspsych-target').html(`
        <h1>Saving data</h1>

        <div class="alert alert-danger">
          <strong>Error!</strong>
          We couldn't save your data! Please send us a message on Prolific,
          then click the button below.
        </div>
        <br><br>
        <button class='btn btn-primary btn-lg' id="resubmit">I reported the error</button>
      `);
      return new Promise(function(resolve) {
        return $('#resubmit').click(function() {
          $('#jspsych-target').empty()
          return resolve('gave up');
        });
      });
    }
  };
  return saveData(true).catch(promptResubmit).then(completeHIT)
};

handleError = function(e) {
  var link, message, msg;
  console.log('Erorr in experiment', e);
  if (e.stack) {
    msg = e.stack;
  } else if (e.name != null) {
    msg = e.name;
    if (e.message) {
      msg += ': ' + e.message;
    }
  } else {
    msg = e;
  }
  psiturk.recordUnstructuredData('error', msg);
  message = `<pre>
    Prolific Id: ${(typeof workerId !== "undefined" && workerId !== null ? workerId : 'N/A')}
    ${msg}
  </pre>`;
  
  link = `<a href="mailto:fredcallaway@princeton.edu?subject=ERROR in experiment&
    body=${encodeURIComponent(message)}">Click here</a>`;
  $('#jspsych-target').html(markdown(`
    # The experiment encountered an error!

    <b>${link}</b> to report the error by email. Please describe at what point in the
    study the error occurred, and include the following information
    (it should be included automatically if you click the link).

    ${message}

    After reporting the error, click the button below to submit your data
    and see the completion code.

    <button id="submit">I reported the error</button>`));

  return $('#submit').click(submitHit);
};

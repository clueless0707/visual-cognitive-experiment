var jsPsychSketchpadWithAudioRecording = (function (jspsych) {
  "use strict";

  const info = {
    name: "SketchpadWithAudioRecording",
    parameters: {
      /**
       * The shape of the canvas element. Accepts `'rectangle'` or `'circle'`
       */
      canvas_shape: {
        type: jspsych.ParameterType.STRING,
        default: "rectangle",
      },
      /**
       * Width of the canvas in pixels.
       */
      canvas_width: {
        type: jspsych.ParameterType.INT,
        default: 500,
      },
      /**
       * Width of the canvas in pixels.
       */
      canvas_height: {
        type: jspsych.ParameterType.INT,
        default: 500,
      },
      /**
       * Diameter of the canvas (when `canvas_shape` is `'circle'`) in pixels.
       */
      canvas_diameter: {
        type: jspsych.ParameterType.INT,
        default: 500,
      },
      /**
       * This width of the border around the canvas element
       */
      canvas_border_width: {
        type: jspsych.ParameterType.INT,
        default: 0,
      },
      /**
       * The color of the border around the canvas element.
       */
      canvas_border_color: {
        type: jspsych.ParameterType.STRING,
        default: "#000",
      },
      /**
       * Path to an image to render as the background of the canvas.
       */
      background_image: {
        type: jspsych.ParameterType.IMAGE,
        default: null,
      },
      /**
       * Background color of the canvas.
       */
      background_color: {
        type: jspsych.ParameterType.STRING,
        default: "#ffffff",
      },
      /**
       * The width of the strokes on the canvas.
       */
      stroke_width: {
        type: jspsych.ParameterType.INT,
        default: 2,
      },
      /**
       * The color of the stroke on the canvas
       */
      stroke_color: {
        type: jspsych.ParameterType.STRING,
        default: "#000000",
      },
      /**
       * An array of colors to render as a palette of options for stroke colors.
       */
      stroke_color_palette: {
        type: jspsych.ParameterType.STRING,
        array: true,
        default: [],
      },
      /**
       * HTML content to render above or below the canvas (use `prompt_location` parameter to change location).
       */
      prompt: {
        type: jspsych.ParameterType.HTML_STRING,
        default: null,
      },
      /**
       * Location of the `prompt` content. Can be 'abovecanvas' or 'belowcanvas' or 'belowbutton'.
       */
      prompt_location: {
        type: jspsych.ParameterType.STRING,
        default: "abovecanvas",
      },
      /**
       * Whether to save the final image in the data as dataURL
       */
      save_final_image: {
        type: jspsych.ParameterType.BOOL,
        default: true,
      },
      /**
       * Whether to save the set of strokes that generated the image
       */
      save_strokes: {
        type: jspsych.ParameterType.BOOL,
        default: true,
      },
      /**
       * If this key is held down then it is like the mouse button being clicked for controlling
       * the flow of the "ink".
       */
      key_to_draw: {
        type: jspsych.ParameterType.KEY,
        default: null,
      },
      /**
       * Whether to show the button that ends the trial
       */
      show_finished_button: {
        type: jspsych.ParameterType.BOOL,
        default: true,
      },
      /**
       * The label for the button that ends the trial
       */
      finished_button_label: {
        type: jspsych.ParameterType.STRING,
        default: "Finished",
      },
      /**
       * Whether to show the button that clears the entire drawing.
       */
      show_clear_button: {
        type: jspsych.ParameterType.BOOL,
        default: true,
      },
      /**
       * The label for the button that clears the entire drawing.
       */
      clear_button_label: {
        type: jspsych.ParameterType.STRING,
        default: "Clear",
      },
      /**
       * Whether to show the button that enables an undo action.
       */
      show_undo_button: {
        type: jspsych.ParameterType.BOOL,
        default: true,
      },
      /**
       * The label for the button that performs an undo action.
       */
      undo_button_label: {
        type: jspsych.ParameterType.STRING,
        default: "Undo",
      },
      /**
       * Whether to show the button that enables an redo action. `show_undo_button` must also
       * be `true` for the redo button to show.
       */
      show_redo_button: {
        type: jspsych.ParameterType.BOOL,
        default: true,
      },
      /**
       * The label for the button that performs an redo action.
       */
      redo_button_label: {
        type: jspsych.ParameterType.STRING,
        default: "Redo",
      },
      /**
       * Array of keys that will end the trial when pressed.
       */
      choices: {
        type: jspsych.ParameterType.KEYS,
        default: "NO_KEYS",
      },
      /**
       * Length of time before trial ends. If `null` the trial will not timeout.
       */
      trial_duration: {
        type: jspsych.ParameterType.INT,
        default: null,
      },
      /**
       * Whether to show a countdown timer for the remaining trial duration
       */
      show_countdown_trial_duration: {
        type: jspsych.ParameterType.BOOL,
        default: false,
      },
      /**
       * The html for the countdown timer.
       */
      countdown_timer_html: {
        type: jspsych.ParameterType.HTML_STRING,
        default: `<span id="sketchpad-timer"></span> remaining`,
      },
    },
  };
  /**
   * **SketchpadWithAudioRecording**
   *
   * jsPsych plugin for canvas drawing and audio recording
   * adapted from Sketchpad plugin
   * @author Josh de Leeuw
   * @see {@link https://www.jspsych.org/latest/plugins/sketchpad/ sketchpad plugin documentation on jspsych.org}
   */
  class SketchpadWithAudioRecordingPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
      this.is_drawing = false;
      this.strokes = [];
      this.stroke = [];
      this.undo_history = [];
      this.mouse_position = { x: 0, y: 0 };
      this.draw_key_held = false;
      /** A.H.
       * Added HTML Audio Response code
       */
      // store data chunks in audio recordings
      this.recorded_data_chunks = [];
      // the minimum threshold to determine whether a timer 
      // event is triggerd ('T') or not ('F')
      // this.minTimerFiringThr = 828;  
      this.minDuration = 48; 
      // to store the last time a timer is fired
      this.lastTimeTimerFired = -1;            
    }
    trial(display_element, trial, on_load) {
      this.display = display_element;
      this.params = trial;
      this.current_stroke_color = trial.stroke_color;
      // set up the canvas
      this.init_display();
      this.setup_event_listeners(trial);
      this.add_background_color();
      this.add_background_image().then(() => {
        on_load();
      });
      
      /** A.H.
       * Added HTML Audio Response code
       */
      this.recorder = this.jsPsych.pluginAPI.getMicrophoneRecorder();
      this.setupRecordingEvents();
      this.startRecording();
      // A.H.

      this.start_time = performance.now();
      this.set_trial_duration_timer();

      return new Promise((resolve, reject) => {
        this.trial_finished_handler = resolve;
      });
    }
    init_display() {
      this.add_css();
      let canvas_html;
      if (this.params.canvas_shape == "rectangle") {
        canvas_html = `
        <canvas id="sketchpad-canvas" 
        width="${this.params.canvas_width}" 
        height="${this.params.canvas_height}" 
        class="sketchpad-rectangle"></canvas>
      `;
      } else if (this.params.canvas_shape == "circle") {
        canvas_html = `
        <canvas id="sketchpad-canvas" 
        width="${this.params.canvas_diameter}" 
        height="${this.params.canvas_diameter}" 
        class="sketchpad-circle">
        </canvas>
      `;
      } else {
        throw new Error(
          '`canvas_shape` parameter in sketchpad plugin must be either "rectangle" or "circle"'
        );
      }
      let sketchpad_controls = `<div id="sketchpad-controls">`;
      sketchpad_controls += `<div id="sketchpad-color-palette">`;
      for (const color of this.params.stroke_color_palette) {
        sketchpad_controls += `<button class="sketchpad-color-select" data-color="${color}" style="background-color:${color};"></button>`;
      }
      sketchpad_controls += `</div>`;
      sketchpad_controls += `<div id="sketchpad-actions">`;
      if (this.params.show_clear_button) {
        sketchpad_controls += `<button class="jspsych-btn" id="sketchpad-clear" disabled>${this.params.clear_button_label}</button>`;
      }
      if (this.params.show_undo_button) {
        sketchpad_controls += `<button class="jspsych-btn" id="sketchpad-undo" disabled>${this.params.undo_button_label}</button>`;
        if (this.params.show_redo_button) {
          sketchpad_controls += `<button class="jspsych-btn" id="sketchpad-redo" disabled>${this.params.redo_button_label}</button>`;
        }
      }
      sketchpad_controls += `</div></div>`;
      canvas_html += sketchpad_controls;
      let finish_button_html = "";
      if (this.params.show_finished_button) {
        finish_button_html = `<p id="finish-btn"><button class="jspsych-btn" id="sketchpad-end">${this.params.finished_button_label}</button></p>`;
      }
      let timer_html = "";
      if (
        this.params.show_countdown_trial_duration &&
        this.params.trial_duration
      ) {
        timer_html = `<p id="countdown-timer">${this.params.countdown_timer_html}</p>`;
      }
      let display_html;
      if (this.params.prompt !== null) {
        if (this.params.prompt_location == "abovecanvas") {
          display_html =
            this.params.prompt + timer_html + canvas_html + finish_button_html;
        }
        if (this.params.prompt_location == "belowcanvas") {
          display_html =
            timer_html + canvas_html + this.params.prompt + finish_button_html;
        }
        if (this.params.prompt_location == "belowbutton") {
          display_html =
            timer_html + canvas_html + finish_button_html + this.params.prompt;
        }
      } else {
        display_html = timer_html + canvas_html + finish_button_html;
      }
      this.display.innerHTML = display_html;
      this.sketchpad = this.display.querySelector("#sketchpad-canvas");
      this.ctx = this.sketchpad.getContext("2d");
    }
    setup_event_listeners(trial) {
      document.addEventListener("pointermove", (e) => {
        this.mouse_position = { x: e.clientX, y: e.clientY };
      });
      if (this.params.show_finished_button) {
        this.display
          .querySelector("#sketchpad-end")
          .addEventListener("click", () => {
            /** A.H.
             * Added Audio Response Code
             * */
            // stop recording, show playback control (for debug purposes, will be removed later)
            // note here stopRecording is asynchronous, then() awaits its completion
            this.stopRecording().then(() => {
              this.showPlaybackControls();
            });
          });
      }
      this.sketchpad.addEventListener("pointerdown", this.start_draw);
      this.sketchpad.addEventListener("pointermove", this.move_draw);
      this.sketchpad.addEventListener("pointerup", this.end_draw);
      this.sketchpad.addEventListener("pointerleave", this.end_draw);
      this.sketchpad.addEventListener("pointercancel", this.end_draw);
      if (this.params.key_to_draw !== null) {
        document.addEventListener("keydown", (e) => {
          if (
            e.key == this.params.key_to_draw &&
            !this.is_drawing &&
            !this.draw_key_held
          ) {
            this.draw_key_held = true;
            if (
              document.elementFromPoint(
                this.mouse_position.x,
                this.mouse_position.y
              ) == this.sketchpad
            ) {
              this.sketchpad.dispatchEvent(
                new PointerEvent("pointerdown", {
                  clientX: this.mouse_position.x,
                  clientY: this.mouse_position.y,
                })
              );
            }
          }
        });
        document.addEventListener("keyup", (e) => {
          if (e.key == this.params.key_to_draw) {
            this.draw_key_held = false;
            if (
              document.elementFromPoint(
                this.mouse_position.x,
                this.mouse_position.y
              ) == this.sketchpad
            ) {
              this.sketchpad.dispatchEvent(
                new PointerEvent("pointerup", {
                  clientX: this.mouse_position.x,
                  clientY: this.mouse_position.y,
                })
              );
            }
          }
        });
      }
      if (this.params.show_undo_button) {
        this.display
          .querySelector("#sketchpad-undo")
          .addEventListener("click", this.undo);
        if (this.params.show_redo_button) {
          this.display
            .querySelector("#sketchpad-redo")
            .addEventListener("click", this.redo);
        }
      }
      if (this.params.show_clear_button) {
        this.display
          .querySelector("#sketchpad-clear")
          .addEventListener("click", this.clear);
      }
      const color_btns = Array.from(
        this.display.querySelectorAll(".sketchpad-color-select")
      );
      for (const btn of color_btns) {
        btn.addEventListener("click", (e) => {
          const target = e.target;
          this.current_stroke_color = target.getAttribute("data-color");
        });
      }
      this.jsPsych.pluginAPI.getKeyboardResponse({
        callback_function: this.after_key_response,
        valid_responses: this.params.choices,
        persist: false,
        allow_held_key: false,
      });
    }

    /** A.H.
     * Added HTML Audio Response code
     */
    setupRecordingEvents() {
      this.data_available_handler = (e) => {
        if (e.data.size > 0) {
          this.recorded_data_chunks.push(e.data);
        }
      };
      this.stop_event_handler = () => {
        // Constructs a Blob (binary large object) containing the recorded audio data
        const data = new Blob(this.recorded_data_chunks, {
          type: "audio/webm",
        });
        // Create a temporary URL that references the audio data
        // This URL can be used for playback or further processing
        this.audio_url = URL.createObjectURL(data);
        // Create a FileReader object to read the Blob as a data URL
        const reader = new FileReader();
        // Read Data Asynchronously
        // Attach a "load" event listener to the FileReader,
        // executing code when reading completes.
        // Calls reader.readAsDataURL(data) to initiate asynchronous reading.
        // When reading finishes, the "load" event listener
        // extracts the Base64-encoded audio data from the result string.
        // Store the Base64 data in this.audio_response for later use.
        // Call this.load_resolver(), resolving a Promise related to recording completion (from stopRecording())
        reader.addEventListener("load", () => {
          const base64 = reader.result.split(",")[1];
          this.audio_response = base64;
          this.load_resolver();
        });
        reader.readAsDataURL(data);
      };
      this.start_event_handler = (e) => {
        // resets the recorded data
        this.recorded_data_chunks.length = 0;
        this.recorder_start_time = e.timeStamp;
      };
      this.recorder.addEventListener(
        "dataavailable",
        this.data_available_handler
      );
      this.recorder.addEventListener("stop", this.stop_event_handler);
      this.recorder.addEventListener("start", this.start_event_handler);
    }
    startRecording() {
      this.recorder.start();
    }
    stopRecording() {
      this.recorder.stop();
      return new Promise((resolve) => {
        this.load_resolver = resolve;
      });
    }
    // A.H.

    add_css() {
      document.querySelector("head").insertAdjacentHTML(
        "beforeend",
        `<style id="sketchpad-styles">
        #sketchpad-controls {
          line-height: 1; 
          width:${
            this.params.canvas_shape == "rectangle"
              ? this.params.canvas_width + this.params.canvas_border_width * 2
              : this.params.canvas_diameter +
                this.params.canvas_border_width * 2
          }px; 
          display: flex; 
          justify-content: space-between; 
          flex-wrap: wrap;
          margin: auto;
        }
        #sketchpad-color-palette { 
          display: inline-block; text-align:left; flex-grow: 1;
        }
        .sketchpad-color-select { 
          cursor: pointer; height: 33px; width: 33px; border-radius: 4px; padding: 0; border: 1px solid #ccc; 
        }
        #sketchpad-actions {
          display:inline-block; text-align:right; flex-grow: 1;
        }
        #sketchpad-actions button {
          margin-left: 4px;
        }
        #sketchpad-canvas {
          touch-action: none;
          border: ${this.params.canvas_border_width}px solid ${
          this.params.canvas_border_color
        };
        }
        .sketchpad-circle {
          border-radius: ${this.params.canvas_diameter / 2}px;
        }
        #countdown-timer {
          width:${
            this.params.canvas_shape == "rectangle"
              ? this.params.canvas_width + this.params.canvas_border_width * 2
              : this.params.canvas_diameter +
                this.params.canvas_border_width * 2
          }px; 
          text-align: right;
          font-size: 12px; 
          margin-bottom: 0.2em;
        }
      </style>`
      );
    }
    add_background_color() {
      this.ctx.fillStyle = this.params.background_color;
      if (this.params.canvas_shape == "rectangle") {
        this.ctx.fillRect(
          0,
          0,
          this.params.canvas_width,
          this.params.canvas_height
        );
      }
      if (this.params.canvas_shape == "circle") {
        this.ctx.fillRect(
          0,
          0,
          this.params.canvas_diameter,
          this.params.canvas_diameter
        );
      }
    }
    add_background_image() {
      return new Promise((resolve, reject) => {
        if (this.params.background_image !== null) {
          this.background_image = new Image();
          this.background_image.src = this.params.background_image;
          this.background_image.onload = () => {
            this.ctx.drawImage(this.background_image, 0, 0);
            resolve(true);
          };
        } else {
          resolve(false);
        }
      });
    }
    // A.H. 
    // It appears that each chunck of strokes have three parts: action-start, action-move, action-end
    start_draw(e) {
      this.is_drawing = true;
      const x = Math.round(
        e.clientX - this.sketchpad.getBoundingClientRect().left
      );
      const y = Math.round(
        e.clientY - this.sketchpad.getBoundingClientRect().top
      );
      this.undo_history = [];
      this.set_redo_btn_state(false);
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.strokeStyle = this.current_stroke_color;
      this.ctx.lineJoin = "round";
      this.ctx.lineWidth = this.params.stroke_width;
      this.stroke = [];
      this.stroke.push({
        x: x,
        y: y,
        color: this.current_stroke_color,
        action: "start",
        t: Math.round(performance.now() - this.start_time),
      });
      this.sketchpad.releasePointerCapture(e.pointerId);
    }
    move_draw(e) {
      if (this.is_drawing) {
        const x = Math.round(
          e.clientX - this.sketchpad.getBoundingClientRect().left
        );
        const y = Math.round(
          e.clientY - this.sketchpad.getBoundingClientRect().top
        );
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        this.stroke.push({
          x: x,
          y: y,
          action: "move",
          t: Math.round(performance.now() - this.start_time),
        });
      }
    }
    end_draw(e) {
      if (this.is_drawing) {
        this.stroke.push({
          action: "end",
          t: Math.round(performance.now() - this.start_time),
        });
        this.strokes.push(this.stroke);
        this.set_undo_btn_state(true);
        this.set_clear_btn_state(true);
      }
      this.is_drawing = false;
    }
    render_drawing() {
      this.ctx.clearRect(0, 0, this.sketchpad.width, this.sketchpad.height);
      this.add_background_color();
      if (this.background_image) {
        this.ctx.drawImage(this.background_image, 0, 0);
      }
      for (const stroke of this.strokes) {
        for (const m of stroke) {
          if (m.action == "start") {
            this.ctx.beginPath();
            this.ctx.moveTo(m.x, m.y);
            this.ctx.strokeStyle = m.color;
            this.ctx.lineJoin = "round";
            this.ctx.lineWidth = this.params.stroke_width;
          }
          if (m.action == "move") {
            this.ctx.lineTo(m.x, m.y);
            this.ctx.stroke();
          }
        }
      }
    }
    undo() {
      this.undo_history.push(this.strokes.pop());
      this.set_redo_btn_state(true);
      if (this.strokes.length == 0) {
        this.set_undo_btn_state(false);
      }
      this.render_drawing();
    }
    redo() {
      this.strokes.push(this.undo_history.pop());
      this.set_undo_btn_state(true);
      if (this.undo_history.length == 0) {
        this.set_redo_btn_state(false);
      }
      this.render_drawing();
    }
    clear() {
      this.strokes = [];
      this.undo_history = [];
      this.render_drawing();
      this.set_redo_btn_state(false);
      this.set_undo_btn_state(false);
      this.set_clear_btn_state(false);
    }
    set_undo_btn_state(enabled) {
      if (this.params.show_undo_button) {
        this.display.querySelector("#sketchpad-undo").disabled = !enabled;
      }
    }
    set_redo_btn_state(enabled) {
      if (this.params.show_undo_button && this.params.show_redo_button) {
        this.display.querySelector("#sketchpad-redo").disabled = !enabled;
      }
    }
    set_clear_btn_state(enabled) {
      if (this.params.show_clear_button) {
        this.display.querySelector("#sketchpad-clear").disabled = !enabled;
      }
    }
    set_trial_duration_timer() {
      if (this.params.trial_duration !== null) {
        this.jsPsych.pluginAPI.setTimeout(() => {
          this.end_trial();
        }, this.params.trial_duration);
        if (this.params.show_countdown_trial_duration) {
          this.timer_interval = setInterval(() => {
            const remaining =
              this.params.trial_duration -
              (performance.now() - this.start_time);
            let minutes = Math.floor(remaining / 1000 / 60);
            let seconds = Math.ceil((remaining - minutes * 1000 * 60) / 1000);
            if (seconds == 60) {
              seconds = 0;
              minutes++;
            }
            const minutes_str = minutes.toString();
            const seconds_str = seconds.toString().padStart(2, "0");
            const timer_span = this.display.querySelector("#sketchpad-timer");
            if (timer_span) {
              timer_span.innerHTML = `${minutes_str}:${seconds_str}`;
            }
            if (remaining <= 0) {
              if (timer_span) {
                timer_span.innerHTML = `0:00`;
              }
              clearInterval(this.timer_interval);
            }
          }, 250);
        }
      }
    }
    after_key_response(info) {
      this.end_trial(info.key);
    }

    /** A.H.
     * 
     * */
    // for the stroke at this.strokes[stroke_index], 
    // draw the point in this stroke at pointIndex 
    drawStroke(strokeIndex, pointIndex) {
      const currentStroke = this.strokes[strokeIndex];
      const currentPoint = currentStroke[pointIndex];
      let timerDuration; 

      if (currentPoint.action === "start") {
        // the point is at the start of the stroke
        this.ctx_redraw.beginPath();
        this.ctx_redraw.moveTo(currentPoint.x, currentPoint.y);
        this.ctx_redraw.strokeStyle = currentPoint.color;
        this.ctx_redraw.lineJoin = "round";
        this.ctx_redraw.lineWidth = this.params.stroke_width;
        pointIndex += 1; 
        timerDuration = currentStroke[pointIndex].t - this.lastTimeTimerFired;

      } else if (currentPoint.action === "move") {
        // the point is in the middle of the stroke
        this.ctx_redraw.lineTo(currentPoint.x, currentPoint.y);
        this.ctx_redraw.stroke();
        pointIndex += 1; 
        timerDuration = currentStroke[pointIndex].t - this.lastTimeTimerFired;

      } else if (currentPoint.action === "end") {
        // the point is at the end of the stroke
        // advance to the next stroke, reset the point index
        strokeIndex += 1;
        if (strokeIndex >= this.strokes.length) {
          // reached to the end of the last stroke, stop drawing the sketch
          return;
        }
        pointIndex = 0; 
        const nextStroke = this.strokes[strokeIndex];
        timerDuration = nextStroke[0].t - this.lastTimeTimerFired; 
              
      }

      if (timerDuration >= this.minDuration) {
        // if more than minDuration ms has passed, fire a timer, 
        // and update lastTimeTimerFired 
        this.lastTimeTimerFired += timerDuration; 
        // console.log("fired timer duration: ", timerDuration); 
        setTimeout(() => {
          this.drawStroke(strokeIndex, pointIndex);
        }, timerDuration);  
      } else {
        // if not, move to the next stroke/point
        this.drawStroke(strokeIndex, pointIndex);
      }            
    }

    // show the audio/sketch playback control
    showPlaybackControls() {
      // Add Canvas control
      const canvas_html = `<div>
        <canvas id="redraw-canvas" 
        width="${this.params.canvas_width}"
        height="${this.params.canvas_height}" 
        class="sketchpad-rectangle"></canvas>
        </div>
      `;
      //

      this.display.innerHTML =
        `
    <p><audio id="playback" src="${this.audio_url}" controls></audio></p>
    <button id="continue" class="jspsych-btn">Continue</button>
  ` + canvas_html;

      this.display.querySelector("#continue").addEventListener("click", () => {
        this.end_trial();
      });

      this.ctx_redraw = this.display.querySelector("#redraw-canvas").getContext("2d");        

      // Handler for the 'play' event of the audio playback element, 
      // when 'play' event is triggered, start animating sketchpad drawings 
      // by connecting strokes 
      this.display.querySelector("#playback").addEventListener("play", () => {
        // draw the first stroke
        this.lastTimeTimerFired = this.strokes[0][0].t;
        setTimeout(() => {
          this.drawStroke(0, 0);          
        }, this.strokes[0][0].t);        
      });

    }
    // A. H.

    end_trial(response = null) {
      /** A.H.
       * Added Audio Response Code
       * */
      // clear recordering event handler
      this.recorder.removeEventListener(
        "dataavailable",
        this.data_available_handler
      );
      this.recorder.removeEventListener("start", this.start_event_handler);
      this.recorder.removeEventListener("stop", this.stop_event_handler);
      // A.H.

      // kill any remaining setTimeout handlers
      this.jsPsych.pluginAPI.clearAllTimeouts();
      this.jsPsych.pluginAPI.cancelAllKeyboardResponses();
      clearInterval(this.timer_interval);
      const trial_data = {};
      trial_data.rt = Math.round(performance.now() - this.start_time);
      trial_data.response = response;
      if (this.params.save_final_image) {
        trial_data.png = this.sketchpad.toDataURL();
      }
      if (this.params.save_strokes) {
        trial_data.strokes = this.strokes;
      }

      /** A.H.
       * Added Audio Response code
       * */
      // Save audio recordings
      trial_data.audio_url = this.audio_url;
      trial_data.audio_response = this.audio_response;
      // A.H.

      // Empty the HTML and remove the CSS
      this.display.innerHTML = "";
      document.querySelector("#sketchpad-styles").remove();
      this.jsPsych.finishTrial(trial_data);
      /** 
       * The trial method in the plugin returns a Promise, and this.trial_finished_handler is essentially 
       * the resolve function of this Promise. When the trial is ready to conclude, 
       * calling this.trial_finished_handler resolves the Promise, signaling that the trial has finished its execution.
       */
      this.trial_finished_handler();
    }
  }
  SketchpadWithAudioRecordingPlugin.info = info;

  return SketchpadWithAudioRecordingPlugin;
})(jsPsychModule);

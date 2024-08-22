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
      // To store strokes being drawn
      this.strokes = [];
      // To hold each stroke that will be stored in this.strokes, 
      // note that a stroke has one of the following states: 
      // 'Normal' (many points), 'Undo' (single point), 'Redo' (single point)
      this.stroke = [];
      this.mouse_position = { x: 0, y: 0 };
      this.draw_key_held = false;
      // A.H. added
      // To store a consecutive set of strokes involved in 'undo' and 'redo',
      // note this is a 'stack' which has implications on how the state of 
      // each stroke is managed
      this.undo_history = [];
      // To store all strokes ever generated in the entire history, including 
      // those involved in 'undo' and 'redo' events
      this.strokes_with_all_history = [];
      // To store the last stroke index with 'normal' state, 
      // initiated to -1 to indicate 'unused'
      this.last_normal_stroke_index = -1; 
      // A.H. added HTML Audio Response code
      // Store data chunks in audio recordings
      this.recorded_data_chunks = [];
      // The minimum threshold to determine whether a timer 
      // event is triggerd ('T') or not ('F')
      this.minDuration = 48; 
      // To store the last time a timer is fired
      this.lastTimeTimerFired = -1;            
      // To store the confidence level by a user solving each problem
      this.confidence_level = "Very Confident"; 
      // balloon notification timer duration
      this.balloon_timer_duration = 10000; 
      // balloon notification timer handle
      this.balloon_interval_handle = null; 
      // To download the recorded audio to a local file
      this.audio_file_webm_name = "recorded_audio.webm";
      this.audio_file_wav_name = "recorded_audio.wav";
      // To store the transcribed caption
      this.transcribed_caption = "";
      // A.H. 
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

      // A.H. Added balloon notification controls
      // Initialize Notyf (balloon notification control)
      const notyf = new Notyf({
        duration: 1000, // Notification will disappear after 1 second
        position: {
          x: 'left',
          y: 'top',
        },
        types: [
          {
            type: 'info',
            background: 'blue',
            icon: false,
          }
        ]
      });

      // Start displaying the notification every (this.balloon_timer) milliseconds
      this.balloon_interval_handle = setInterval(() => {
        notyf.open({
          type: 'info',
          message: 'Please Keep Verbalizing Your Thoughts.'
        })
      }, this.balloon_timer_duration);

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
            // stop recording, show playback control (for debug purposes, 
            // will be removed later), note here stopRecording is 
            // asynchronous, then() awaits its completion
            this.stopRecording().then(() => {
              // Clear the balloon notification timer
              clearInterval(this.balloon_interval_handle);
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
        // const data = new Blob(this.recorded_data_chunks, {
        //   type: "audio/webm",
        // });
        const data = new Blob(this.recorded_data_chunks, {
          type: "audio/wav",
        });
        // Create a temporary URL that references the audio data
        // This URL can be used for playback or further processing
        this.audio_url = URL.createObjectURL(data);

        // Create an file (with audio_file_name) from the blob data
        // this.audio_file = new File([data], this.audio_file_webm_name, 
        //   { type: "audio/webm" });
        this.audio_file = new File([data], this.audio_file_wav_name, 
          { type: "audio/wav" });
          
        // // Download the recorded audio data to a local file named this.audio_file
        // const downloadLink = document.createElement("a");
        // downloadLink.href = this.audio_url;
        // // downloadLink.download = this.audio_file_webm_name;
        // downloadLink.download = this.audio_file_wav_name;
        // document.body.appendChild(downloadLink);
        // downloadLink.click();
        // document.body.removeChild(downloadLink);

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
    // It appears that each stroke has three parts: action-start, action-move, action-end
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
      // Generate a new stroke
      this.stroke = [];
      this.stroke.push({
        x: x,
        y: y,
        color: this.current_stroke_color,
        action: "start",
        // A.H. added. To indicate this stroke is a 'Normal' Stroke
        state: "Normal",
        // A.H. 
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
        // A.H. added. Also push each stroke into strokes_with_all_history
        this.strokes_with_all_history.push(this.stroke);
        // A.H.
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
      // A.H. added. Treat this as a stroke with a state of 'Undo':
      // generate a new stroke and push to this.strokes_with_all_history.
      this.stroke = [];
      this.stroke.push({
        state: "Undo",
        t: Math.round(performance.now() - this.start_time),
      });
      this.strokes_with_all_history.push(this.stroke);
      // A.H.
    }
    redo() {
      this.strokes.push(this.undo_history.pop());
      this.set_undo_btn_state(true);
      if (this.undo_history.length == 0) {
        this.set_redo_btn_state(false);
      }
      this.render_drawing();
      // A.H. added. Treat this as a stroke with a state of 'Redo':
      // generate a new stroke and push to this.strokes_with_all_history.
      this.stroke = [];
      this.stroke.push({
        state: "Redo",
        t: Math.round(performance.now() - this.start_time),
      });
      this.strokes_with_all_history.push(this.stroke);
      // A.H.
    }
    clear() {
      this.strokes = [];
      this.undo_history = [];
      this.render_drawing();
      this.set_redo_btn_state(false);
      this.set_undo_btn_state(false);
      this.set_clear_btn_state(false);
      // A.H. added. Clear this.strokes_with_all_history, 
      // to make it consistent with this.strokes
      this.strokes_with_all_history = [];
      // A.H.
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
    // For each stroke at this.strokes[stroke_index], 
    // draw the point in this stroke at pointIndex 
    drawStroke(strokeIndex, pointIndex) {
      if (strokeIndex >= this.strokes_with_all_history.length) {
        // reached to the end of the last stroke, stop drawing the sketch
        return;
      }
      const currentStroke = this.strokes_with_all_history[strokeIndex];
      const currentPoint = currentStroke[pointIndex];
      let timerDuration; 
      // Define what to do, a value of 0 indicates 'do as usual', 
      // a value of 1 indicates 'do a redraw' since 'Redo' or 'Undo' 
      // stroke is encountered
      let doWhat = 0; 

      // If pointIndex equals 0, this is the first time to draw this stroke,
      // and we must check the state of this stroke: Normal, Redo, or Undo?
      // If pointIndex does NOT equal 0, this current stroke cannot have 
      // "Undo" or "Redo" states, 
      if (pointIndex == 0) {
        // console.log("Stroke index and state are:", strokeIndex, currentPoint.state);
        if (currentPoint.state === "Normal") {
          this.last_normal_stroke_index = strokeIndex;   
          // console.log("last_normal_stroke_index: ", this.last_normal_stroke_index);        
        } else if (currentPoint.state === "Undo") {
          // Change the state of the stroke with last_normal_stroke_index 
          // to "Undo", then reduce last_normal_stroke_index by 1
          this.strokes_with_all_history[this.last_normal_stroke_index][0].state = "Undo";
          this.last_normal_stroke_index -= 1; 
          doWhat = 1; 
          // console.log("last_normal_stroke_index: ", this.last_normal_stroke_index);
        } else if (currentPoint.state === "Redo") {
          // Increase last_normal_stroke_index by 1, then change the state of the stroke
          // with last_normal_stroke_index to "Normal"
          this.last_normal_stroke_index += 1; 
          this.strokes_with_all_history[this.last_normal_stroke_index][0].state = "Normal";
          doWhat = 1; 
          // console.log("last_normal_stroke_index: ", this.last_normal_stroke_index);
        }
      }

      if (doWhat == 1) { // A 'Redo' or 'Undo' stroke is encountered
        // Check how long has passed since the last time the timer was fired
        timerDuration = currentStroke[0].t - this.lastTimeTimerFired;
        if (timerDuration >= this.minDuration) {
          // if more than minDuration ms has passed, update lastTimeTimerFired  
          // and fire a timer to schedule the task to redraw all strokes
          // up to the last normal stroke
          this.lastTimeTimerFired += timerDuration; 
          // console.log("fired timer duration: ", timerDuration); 
          setTimeout(() => {
            this.redrawUpToLastNormalStroke(strokeIndex, this.last_normal_stroke_index);
          }, timerDuration);  
        } else {
          // if not, immediately redraw all strokes up to the last normal stroke
          this.redrawUpToLastNormalStroke(strokeIndex, this.last_normal_stroke_index);
        }      
      } else { // This is a 'Normal' stroke
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
          // the point is at the end of the stroke, 
          // advance to the next stroke, reset the point index
          strokeIndex += 1;
          if (strokeIndex >= this.strokes_with_all_history.length) {
            // reached to the end of the last stroke, stop drawing the sketch
            return;
          }
          pointIndex = 0; 
          const nextStroke = this.strokes_with_all_history[strokeIndex];
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
      
    }

    redrawUpToLastNormalStroke(strokeIndex, last_normal_stroke_index) {
      // console.log("redrawUpToLastNormalStroke is called with strokeIndex/last_normal_stroke_index:", strokeIndex, last_normal_stroke_index);      
      this.ctx_redraw.clearRect(0, 0, this.sketchpad.width, this.sketchpad.height);
      this.add_background_color();
      if (this.background_image) {
        this.ctx_redraw.drawImage(this.background_image, 0, 0);
      }
      let i = 0;
      while (i <= last_normal_stroke_index) {
        const stroke = this.strokes_with_all_history[i];
        // console.log("stroke drawn:", i);
        if (stroke[0].state === "Normal") {
          for (const m of stroke) {
            if (m.action == "start") {
              this.ctx_redraw.beginPath();
              this.ctx_redraw.moveTo(m.x, m.y);
              this.ctx_redraw.strokeStyle = m.color;
              this.ctx_redraw.lineJoin = "round";
              this.ctx_redraw.lineWidth = this.params.stroke_width;
            }
            if (m.action == "move") {
              this.ctx_redraw.lineTo(m.x, m.y);
              this.ctx_redraw.stroke();
            }
          }
        }
        i += 1;
      }
      
      // After redrawing all strokes up to the last normal stroke, 
      // move to the next stroke
      strokeIndex += 1;
      // Now strokeIndex is the index of the next stroke
      if (strokeIndex >= this.strokes_with_all_history.length) {
        // Reached to the end of the last stroke, return
        return;
      }
      const nextStroke = this.strokes_with_all_history[strokeIndex];
      let pointIndex = 0;
      if (nextStroke[0].state === "Normal") { // This is a 'Normal' stroke
        let timerDuration = nextStroke[0].t - this.lastTimeTimerFired;
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
      } else { // This is a 'Undo' or 'Redo' stroke
        this.drawStroke(strokeIndex, pointIndex);
      }      
    }

    // Show the "audio/sketch playback" controls
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
    <p><audio id="playback" src="${this.audio_url}" ></audio></p>
    <button id="continue" class="jspsych-btn" disabled>Continue</button>
  ` + canvas_html + `<br> 
      <br> 
      <label id="captionLabel">Waiting for the transcribed caption...</label> `;

      this.display.querySelector("#continue").addEventListener("click", () => {
        this.showRateConfidenceControls();
      });

      this.ctx_redraw = this.display.querySelector("#redraw-canvas").getContext("2d");        

      // Handler for the 'play' event of the audio playback element, 
      // when 'play' event is triggered, start animating sketchpad drawings 
      // by using strokes stored this.strokes_with_all_history
      this.display.querySelector("#playback").addEventListener("play", () => {
        this.ctx_redraw.clearRect(0, 0, this.sketchpad.width, this.sketchpad.height);
        this.add_background_color();
        if (this.background_image) {
          this.ctx_redraw.drawImage(this.background_image, 0, 0);
        }
        // draw the first stroke
        this.lastTimeTimerFired = this.strokes_with_all_history[0][0].t;
        setTimeout(() => {
          this.drawStroke(0, 0);          
        }, this.strokes_with_all_history[0][0].t);        

        // start captioning of the transcribed audio
        let index = 0;
        if (index < this.transcribed_caption.length) {
          const word = this.transcribed_caption[index];
          document.getElementById("captionLabel").innerText = word.text;
          const start = word.timestamp[0];
          const end = word.timestamp[1];
          setTimeout(() => {
            this.drawCaption(index + 1);
          }, (end - start) * 1000);
        }

      });

      // call the transcribe endpoint api
      this.transcribeAudio(this.audio_file)
        .then((transcription_data) => {
          // enable audio control and 'continue' button after transcription is done
          document.getElementById('playback').controls = true;
          document.getElementById('continue').removeAttribute('disabled');
          document.getElementById("captionLabel").innerText = "Caption Ready. Press the playback button (Right Triangle).";

          // Save the transcribed caption
          this.transcribed_caption = transcription_data;
          
          // // Iterate over each word object in the transcription data
          // transcription_data.forEach((wordObject) => {
          //   const { text, timestamp } = wordObject;
          //   console.log(
          //     `Word: "${text}", Start: ${timestamp[0]}, End: ${timestamp[1]}`
          //   );
          //   caption += text;
          // });          
          
        })
        .catch((error) => {
          console.error("Transcription failed", error);
          document.getElementById("captionLabel").innerText =
            "Transcription failed";
        });
    
    }

    drawCaption(nextIndex) {
      if (nextIndex < this.transcribed_caption.length) {
        const word = this.transcribed_caption[nextIndex];
        const caption = document.getElementById("captionLabel").innerText;
        document.getElementById("captionLabel").innerText = caption + word.text;
        const start = word.timestamp[0];
        const end = word.timestamp[1];
        setTimeout(() => {
          this.drawCaption(nextIndex + 1);          
        }, (end - start) * 1000);  
      }
    }

    // Show the 'rate confidence' controls
    showRateConfidenceControls() {      
      this.display.innerHTML = `
      <label for="confidenceLevel">Rate Your Confidence Level:</label>
      <select name="confidenceOptions" id="confidenceLevel">
          <option value="Very Confident" selected>Very Confident</option>
          <option value="Confident">Confident</option>
          <option value="Less Confident">Less Confident</option>
          <option value="Least Confident">Least Confident</option>
      </select>
      <button id="continue2" class="jspsych-btn">Continue</button> 
      `;

      // Handler for the 'click' event of the 'Continue' button
      this.display.querySelector("#continue2").addEventListener("click", () => {
        this.end_trial();
      });

      // Handler for the 'value change' event of the 'drop down' menu
      this.display.querySelector("#confidenceLevel").addEventListener("change", (event) => {
        this.confidence_level = event.target.value; 
      });      
      
    }    

    // Call the Endpoint API to transcribe the audio file
    transcribeAudio(file) {
      const formData = new FormData();
      formData.append('file', file);
      // formData.append('uniqueId', 'user-transcriber-001');
  
      return fetch('/transcribe', {
        method: 'POST',
        body: formData
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(transcriber_data => {
        // console.log('Transcription:', transcriber_data.transcription);
        return transcriber_data.transcription;
      })
      .catch(error => {
        console.error('Error:', error);
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
        // A.H. changed. Change saved strokes from this.strokes to 
        // this.strokes_with_all_history
        trial_data.strokes = this.strokes_with_all_history;
      }

      /** A.H.
       * Added Audio Response code
       * */
      // Save audio recordings
      trial_data.audio_url = this.audio_url;
      trial_data.audio_response = this.audio_response;
      // Save the 'Confidence Level' of problem solving
      trial_data.confidence_level = this.confidence_level
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

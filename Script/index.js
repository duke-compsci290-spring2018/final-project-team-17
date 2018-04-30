var user_info = {};
var rels = [];
var current_question = -1;
var scores = new Array(10).fill(null);
var current_username = "";
var chosen_date;
var selected_name = "";
var selected_name_index = 0;

var quiz_questions = [
  {
    "question": "How would you classify this relationship?",
    "choices": [
      {
        "choice": "Family or Close Friend",
        "value": 10
      },
      {
        "choice": "Romantic or Friendship",
        "value": 5
      },
      {
        "choice": "Business",
        "value": 5
      },
      {
        "choice": "Acquaintance",
        "value": 3
      },
      {
        "choice": "Estranged Friend or Ex-Romantic",
        "value": -10
      }
    ]
  },
  {
    "question": "How recently did you last communicate with this person?",
    "choices": [
      {
        "choice": "today",
        "value": 10
      },
      {
        "choice": "in the past week",
        "value": 6
      },
      {
        "choice": "in the past month",
        "value": 3
      },
      {
        "choice": "in the past year",
        "value": 0
      },
      {
        "choice": "more than a year ago",
        "value": -5
      }
    ]
  },
  {
    "question": "What was your most recent medium of communication?",
    "choices": [
      {
        "choice": "speaking/in person",
        "value": 7
      },
      {
        "choice": "Skype, FaceTime or video call",
        "value": 5
      },
      {
        "choice": "phone call",
        "value": 3
      },
      {
        "choice": "text or email",
        "value": 1
      },
      {
        "choice": "we acknowledged each other silently in passing",
        "value": 0
      }
    ]
  }
]

$(document).ready(function() {
  $("#signup-submit").click(function() {
    alert("clicked")
    var firstname = $("#first-name").val();
    var lastname = $("#last-name").val();
    var pin = $("#pin").val();
    var pinconfirm = $("#pin-confirm").val();

    if (firstname.length <= 0 || lastname.length <= 0 || pin.length <= 0 || pinconfirm.length <= 0) {
      alert("Please fill in all fields.");
    } else if (pin !== pinconfirm) {
    alert("PINs do not match.")
    } else {
      $.ajax({
        method: "POST",
        url: "/create-account",
        data: { "firstname": firstname, "lastname": lastname, "pin" : pin }
      }).done(function(msg) {
        console.log(msg);
        alert("Account created")
      });
    }
  });

  $("#pin-submit").click(function() {
		var pin = $("#pin-input").val();
		var temp = window.location.href.split("/");
		var id = temp[temp.length - 1];

		if (pin.length <= 0) {
			alert("PIN cannot be blank!");
		} else {
			$.ajax({
			  method: "POST",
			  url: "/login",
			  data: { "pin": pin, "username": id }
			}).done(function(msg) {
			    if (msg["status"] && !msg["locked"]) {
			    	alert("Welcome back, " + msg.userdata.firstname + "!")
            user_info = msg.userdata;
            rels = user_info.user_info.rels;
            current_username = user_info.username;
            console.log(rels);
            if (rels.length > 0) {
              updateGraph();
              updateRels();
            }
			    } else if (!msg["status"] && !msg["locked"]) {
			    	console.log("Incorrect pin!");
			    	document.getElementById("msg").innerHTML = msg["reason"];
			    } else {
			    	console.log("Account locked!");
			    	document.getElementById("msg").innerHTML = msg["reason"];
			    }
			});
		}
	})


  $("#choose-quiz").click(function() {
    $("#create-rel-prompt").hide(function() {
      $("#rel-quiz-prompt").show();
      $("#next-question-btn").show();
    });
  })

  $("#next-question-btn").click(function() {
    current_question++;
    $("#rel-quiz").show();
    showQuestions()
  })

  $("#prev-question-btn").click(function() {
    current_question--;
    showQuestions()
  })

  $(".quiz-choice").click(function() {
    $(".quiz-choice").css("color", "black");
    this.style.color = "lightblue";
    var clicked_choice_index = this.id.split("choice")[1] - 1
    scores[current_question] = quiz_questions[current_question].choices[clicked_choice_index].value;
    console.log(scores[current_question]);

  })

  $("#choose-self").click(function() {
    $("#create-rel-prompt").hide(function() {
      $("#slider-input").show();
      $("#finish-slider-btn").show();
    });
  })

  $("#new-rel-btn").click(function() {
    $("#new-rel-modal").modal("show");
  })

  $("#rate-slider").slider();
  $("#rate-slider").on("slide", function(slideEvt) {
  	$("#rate-slider-label").text(slideEvt.value);
  });

  $("#add-rel").click(function() {
    $("#new-rel-modal").modal("show");
  })

  $("#finish-quiz-btn").click(function() {
    console.log("finished")
    var sum = 0;
    scores.forEach(function(score) {
      if (score) {
        sum += score;
      }
    })
    var new_rel_name = $("#new-rel-name").val();
    var new_rel_relation = $("#new-rel-relation").val();

    $.ajax({
      method: "POST",
      url: "/new-relation",
      data: { "username": current_username, "score": sum, "name": new_rel_name, "relation" : new_rel_relation }
    }).done(function(msg) {
      alert(msg.msg);
      if (msg.success) {
        $('#new-rel-modal').modal('hide');
        reset_quiz_modal()
      }
      user_info = msg.user_info;
      rels = user_info.rels;
      updateGraph();
    });
  })

  $('#new-rel-modal').on('hidden.bs.modal', function () {
    reset_quiz_modal()
  })

  $('#datepicker').daterangepicker({
    "singleDatePicker": true,
    "drops": "up"
  }, function(start, end, label) {
    chosen_date = start.format('YYYY-MM-DD')
    console.log(new Date(chosen_date));
    // console.log('New date range selected: ' + start.format('YYYY-MM-DD') + ' to ' + end.format('YYYY-MM-DD') + ' (predefined range: ' + label + ')');
  });

  $(document).on('click', '#schedule-interaction', function() {
    var selected_interaction = $("#all-interactions option:selected").text();
    if (selected_interaction == "Select an interaction") {
      alert("Please select an interaction in the dropdown list!");
    } else {
      var point_value = 0;
      if (selected_interaction[selected_interaction.length - 2] == "-") {
        point_value = -parseInt(selected_interaction[selected_interaction.length - 1])
      } else {
        point_value = parseInt(selected_interaction[selected_interaction.length - 1]);
      }
      rels[selected_name_index]["interactions"].activity.push(selected_interaction.split(",")[0]);
      rels[selected_name_index]["interactions"].time.push(new Date(chosen_date));
      rels[selected_name_index]["interactions"].score.push(point_value);

      $.ajax({
        method: "POST",
        url: "/update-relation",
        data: { "username": current_username, "doc": rels }
      }).done(function(msg) {
        if (msg.success) {
          alert(msg.msg);
          user_info = msg["user_info"];
          rels = user_info["user_info"]["rels"];
          console.log(user_info)
          console.log(rels)

          updateInteractionGraph()
        }
      });
    }

  })

  $(document).on('click', '.bubble', function() {
    selected_name = $(this).data('original-title').split("<strong>")[1].split("</strong>")[0];
    console.log(selected_name)
    selected_name_index = 0;
    var j = 0;
    rels.forEach(function(rel) {
      if (rel.name == selected_name) {
        console.log("matched")
        selected_name_index = j;
        console.log(selected_name_index);


        updateInteractionGraph();
      }
      j++;
    })
    $("#rel-modal").modal("show");
  })

  function showQuestions() {
    if (current_question == quiz_questions.length - 1) {
      $("#next-question-btn").hide();
      $("#finish-quiz-btn").show();
    } else {
      $("#next-question-btn").show();
      $("#finish-quiz-btn").show();
    }

    if (current_question > 0) {
      $("#prev-question-btn").show();
    } else {
      $("#prev-question-btn").hide();
    }

    $("#question").html(quiz_questions[current_question].question);
    var choices = quiz_questions[current_question].choices;
    $(".quiz-choice").css("color", "black");
    for (var i = 0; i < choices.length; i++) {
      $("#choice" + (i + 1)).html(choices[i].choice);
      if (scores[current_question] && (choices[i].value == scores[current_question])) {
        $("#choice" + (i + 1)).css("color", "lightblue");
      }
    }
  }

  function hide_all_quiz_modal() {
    $("#slider-input").hide();
    $("#rel-quiz-prompt").hide();
    $("#rel-quiz").hide();
    $(".modal-btn").hide();
  }


  function reset_quiz_modal() {
    hide_all_quiz_modal()
    current_question = -1;
    scores = new Array(10).fill(null);
    $("#create-rel-prompt").show();
  }

  function updateRels() {
    var all_rels = $("#all-rels");
    rels.forEach(function(rel) {
      var name_arr = rel.name.trim().split(" ");

      var tooltip_text = "<strong>" + rel.name + "</strong></p><p>Type: " + rel.relation + "</p><p>Score: " + rel.score + "</p>"
      if (name_arr.length === 1) {
        all_rels.append("<li class='bubble' data-toggle='tooltip' data-placement='top' data-original-title='" + tooltip_text + "'>" + name_arr[0][0] + "</li>");

      } else if (name_arr.length > 1) {
        var name_split = rel.name.split(" ");
        var fname = name_split[0][0];
        var lname = name_split[name_split.length - 1][0];
        all_rels.append("<li class='bubble' data-toggle='tooltip' data-placement='top' data-original-title='" + tooltip_text + "'>" + fname + lname + "</li>")
      }


      $('[data-toggle="tooltip"]').tooltip({html:true});

    })
  }

  function updateGraph() {
    if (rels.length > 0) {
      var names = [];
      var scores = [];
      rels.forEach(function(rel) {
        names.push(rel.name);
        scores.push(rel.score);
      })

      var data = [
        {
          x: names,
          y: scores,
          type: 'bar'
        }
      ]
      console.log(data)
      $("#rel-graph").html("");
      Plotly.newPlot('rel-graph', data);

    }
  }

  function updateInteractionGraph() {
    var score_arr = [];
    var cum_score = 0;
    for (var i = 0; i < rels[selected_name_index].interactions.score.length; i++) {
      cum_score += parseInt(rels[selected_name_index].interactions.score[i]);
      score_arr.push(cum_score)
    }
    console.log(score_arr)
    var selected_data = [
      {
        x: rels[selected_name_index].interactions.time,
        y: score_arr,
        type: 'scatter'
      }
    ]
    $("#rel-plot").html("");
    Plotly.newPlot('rel-plot', selected_data);
  }



})

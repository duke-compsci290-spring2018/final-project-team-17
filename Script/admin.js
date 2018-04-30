

$(document).ready(function() {

    $("#admin-pin-submit").click(function() {
  		var pin = $("#admin-pin-input").val();
  		var temp = window.location.href.split("/");
  		var id = temp[temp.length - 1];

  		if (pin.length <= 0) {
  			alert("PIN cannot be blank!");
  		} else {
  			$.ajax({
  			  method: "POST",
  			  url: "/admin-login",
  			  data: { "pin": pin }
  			}).done(function(msg) {
  			    if (msg["status"]) {
  			    	alert("Hello admin!");
              console.log(msg.userdata)
  			    } else {
  			    	alert("Login failed!");
            }
  			});
      }
  	})

});

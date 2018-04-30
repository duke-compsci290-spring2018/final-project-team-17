
var users;
var usn;
var pin = 0;

function deleteUser(user) {
  usn = $(user).parent().parent().find("td:first-child").text();
}

$(document).ready(function() {

    $("#admin-pin-submit").click(function() {
  		pin = $("#admin-pin-input").val();
  		var temp = window.location.href.split("/");
  		var id = temp[temp.length - 1];

  		if (pin.length <= 0) {
  			alert("PIN cannot be blank!");
  		} else {
        getUsers();
      }
  	})

    function fillUserTable() {

      users.forEach(function(user) {
        var lock_str;
        if (user.locked) {
          lock_str = "Unlock user";
        } else {
          lock_str = "Lock user";
        }
        $("#admin-tbody").append("<tr><td>" + user.username + "</td><td><button class='lock_toggle_btn' type='button' class='btn btn-secondary'>" + lock_str + "</button></td><td><button type='button' class='btn btn-danger' onclick='deleteUser(this)'>Delete User</button></td></tr>")
      })
      $("#admin-table").show();
    }

    $(document).on('click', '.lock_toggle_btn', function(event) {
      toggleLock(event.target);
    })

    function getUsers() {
      $.ajax({
        method: "POST",
        url: "/admin-login",
        data: { "pin": pin }
      }).done(function(msg) {
          if (msg["status"]) {
            alert("Hello admin!");
            users = msg.userdata;
            fillUserTable();
          } else {
            alert("Login failed!");
          }
      });
    }

    function toggleLock(user) {
      usn = $(user).parent().parent().find("td:first-child").text();
      users.forEach(function(user) {
        if (usn == user.username) {
          console.log(user.locked)
          if (user.locked) {
            user.locked = false;
          } else {
            user.locked = true;
          }
          $.ajax({
            method: "POST",
            url: "/unlock-user",
            data: { "username": usn, "lock_status": user.locked }
          }).done(function(msg) {
              if (msg["status"]) {
                alert(msg.msg)
                getUsers();
              } else {
                alert(msg.msg)
              }
          });
        }
      })
    }


});

var app = angular.module("app")
.controller("mainController", ["$scope", "$http", "$rootScope", "$window", "printService", 'FileSaver', 'Blob', '$location', '$interval', function ($scope, $http, $rootScope, $window, printService, FileSaver, Blob, $location, $interval) {

  var innit_login = function() {
    $scope.displayText = "Forgot Password?";
    $scope.displayStyle = "scnd-font-color";
  };
  var login_failed = function() {
    $scope.displayText = "Login unsuccessful ! Please check your email or password.";
    $scope.displayStyle = "material-pink";
  };

  var show_login = function() {
  innit_login();
  $scope.user_email = "";
  $scope.user_password = "";
    jQuery("#divMain").hide();
    jQuery("#divLogin").fadeIn(400);
  };
  var hide_login = function() {
    jQuery("#divLogin").fadeOut(400, function() {
      jQuery("#divMain").fadeIn(400);
    });
  };

  innit_login();

  $scope.performLogin = function() {
      var userInfo = {
        email: $scope.user_email,
        password: $scope.user_password
      };
      if (userInfo.password == 456) {
        login_failed();
      } else {
        $scope.userInfo = userInfo;
        $window.localStorage["cassandra_userInfo"] = JSON.stringify(userInfo);
        hide_login();
      };
    };
  $scope.hide_if_zero = function(array) {
    var len = array.length;
    if (len == 0) {
      return true;
    } else {
      return false;
    };
  };

  $scope.notifications = [
    {
      title: "Version 1.0 publised",
      sender: "Nguyen, Pham",
      action: {
        type: "redirect",
        link: "/personal",
        extra: ""
      }
    },
    {
      title: "New messages received",
      sender: "Hung, Le",
      action: {
        type: "redirect",
        link: "/messages",
        extra: ""
      }
    },
  ];
  $scope.doctors = [];
  $scope.devices = [];
  $scope.messages = [];
  if ($window.localStorage["cassandra_userInfo"]) {
    $scope.userInfo = JSON.parse($window.localStorage["cassandra_userInfo"]);
    hide_login();
    console.log($scope.userInfo);
  };
  $scope.openLaboratory = function() {
    //$location.path("/laboratory");
    $window.open("laboratory.html", "_blank", 'width=1280,height=720');
  };

  $scope.chat_messages = [];

}])
.controller("personalController", ["$scope", "$http", "$rootScope", "$window", "printService", 'FileSaver', 'Blob', '$location', function ($scope, $http, $rootScope, $window, printService, FileSaver, Blob, $location) {
  console.log("personal");
  if ($window.localStorage["cassandra_userInfo"]) {
    $scope.userInfo = JSON.parse($window.localStorage["cassandra_userInfo"]);
  };
  if ($window.localStorage["cassandra_my_ehealth"]) {
    $scope.ehealth = JSON.parse($window.localStorage["cassandra_my_ehealth"]);
  } else {
    $scope.ehealth = {
      fullname: "Pham Khoi Nguyen",
      date_of_birth: "",
      mssid: "VN-HCM-5400KB",
      sex: "Male",
      occupation: "",
      email: $scope.userInfo.email,
      phone: "",
      country: "",
      city: "",
      address_line_1: "",
      address_line_2: "",
      my_doctors: [
        {
          fullname: "Aurora Anfredyla",
          dssid: "US-MANS-4218LA",
          specity: "Heart disease department",
          work_address: "Arizona state hospital, Losangeles, US",
          phone: "+ (32) 916 112 985",
          email: "auro.andres@arizo.com",
        },
      ],
      location: {lat: "", lng: ""},
      medical_history: {
        history_stroke: false,
        obesity: false,
        high_blood_pressure: false,
        alcoholism: false,
      },
      clinical_symptoms: {
        chest_pain: true,
        shortness_of_breath: false,
        severe_sweating: true,
        dizziness: false,
      },
    };
  };
  $scope.updateInfo = function() {
    $window.localStorage["cassandra_my_ehealth"] = JSON.stringify($scope.ehealth);
  };
  var handle_geolocation = function(position) {

  };
  $scope.get_current_location = function() {
    navigator.geolocation.getCurrentPosition(function success(position) {
      $scope.ehealth.location.lat = position.coords.latitude;
      $scope.ehealth.location.lng = position.coords.longitude;
      console.log(position.coords.longitude);
    }, function error(error) {
      alert("This software version does not support geolocation");
    });
  };

  $scope.init_google_map = function() {
    // var uluru = {lat: -25.363, lng: 131.044};
    var map = new google.maps.Map(document.getElementById('google-map'), {
      zoom: 4,
      center: $scope.ehealth.location
    });
    var marker = new google.maps.Marker({
      position: $scope.ehealth.location,
      map: map
    });
  };
  // $scope.get_current_location();
  // $scope.init_google_map();
  $scope.test = function() {
    console.log($scope.ehealth.clinical_symptoms.dizziness);
  }
}])
.controller("recordsController", ["$scope", "$http", "$rootScope", "$window", "printService", 'FileSaver', 'Blob', '$location', '$interval', '$timeout', function ($scope, $http, $rootScope, $window, printService, FileSaver, Blob, $location, $interval, $timeout) {
  jQuery("#upload_record_popup").hide();
  jQuery("#smallPopup_uploadRecord").tinyDraggable({ handle: '.header' });
  $scope.local_server = {
    name: "Local server",
    link: "http://localhost:8000",
  };
  $scope.express_server = {
    name: "Cassandra express server",
    link: "http://localhost:8081",
  };
  $scope.ecg_data = [];
  $scope.file_content = [];
  $scope.record_name = "";
  $scope.record_comment = "";
  $scope.record_sampling_frequency = 100;
  $scope.record_duration = Math.floor($scope.file_content.length / ($scope.record_sampling_frequency) * 10) / 10;
  $scope.record_date = new Date();

  var socket = io.connect($scope.local_server.link);

  $scope.init_chart = function(normal, risk, danger) {
    var chart = new Chartist.Pie('.ct-chart', {
      series: [normal, risk, danger],
      labels: ["Normal", "Risk", "Danger"]
    }, {
      donut: true,
      donutWidth: 42,
      startAngle: 340,
      showLabel: false
    });
    chart.on('draw', function(data) {
      if(data.type === 'slice') {
        // Get the total path length in order to use for dash array animation
        var pathLength = data.element._node.getTotalLength();

        // Set a dasharray that matches the path length as prerequisite to animate dashoffset
        data.element.attr({
          'stroke-dasharray': pathLength + 'px ' + pathLength + 'px'
        });

        // Create animation definition while also assigning an ID to the animation for later sync usage
        var animationDefinition = {
          'stroke-dashoffset': {
            id: 'anim' + data.index,
            dur: 900,
            from: -pathLength + 'px',
            to:  '0px',
            easing: Chartist.Svg.Easing.easeOutQuint,
            // We need to use `fill: 'freeze'` otherwise our animation will fall back to initial (not visible)
            fill: 'freeze'
          }
        };

        // If this was not the first slice, we need to time the animation so that it uses the end sync event of the previous animation
        if(data.index !== 0) {
          animationDefinition['stroke-dashoffset'].begin = 'anim' + (data.index - 1) + '.end';
        }

        // We need to set an initial value before the animation starts as we are not in guided mode which would do that for us
        data.element.attr({
          'stroke-dashoffset': -pathLength + 'px'
        });

        // We can't use guided mode as the animations need to rely on setting begin manually
        // See http://gionkunz.github.io/chartist-js/api-documentation.html#chartistsvg-function-animate
        data.element.animate(animationDefinition, false);
      }
    });

    // For the sake of the example we update the chart every time it's created with a delay of 8 seconds
    chart.on('created', function() {
      if(window.__anim21278907124) {
        clearTimeout(window.__anim21278907124);
        window.__anim21278907124 = null;
      };

    });
  };
  $scope.timer = 0;
  $scope.selected_index = -1;

  $scope.cancel_custom_timeout = function() {
    if ($scope.custom_timeout) {
      $timeout.cancel($scope.custom_timeout);
      $scope.custom_timeout = null;
    };
  };

  $scope.custom_timeout = $timeout(function() {
    if ($window.localStorage["cassandra_records"]) {
      $scope.records = JSON.parse($window.localStorage["cassandra_records"]);
      jQuery("#loading_records_spinner").hide();
    } else {
      $scope.records = [];
      jQuery("#loading_records_spinner").hide();
    };
    $scope.cancel_custom_timeout();
  }, 1600);


  // For communicate with server herokuapp

  // socket.emit("get_all_records_from_text_file");
  //
  // socket.on("get_all_records_from_text_file_succeeded", function(response) {
  //   if (response.text_content) {
  //     $scope.$apply(function() {
  //       $scope.records = JSON.parse(response.text_content);
  //     });
  //
  //   } else {
  //     $scope.$apply(function() {
  //       $scope.records = [];
  //     });
  //   };
  //   jQuery("#loading_records_spinner").hide();
  // });
  //
  // socket.on("get_all_records_from_text_file_failed", function(response) {
  //   alert("Sorry, cassandra cannot get your records. Please allow the software to access your network!");
  //   jQuery("#loading_records_spinner").hide();
  // });
  //
  // $scope.update_my_records_to_local_storage = function(obj) {
  //   if (obj) {
  //     var text_content = JSON.stringify(obj);
  //     socket.emit("update_all_records_on_local_server", { text_content: text_content });
  //   } else {
  //     var text_content = JSON.stringify($scope.records);
  //     socket.emit("update_all_records_on_local_server", { text_content: text_content });
  //   };
  //
  // };

  // socket.on("save_record_to_server_failed", function(response) {
  //   jQuery("#page_loading").hide();
  //   alert("Save record to server failed");
  // });

  // socket.on("update_all_records_to_local_server_failed", function(response) {
  //   jQuery("#page_loading").hide();
  //   alert("Sorry, update all records to text file failed");
  // });
  //
  // socket.on("save_record_to_server_successed", function(response) {
  //
  //   response.record_data.data = [];
  //   $scope.$apply(function () {
  //     $scope.records.push(response);
  //     // $window.localStorage["cassandra_records"] = JSON.stringify($scope.records);
  //     $scope.update_my_records_to_local_storage();
  //   });
  //   alert("Record saved successfully!");
  // });
  //
  // socket.on("update_all_records_to_local_server_successed", function(response) {
  //   jQuery("#page_loading").hide();
  //   $scope.$apply(function() {
  //     $scope.records = JSON.parse(response.records_text);
  //   });
  //   $scope.close_popup_upload_record();
  // });

  // End of server communication with heroku

  $scope.selected_record = {
    name: "No records hovered",
    statistics: [0, 0, 0],
  };

  $scope.cancel_all_timeouts_and_intervals = function() {
    if ($scope.hover_record_timeout) {
      $timeout.cancel($scope.hover_record_timeout);
      $scope.hover_record_timeout = null;
    };
    if ($scope.timer_interval) {
      $interval.cancel($scope.timer_interval);
      $scope.timer_interval = null;
    };
  };

  $scope.display_record_statistics = function(index) {
      $scope.timer = 1;
      $scope.timer_interval = $interval(function() {
        if ($scope.timer > 0) {
          $scope.timer += 1;
        };
        if ($scope.timer == 6) {
          if ($scope.selected_index >= 0) {
            if (index != $scope.selected_index) {
              $scope.selected_record = $scope.records[index];
              $scope.init_chart($scope.selected_record.statistics[0], $scope.selected_record.statistics[1], $scope.selected_record.statistics[2]);
              $scope.cancel_all_timeouts_and_intervals();
              $scope.selected_index = index;
            }
          } else {
            $scope.selected_record = $scope.records[index];
            $scope.init_chart($scope.selected_record.statistics[0], $scope.selected_record.statistics[1], $scope.selected_record.statistics[2]);
            $scope.cancel_all_timeouts_and_intervals();
            $scope.selected_index = index;
          }
        };
      }, 160);
  };
  $scope.mouse_leave_this_record = function() {
    $scope.timer = 0;
    $scope.cancel_all_timeouts_and_intervals();
  };
  $scope.view_this_signal = function(record) {
    var index = $scope.records.indexOf(record);
    $window.localStorage["cassandra_command_lab_to_run_this_signal"] = JSON.stringify($scope.records[index]);
    $window.open("laboratory.html", "_blank", 'width=1280,height=720');
  };

  $scope.delete_this_record = function(index) {
    if (confirm("Delete record " + $scope.records[index].name + "?")) {
      jQuery("#page_loading").show();
      if (index == $scope.records.length - 1) {
        $scope.selected_record = {
          name: "No records hovered",
          statistics: [0, 0, 0],
        };
        $scope.init_chart($scope.selected_record.statistics[0], $scope.selected_record.statistics[1], $scope.selected_record.statistics[2]);
      } else {
        $scope.selected_record = $scope.records[index + 1];
        $scope.init_chart($scope.selected_record.statistics[0], $scope.selected_record.statistics[1], $scope.selected_record.statistics[2]);
      };

      $scope.cancel_all_timeouts_and_intervals();

      $scope.selected_index = index;

      $scope.record = $scope.records[index];
      var record_data_id = $scope.record._id;

      $window.localStorage.removeItem(record_data_id);

      console.log("Remove item: " + record_data_id);

      $scope.records.splice(index, 1);
      $window.localStorage["cassandra_records"] = JSON.stringify($scope.records);

      jQuery("#page_loading").hide();

      $scope.cancel_custom_timeout();

      // $scope.update_my_records_to_local_storage();

    };
  };



  $scope.importPackageFromTextFile = function($fileContent) {
    jQuery("#page_loading").show();
    $scope.custom_timeout = $timeout(function() {
      var result = [];
      var lines = $fileContent.split('\n');
      for(var line = 0; line < lines.length; line++) {
        result.push(lines[line]);
      };
      if ($scope.file_content.length > 0) {
        $scope.file_content = $scope.file_content.concat($fileContent);
        $scope.ecg_data = $scope.ecg_data.concat(result);
      } else {
        $scope.file_content = $fileContent;
        $scope.ecg_data = result;
      };
      $scope.update_ecg_data_and_duration();
      jQuery("#page_loading").hide();
      $scope.cancel_custom_timeout();
    }, 200);
  };

  $scope.update_duration = function() {
    $scope.record_duration = Math.floor($scope.ecg_data.length / ($scope.record_sampling_frequency) * 10) / 10;
  };

  $scope.update_ecg_data_and_duration = function() {
    var result = [];
    var lines = $scope.file_content.split('\n');
    for(var line = 0; line < lines.length; line++) {
      result.push(lines[line]);
    };
    $scope.ecg_data = result;
    $scope.record_duration = Math.floor($scope.ecg_data.length / ($scope.record_sampling_frequency) * 10) / 10;
  };

  $scope.open_popup_upload_record = function() {
    jQuery("#upload_record_popup").show();
    jQuery("#upload_record_popup > form > .div_small_popup").animate({
      top: 100,
      opacity: 1
    }, 400);
  };

  $scope.close_popup_upload_record = function() {
    $scope.file_content = [];
    $scope.record_name = "";
    $scope.record_comment = "";
    $scope.record_sampling_frequency = 100;
    $scope.record_duration = Math.floor($scope.file_content.length / ($scope.record_sampling_frequency) * 10) / 10;
    $scope.record_date = new Date();
    $scope.custom_timeout = $timeout(function () {
      jQuery("#upload_record_popup > form > .div_small_popup").animate({
        top: 140,
        opacity: 0
      }, 400, function() {
        jQuery("#upload_record_popup").hide();
      });
      $scope.cancel_custom_timeout();
    }, 160);
  };

  $scope.save_this_record = function() {
    jQuery("#page_loading").show();
    $scope.custom_timeout = $timeout(function() {
      $scope.new_record = {
        name: $scope.record_name,
        date: $scope.record_date,
        _id: "record__" + Math.floor(Math.random() * 1000000) + "__" + $scope.record_name.split(' ').join('_') + "__" + $scope.record_comment.split(' ').join('_'),
        data_link: $scope.local_server.link + "\\bin\\saved-records\\" + $scope.record_name.split(' ').join('_') + ".txt",
        description: $scope.record_comment,
        clinical_symptoms: {
          chest_pain: false,
          shortness_of_breath: false,
          severe_sweating: false,
          dizziness: false,
        },
        statistics: [0, 0, 0],
        send_to_doctor: false,
      };
      $scope.record_data = {
        _id: $scope.new_record._id,
        sampling_frequency: $scope.record_sampling_frequency,
        data: $scope.ecg_data
      };
      // socket.emit("save_this_record_to_server", $scope.new_record);
      $scope.records.push($scope.new_record);
      $window.localStorage["cassandra_records"] = JSON.stringify($scope.records);
      $window.localStorage[$scope.record_data._id] = JSON.stringify($scope.record_data);
      // console.log($window.localStorage[$scope.record_data.name].length);
      alert("Record uploaded successfully");
      jQuery("#page_loading").hide();
      $scope.cancel_custom_timeout();
      $scope.close_popup_upload_record();
    }, 1600);
  };

  socket.on("save_record_to_server_successed", function(response) {
    $scope.$apply(function() {
      $scope.records.push(response);
    });
  });

}]);

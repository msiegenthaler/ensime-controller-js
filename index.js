var launcher = require("ensime-launcher-js");
var WebSocket = require("ws");

var initialized;
var dotEnsime;
var sbtCmd = "sbt";
var ensimeVersion = "0.9.10-SNAPSHOT";

var connection;
var nextCallId = 0;
var callMap = {};


function setup(dotEnsime_, ensimeInstallDir, options) {
  dotEnsime = dotEnsime_;
  if (options) {
    if (options.sbt) sbtCmd = options.sbt;
    if (options.ensimeVersion) ensimeVersion = options.ensimeVersion;
  }
  launcher.setup(dotEnsime_, ensimeVersion, ensimeInstallDir, sbtCmd);
  initialized = true;
}

function connect(callback) {
  if (!initialized) return callback("Not initialized, please call setup first.");

  //TODO check already running...

  launcher.start(function(err, ports) {
    console.log(callback);
    if (err) return callback(err);

    console.log("ensime now running on port "+ports.http);

    connection = new WebSocket("ws://localhost:"+ports.http+"/jerky");
    connection.on("open", function() {
      console.log("now connected to ensime...");
      status(callback);
    });
    connection.on("message", handleIncoming);
    connection.on("error", function (error) {
      handleGeneral({disconnected: error});
    });
  });
}

function update(callback) {
  launcher.update(callback);
}

/** Send a command to ensime. */
function send(cmd, callback) {
  if (!connection) return callback("connection not open.");

  var callId = nextCallId++;
  callMap[callId] = callback;
  var req = {
    req: cmd,
    callId: callId
  }
  //console.debug("Sending "+JSON.stringify(req));
  connection.send(JSON.stringify(req));
}

/** Handle an incoming message from ensime. */
function handleIncoming(data) {
  var resp = JSON.parse(data);
  if ("callId" in resp) {
    var callback = callMap[resp.callId];
    if (callback) {
      try {
        callback(false, resp.payload);
      } catch (e) {
        console.error("Error in callback: "+e)
      } finally {
        delete callMap[resp.callId];
      }
    }
  } else handleGeneral(resp.payload);
}

function cancelPending(reason) {
  for (key in callMap) {
    callMap[key](reason);
  }
  callMap = {};
}

function handleGeneral(response) {
  //TODO
  console.log("Received general message: "+JSON.stringify(response));
}




function status(callback) {
  if (!initialized) return callback("Not initialized, please call setup first.");

  send({
      typehint: "ConnectionInfoReq"
  }, function(err, result) {
    callback(err, result);
  });
}


function stop(callback) {
  if (!initialized) return callback("Not initialized, please call setup first.");

  cancelPending("connection lost");

  //TODO
  callback("TODO");
}


module.exports = {
  /** Setup the library. Must be called before any other function. */
  setup: setup,

  /** Start ensime and connect to it. */
  connect: connect,

  /** Update ensime. */
  update: update,

  /** Current status of ensime. */
  status: status,

  /** Terminate ensime. */
  stop: stop
};
launcher = require("ensime-launcher-js");

var initialized;
var dotEnsime;

var sbtCmd = "sbt";
var ensimeVersion = "0.9.10-SNAPSHOT";


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

  launcher.start(function(err, port) {
    console.log(callback);
    if (err) return callback(err);

    //TODO
    callback(false, "Ensime now started on port "+port);
  });
}

function update(callback) {
  launcher.update(callback);
}

function status(callback) {
  if (!initialized) return callback("Not initialized, please call setup first.");

  //TODO
  callback("TODO");
}

function stop(callback) {
  if (!initialized) return callback("Not initialized, please call setup first.");

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
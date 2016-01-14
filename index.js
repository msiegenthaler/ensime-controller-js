var Launcher = require("ensime-launcher-js");
var WebSocket = require("ws");


function Controller(dotEnsime, ensimeInstallDir, options) {
  this.dotEnsime = dotEnsime;

  if (options && "sbt" in options) this.sbtCmd = options.sbt;
  else this.sbtCmd = "sbt";
  if (options && "ensimeVersion" in options) this.ensimeVersion = options.ensimeVersion;
  else this.ensimeVersion = "0.9.10-SNAPSHOT";

  this.connection = null;
  this.nextCallId = 0;
  this.callMap = {};

  this.launcher = new Launcher(this.dotEnsime, this.ensimeVersion, ensimeInstallDir, this.sbtCmd);
}

Controller.prototype.connect = function(callback) {
  if (this.connection) return this.status(callback);

  this.launcher.cleanup(function() {
    this.launcher.start(function(err, ports) {
      console.log(callback);
      if (err) return callback(err);

      console.log("ensime now running on port "+ports.http);

      this.connection = new WebSocket("ws://localhost:"+ports.http+"/jerky");
      this.connection.on("open", function() {
        console.log("now connected to ensime...");
        this.status(callback);
      }.bind(this));
      this.connection.on("message", this.handleIncoming.bind(this));
      this.connection.on("error", function (error) {
        this.handleGeneral({disconnected: error});
      }.bind(this));
    }.bind(this));
  }.bind(this));
}

Controller.prototype.update = function(callback) {
  this.launcher.update(callback);
}

/** Send a command to ensime. */
Controller.prototype.send = function(cmd, callback) {
  if (!this.connection) return callback("connection not open.");

  var callId = this.nextCallId++;
  this.callMap[callId] = callback;
  var req = {
    req: cmd,
    callId: callId
  }
  //console.debug("Sending "+JSON.stringify(req));
  this.connection.send(JSON.stringify(req));
}

/** Handle an incoming message from ensime. */
Controller.prototype.handleIncoming = function(data) {
  var resp = JSON.parse(data);
  if ("callId" in resp) {
    if (resp.callId in this.callMap) {
      try {
        this.callMap[resp.callId](false, resp.payload);
      } catch (e) {
        console.error("Error in callback: "+e)
      } finally {
        delete this.callMap[resp.callId];
      }
    }
  } else this.handleGeneral(resp.payload);
}

Controller.prototype.cancelPending = function(reason) {
  for (key in this.callMap) {
    this.callMap[key](reason);
  }
  this.callMap = {};
}

Controller.prototype.handleGeneral = function(response) {
  //TODO
  console.log("Received general message: "+JSON.stringify(response));
}




Controller.prototype.status = function(callback) {
  this.send({
      typehint: "ConnectionInfoReq"
  }, callback);
}


Controller.prototype.stop = function(callback) {
  this.cancelPending("Stop requested.");

  //Disconnect
  if (this.connection) {
    try {
      this.connection.close();
    } catch (e) {
      //ignore
    }
  }

  this.launcher.stop(callback);
}


module.exports = Controller;
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

/** Connect to ensime, starting it first if necessary.
 * @param output {out: Stream, err: Stream}
 * @return {ports: {http: Int}, info: ensime-ConnectionInfo} */
Controller.prototype.connect = function(output, callback) {
  var _this = this
  function doConnect() {
    _this.launcher.cleanup(function() {
      _this.launcher.start(output, function(err, ports) {
        if (err) return callback(err);
        console.log("ensime now running on port " + ports.http);
        _this.connectWebsocket(ports, callback);
      });
    });
  }

  if (_this.connection) {
    return _this.status(function(err, res) {
      if (err) return doConnect();
      callback(false, res);
    });
  } else {
    doConnect();
  }
};

/** Try to attach to a currently running ensime.
 * @return {ports: {http: Int}, info: ensime-ConnectionInfo} */
Controller.prototype.attach = function(callback) {
  this.launcher.ports(function(err, ports) {
    if (err) return callback("not running");
    console.log("Detected ensime on port " + ports.http);
    this.connectWebsocket(ports, callback);
  }.bind(this));
};

Controller.prototype.connectWebsocket = function(ports, callback) {
  this.connection = new WebSocket("ws://localhost:" + ports.http + "/jerky");
  var calledBack = false;
  this.connection.on("open", function() {
    console.log("now connected to ensime...");
    this.status(function(err, data) {
      if (err) return callback(err);
      if (!calledBack) {
        callback(false, {
          ports: ports,
          info: data
        });
        calledBack = true;
      }
    }.bind(this));
  }.bind(this));
  this.connection.on("message", this.handleIncoming.bind(this));
  this.connection.on("error", function(error) {
    if (!calledBack) {
      callback(error);
      calledBack = true;
    } else {
      this.handleGeneral({
        disconnected: error
      });
    }
  }.bind(this));
};

/** Update ensime to the specified version. Can also be used to fix installations.
 * @param output {out: Stream, err: Stream}
 * @return nothing */
Controller.prototype.update = function(output, callback) {
  this.launcher.update(output, callback);
};

/** Send a command to ensime. */
Controller.prototype.send = function(cmd, callback) {
  if (!this.connection) return callback("connection not open.");

  var callId = this.nextCallId++;
  this.callMap[callId] = callback;
  var req = {
    req: cmd,
    callId: callId
  };
  //console.debug("Sending "+JSON.stringify(req));
  this.connection.send(JSON.stringify(req));
};

/** Handle an incoming message from ensime. */
Controller.prototype.handleIncoming = function(data) {
  var resp = JSON.parse(data);
  if ("callId" in resp) {
    if (resp.callId in this.callMap) {
      try {
        this.callMap[resp.callId](false, resp.payload);
      }
      catch (e) {
        console.error("Error in callback: " + e);
      }
      finally {
        delete this.callMap[resp.callId];
      }
    }
  }
  else this.handleGeneral(resp.payload);
};

Controller.prototype.cancelPending = function(reason) {
  var key;
  for (key in this.callMap) {
    this.callMap[key](reason);
  }
  this.callMap = {};
};

Controller.prototype.handleGeneral = function(response) {
  //TODO
  console.log("Received general message: " + JSON.stringify(response));
};




Controller.prototype.status = function(callback) {
  this.send({
    typehint: "ConnectionInfoReq"
  }, callback);
};


Controller.prototype.stop = function(callback) {
  this.cancelPending("Stop requested.");

  //Disconnect
  if (this.connection) {
    try {
      this.connection.close();
    }
    catch (e) {
      //ignore
    }
  }

  this.launcher.stop(callback);
};


module.exports = Controller;
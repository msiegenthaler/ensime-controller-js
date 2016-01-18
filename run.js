// Used for testing and as an example.

var Controller = require("./index");

var stdout = {
  out: process.stdout,
  err: process.stderr
};

if (process.argv.length < 3) {
  return console.error("Specify the .ensime file as the first command line argument.");
}
var dotEnsime = process.argv[2];

var ec = new Controller(dotEnsime, "/tmp/ensime");

ec.connect(stdout, function(err, res) {
  if (err) return console.error(err);

  console.log("========= Connected ==================");
  console.log(res);
  console.log("======================================");

  setTimeout(function() {
    ec.stop(function(err) {
      if (err) return console.error(err);
      console.log("============= Stopped =================");
    });
  }, 20000);
});
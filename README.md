Ensime Controller JS
====================

NPM module that controls the [ENSIME server](https://github.com/ensime/ensime-server). ENSIME is a cross editor platform
for the scala programming language.


API
---
Constructor
  - new Controller(dotEnsime, ensimeInstallDir, options);

The following methods are available:

  - *update(output, callback)*: (Re)download the newest version of ensime.
  - *connect(output, callback)*: Start ENSIME and connect to it. It will cleanup already running but unmanaged instances of ensime.
  - *status(callback)*: Request the current status. Fails if not running, else returns a ConnectionInfo.
  - *send(req, callback)*: Send an rpc request to ENSIME.
  - *stop(callback)*: Disconnect and stop ensime.

Parameters:

  - req: Request to ensime (an RpcRequestEnvelope)
  - output: {out: Stream, err: Stream} => Streams that capture the sysout/syserr of the started process (ensime resp. the installer).
  - callback: function(err, result)

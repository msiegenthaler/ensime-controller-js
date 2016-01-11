Ensime Controller JS
====================

NPM module that controls the [ENSIME server](https://github.com/ensime/ensime-server). ENSIME is a cross editor platform
for the scala programming language.


API
---
Constructor
  - new Controller(dotEnsime, ensimeInstallDir, options);

The following methods are available:

  - *connect(callback)*: Start ENSIME and connect to it.
  - *status(callback)*: Request the current status. Fails if not running, else returns a ConnectionInfo.
  - *send(req, callback)*: Send an rpc request to ENSIME.
  - *stop(callback)*: Disconnect and stop ensime.

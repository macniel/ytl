const fs = require('fs');
const path = require('path');

module.exports = function (options) {
  seneca = options.seneca;
  __rootdir = options.__rootdir;
  const service = require('./logic.js')({ __rootdir: __rootdir });


  /**
   * returns the processes of given user
   */
  this.add({ list: 'processes' }, function (args, done) {
    try {
      const processes = service.listProcesses(args.userId);
      done(null, processes);
    } catch (e) {
      if (e instanceof ReferenceError) {
        done(new Error('Process not found'), null);
      }
    }
  });

  /**
   * returns the process info with a matching processId
   */
  this.add({ info: 'process' }, function (args, done) {
    try {
      done(null, service.getProcess(args.processId, args.userId));
    } catch (e) {
      if (e instanceof ReferenceError) {
        done(new Error('Process not found'), null);
      }
    }
  });

  /**
   * updates or creates a new process with given processId to the given processInfo object
   */
  this.add({ update: 'process' }, function (args, done) {
    try {
      done(null, service.updateProcess(args.processId, args.processInfo, args.userId));
    } catch (e) {
      done(new Error(e.message), null);
    }
  });

  return 'process-info';
};
const fs = require('fs');
const path = require('path');

module.exports = function (options) {
    seneca = options.seneca;
    __rootdir = options.__rootdir;
    const service = require('./services/process-info.js')({__rootdir: __rootdir});

    /**
     * returns the process info with a matching processId
     */
    this.add({ info: 'process' }, function (args, done) {
      try {
        done(null, service.getProcess(args.processId));
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
        done(null, service.updateProcess(args.processId, args.processInfo));
      } catch (e) {
        done(new Error(e.message), null);
      }
    });

    return 'process-info';
};
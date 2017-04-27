const fs = require('fs');
const path = require('path');

var dataStore = [];

function findRecordBy(processId) {
    for (var dataRecord of dataStore) {
        if (dataRecord.processId == processId) {
            return dataRecord;
        }
    }
    return null;
}

function findIndexOfRecordBy(processId) {
    for (var i = 0; i < dataStore.length; ++i) {

        let dataRecord = dataStore[i];
        if (dataRecord.processId == processId) {
            return i;
        }
    }
    return -1;
}

function writeOrCreateFileFromJSON(json) {
    const filepath = path.join(__rootdir, 'uploads', 'processes.json');
    fs.writeFileSync(filepath, JSON.stringify(json));
}

function getDatastoreAsJSON() {
    const filepath = path.join(__rootdir, 'uploads', 'processes.json')
    if (!fs.existsSync(filepath)) {
        return [];
    } else {
        return JSON.parse(fs.readFileSync(filepath));
    }
}

module.exports = function (options) {
    seneca = options.seneca;
    __rootdir = options.__rootdir;
    /**
     * returns the process info with a matching processId
     */
    this.add({ info: 'process' }, function (args, done) {
        dataStore = getDatastoreAsJSON();
        let record = findRecordBy(args.processId);
        if (!record) {
            done(new Error('Process not found'), null);
        } else {
            done(null, record);
        }

    });

    /**
     * updates or creates a new process with given processId to the given processInfo object
     */
    this.add({ update: 'process' }, function (args, done) {
        dataStore = getDatastoreAsJSON();
        let recordIndex = findIndexOfRecordBy(args.processId);
        if (recordIndex > -1) {
            dataStore[recordIndex] = args.processInfo;
        } else {
            dataStore.push(args.processInfo);
        }
        writeOrCreateFileFromJSON(dataStore);
        done(null, args.processInfo);
    });
    return 'process-info';
};
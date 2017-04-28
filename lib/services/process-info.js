const fs = require('fs');
const path = require('path');

module.exports = function(options) {

    const __rootdir = options.__rootdir;

    let dataStore = [];

    const findRecordBy = function(processId) {
        for (var dataRecord of dataStore) {
            if (dataRecord.processId == processId) {
                return dataRecord;
            }
        }
        return null;
    };

    const findIndexOfRecordBy = function(processId) {
        for (var i = 0; i < dataStore.length; ++i) {

            let dataRecord = dataStore[i];
            if (dataRecord.processId == processId) {
                return i;
            }
        }
        return -1;
    }

    const writeOrCreateFileFromJSON = function (json) {
        const filepath = path.join(__rootdir, 'uploads', 'processes.json');
        fs.writeFileSync(filepath, JSON.stringify(json));
    }

    const getDatastoreAsJSON = function() {
        const filepath = path.join(__rootdir, 'uploads', 'processes.json')
        if (!fs.existsSync(filepath)) {
            return [];
        } else {
            return JSON.parse(fs.readFileSync(filepath));
        }
    }

    this.getProcess = function(processId) {
        dataStore = getDatastoreAsJSON();
        let record = findRecordBy(processId);
        if (!record) {
            throw new ReferenceError('Process not found');
        } else {
            return record;
        }

    }

    this.updateProcess = function(processId, processInfo) {
        dataStore = getDatastoreAsJSON();
        let recordIndex = findIndexOfRecordBy(processId);
        if (recordIndex > -1) {
            dataStore[recordIndex] = processInfo;
        } else {
            dataStore.push(processInfo);
        }
        writeOrCreateFileFromJSON(dataStore);
        return processInfo;
    }

    return this;
};

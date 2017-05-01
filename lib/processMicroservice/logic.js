const fs = require('fs');
const path = require('path');

module.exports = function (options) {

    const __rootdir = options.__rootdir;

    let dataStore = [];

    const findRecordBy = function (processId, userId) {
        for (var dataRecord of dataStore) {
            if (dataRecord.processId == processId && dataRecord.processOwnerId == userId) {
                return dataRecord;
            }
        }
        return null;
    };

    const findIndexOfRecordBy = function (processId, userId) {
        for (var i = 0; i < dataStore.length; ++i) {

            let dataRecord = dataStore[i];
            if (dataRecord.processId == processId && dataRecord.processOwnerId == userId) {
                return i;
            }
        }
        return -1;
    }

    const writeOrCreateFileFromJSON = function (json) {
        const filepath = path.join(__rootdir, 'uploads', 'processes.json');
        fs.writeFileSync(filepath, JSON.stringify(json));
    }

    const getDatastoreAsJSON = function () {
        const filepath = path.join(__rootdir, 'uploads', 'processes.json')
        if (!fs.existsSync(filepath)) {
            return [];
        } else {
            return JSON.parse(fs.readFileSync(filepath));
        }
    }

    this.listProcesses = function (userId) {
        dataStore = getDatastoreAsJSON();
        const filteredResult = dataStore.filter((record) => {
            return record.processOwnerId === userId;
        });
        return filteredResult;
    }

    this.getProcess = function (processId, userId) {
        dataStore = getDatastoreAsJSON();
        let record = findRecordBy(processId, userId);
        if (!record) {
            throw new ReferenceError('Process not found');
        } else {
            return record;
        }

    }

    this.updateProcess = function (processId, processInfo, userId) {
        dataStore = getDatastoreAsJSON();
        let recordIndex = findIndexOfRecordBy(processId, userId);
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

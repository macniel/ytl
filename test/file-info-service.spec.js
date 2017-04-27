const expect = require("chai").expect;
const mockery = require("mockery");

mockDb = {};

fsMock = {
    existsSync: (fileName) => {
        return mockDb[fileName] != null;
    },
    writeFileSync: (fileName, content) => {
        mockDb[fileName] = content;
    },
    readFileSync: (fileName) => {
        return mockDb[fileName];
    }
}

pathMock = {
    join: (...parts) => {
        return parts.join('-');
    }
}

let fileInfo = null;

describe('File-Info service', () => {

    before( () => {
        // begin the mockery
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false
        });
        mockery.registerMock('path', pathMock);
        mockery.registerMock('fs', fsMock);

        fileInfo = require("../lib/services/file-info.js")({__rootdir: ''});

        // load Module
    });

    beforeEach( () => {
        // reset mockDb
        mockDb = {};
    })

    after( () => {
        // tear down the mockery
        mockery.disable();
    });

    it('should be able to list some files', () => {
        expect(fileInfo.listFiles().length).equal(0);
    });

    it('should be able to store files', () => {
        const payload = {
            processId: '0',
            posterFile: 'stuff.png',
            file: 'stuff.mov',
            title: 'Stuff',
            type: 'video'
        }
        expect(fileInfo.listFiles().length).equal(0);
        const returnPayload = fileInfo.updateFile(payload);
        expect(returnPayload.created).to.not.be.undefined;
        expect(returnPayload.isVideo).to.be.true;
        expect(returnPayload.isImage).to.be.false;
        expect(returnPayload.isAvailable).to.be.false;
        expect(returnPayload.filePath).to.equal(payload.file);
        expect(returnPayload.title).to.equal(payload.title);
        expect(returnPayload.processId).to.equal(payload.processId);
        expect(fileInfo.listFiles().length).equal(1);
    });

    it('should not be able to overwrite files', () => {
        const payload = {
            processId: '0',
            posterFile: 'stuff.png',
            file: 'stuff.mov',
            title: 'Stuff',
            type: 'video'
        }
        expect(fileInfo.listFiles().length).equal(0);
        const returnPayload = fileInfo.updateFile(payload);
        expect(returnPayload.created).to.not.be.undefined;
        expect(returnPayload.isVideo).to.be.true;
        expect(returnPayload.isImage).to.be.false;
        expect(returnPayload.isAvailable).to.be.false;
        expect(returnPayload.filePath).to.equal(payload.file);
        expect(returnPayload.title).to.equal(payload.title);
        expect(returnPayload.processId).to.equal(payload.processId);
        expect(fileInfo.listFiles().length).to.equal(1);
        fileInfo.updateFile(payload);
        expect(fileInfo.listFiles().length).to.equal(1);
    });

    it('should return specific files', () => {
        const payload = {
            processId: '0',
            posterFile: 'stuff.png',
            file: 'stuff.mov',
            title: 'Stuff',
            type: 'video'
        }
        expect(fileInfo.listFiles().length).equal(0);
        fileInfo.updateFile(payload);
        expect(fileInfo.listFiles().length).to.equal(1);

        const returnPayload = fileInfo.getFile(payload.processId);
        expect(returnPayload.created).to.not.be.undefined;
        expect(returnPayload.isVideo).to.be.true;
        expect(returnPayload.isImage).to.be.false;
        expect(returnPayload.isAvailable).to.be.false;
        expect(returnPayload.filePath).to.equal(payload.file);
        expect(returnPayload.title).to.equal(payload.title);
        expect(returnPayload.processId).to.equal(payload.processId);
        expect( () => { fileInfo.getFile('-5'); } ).to.throw(ReferenceError);
    });

    it('should be able to mark files accessible', () => {
        const payload = {
            processId: '0',
            posterFile: 'stuff.png',
            file: 'stuff.mov',
            title: 'Stuff',
            type: 'video'
        }
        expect(fileInfo.listFiles().length).equal(0);
        fileInfo.updateFile(payload);
        expect(fileInfo.listFiles().length).to.equal(1);

        let returnPayload = fileInfo.getFile(payload.processId);
        expect(returnPayload.processId).to.equal(payload.processId);
        expect(returnPayload.isAvailable).to.be.false;

        fileInfo.markFileForRelease(payload.processId);
        returnPayload = fileInfo.getFile(payload.processId);
        expect(returnPayload.isAvailable).to.be.true;

    });

});

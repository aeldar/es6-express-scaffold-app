(function () {
  'use strict';

  var expect = require('chai').expect;

  describe('Give it some context', function () {
    describe('maybe a bit more context here', function () {
      it('should run here few assertions', function () {
        expect(8-5).to.be.equal(3);
      });
    });
  });
})();

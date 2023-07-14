import * as chai from 'chai';
import { Sunshine } from '../src'
import * as chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

describe('Test Sunshine connection', () => {

    it('should connect to database', async () => {
        await chai.expect(Sunshine.connect('test', 'test', 'test', 'test'))
            .to.eventually.throw;
    })
})

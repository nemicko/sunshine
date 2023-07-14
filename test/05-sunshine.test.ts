import * as chai from 'chai';
import { Sunshine } from '../src'
import * as chaiAsPromised from 'chai-as-promised';
import { Customer } from './models/Customer'
import { Order } from './models/Order'
import { expect } from 'chai'

chai.use(chaiAsPromised);

describe('Test Sunshine connection', () => {

    it('should connect to database', async () => {
        await chai.expect(Sunshine.connect('test', 'test', 'test', 'test'))
            .to.eventually.throw;
    })

    it('should test transactions', async () => {
        const session = Sunshine.startSession();

        try {
            await session.withTransaction(async () => {
                const customer = await Customer.collection().insertOne({ firstname: 'Test' });
                const order = await Order.collection().insertOne({ customer_id: customer.insertedId });

                const result = await Order.findOne<Order>({ _id: order.insertedId });

                expect(result.customer_id).to.exist;
            })
        } finally {
            await session.endSession()
        }
    })
})

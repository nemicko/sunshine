import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised';
import { expect } from 'chai'
import { Customer } from './models/Customer'

chai.use(chaiAsPromised);

describe('Default values tests', () => {
    it('should add default string value', async () => {
        const customer = new Customer();

        await customer.save();

        const _customer = await Customer.findOne<Customer>({ _id: customer._id });
        expect(_customer.nickname).to.equal('test');
    });

    it('should add default number value', async () => {
        const customer = new Customer();

        await customer.save();

        const _customer = await Customer.findOne<Customer>({ _id: customer._id });
        expect(_customer.height).to.equal(0);
    });

  it('should add default date value', async () => {
    const customer = new Customer();

    await customer.save();

    const _customer = await Customer.findOne<Customer>({ _id: customer._id });
    expect(_customer.birth_date).to.exist;
  });
})

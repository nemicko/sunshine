import {Item, Order} from "./models/Order";
import {expect} from "chai";
import {Binary, ObjectId} from "mongodb";
import {Customer} from "./models/Customer";
import {EmbeddedModel} from "../src/EmbeddedModel";
import {Article} from "./models/Article";
import {Sunshine} from "../src/Sunshine";
import {Document} from "../src/Document";
import { LanguageModel } from "./models/LanguageModel";

const events = [];

/**
 * Sunshine V1
 *
 * Copyright (c) Michael Hasler
 */
describe('Basic attribute persistence tests', function () {

    before(done => {
        Sunshine.on("insert", event => events.push(event));
        Sunshine.on("update", event => events.push(event));
        Sunshine.on("query", event => events.push(event));
        done();
    });

    it("Creating DocumentModel and extracting Document", async () => {

        let order = new Order();
        order.customer_id = ObjectId.createFromHexString("58f0c0ac235ea70d83e6c672");
        order._customer = new Customer();
        order._customer.firstname = "Michael";

        await order.save();

        let doc = order.toObject(true);

        return;
    });

    it("Testing correct type persistence", async () => {

        let order = new Order();
        order.created = new Date();
        order.customer_id = ObjectId.createFromHexString("58f0c0ac235ea70d83e6c672");
        order._customer = new Customer();
        order._customer.firstname = "Michael";
        (order as any).testString = "Hello";
        (order as any).num = 232343.2342342;

        await order.save();

        let newOrder = await Order.findOne<Order>({ _id : order._id });

        expect(newOrder.created).to.be.an("Date");
        expect(newOrder.customer_id).to.be.instanceof(ObjectId);
        expect((newOrder as any).testString).to.be.an("string");
        expect((newOrder as any).num).to.be.an("number");

        return;
    });

    it("Properties are updated correctly", async () => {

        const customer = new Customer();
        customer.firstname = "Michael";
        customer.title = "Mr";
        customer.email = "test@test.com";
        await customer.save();

        const update = {
            _id: customer._id.toString(),
            firstname: "Markus",
            lastname: "Müller"
        };

        customer.__elevate(update);

        expect(customer._id).to.be.instanceof(ObjectId);

        await customer.save();

        expect(customer.firstname).to.be.equal("Markus");
        expect(customer.lastname).to.be.equal("Müller");

        return;
    });

    it("Query non existing documents (handling of empty - null results)", async () => {

        let customer = await Customer.findOne({ _id: "null" });

        expect(customer).to.be.null;

    });

    it("Query (multiple) with projection", async () => {

        // find all fields
        let customer = await Customer.find({}).toArray();
        let keys = Object.keys(customer[0]);
        expect(keys.length).to.be.equal(9);

        // find only one field
        customer = await Customer.find({}, { projection: { firstname: true } }).toArray();
        keys = Object.keys(customer[0]);
        expect(keys.length).to.be.equal(3);
    });

    it("Embedded Models are parsed", async() => {

        let order = new Order();
        order.customer_id = ObjectId.createFromHexString("58f0c0ac235ea70d83e6c672");
        order._customer = new Customer();
        order._customer.firstname = "Michael";
        order.items.push(new Item({
            amount: 20,
        }));

        await order.save();

        let orderRecover = await Order.findOne<Order>({ _id: order._id });

        expect(orderRecover.items[0]).to.be.instanceOf(EmbeddedModel);

    });

    it("Update document", async () => {

        const customer = new Customer();
        customer.firstname = "Michael";
        await customer.save();

        // update property
        await Customer.updateOne({ _id : customer._id }, {
            $set: { firstname: "Markus" }
        });

        // find updated model
        const customerUpdated = await Customer.findOne<Customer>({ _id: customer._id });
        expect(customerUpdated.firstname).to.be.equal("Markus");
    });

    it("UpdateOne document", async () => {

        const customer = new Customer();
        customer.firstname = "Michael";
        await customer.save();

        // update property
        await Customer.updateOne({ _id : customer._id }, {
            $set: {
                firstname: "Markus"
            }
        });

        // find updated model
        const customerUpdated = await Customer.findOne<Customer>({ _id: customer._id });
        expect(customerUpdated.firstname).to.be.equal("Markus");
    });

    it("UpdateMany document", async () => {

        const customer = new Customer();
        customer.firstname = "Michael";
        await customer.save();

        // update property
        await Customer.updateMany({ _id : customer._id }, {
            $set: {
                firstname: "Markus"
            }
        });

        // find updated model
        const customerUpdated = await Customer.findOne<Customer>({ _id: customer._id });
        expect(customerUpdated.firstname).to.be.equal("Markus");
    });

    it("Update document (new updateOne)", async () => {

        const customer = new Customer();
        customer.firstname = "Michael";
        await customer.save();

        // update property
        await Customer.updateOne({ _id : customer._id }, {
            $set: { firstname: "Hans" }
        });

        // find updated model
        const customerUpdated = await Customer.findOne<Customer>({ _id: customer._id });
        expect(customerUpdated.firstname).to.be.equal("Hans");
    });

    it("Create document with auto-type parse objectid", async () => {

        const order = new Order();
        (order as any).customer_id = "5a0368ea7bb6ebb9fc10b8e8";

        await order.save();

        const orderSaved = await Order.findOne<Order>({ _id: order._id });
        expect(orderSaved.customer_id).to.be.instanceof(ObjectId);

    });

    it("Child property is saved correctly from basis", async () => {

        const order = new Order();
        order.attributes = {
            customer_id: ObjectId.createFromHexString("5a0368ea7bb6ebb9fc10b8e8")
        };
        await order.save();

        order.__elevate({
            attributes: {
                customer_id: "5a0368ea7bb6ebb9fc10b8e8"
            }
        });
        await order.save();

        const orderSaved = await Order.findOne<Order>({ _id: order._id });
        expect(orderSaved.attributes.customer_id).to.be.instanceof(ObjectId);

    });

    it("Encryption decorator", async () => {

        const article = new Article();
        article.encryptedProperty = "Hello Rijeka";
        article.name = "Test article name";

        await article.save();

        const dbValue = await (new Promise((resolve, reject) => {
            Sunshine.getConnection().collection("articles").findOne({ _id: article._id }).then((article) => {
                resolve(article.encryptedProperty)
            })
        }));

        expect(dbValue).not.to.be.equal("Hello Rijeka");

        const articleLoaded = await Article.findOne<Article>({ _id : article._id });
        expect(articleLoaded.encryptedProperty).to.be.equal("Hello Rijeka");

    });

    it("Decrypt from old version", async () => {

        const old = "U2FsdGVkX19TUsTPbRQ4oqde+oqOKMdtCa5HNTj7CrM=";

        const doc = new Document();
        // @ts-ignore
        const clearText = doc.decrypt(old);

        expect(clearText).to.be.equal("Hello Rijeka");

    });

    it("Binary type is saved and retrieved correctly", async () => {

        const article = new Article();

        const buffer = Buffer.from([1, 2, 3]);
        article.binaryField = new Binary(buffer);
        article.name = "Binary article name"

        await article.save();
        expect(article.binaryField).to.be.instanceOf(Binary);

        const articleSaved = await Article.findOne<Article>({ _id: article._id });
        expect(articleSaved.binaryField).to.be.instanceOf(Binary);

    });

    it("Array with number types", async () => {

        const article = new Article();
        article.name = "Array article name"
        article.numberArray = [1, 2, 3, 4, 5, 6];
        article.numberObjectArray = [{
            data: [10, 2]
        }];
        await article.save();

        const articleSaved = await Article.findOne<Article>({ _id: article._id });
        expect(articleSaved.numberArray[0]).to.be.a("number");
    });

    it("Sorting with Collate", async () => {

        await (new LanguageModel("Alpha")).save();
        await (new LanguageModel("Beta")).save();
        await (new LanguageModel("alpha")).save();

        const allSorted = await LanguageModel.find<LanguageModel>({})
            .sort({"name": 1})
            .collation({
                locale: "de",
                caseLevel: true,
                caseFirst: "lower"
            })
            .toArray();

        expect(allSorted[0].name).equals("alpha");
        expect(allSorted[1].name).equals("Alpha");
        expect(allSorted[2].name).equals("Beta");
    });

    it("Aggregation with options", async () => {

        const allSorted = await LanguageModel.aggregate<LanguageModel>([], {
            collation: {
                locale: "de",
                caseLevel: true,
                caseFirst: "lower"
            }
        }).sort({ name: 1}).toArray();

        expect(allSorted[0].name).equals("alpha");
        expect(allSorted[1].name).equals("Alpha");
        expect(allSorted[2].name).equals("Beta");
    });

    it("Collected Events", async () => {
        expect(events.length).equals(38);
    });

    it("Find with projection", async () => {
        const result = await Customer.find({}, { projection: { _id: false } }).toArray();

        for (const item of result) {
            expect(item._id).to.be.equal(undefined);
        }
    });

    it("Find with chained projection", async () => {
        const result = await Customer.find({}).projection({ _id: false }).toArray();

        for (const item of result) {
            expect(item._id).to.be.equal(undefined);
        }
    });

    it("FindOne with projection", async () => {
        const result = await Customer.findOne({}, { projection: { _id: false } });

        expect(result._id).to.be.equal(undefined);
    });

    it("Array of arrays", async () => {

        const arrayOfArrays = [
            [new ObjectId(), "test" , 3, null, true, "", 0, [1, 2, 3]],
            [
                {
                    id: new ObjectId(),
                    name: "testName",
                    num: 1000,
                    nu: null,
                    bool: true,
                    emptyString: "",
                    arr: [4,5,6]
                },
                [100,200,300],
                null
            ],
        ];

        const article = new Article();
        article.name = 'Array of arrays article name'
        article.arrayOfArrays = arrayOfArrays
        await article.save();

        const articleSaved = await Article.findOne<Article>({ _id: article._id });
        expect(JSON.stringify(arrayOfArrays)).to.be.equal(JSON.stringify(articleSaved.arrayOfArrays));
    });

    it("Delete One", async () => {
        const article = new Article();
        article.name = 'TestArticle';
        await article.save();

        const article2 = new Article();
        article2.name = 'TestArticle';
        await article2.save();

        const deleteArticle = await Article.deleteOne(article._id);
        const findArticle = await Article.findOne(article._id);
        expect(deleteArticle.deletedCount).to.be.equal(1);
        expect(findArticle).to.be.equal(null);


        const deleteArticle2 = await Article.deleteOne({_id: article2._id});
        const findArticle2 = await Article.findOne(article2._id);
        expect(deleteArticle2.deletedCount).to.be.equal(1);
        expect(findArticle2).to.be.equal(null);
    });

    it("Delete many", async () => {
        const article = new Article();
        article.name = 'TestArticle';
        await article.save();

        const article2 = new Article();
        article2.name = 'TestArticle';
        await article2.save();

        const deleteArticles = await Article.deleteMany({name: 'TestArticle'});
        const findArticles = await Article.find({name: 'TestArticle'}).toArray();
        expect(deleteArticles.deletedCount).to.be.equal(2);
        expect(findArticles.length).to.be.equal(0);
    });

    it('should get distinct customer firstnames', async function () {
        const result = await Customer.distinct('firstname', {});

        expect(result.length).to.equal(2);
        expect(result.findIndex((name) => name === 'Hans')).to.be.greaterThan(-1)
        expect(result.findIndex((name) => name === 'Markus')).to.be.greaterThan(-1)
    });

    it('should get distinct customer firstnames with filter', async function () {
        const result = await Customer.distinct('firstname', { lastname: { $exists: true } });

        expect(result.length).to.equal(1);
        expect(result.findIndex((name) => name === 'Markus')).to.be.greaterThan(-1)
    });

});


require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const atlasUri = process.env.ATLAS_URI;
const atlasDBName = process.env.ATLAS_DB_NAME;
const atlasDBLLCollection = process.env.ATLAS_DB_LL_COLLECTION;
const atlasDBDLLCollection = process.env.ATLAS_DB_DLL_COLLECTION;
class LinkedList {
    async init () {

        const uri = atlasUri;
        this.client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        try {
            await this.client.connect();
            console.log('connected to mongo db atlas');
            this.collection = this.client.db(atlasDBName).collection(atlasDBLLCollection);
        }
         catch (err) {
             console.error(err.stack);
         }
    }

    async resetAtlasData () {
        await this.collection.deleteMany({value: { $exists: true}});
    }

    async resetMeta() {
        await this.collection.updateOne(
            {meta: true},
            { $set: { head: null, tail: null }},
            { upsert: true }
        )
    }
    async createNewNode (value) {
        const newNode = await this.collection.insertOne({ value, next: null});
        return newNode;
    }

    async getMeta () {
        const meta = await this.collection.find({meta: true}).next();

        return meta;
    }

    async getHead () {
        const meta =  await this.getMeta();
        return meta.head;
    }

    async setHead (newNodeID) {
        await this.collection.updateOne(
            {meta: true},
            { $set: { head: newNodeID}}
        )
    }
    async setTail (newNodeID) {
        await this.collection.updateOne(
            {meta: true},
            { $set: { tail: newNodeID}}
        )
    }
    async getTail (newNodeID) {
        const meta =  await this.getMeta();
        return meta.tail;
        
    }
    async add(value) {
        const newNode = await this.createNewNode(value);
        const newNodeID = newNode.insertedId;
        const head = await this.getHead();

        //adding a node to an empty linked list
        if (head === null) {
            this.setHead(newNodeID);
            this.setTail(newNodeID);
        } else {
            //adding a node to a non empty linked list
            const tailID = await this.getTail();
            await this.collection.updateOne(
                {_id: tailID},
                { $set: { next: newNodeID } }
            );
        }

        this.setTail(newNodeID);
    }

    async get(index) {
        if (index <= -1) {
            throw new Error('invalid index');
        }

        const head = await this.getHead();
        let currentNode = await this.collection.find({_id: head}).next();
        console.log(currentNode);

        let position = 0;
        //loop through the nodes till we hit the index
        while (position < index) {
            if (currentNode.next === null) {
                throw new Error('index overflow');
            }
            currentNode = await this.collection.find({_id: currentNode.next}).next();
            position++;
        }

        return currentNode;
    }

    
}

// (async function () {
//     try {
//        const linkedList = new LinkedList();
//        await linkedList.init(); 
//        await linkedList.resetAtlasData()
//        await linkedList.resetMeta()
//        await linkedList.add('cat');
//        await linkedList.add('dog');
//        await linkedList.add('turtle');
//        const result = await linkedList.get(1);
//         console.log(result)
//     } catch (error) {
//         console.error(error.stack);
//     }
// })()


class DoublyLinkedList {
    async init () {

        const uri = atlasUri;
        this.client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        try {
            await this.client.connect();
            console.log('connected to mongo db atlas');
            this.collection = this.client.db(atlasDBName).collection(atlasDBDLLCollection);
        }
         catch (err) {
             console.error(err.stack);
         }
    }

    async resetAtlasData () {
        await this.collection.deleteMany({value: { $exists: true}});
    }

    async resetMeta() {
        await this.collection.updateOne(
            {meta: true},
            { $set: { head: null, tail: null }},
            { upsert: true }
        )
    }
    async createNewNode (value) {
        const newNode = await this.collection.insertOne({ value, next: null});
        return newNode;
    }

    async getMeta () {
        const meta = await this.collection.find({meta: true}).next();

        return meta;
    }

    async getHead () {
        const meta =  await this.getMeta();
        return meta.head;
    }

    async setHead (newNodeID) {
        await this.collection.updateOne(
            {meta: true},
            { $set: { head: newNodeID}}
        )
    }
    async setTail (newNodeID) {
        await this.collection.updateOne(
            {meta: true},
            { $set: { tail: newNodeID}}
        )
    }
    async getTail (newNodeID) {
        const meta =  await this.getMeta();
        return meta.tail;
        
    }
    async add(value) {
        const newNode = await this.createNewNode(value);
        const newNodeID = newNode.insertedId;
        const head = await this.getHead();

        //adding a node to an empty linked list
        if (head === null) {
            this.setHead(newNodeID);
            this.setTail(newNodeID);
        } else {
            //adding a node to a non empty linked list
            const tailID = await this.getTail();
            await this.collection.updateOne(
                {_id: tailID},
                { $set: { next: newNodeID } }
            );
        }

        this.setTail(newNodeID);
    }

    async get(index) {
        if (index <= -1) {
            throw new Error('invalid index');
        }

        const head = await this.getHead();
        let currentNode = await this.collection.find({_id: head}).next();
        console.log(currentNode);

        let position = 0;
        //loop through the nodes till we hit the index
        while (position < index) {
            if (currentNode.next === null) {
                throw new Error('index overflow');
            }
            currentNode = await this.collection.find({_id: currentNode.next}).next();
            position++;
        }

        return currentNode;
    }

    
}

(async function () {
    try {
       const doublyLinkedList = new DoublyLinkedList();
       await doublyLinkedList.init(); 
       await doublyLinkedList.resetAtlasData()
       await doublyLinkedList.resetMeta()
    //    await linkedList.add('cat');
    //    await linkedList.add('dog');
    //    await linkedList.add('turtle');
    //    const result = await linkedList.get(1);
        // console.log(result)
    } catch (error) {
        console.error(error.stack);
    }
})()
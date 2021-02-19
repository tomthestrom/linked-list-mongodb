require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
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
    async createNewNode (value, previous=null) {
        const newNode = await this.collection.insertOne({ value, next: null, prev: previous});
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
        const tail = await this.getTail();
        //set the previous of the newNode to the ex-tail, in case it does not exist (the first element) it's just null
        const newNode = await this.createNewNode(value, tail);
        const newNodeID = newNode.insertedId;

        console.log(newNodeID)
        //adding a node to an empty linked list, head set here, tail set after the clause, since it works for both cases
        if (tail === null) {
            this.setHead(newNodeID);
            this.setTail(newNodeID);
        } else {
            await this.collection.updateOne(
                {_id: tail},
                { $set: { next: newNodeID } }
            );
        }

        await this.setTail(newNodeID);
    }
    

    async get(index) {
        if (index <= -1) {
            throw new Error('invalid index');
        }

        const head = await this.getHead();
        let currentNode = await this.collection.find({_id: head}).next();

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


    async getNodeByID(nodeID) {
        return await this.collection.find({_id: nodeID}).next();
    }

    async moveNodeAfterNode(moveNodeID, afterNodeID) {
        const nodeToMove = await this.getNodeByID(moveNodeID);
        const nodeToMoveNextID = nodeToMove.next;
        const nodeToMovePrevID = nodeToMove.prev;

        //move reference of previous node next to point to the next of the node that is moved // working
        await this.collection.updateOne(
        {_id: nodeToMovePrevID},
                { $set: { next: nodeToMoveNextID } }
            );
        //move reference of next node prev to point to the prev of the node that is moved // working
        await this.collection.updateOne(
            {_id: nodeToMoveNextID},
                {$set: { prev: nodeToMovePrevID}}
        );

        const nodeToMoveAfter = await this.getNodeByID(afterNodeID);
        const nodeToMoveAfterNextID = nodeToMoveAfter.next;

        await this.collection.updateOne(
        {_id: afterNodeID},
                { $set: { next: moveNodeID } }
            );
        
        await this.collection.updateOne(
            {_id: nodeToMoveAfterNextID},
                {$set: { prev: moveNodeID}}
        );
        //edit the moved nodes next and prev
        await this.collection.updateOne(
            {_id: moveNodeID},
                {$set: { prev: afterNodeID, next: nodeToMoveAfterNextID}}
        );
    } 
}

(async function () {
    try {
       const doublyLinkedList = new DoublyLinkedList();
       await doublyLinkedList.init(); 
    //    await doublyLinkedList.resetAtlasData()
    //    await doublyLinkedList.resetMeta()
    //    await doublyLinkedList.add('cat');
    //    await doublyLinkedList.add('dog');
    //    await doublyLinkedList.add('turtle');
    //    await doublyLinkedList.add('hippopotamus');
    //    await doublyLinkedList.add('bla');
      const result = await doublyLinkedList.moveNodeAfterNode(ObjectID("60304ef883c0916e199469e1"), ObjectID("60304ef783c0916e199469df"))

    //    const result = await linkedList.get(1);
        // console.log(result)
    } catch (error) {
        console.error(error.stack);
    }
})()
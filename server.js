const express = require('express')
const { graphqlHTTP } = require('express-graphql')

const { PubSub } = require('graphql-subscriptions')
const { makeExecutableSchema } = require('@graphql-tools/schema')
const fs = require('fs');
const path = require('path');

// Subscriptions
const ws = require('ws')
const { useServer } = require('graphql-ws/lib/use/ws');
const { execute, subscribe } = require('graphql');

const pubsub = new PubSub();

const app = express()

const resolvers = {
    Query: {
      info: () => `This is the API of an Activity detected`
    },
  
    Mutation: {
      post: (parent, args, context, info) => {
  
         const newActivity = {
          class: args.class,
          chars: args.chars,
        }
        context.pubsub.publish("NEW_ACTIVITY", newActivity)
        return newActivity
      }
    },
    Subscription: {
        newActivity: {
            subscribe: (parent, args, context) => context.pubsub.asyncIterator("NEW_ACTIVITY"),
            resolve: payload => {
                return payload
              }
        }
    },
}

const typeDefs = fs.readFileSync(path.join('schema.graphql'),'utf8')
const schema = makeExecutableSchema({ typeDefs, resolvers });

app.get('/', (req, res) => res.send('GraphQL Server is running'))

app.use('/graphql', graphqlHTTP(req => ({
    schema,
    context: {
        pubsub
    },
    graphiql: {
        headerEditorEnabled: true
    },
  // ...
})))

// const server = app.listen(4000, () => {
//     console.log(`GraphQL Server running on http://localhost:4000/graphql`)

//     // create and use the websocket server
//     const path = '/subscriptions'
//     const wsServer = new ws.Server({
//         server,
//         path
//     });

//     useServer(
//         {
//             schema,
//             context: {
//                 pubsub
//             },
//             execute,
//             subscribe,
//             onConnect: (ctx) => {
//                 console.log('Connect');
//             },
//             onSubscribe: (ctx, msg) => {
//                 console.log('Subscribe');
//             },
//             onNext: (ctx, msg, args, result) => {
//                 console.debug('Next');
//             },
//             onError: (ctx, msg, errors) => {
//                 console.error('Error');
//             },
//             onComplete: (ctx, msg) => {
//                 console.log('Complete');
//             },
//         },
//         wsServer
//     );
//     console.log(`WebSockets listening on ws://localhost:4000/subscriptions`)
// });

const { createServer } = require("http");
const express = require("express");
const { execute, subscribe } = require("graphql");
const { ApolloServer, gql } = require("apollo-server-express");
const { PubSub } = require("graphql-subscriptions");
const { SubscriptionServer } = require("subscriptions-transport-ws");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const fs = require('fs');
const path = require('path');

const { connect } = require('nats');
const textEncoding = require('text-encoding');

(async () => {
  const PORT = 4000;
  const pubsub = new PubSub();
  const app = express();
  const httpServer = createServer(app);

  // Schema definition
  const typeDefs = fs.readFileSync(
    path.join('schema.graphql'),
    'utf8'
)

  // Resolver map
  const resolvers = {
    Query: {
        info: () => `This is the API of an Activity detected`
    },
    Subscription: {
        newActivity: {
            subscribe: () => pubsub.asyncIterator(["NEW_ACTIVITY"]),
        },
    },
  };

  const schema = makeExecutableSchema({ typeDefs, resolvers });

  const server = new ApolloServer({
    schema,
  });
  await server.start();
  server.applyMiddleware({ app });

  SubscriptionServer.create(
    { schema, execute, subscribe },
    { server: httpServer, path: server.graphqlPath }
  );

  httpServer.listen(PORT, () => {
    console.log(
      `🚀 Query endpoint ready at http://localhost:${PORT}${server.graphqlPath}`
    );
    console.log(
      `🚀 Subscription endpoint ready at ws://localhost:${PORT}${server.graphqlPath}`
    );
  });

class ActivityAPI{
    
  static async start() {
      const nc = await connect({ servers: "nats://164.52.213.244:4222" });
      const sub = nc.subscribe("Activity");
      var TextDecoder = textEncoding.TextDecoder;

      try{
          for await (const m of sub) { 
              const block_str = new TextDecoder().decode(m.data)
              const block_dict = JSON.parse(block_str)
              console.log("The message received : \n", block_dict)
              pubsub.publish("NEW_ACTIVITY", { newActivity: block_dict })
          }
                  
        }
        catch (err) 
        {
            console.log('Ooops!', err)
        }
    } 
}

ActivityAPI.start()

})();

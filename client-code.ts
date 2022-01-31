import { createClient } from 'graphql-ws';
import {ApolloClient, HttpLink, InMemoryCache, gql} from 'apollo-boost'
import { connect } from 'nats';
import textEncoding from 'text-encoding';
import fetch from 'isomorphic-fetch';
import ws from 'ws';
import { GraphQLClient } from 'graphql-request'
import { Injectable, NgZone } from '@angular/core';
import { from, Observable } from 'rxjs';

class ActivityAPI{

    public static async start() {
        const nc = await connect({ servers: "nats://164.52.213.244:4222" });
        const sub = nc.subscribe("activity");

        try{
          for await (const m of sub) { 
              // Converting buffer to string
              var TextDecoder = textEncoding.TextDecoder;
              const block_str = new TextDecoder().decode(m.data)
              console.log("The message received : \n", block_str)
              ActivityAPI.callAPI(block_str)
          }
                  
        }
        catch (err) 
        {
            console.log('Ooops!', err)
        }
    }

    public static callAPI(block_str: string){

      try{
        
        const client = createClient({
            url: 'ws://localhost:4000/graphql',
            webSocketImpl: ws
        });
        
        const endPointUrl = 'http://localhost:4000/graphql'
        const apolloClient = new ApolloClient({
           link: new HttpLink({uri:endPointUrl, fetch}),
           cache:new InMemoryCache()
        });

        const block_dict = JSON.parse(block_str)
        var block_class = block_dict['class']
        var block_chars = block_dict['chars'] // ["1", "A", "H", "4", "4"]
        var block_length = block_chars.length
        var block_string = ""

        if(block_length > 0){
          for (var i = 0; i < block_length; i++){
            block_string = block_string + block_chars[i]
          }
        }
        
        
        console.log("\n", block_class, block_string)

        apolloClient.mutate({
          mutation: gql`
          mutation {
              post(class: "${block_class}", chars: "${block_string}") {
                  class
                  chars
              }
          }
        `,
      })
      .then(result => console.log(result));
      
        // apolloClient.query({
        //     query: gql`
        //     query {
        //         info
        //     }
        //     `,
        // })
        // .then(result => console.log(result));
    }
    catch(error)
    {
      console.log(error)
    }
  }   
}

ActivityAPI.start()

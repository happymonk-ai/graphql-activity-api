
function newActivitySubscribe(parent, args, context, info) {
    return context.pubsub.asyncIterator("NEW_ACTIVITY")
  }
  
  const newActivity = {
    subscribe: newActivitySubscribe,
    resolve: payload => {
      return payload
    },
  }
  
  module.exports = {
    newActivity,
  }
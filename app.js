const express = require('express');
const bodyParser = require('body-parser');
const graphqlHttp = require('express-graphql');


const mongoose = require('mongoose');

const app = express();

const graphqlSchema = require('./graphql/schema/index');
const resolvers = require('./graphql/resolvers/index')

app.use(bodyParser.json());



app.use('/graphql', graphqlHttp({
    schema: graphqlSchema,
    rootValue: resolvers,
    graphiql: true

}));



mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-g380p.mongodb.net/${process.env.MONGO_DB}?retryWrites=true`,
    { useNewUrlParser: true })
    .then(() => {
        app.listen(3000, () => {
            console.log('Listing on port 3000');
        });
    }).catch(err => {
        console.log(err)
    })
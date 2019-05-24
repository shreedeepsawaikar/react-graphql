const express = require('express');
const bodyParser = require('body-parser');
const graphqlHttp = require('express-graphql');
const { buildSchema } = require('graphql');

const Event = require('./models/event');
const User = require('./models/user');

const bcrypt = require('bcryptjs');


const mongoose = require('mongoose');

const app = express();

app.use(bodyParser.json());

const events = eventIds => {
    return Event.find({ _id: { $in: eventIds } })
        .then(events => {
            return events.map(event => {
                return {
                    ...event._doc,
                    _id: event.id,
                    creator: user.bind(this, event.creator)
                }

            })
        })
        .catch(err => {
            throw err
        })
}

const user = userId => {
    return User.findById(userId)
        .then(user => {
            return {
                ...user._doc,
                _id: user.id,
                createdEvents: events.bind(this, user._doc.createdEvents)
            }
        })
        .catch(err => {
            throw err
        });
}

app.use('/graphql', graphqlHttp({
    schema: buildSchema(`
        type Event{
            _id: ID!,
            title: String!,
            description: String!,
            price: Float!
            date: String!,
            creator: User!
        }
        input EventInput {
            title: String!,
            description: String!,
            price: Float!
            date: String!
        }
        type User {
            _id: ID!,
            email: String!,
            password: String,
            createdEvents:[Event!]!
        }

        input UserInput {
            email: String!,
            password: String!
        }
        type RootQuery {
            events: [Event!]!

        }
        type RootMutation {
            createEvent(eventInput: EventInput): Event,
            createUser(userInput: UserInput): User

        }
        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `

    ),
    rootValue: {
        events: () => {
            return Event.find().populate('creator')
                .then((events) => {
                    console.log(events);
                    return events.map(event => {
                        return {
                            ...event._doc,
                            _id: event.id,
                            creator: user.bind(this, event._doc.creator)
                        }
                    })
                })
                .catch((err) => {
                    throw err;
                });
        },

        createEvent: (args) => {
            let createdEvent;
            const event = new Event({
                title: args.eventInput.title,
                description: args.eventInput.description,
                price: +args.eventInput.price,
                date: new Date(args.eventInput.date),
                creator: '5ce7147d159671519845dad4'
            })
            return event
                .save()
                .then((result) => {
                    createdEvent = { ...result._doc, _id: event.id, date: new Date(result._doc.date) }
                    return User.findById('5ce7147d159671519845dad4')

                }).then(user => {
                    if (!user) {
                        throw new Error('Usre does not exists')
                    }
                    user.createdEvents.push(event)
                    return user.save()
                        .then(result => {
                            return createdEvent;
                        })
                })
                .catch((err) => {
                    throw err;
                })
        },
        createUser: args => {
            return User.findOne({ email: args.userInput.email })
                .then(user => {
                    if (user) {
                        throw new Error('Usre already exists')
                    }
                    return bcrypt.hash(args.userInput.password, 12)
                }).then(hashedPassword => {
                    const user = new User({
                        email: args.userInput.email,
                        password: hashedPassword
                    });
                    return user.save().then(result => {
                        console.log(user.id)
                        return { ...result._doc, password: null, _id: user.id }
                    })

                })
                .catch(err => {
                    throw err
                })

        }

    },
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
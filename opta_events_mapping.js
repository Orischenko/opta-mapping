const csv = require('csvtojson');
const fetch = require('isomorphic-fetch');
const _ = require('lodash');

const SOURCE = 'opta_events';
const DATE = process.argv[2];

const postData = body => {
    return fetch(`http://ss2.tjekscores.dk/admin/mapping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })
        .then(res => {
            const { status } = res;
            if (status === 200) {
                console.log( '--> Data was added' );
                return res.json();
            } else {
                throw new Error(`--> Error load status ${status}`);
            }
        })
        .catch(e => {
            console.error(e);
        });
};

const eventsMapping = () => {
    const csvFilePath =`./src/csv/matches.csv`;
    const extMemebers = csv().fromFile(csvFilePath).then(jsonObj => jsonObj);
    const enetMemebers = fetch(`http://ss2.tjekscores.dk/events/soccer/${DATE}?ttId[]=46&locale=da`)
        .then(res => res.json())
        .catch(e => {
            console.error(e);
        });

    Promise.all([extMemebers, enetMemebers])
        .then(res => {
            return res
        })
        .then(data => {
            const [ ext = [], enet = [] ] = data;

            const body = enet.map(event => {
                const match = `${event.homeName} v ${event.awayName}`;
                const extEvent = _.find(ext, {'Match': match});

                if (!extEvent) {
                    console.log( `---> Event not matched ${match}: ${event.eventId}` );
                }

                return {
                    enetParticipantId: event.eventId,
                    extParticipantId: extEvent ? +extEvent['Match ID'] : '-',
                    enetParticipantName: match,
                    extParticipantName: match,
                    source: SOURCE,
                    extra : 'Football'
                }
            });

            postData(body);
            //console.log( '--->', 'body', body );
        })
        .catch(function (err) {
            console.error(err);
            res.status(500).send({});
        });
};

eventsMapping();
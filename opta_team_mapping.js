const csv = require('csvtojson');
const fetch = require('isomorphic-fetch');
const _ = require('lodash');

const SOURCE = 'opta_players';
const TEAM_ID = process.argv[2];

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

const teamMapping = () => {
    const csvFilePath =`./src/csv/${TEAM_ID}.csv`;
    const extMemebers = csv().fromFile(csvFilePath).then(jsonObj => jsonObj);
    const enetMemebers = fetch(`http://ss2.tjekscores.dk/teams/${TEAM_ID}/members?locale=da`).then(res => res.json()).then(res => res.players );

    Promise.all([extMemebers, enetMemebers])
        .then(res => {
            return res
        })
        .then(data => {
            const [ ext = [], enet = [] ] = data;

            const body = enet.map(player => {
                const extPlayer = _.find(ext, {'Player name': player.name});

                if (!extPlayer) {
                    console.log( `---> Player not matched ${player.name}: ${player.id}` );
                }

                return {
                    enetParticipantId: player.id,
                    extParticipantId: extPlayer ? +extPlayer['Player ID'] : '-',
                    enetParticipantName: player.name,
                    extParticipantName:  extPlayer ? extPlayer['Player name'] : '-',
                    source: SOURCE,
                    extra : 'Football'
                }
            });

            postData(body);
            //console.log( '--->', 'body', body );
        })
        .catch(function (err) {
            log.err(err);
            res.status(500).send({});
        });
};

teamMapping();
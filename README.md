# Stepmania 5 Highscore server
Just a simple [Express](https://expressjs.com/) server that stores stepmania scores. Developed in Node 16.15.0

## Setup
1. Run `npm ci --omit=dev` to install the dependencies
2. Make 2 directories in the root folder. `_backup` and `scores`
3. (Optional) Set environmental variable `PORT` to run the server at different port (Default: 8765)

## Information
`scores` directory will be used to store all the submitted scores

`_backup` directory will be used to store backups of each submitted scores through `POST /submitScore`

By default, each endpoints will be given 200mb payload limit, if you needed more or less, please do configure yourself in the code

## Start the server
```
npm start
```

## Available Endpoints
The server uses port `8765` by default
| Endpoint | Content-Type | Query/Body |
| -------- | -------------| ----------------------- |
| GET /getPackAliases | - | - |
| GET /getScores | GET query | r_song, r_pack, r_diff, sort |
| POST /submitScore | text/plain; charset=UTF-8 | xml data from Stats.xml | 
| POST /submitScoreIndividual | x-www-form-urlencoded | player,pack,song,Difficulty,DateTime,Disqualified,Grade,MaxCombo,Modifiers,PercentDP,Score,HitMine,AvoidMine,CheckpointMiss,Miss,W5,W4,W3,W2,W1,CheckpointHit,OK |

## Sample score submission (using curl)
```
curl -H "Content-Type: text/plain; charset=UTF-8" --data-binary "@Stats.xml" localhost:8765/submitScore
```
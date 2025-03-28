import "dotenv/config"
import { format } from "date-fns"

import Summary from "./models/Summary"
import DbMoratense from "./database/connectionManagerHomeLab"

const execute = async () => {
  const db = DbMoratense.getConnection()
  const [trips] = await db.raw(`
    SELECT
      tripId,
      tripStart,
      tripEnd,
      assetId,
      driverId
    FROM
      trips
    WHERE
      tripId NOT IN (
        select
          tripId
        from
          trip_events_resume
      ) and
      tripStart between CURDATE() - INTERVAL 8 DAY AND CURDATE() - INTERVAL 1 DAY
    ORDER BY
      tripStart desc
  `)

  for await (const trip of trips) {
    const eventos = await Summary.getEventsByAssetAndDriver({
      start: format(new Date(trip.tripStart), "yyyy-MM-dd HH:mm:ss"),
      end: format(new Date(trip.tripEnd), "yyyy-MM-dd HH:mm:ss"),
      assetId: trip.assetId,
      driverId: trip.driverId,
    })

    if (eventos.length > 0) {
      for await (const evento of eventos) {
        console.log(`${trip.tripId} - ${evento.description}`)

        await db.raw(`
          INSERT INTO
            trip_events_resume (driverId, assetId, tripId, quantity, description, totalOccurances, eventTypeId, code)
          VALUES
            (${trip.driverId}, ${trip.assetId}, ${trip.tripId}, ${Number.parseInt(evento.qtd, 10)}, '${evento.description}', ${Number.parseInt(evento.totalOccurances, 10)}, ${evento.eventTypeId}, ${evento.code})
        `)
      }
    }
    if (eventos.length === 0) {
      await db.raw(`
        INSERT INTO
          trip_events_resume (driverId, assetId, tripId, quantity, description, totalOccurances, eventTypeId, code)
        VALUES
          (${trip.driverId}, ${trip.assetId}, ${trip.tripId}, 0, '(RT) Fora da Faixa Verde', 0, -7417774485302453264, 1124)
      `)
    }
  }

  process.exit(0)
}

execute()

import "dotenv/config"
import express from "express"
import morgan from "morgan"
import cors from "cors"

import authRoutes from "./routes/authRoutes"
import reportRoutes from "./routes/reportRoutes"
import dataRoutes from "./routes/dataRoutes"
import eventsRoutes from "./routes/eventsRoutes"
import chassiRoutes from "./routes/chassiRoutes"
import driverRoutes from "./routes/driverRoutes"
import busLinhaRoutes from "./routes/busLinhaRoutes"
import assetRoutes from "./routes/assetRoutes"

import responseError from "./middleware/response-error"

const app = express()
const port = process.env.PORT || 3000

app.use(cors())
app.use(morgan("dev"))
app.use(express.json({ limit: "200mb" }))
app.use(express.urlencoded({ extended: true, limit: "200mb" }))
app.use(authRoutes)
app.use(dataRoutes)
app.use(reportRoutes)
app.use(eventsRoutes)
app.use(chassiRoutes)
app.use(driverRoutes)
app.use(busLinhaRoutes)
app.use(assetRoutes)

app.use(responseError)

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})

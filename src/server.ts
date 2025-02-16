import "dotenv/config"
import express from "express"
import morgan from "morgan"
import cors from "cors"

import reportRoutes from "./routes/reportRoutes"
import responseError from "./middleware/response-error"

const app = express()
const port = process.env.PORT || 3000

app.use(cors())
app.use(morgan("dev"))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(reportRoutes)

app.use(responseError)

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})

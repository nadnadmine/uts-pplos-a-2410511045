require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const gatewayRoutes = require("./routes/gatewayRoutes");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use(rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),
  max: Number(process.env.RATE_LIMIT_MAX || 60),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later" }
}));

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "gateway" });
});

app.use(gatewayRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || "Internal server error"
  });
});

app.listen(port, () => {
  console.log(`API Gateway running on port ${port}`);
});

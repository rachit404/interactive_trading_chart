import axios from "axios";

export const mockOHLC = [
  { time: "2025-06-01", open: 100, high: 110, low: 90, close: 105 },
  { time: "2025-06-02", open: 105, high: 120, low: 100, close: 115 },
  { time: "2025-06-03", open: 115, high: 125, low: 110, close: 112 },
  { time: "2025-06-04", open: 112, high: 118, low: 108, close: 110 },
];

export const fetchBinanceOHLC = async (
  symbol = "BTCINR",
  interval = "1d",
  limit = 10
) => {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

  try {
    const response = await axios.get(url);
    const data = response.data;

    return data.map((d) => ({
      time: new Date(d[0]).toISOString().split("T")[0],
      open: parseFloat(d[1]),
      high: parseFloat(d[2]),
      low: parseFloat(d[3]),
      close: parseFloat(d[4]),
    }));
  } catch (error) {
    console.error("Error in fetchBinanceOHLC:", error);
  }
};

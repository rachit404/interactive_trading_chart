# Interactive Trading Chart - Binance BTCUSDT Data

This project is an interactive chart that visualizes historical trading data of BTC/USDT from Binance using `Chart.js`. The chart allows users to view and draw trendlines on the candlestick chart, which represents the open, high, low, and close prices of BTC/USDT over a given time interval.

## Project Setup

### Prerequisites

Ensure that you have the following installed:

- **Node.js** (v14 or higher)
- **npm** (Node Package Manager)

### Install Dependencies

1. Clone the repository to your local machine:

2. Install the project dependencies using npm:

   ```bash
   npm install
   ```

### Running Locally

To run the project locally, follow these steps:

1. After installing the dependencies, run the following command to start the development server:

   ```bash
   npm run dev
   ```

## Dependencies

Here is a list of the main dependencies used in this project:

- `@tailwindcss/vite`: A Vite plugin for Tailwind CSS support.
- `axios`: HTTP client to fetch data from Binance API.
- `chart.js`: JavaScript library for rendering interactive charts.
- `chartjs-adapter-date-fns`: Date adapter for `chart.js` to handle time-based scales.
- `chartjs-chart-financial`: Extension for `chart.js` to support financial charts (e.g., candlestick charts).
- `chartjs-plugin-annotation`: Plugin for drawing annotations (trendlines).
- `date-fns`: Utility for date manipulation and formatting.
- `react`: JavaScript library for building user interfaces.
- `react-dom`: React's package for DOM-specific methods.
- `tailwindcss`: Utility-first CSS framework for rapid UI development.

## Approach & Assumptions

1. **Binance Data Fetching:**

   - The `fetchBinanceOHLC` function is used to fetch historical trading data from the Binance API. The data includes open, high, low, close prices, and the time of each candlestick.

2. **Charting with Chart.js:**

   - We use `chart.js` for rendering a candlestick chart and displaying the BTC/USDT price data.
   - The `chartjs-chart-financial` plugin is used to render candlestick charts, while `chartjs-plugin-annotation` is used to allow users to draw trendlines on the chart.

3. **Interactive Trendlines:**

   - Users can draw trendlines on the chart by clicking two points (start and end).
   - Users can also drag and adjust the trendlines after drawing them.
   - Delete all trendlines with a single button click.

4. **Data Interval & Limit:**

   - Users can change the interval (e.g., 1 day, 1 hour) and the limit (the number of data points to fetch) through input fields.
   - After setting the desired interval and limit, users can click the "Go" button to fetch data and update the chart.

5. **Responsive UI:**
   - Tailwind CSS is used for styling the UI, making it responsive and mobile-friendly.

## How to Use

1. **Set the Interval:**

   - Choose the time interval for the candlestick data (e.g., `1d`, `1h`).

2. **Set the Limit:**

   - Choose the number of data points to fetch (e.g., 20).

3. **Fetch Data:**

   - After setting the interval and limit, click the **Go** button to fetch the data and display it on the chart.

4. **Draw Trendlines:**

   - Click on two points on the chart to draw a trendline. You can move the points by dragging them.

5. **Reset Trendlines:**

   - Click the **Reset Trendlines** button to remove all drawn trendlines.

## Notes

- The trendline coordinates are logged to the console when a trendline is created or removed.

## Troubleshooting

- If you encounter issues with fetching data, make sure you have an active internet connection.
- Check the browser's developer console for any error messages related to the API request or chart rendering.

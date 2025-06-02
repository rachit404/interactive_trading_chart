import { useEffect, useRef, useState } from "react";
import { fetchBinanceOHLC } from "../utils/data.js";
import useLocalStorage from "../utils/useLocalStorage.js";
import Table from "./Table.jsx";
import {
  Chart,
  TimeScale,
  LinearScale,
  Tooltip,
  Title,
  Filler,
  Legend,
} from "chart.js";
import "chartjs-adapter-date-fns";
import {
  CandlestickController,
  CandlestickElement,
} from "chartjs-chart-financial";
import { set } from "date-fns";

Chart.register(
  TimeScale,
  LinearScale,
  Tooltip,
  Title,
  Filler,
  Legend,
  CandlestickController,
  CandlestickElement
);

const ChartComponent = () => {
  const [data, setData] = useState([]);
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [interval, setInterval] = useState("1d");
  const [limit, setLimit] = useState(20);
  const canvasRef = useRef(null);
  const [trendlines, setTrendlines] = useLocalStorage("trendlines", []);
  const [clicks, setClicks] = useState([]);
  const [dragging, setDragging] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [callAPI, setCallAPI] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [displayType, setDisplayType] = useState(true);

  const getDataCoordinates = (event, chartInstance) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return {
      x: chartInstance.scales.x.getValueForPixel(x),
      y: chartInstance.scales.y.getValueForPixel(y),
    };
  };

  const handleGo = () => {
    if (!symbol || !interval || !limit) {
      alert("Please fill in all fields.");
      return;
    }
    setCallAPI(true);
    setData([]); // Clear previous data
    setTrendlines([]); // Clear previous trendlines
  };

  const handleDoubleClick = (event) => {
    const chartInstance = Chart.getChart(canvasRef.current);
    const { x, y } = getDataCoordinates(event, chartInstance);
    const hitRadius = 10;

    let clickedIndex = null;

    // Iterate over current trendlines to find closest one
    trendlines.forEach((line, index) => {
      const distToStart = Math.hypot(x - line.start.x, y - line.start.y);
      const distToEnd = Math.hypot(x - line.end.x, y - line.end.y);

      if (distToStart < hitRadius || distToEnd < hitRadius) {
        clickedIndex = index;
      }
    });

    if (clickedIndex !== null) {
      const clickedLine = trendlines[clickedIndex];

      // Optional: Remove the clicked trendline on double-click
      setTrendlines((prev) => prev.filter((_, i) => i !== clickedIndex));
      setSelectedIndex(null);

      // Format and log coordinates
      const formatTimestamp = (ts) => new Date(ts).toLocaleString();
      const start = clickedLine.start;
      const end = clickedLine.end;

      console.log(
        "Double-clicked Trendline:\n Start:",
        {
          x: start.x,
          time: formatTimestamp(start.x),
          y: start.y,
        },
        "\n End:",
        {
          x: end.x,
          time: formatTimestamp(end.x),
          y: end.y,
        }
      );
    } else {
      console.log("❌ No trendline matched for deletion");
    }
  };

  const handleCanvasClick = (event) => {
    const chartInstance = Chart.getChart(canvasRef.current);
    const { x, y } = getDataCoordinates(event, chartInstance);

    if (clicks.length === 1) {
      setTrendlines((prev) => [...prev, { start: clicks[0], end: { x, y } }]);
      console.log("coordinates are:", { start: clicks[0], end: { x, y } });
      setClicks([]);
    } else {
      setClicks([{ x, y }]);
    }
  };

  const handleMouseDown = (event) => {
    const chartInstance = Chart.getChart(canvasRef.current);
    const { x, y } = getDataCoordinates(event, chartInstance);

    const hitRadius = 10;
    for (let i = 0; i < trendlines.length; i++) {
      const { start, end } = trendlines[i];
      const distStart = Math.hypot(x - start.x, y - start.y);
      const distEnd = Math.hypot(x - end.x, y - end.y);
      if (distStart < hitRadius) {
        setDragging({ index: i, point: "start" });
        return;
      } else if (distEnd < hitRadius) {
        setDragging({ index: i, point: "end" });
        return;
      }
    }
  };

  const handleMouseMove = (event) => {
    const canvas = canvasRef.current;
    const chartInstance = Chart.getChart(canvas);
    const { x, y } = getDataCoordinates(event, chartInstance);
    if (!dragging) {
      let found = false;
      for (let i = 0; i < trendlines.length; i++) {
        const line = trendlines[i];
        const distanceToStart = Math.hypot(x - line.start.x, y - line.start.y);
        const distanceToEnd = Math.hypot(x - line.end.x, y - line.end.y);

        if (distanceToStart < 10 || distanceToEnd < 10) {
          found = true;
          canvas.style.cursor = "grab";
          setHoveredPoint({ index: i });
          break;
        }
      }

      if (!found) {
        canvas.style.cursor = "default";
        setHoveredPoint(null);
      }
      return;
    }

    setTrendlines((prev) => {
      const updated = [...prev];
      updated[dragging.index] = {
        ...updated[dragging.index],
        [dragging.point]: { x, y },
      };
      return updated;
    });
  };

  const handleMouseUp = () => setDragging(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchBinanceOHLC(symbol, interval, limit);
        if (Array.isArray(result)) setData(result);
        else throw new Error("Unexpected data format");
      } catch (err) {
        console.error("Error loading data:", err);
      }
    };
    loadData();
    setCallAPI(false);
  }, [callAPI, displayType]);

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;

    const ctx = canvasRef.current.getContext("2d");
    const candlestickData = data.map((point) => ({
      x: new Date(point.time).getTime(),
      o: point.open,
      h: point.high,
      l: point.low,
      c: point.close,
    }));

    const trendlinePlugin = {
      id: "customTrendline",
      afterDraw: (chart) => {
        const ctx = chart.ctx;
        trendlines.forEach((line) => {
          const startX = chart.scales.x.getPixelForValue(line.start.x);
          const startY = chart.scales.y.getPixelForValue(line.start.y);
          const endX = chart.scales.x.getPixelForValue(line.end.x);
          const endY = chart.scales.y.getPixelForValue(line.end.y);

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.strokeStyle = "black";
          ctx.lineWidth = 2;
          ctx.stroke();

          // Draw draggable handles
          ctx.beginPath();
          ctx.arc(startX, startY, 6, 0, 2 * Math.PI);
          ctx.arc(endX, endY, 6, 0, 2 * Math.PI);
          ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
          ctx.fill();
          ctx.restore();
        });
      },
    };

    const chart = new Chart(ctx, {
      type: "candlestick",
      data: {
        datasets: [
          {
            label: `${symbol} Price`,
            data: candlestickData,
            parsing: false,
            borderColor: "black",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: "time",
            time: { unit: "day", tooltipFormat: "PPP" },
            title: { display: true, text: "Date" },
          },
          y: {
            title: { display: true, text: "Price (USDT)" },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const ohlc = ctx.raw;
                return [
                  `Open: $${ohlc.o}`,
                  `High: $${ohlc.h}`,
                  `Low: $${ohlc.l}`,
                  `Close: $${ohlc.c}`,
                ];
              },
            },
          },
        },
      },
      plugins: [trendlinePlugin],
    });
    return () => chart.destroy();
  }, [data, trendlines, displayType]);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.addEventListener("click", handleCanvasClick);
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("dblclick", handleDoubleClick);

    return () => {
      canvas.removeEventListener("click", handleCanvasClick);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("dblclick", handleDoubleClick);
    };
  }, [clicks, trendlines, dragging]);

  return (
    <div className="w-full h-full p-20">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Interactive Trading Chart
      </h1>
      <div className="flex flex-col md:flex-row md:items-end items-start gap-4 p-6 bg-gray-50 rounded-xl shadow-lg border border-gray-200">
        {/* Interval Input */}
        <div className="flex flex-col w-full md:w-auto">
          <label
            htmlFor="interval"
            className="mb-1 text-sm font-medium text-gray-800"
          >
            Interval
          </label>
          <input
            id="interval"
            type="text"
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            placeholder="e.g., 1d, 1h"
            className="border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none rounded-md px-3 py-2 w-full md:w-36 text-sm"
          />
        </div>

        {/* Limit Input */}
        <div className="flex flex-col w-full md:w-auto">
          <label
            htmlFor="limit"
            className="mb-1 text-sm font-medium text-gray-800"
          >
            Limit
          </label>
          <input
            id="limit"
            type="number"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            placeholder="e.g., 20"
            className="border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none rounded-md px-3 py-2 w-full md:w-24 text-sm"
          />
        </div>

        {/* Go Button */}
        <button
          onClick={handleGo}
          className="bg-white border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold px-5 py-2.5 rounded-md shadow-sm transition-colors duration-300 text-sm"
        >
          Go
        </button>

        {/* Toggle Display Button */}
        <button
          onClick={() => setDisplayType(!displayType)}
          className="bg-white border border-pink-600 text-pink-600 hover:bg-pink-600 hover:text-white font-semibold px-5 py-2.5 rounded-md shadow-sm transition-colors duration-300 text-sm"
        >
          {displayType ? "Table" : "Chart"}
        </button>
      </div>

      {displayType ? (
        <>
          <h2 className="pt-5 text-2xl font-semibold mb-4">
            Click to draw trendlines
          </h2>
          <div className="flex justify-between w-[95%] mb-4">
            {trendlines.length == 0 ? null : (
              <>
                <button
                  type="button"
                  onClick={() => setTrendlines([])}
                  className="bg-white border border-teal-600 text-teal-600 hover:bg-teal-500 hover:text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-300 mb-4"
                >
                  Reset TrendLines
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTrendlines((prev) => prev.slice(0, -1));
                  }}
                  className="bg-white border border-red-600 text-red-600 hover:bg-red-600 hover:text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-300 mb-4"
                >
                  Delete Last
                </button>
              </>
            )}
          </div>

          <div className="relative w-[95%] h-[800px] mb-8 bg-gray-100 rounded shadow flex items-center justify-center border-2 border-gray-300">
            <canvas className="p-4" ref={canvasRef}></canvas>
          </div>
        </>
      ) : (
        <Table data={data} />
      )}
    </div>
  );
};

export default ChartComponent;

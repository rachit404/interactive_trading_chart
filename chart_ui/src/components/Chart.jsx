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

  const handleDoubleClick = (event) => {
    const chartInstance = Chart.getChart(canvasRef.current);
    const { x, y } = getDataCoordinates(event, chartInstance);
    const hitRadius = 10;
    setTrendlines((prev) =>
      prev.filter(
        (item) =>
          !(
            item.start.x === x &&
            item.start.y === y &&
            item.end.x === x &&
            item.end.y === y
          )
      )
    );

    for (let i = 0; i < trendlines.length; i++) {
      const { start, end } = trendlines[i];

      const distToStart = Math.hypot(x - start.x, y - start.y);
      const distToEnd = Math.hypot(x - end.x, y - end.y);

      if (distToStart < hitRadius || distToEnd < hitRadius) {
        const formatTimestamp = (ts) => {
          const d = new Date(ts);
          return d.toLocaleString();
        };

        const startTime = formatTimestamp(start.x);
        const endTime = formatTimestamp(end.x);

        console.log("🟩 Trendline Coordinates:");
        console.log("Start →", { time: startTime, price: start.y });
        console.log("End   →", { time: endTime, price: end.y });

        // alert(
        //   `Trendline:\nStart → ${startTime}, $${start.y}\nEnd → ${endTime}, $${end.y}`
        // );

        break;
      }
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
  }, [callAPI]);

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
  }, [data, trendlines]);

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
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 bg-gray-100 rounded-lg shadow-md">
        {/* Interval Input */}
        <div className="flex flex-col">
          <label
            htmlFor="interval"
            className="mb-1 text-sm font-medium text-gray-700"
          >
            Interval
          </label>
          <input
            id="interval"
            type="text"
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            placeholder="e.g., 1d, 1h"
            className="border border-gray-300 rounded px-3 py-2 w-full md:w-32"
          />
        </div>

        {/* Limit Input */}
        <div className="flex flex-col">
          <label
            htmlFor="limit"
            className="mb-1 text-sm font-medium text-gray-700"
          >
            Limit
          </label>
          <input
            id="limit"
            type="number"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            placeholder="e.g., 20"
            className="border border-gray-300 rounded px-3 py-2 w-full md:w-20"
          />
        </div>

        <button
          onClick={handleGo}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded shadow transition"
        >
          Go
        </button>
      </div>
      <Table data={data} />
      <h2 className="text-2xl font-semibold mb-4">Click to draw trendlines</h2>
      <button
        onClick={() => setTrendlines([])}
        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 mb-6"
      >
        Reset TrendLines
      </button>
      <div className="relative w-[95%] h-[800px] mb-8 bg-gray-100 rounded shadow flex items-center justify-center border-2 border-gray-300">
        <canvas className="p-4" ref={canvasRef}></canvas>
      </div>
    </div>
  );
};

export default ChartComponent;

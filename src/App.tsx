import { useRef, useEffect } from "react";
import * as d3 from "d3";
import { MOCK_DATA } from "./mock-data";

// Define the types for our data structures
export type DataPoint = [number, number | number[] | null | (number | null)[]];

interface SeriesData {
  title: string;
  data: DataPoint[];
}

const chartData: SeriesData[] = MOCK_DATA;

interface ChartProps {
  title: string;
  data: DataPoint[];
}

const Chart: React.FC<ChartProps> = ({ title, data }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    d3.select(svgRef.current).selectAll("*").remove();

    const margin = { top: 30, right: 20, bottom: 40, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const firstNonNullDataPoint = data.find((d) => d[1] !== null);
    if (!firstNonNullDataPoint) {
      console.error("No valid data points to render a chart.");
      return;
    }
    const isMultiSeries = Array.isArray(firstNonNullDataPoint[1]);

    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d[0] as number) as [number, number])
      .range([0, width]);

    let yDomain: [number, number];

    if (isMultiSeries) {
      const allValues = data.flatMap(
        (d) => (d[1] as (number | null)[]).filter((v) => v !== null) as number[]
      );
      const min = d3.min(allValues);
      const max = d3.max(allValues);
      yDomain = [min !== undefined ? min : 0, max !== undefined ? max : 1];
    } else {
      const validDataPoints = data.filter(
        (d): d is [number, number] => typeof d[1] === "number"
      );
      if (validDataPoints.length > 0) {
        yDomain = d3.extent(validDataPoints, (d) => d[1]) as [number, number];
      } else {
        yDomain = [0, 1];
      }
    }

    const yScale = d3.scaleLinear().domain(yDomain).nice().range([height, 0]);

    // x axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    // y axis
    svg.append("g").call(d3.axisLeft(yScale));

    if (isMultiSeries) {
      const colors = ["#3B82F6", "#22C55E", "#EF4444"];
      const seriesCount = (firstNonNullDataPoint[1] as number[]).length;

      for (let i = 0; i < seriesCount; i++) {
        const line = d3
          .line<DataPoint>()
          .defined((d) => (d[1] as number[])?.[i] !== null)
          .x((d) => xScale(d[0]))
          .y((d) => yScale((d[1] as number[])[i]));

        svg
          .append("path")
          .datum(data)
          .attr("fill", "none")
          .attr("stroke", colors[i])
          .attr("stroke-width", 2)
          .attr("d", line);
      }
    } else {
      const line = d3
        .line<DataPoint>()
        .defined((d) => d[1] !== null)
        .x((d) => xScale(d[0]))
        .y((d) => yScale(d[1] as number));

      svg
        .append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#3B82F6")
        .attr("stroke-width", 2)
        .attr("d", line);
    }
    // chart title
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .attr("class", "font-sans text-lg font-bold text-gray-800")
      .text(title);
  }, [data, title]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl hover:shadow-2xl transition-shadow duration-300">
      <svg ref={svgRef}></svg>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <div className="bg-gray-100 min-h-screen p-8 font-sans flex flex-col items-center space-y-8">
      <h1 className="text-4xl font-extrabold text-gray-800 mb-4">
        Line Charts
      </h1>
      <p className="text-gray-600 mb-8">
        This application dynamically renders charts based on the data format.
      </p>
      {chartData.map((chart, index) => (
        <Chart key={index} title={chart.title} data={chart.data} />
      ))}
    </div>
  );
};

export default App;

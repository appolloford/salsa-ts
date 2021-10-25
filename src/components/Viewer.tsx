import { useRef, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import HC_exporting from 'highcharts/modules/exporting';

HC_exporting(Highcharts);

const Viewer = (props: any) => {
  const chartComponentRef = useRef<HighchartsReact.RefObject>(null);
  const [cursorX, setCursorX] = useState(0);
  const [cursorY, setCursorY] = useState(0);

  const handleMouseMove = (event: any) => {
    // const chart = event.target.series.chart;
    const chart = chartComponentRef.current && chartComponentRef.current.chart;
    // console.log(chart);
    // console.log(event);
    // console.log(Highcharts);
    // console.log(chartComponentRef);
    // console.log(event.target);
    // console.log(event.target.tooltipPos);

    if (chart) {
      const e = chart.pointer.normalize(event);
      const x = e.chartX - chart.plotLeft;
      const y = e.chartY - chart.plotTop;
      // const top = chart.container.offsetTop;
      // const left = chart.container.offsetLeft;
      // const x = event.clientX - chart.plotLeft - left;
      // const y = event.clientY - chart.plotTop - top;
      if (x >= 0 && y >= 0 && x <= chart.chartWidth && y <= chart.chartHeight) {
        // console.log(chart.xAxis[0].toValue(x, true));
        // console.log(chart.yAxis[0].toValue(chart.plotHeight - y, true));
        setCursorX(chart.xAxis[0].toValue(x, true));
        setCursorY(chart.yAxis[0].toValue(y, true));
      }
    }
  };



  const fileName = props.fileName;
  const dataSource = props.dataSource;
  const unit = props.unit;
  const xPrecision = props.xPrecision;
  let order, xdisplayUnit;

  if (unit === "freq-k") {
    order = 3;
    xdisplayUnit = "kHz";
  } else if (unit === "freq-m") {
    order = 6;
    xdisplayUnit = "MHz";
  } else if (unit === "freq-g") {
    order = 9;
    xdisplayUnit = "GHz";
  } else if (unit === "chan") {
    order = 0;
    xdisplayUnit = "Channel";
  } else if (unit === "vel") {
    order = 0;
    xdisplayUnit = "Velocity (km/s)";
  } else {
    order = 0;
    xdisplayUnit = "Hz";
  }

  const newOptions = props.options;

  if (dataSource) {

    const xdata = dataSource.axisdata(1, unit, order).toJs();
    const ydata = dataSource.rawdata.toJs()[0][0];
    const header = dataSource.header.toJs();

    const xdataArray = [].slice.call(xdata);
    // const ydataArray = [].slice.call(ydata);
    const seriesData = xdataArray.map((xi: number, i: number) => {
      return [xi, ydata[i]];
    });
    // console.log(xdata);
    // console.log(ydata);
    // console.log(seriesData);

    const plotData = [{
      type: 'line',
      // data: [1, 2, 3],
      data: seriesData,
      // data: {
      //   x: xdata,
      //   y: ydata,
      // },
    }];

    newOptions.series = plotData;

    // console.log(newOptions);

    const xAxis = {
      title: {
        text: xdisplayUnit,
      },
      // labels: {
      //   format: '{value:.2f}',
      // }
    };
    const yAxis = {
      title: {
        text: header.get('BUNIT'),
      }
    };

    newOptions.title.text = fileName
    newOptions.xAxis = xAxis;
    newOptions.yAxis = yAxis;

    // plotLayout.xaxis.tickformat = `.${xPrecision}r`;

  }

  return (
    <>
      <HighchartsReact
        highcharts={Highcharts}
        options={newOptions}
        ref={chartComponentRef}
        containerProps={{ onMouseMove: handleMouseMove }}
        {...props}
      />
      <h4>X: {cursorX} Y: {cursorY}</h4>
    </>
    // <div>
    //   <Plot data={plotData} layout={plotLayout} />
    // </div>
  );
}

Viewer.defaultProps = {
  options: {
    title: {
      text: 'My chart'
    },
    chart: {
      zoomType: 'x'
    },
    tooltip: {
      enabled: true
    },
    plotOptions: {
      series: {
        enableMouseTracking: true,
        tooltip: {
          followPointer: false
        },
      }
    },
  },
}

export default Viewer;
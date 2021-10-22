import Plot from 'react-plotly.js';

const Viewer = (props: any) => {

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

  let plotData = [{}];
  let plotLayout = props.layout;

  if (dataSource) {

    const xdata = dataSource.axisdata(1, unit, order).toJs();
    const ydata = dataSource.rawdata.toJs()[0][0];
    const header = dataSource.header.toJs();

    plotData = [{
      x: xdata,
      y: ydata,
      type: 'scatter',
      mode: 'lines+markers',
    }];

    plotLayout.title.text = fileName
    plotLayout.xaxis.title.text = xdisplayUnit;
    plotLayout.yaxis.title.text = header.get('BUNIT');

    plotLayout.xaxis.tickformat = `.${xPrecision}r`;

  }

  return (
    <div>
      <Plot data={plotData} layout={plotLayout} />
    </div>
  );
}

Viewer.defaultProps = {
  layout: {
    title: {
      text: 'Plot Title',
      font: {
        family: 'Courier New, monospace',
        size: 24
      },
      xref: 'paper',
      x: 0.05,
    },
    xaxis: {
      title: {
        text: 'x Axis',
        font: {
          family: 'Courier New, monospace',
          size: 18,
          color: '#7f7f7f'
        }
      },
      tickformat: '.6r',
    },
    yaxis: {
      title: {
        text: 'y Axis',
        font: {
          family: 'Courier New, monospace',
          size: 18,
          color: '#7f7f7f'
        }
      },
    }
  }
}

export default Viewer;
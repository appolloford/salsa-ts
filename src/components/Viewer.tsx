import Plot from 'react-plotly.js';

const Viewer = (props: any) => {

  return (
    <div>
      <Plot data={props.data} layout={props.layout} />
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
      tickformat: '.3e'
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
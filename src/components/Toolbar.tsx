import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../redux/store';
import { setDrag } from '../redux/cursorSlice';
import { setBaselineFit, setShowSubtraction, setShowBaselineTable } from '../redux/baselineSlice';
import { setOrder, setIsFitting, setGaussianGuess, setGaussianFit, setShowGaussianTable } from '../redux/gaussianSlice';
import { AnchorButton, Button, Classes, ButtonGroup, Divider, FormGroup, HTMLSelect, NumericInput, Position } from '@blueprintjs/core';
import { Popover2, Tooltip2 } from "@blueprintjs/popover2";
import { toSciSymbol } from "../Helper";

const Toolbar = (props: any) => {
  const dispatch = useDispatch();
  const position = useSelector((state: RootState) => state.cursor.position);
  const drag = useSelector((state: RootState) => state.cursor.drag);
  const baselinePoints = useSelector((state: RootState) => state.baseline.dataPoints);
  const baselineFit = useSelector((state: RootState) => state.baseline.fitValues);
  const showSubtraction = useSelector((state: RootState) => state.baseline.showSubtraction);
  const isBaselineFitted = baselineFit.length > 0;
  const xdata = baselinePoints.map((item: number[]) => { return item[0] });
  const ydata = baselinePoints.map((item: number[]) => { return item[1] });

  const order = useSelector((state: RootState) => state.gaussian.order);
  const isFitting = useSelector((state: RootState) => state.gaussian.isFitting);
  const gaussianGuess = useSelector((state: RootState) => state.gaussian.guess);
  const dataSource = props.dataSource;
  const unit = props.unit;
  const setUnit = props.setUnit;

  const unSelectAllPoints = props.unSelectAllPoints;

  const fitBaseline = (x: number[], y: number[]) => {
    const result = dataSource?.fit_baseline(x, y, unit).toJs();
    const fit = [].slice.call(result);
    dispatch(setBaselineFit(fit));
  }
  const fitGaussian = (order: number) => {
    const guess = gaussianGuess.map((guess: number[]) => {
      const [xmin, xmax, ymin, ymax] = guess;
      const tmp1 = dataSource?.convertfreq(xmin, unit);
      const tmp2 = dataSource?.convertfreq(xmax, unit);
      const xmin2 = tmp1 <= tmp2 ? tmp1 : tmp2;
      const xmax2 = tmp1 <= tmp2 ? tmp2 : tmp1;
      return [xmin2, xmax2, ymin, ymax];
    });
    const result = dataSource?.fit_gaussian(unit, order, guess).toJs();
    const fit = [].slice.call(result);
    dispatch(setGaussianFit(fit));
  }

  const showBaselineTable = useSelector((state: RootState) => state.baseline.showBaselineTable);
  const showGaussianTable = useSelector((state: RootState) => state.gaussian.showGaussianTable);

  return (
    <div style={{ display: "flex" }}>
      <ButtonGroup>
        <Tooltip2
          content="Cursor action: drag to zoom"
          position={Position.TOP_LEFT}
          minimal={true}
        >
          <AnchorButton
            icon="zoom-in"
            small={true}
            active={drag === "zoom"}
            onClick={() => { dispatch(setDrag("zoom")) }}
          />
        </Tooltip2>
        <Tooltip2
          content="Cursor action: select baseline points"
          position={Position.TOP_LEFT}
          minimal={true}
        >
          <AnchorButton
            icon="widget-button"
            small={true}
            active={drag === "baseline"}
            disabled={showSubtraction}
            onClick={() => { dispatch(setDrag("baseline")) }}
          />
        </Tooltip2>
        <Tooltip2
          content="Cursor action: select gaussian peak ranges"
          position={Position.TOP_LEFT}
          minimal={true}
        >
          <AnchorButton
            icon="widget"
            small={true}
            active={drag === "gaussian"}
            disabled={!isBaselineFitted || !showSubtraction}
            onClick={() => { dispatch(setDrag("gaussian")) }}
          />
        </Tooltip2>
      </ButtonGroup>
      <Divider />
      <Tooltip2
        content="Subtraction baseline"
        position={Position.TOP_LEFT}
        minimal={true}
      >
        <AnchorButton
          icon="bring-data"
          small={true}
          active={showSubtraction}
          onClick={() => {
            dispatch(setShowSubtraction(!showSubtraction));
            dispatch(setDrag("zoom"));
          }}
        />
      </Tooltip2>
      <Tooltip2
        content="Fit baseline"
        position={Position.TOP_LEFT}
        minimal={true}
      >
        <AnchorButton
          icon="regression-chart"
          small={true}
          disabled={!baselinePoints.length}
          onClick={() => { fitBaseline(xdata, ydata) }}
        />
      </Tooltip2>
      <Tooltip2
        content="Show baseline table"
        position={Position.TOP_LEFT}
        minimal={true}
      >
        <AnchorButton
          icon="th"
          small={true}
          onClick={() => { dispatch(setShowBaselineTable(!showBaselineTable)) }}
        />
      </Tooltip2>
      <Tooltip2
        content="Remove all baseline data"
        position={Position.TOP_LEFT}
        minimal={true}
      >
        <AnchorButton
          icon="delete"
          small={true}
          onClick={() => {
            unSelectAllPoints();
            fitBaseline([], []);
          }}
        />
      </Tooltip2>
      <Divider />
      <Tooltip2
        className={Classes.TOOLTIP_INDICATOR}
        content="Fit Gaussian"
        position={Position.TOP_LEFT}
        minimal={true}
      >
        <AnchorButton
          icon="timeline-bar-chart"
          small={true}
          active={isFitting}
          disabled={!baselinePoints.length || !showSubtraction}
          onClick={() => {
            if (isFitting) {
              dispatch(setGaussianFit([]));
            }
            else {
              fitGaussian(order);
            }
            dispatch(setIsFitting(!isFitting))
          }}
        />
      </Tooltip2>
      <Popover2
        content={
          <NumericInput
            style={{ width: 30 }}
            value={order}
            min={0}
            onValueChange={(value) => {
              dispatch(setOrder(value));
              if (isFitting) fitGaussian(value);
            }}
          />
        }
      >
        <Tooltip2
          content="Number of Gaussian peaks"
          position={Position.TOP_LEFT}
          minimal={true}
        >
          <AnchorButton text={order} small={true} />
        </Tooltip2>
      </Popover2>
      <Tooltip2
        content="Show gaussian table"
        position={Position.TOP_LEFT}
        minimal={true}
      >
        <AnchorButton
          icon="th"
          small={true}
          onClick={() => { dispatch(setShowGaussianTable(!showGaussianTable)) }}
        />
      </Tooltip2>
      <Tooltip2
        content="Remove all gaussian data"
        position={Position.TOP_LEFT}
        minimal={true}
      >
        <AnchorButton
          icon="delete"
          small={true}
          onClick={() => {
            dispatch(setIsFitting(false));
            dispatch(setGaussianGuess([]));
            dispatch(setGaussianFit([]));
          }}
        />
      </Tooltip2>

      {/* <Label>Position: ({toSciSymbol(position[0])}, {toSciSymbol(position[1])})</Label> */}
      <Button style={{ marginLeft: "auto", height: 10 }} small={true} minimal={true} disabled={true} >
        (x, y) = ({toSciSymbol(position[0])}, {toSciSymbol(position[1])})
      </Button>
      {/* <Text style={{ marginLeft: "auto", height: 10 }} >(x, y) = ({toSciSymbol(position[0])}, {toSciSymbol(position[1])})</Text> */}
      {/* (x, y) = ({toSciSymbol(position[0])}, {toSciSymbol(position[1])}) */}

      <FormGroup style={{ marginLeft: "auto", height: 10 }} label="x-axis unit:" inline={true}>
        <HTMLSelect value={unit} minimal={true} onChange={(e) => { setUnit(e.target.value) }}>
          <option value="freq">Frequency (Hz)</option>
          <option value="freq-k">Frequency (kHz)</option>
          <option value="freq-m">Frequency (MHz)</option>
          <option value="freq-g">Frequency (GHz)</option>
          <option value="chan">Channel</option>
          <option value="vel">Velocity (km/s)</option>
        </HTMLSelect>
      </FormGroup>
    </div>
  )
}

export default Toolbar;
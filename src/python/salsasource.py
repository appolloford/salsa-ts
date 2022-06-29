import numpy as np

from io import BytesIO
from js import jsarray

from astropy.io import fits
from scipy.optimize import curve_fit

# from scipy.optimize import curve_fit
# #? fit gaussian: https://stackoverflow.com/questions/11507028/fit-a-gaussian-function

clight = 299792458

def _gaussian(x: np.ndarray, mean: float, sigma: float, amp: float) -> float:
    return amp * np.exp( -(x-mean)**2 / (2*sigma**2) )

def _gaussian_fitting_func(x, *params) -> float:
    y = np.zeros_like(x)
    for i in range(0, len(params), 3):
        mean, sigma, amp = params[i], params[i+1], params[i+2]
        y = y + _gaussian(x, mean, sigma, amp)
    return y

class SALSASource:
    def __init__(self, bytesfile) -> None:
        self.content = fits.open(BytesIO(bytesfile), mode="readonly")
        self._baseline = None
        self._gaussian = None
        self._gaussian_params = None
        self._gaussian_superpos = None

    @property
    def header(self) -> dict:
        header = self.content[0].header
        return dict(header)

    @property
    def rawdata(self) -> list:
        return self.content[0].data.tolist()

    def axisdata(self, idx: int, unit: str = None) -> np.ndarray:
        if idx > self.header.get("NAXIS"):
            raise RuntimeError(f"Input index {idx} is higher than the dimension")

        naxis = self.header[f"NAXIS{idx}"]
        reval = self.header[f"CRVAL{idx}"]
        repix = self.header[f"CRPIX{idx}"]
        delta = self.header[f"CDELT{idx}"]
        cunit = self.header[f"CTYPE{idx}"]

        vlsr = self.header["VELO-LSR"] * 1000

        if not unit:
            ret = [reval + (i - repix) * delta for i in range(naxis)]

        else:

            lowerunit = unit.lower()

            if idx == 1:
                # Channels
                if lowerunit.startswith("chan"):
                    ret = np.array(list(range(naxis)))

                elif lowerunit.startswith("freq"):
                    ret = np.array([reval + (i - repix) * delta for i in range(naxis)])

                    if lowerunit.endswith("-k"):
                        ret /= 10**3
                    elif lowerunit.endswith("-m"):
                        ret /= 10**6
                    elif lowerunit.endswith("-g"):
                        ret /= 10**9

                elif lowerunit.startswith("vel"):
                    freq = np.array([reval + (i - repix) * delta for i in range(naxis)])
                    ret = (-clight * (freq - reval) / reval - vlsr) / 1000

                else:
                    raise RuntimeError(f"{cunit} cannot be converted to {unit}")

        return ret

    @property
    def baseline(self) -> np.ndarray:
        return self._baseline

    def fit_baseline(
        self,
        xdata: list[float],
        ydata: list[float],
        unit: str = None,
        deg: float = 2,
    ) -> np.ndarray:

        if not xdata or not ydata:
            self._baseline = []

        else:
            poly = np.polyfit(xdata.to_py(), ydata.to_py(), deg=deg)
            x = self.axisdata(1, unit=unit)
            self._baseline = np.polyval(poly, x)
            # self._baseline = {xi: yi for xi, yi in zip(x, y)}
            # self._baseline = np.array([[xi, yi] for xi, yi in zip(x, y)])
            # ? error: https://stackoverflow.com/questions/15721053/whats-the-error-of-numpy-polyfit

        return self._baseline

    def fit_gaussian(
        self, 
        unit: str = None, 
        ngaussian: int = 0, 
        xylim: list[list[float]] = None,
    ) -> np.ndarray:

        xdata = self.axisdata(1, unit=unit)

        if not ngaussian:
            self._gaussian = np.zeros(xdata.shape)
            return self._gaussian

        if self.baseline is None:
            return np.zeros(xdata.shape) 

        ydata = self.content[0].data.flatten() - self.baseline

        xdatarange = xdata.max() - xdata.min()

        # initial guess
        p0 = [xdata.mean(), xdatarange / 2.0, ydata.max()] * ngaussian
        # lower/upper bound for the mean, sigma, and amp of each gaussian
        lbound = [xdata.min(), 0.0, 0.5*ydata.min()] * ngaussian
        ubound = [xdata.max(), xdatarange, 2.0*ydata.max()] * ngaussian

        if xylim:
            for idx, lim in enumerate(xylim):
                xmin, xmax, ymin, ymax = lim
                if idx < ngaussian:
                    p0[idx*3:(idx+1)*3] = [(xmin+xmax)/2.0, (xmax-xmin), ymax]
                    lbound[idx*3:(idx+1)*3] = [xmin, 0.0, ymin]
                    ubound[idx*3:(idx+1)*3] = [xmax, 2.0*(xmax-xmin), 2.0*ymax]

        popt, pcov = curve_fit(_gaussian_fitting_func, xdata, ydata, p0=p0, bounds=(lbound, ubound))

        self._gaussian_params = [popt[idx*3:(idx+1)*3] for idx in range(ngaussian)]
        self._gaussian = [_gaussian(xdata, *params) for params in self._gaussian_params]
        self._gaussian_superpos = _gaussian_fitting_func(xdata, *popt)

        return self._gaussian_superpos


    @property
    def gaussian(self):
        return self._gaussian

    @property
    def gaussian_params(self):
        return self._gaussian_params

    @property
    def gaussian_superpos(self):
        return self._gaussian_superpos

    def convert2freq(self, value: float, unit: str) -> float:
        """
        Convert the input value from the input unit to frequency 

        Args:
            value (float): input value
            unit (str): original unit

        Raises:
            ValueError: if the input unit is unknown

        Returns:
            float: value in frequency
        """

        reval = self.header[f"CRVAL1"]
        repix = self.header[f"CRPIX1"]
        delta = self.header[f"CDELT1"]

        vlsr = self.header["VELO-LSR"] * 1000

        lowerunit = unit.lower()

        if lowerunit.startswith("chan"):
            ret = reval + (value - repix) * delta

        elif lowerunit.startswith("freq"):
            ret = value

            if lowerunit.endswith("-k"):
                ret *= 1e3
            elif lowerunit.endswith("-m"):
                ret *= 1e6
            elif lowerunit.endswith("-g"):
                ret *= 1e9

        elif lowerunit.startswith("vel"):
            ret = - (value * 1000 + vlsr) * reval / clight + reval

        else:
            raise ValueError(f"Unkown unit: {unit}")

        return ret

    def convertfreq(self, value: float, unit: str) -> float:
        """
        Convert the frequency to another unit

        Args:
            value (float): input frequency value
            unit (str): target unit

        Raises:
            ValueError: if the target unit is unknown

        Returns:
            float: target value
        """

        reval = self.header[f"CRVAL1"]
        repix = self.header[f"CRPIX1"]
        delta = self.header[f"CDELT1"]

        vlsr = self.header["VELO-LSR"] * 1000

        lowerunit = unit.lower()

        if lowerunit.startswith("chan"):
            ret = (value - reval) / delta + repix

        elif lowerunit.startswith("freq"):
            ret = value

            if lowerunit.endswith("-k"):
                ret /= 1e3
            elif lowerunit.endswith("-m"):
                ret /= 1e6
            elif lowerunit.endswith("-g"):
                ret /= 1e9

        elif lowerunit.startswith("vel"):
            ret = (-clight * (value - reval) / reval - vlsr) / 1000

        else:
            raise ValueError(f"Unkown unit: {unit}")

        return ret

# if __name__ == "__main__":
#     array = jsarray.to_py().tobytes()
#     print("in main", array)
#     fitsreader = FitsReader(array)
#     FitsReader(array)

array = jsarray.to_py().tobytes()
salsa = SALSASource(array)
# FitsReader(array)
